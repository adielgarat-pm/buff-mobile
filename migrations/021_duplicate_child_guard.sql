-- 021_duplicate_child_guard.sql
-- Package: fix/duplicate-child-guard
--
-- Problem: a parent re-added the same child 4.5 min apart (empty dashboard +
-- weak feedback made the first add look like it failed). Nothing in the DB
-- prevented two active same-name children in one family, and the duplicate
-- also broke child login: list_family_children / link_child_profile show every
-- non-deleted child by name, so the child could pick the empty twin and see 0.
--
-- Architect decision: atomic RPC guard + friendly confirm dialog. NO hard
-- unique constraint (legitimate same-name kids + soft-deleted rows would
-- collide, and uniqueness can't carry a friendly "open existing vs add anyway"
-- choice).
--
-- This migration:
--   1. create_child_profile  — atomic same-name guard for parent-initiated
--      child creation. Check + insert in one transaction (no TOCTOU race);
--      authorization + family_id derived server-side (not trusted from client).
--      The existing AFTER INSERT triggers still seed buddy_relationships,
--      default tasks/rewards and credit_vault inside the same statement.
--   2. delete_child_profile  — fix the broken hard-delete path:
--        a. store_rewards is keyed on child_id, not assigned_to (the old line
--           referenced a non-existent column -> 42703 -> whole delete rolled
--           back -> child never deleted).
--        b. add the two NO-ACTION FK cleanups (child_suggestions.child_id,
--           stickers.to_child_id) that would otherwise FK-block the final
--           profile delete. Everything else referencing the child cascades.

-- ── 1. create_child_profile ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_child_profile(
  p_display_name text,
  p_pro_settings jsonb   DEFAULT '{}'::jsonb,
  p_force        boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id       uuid;
  v_family_id     uuid;
  v_role          text;
  v_name          text;
  v_existing_id   uuid;
  v_existing_name text;
  v_new_id        uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('status', 'error', 'reason', 'not_authenticated');
  END IF;

  -- Caller must be a parent; derive family server-side (never trust the client).
  -- Mirrors the "Users can insert their profile" RLS INSERT check.
  SELECT family_id, role INTO v_family_id, v_role
  FROM public.profiles
  WHERE user_id = v_user_id
  LIMIT 1;

  IF v_family_id IS NULL OR v_role <> 'parent' THEN
    RETURN jsonb_build_object('status', 'error', 'reason', 'not_a_parent');
  END IF;

  v_name := btrim(coalesce(p_display_name, ''));
  IF v_name = '' THEN
    RETURN jsonb_build_object('status', 'error', 'reason', 'empty_name');
  END IF;

  -- Duplicate guard: an ACTIVE same-name child already in this family.
  -- Case-insensitive + whitespace-trimmed match. Skipped when p_force=true
  -- (parent explicitly chose "Add anyway" in the dialog).
  IF NOT p_force THEN
    SELECT id, display_name
      INTO v_existing_id, v_existing_name
    FROM public.profiles
    WHERE family_id = v_family_id
      AND role = 'child'
      AND is_deleted = false
      AND lower(btrim(display_name)) = lower(v_name)
    ORDER BY created_at
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'status',             'duplicate',
        'existing_child_id',  v_existing_id,
        'existing_child_name', v_existing_name
      );
    END IF;
  END IF;

  -- Insert. AFTER INSERT triggers atomically seed buddy_relationships,
  -- default tasks/rewards and credit_vault within this same statement.
  INSERT INTO public.profiles
    (user_id, family_id, display_name, role, marketing_consent, pro_settings)
  VALUES
    (NULL, v_family_id, v_name, 'child', false, coalesce(p_pro_settings, '{}'::jsonb))
  RETURNING id INTO v_new_id;

  RETURN jsonb_build_object('status', 'created', 'child_id', v_new_id);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.create_child_profile(text, jsonb, boolean) TO authenticated;

-- ── 2. delete_child_profile (fixed) ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.delete_child_profile(p_child_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_my_family_id    UUID;
  v_my_role         TEXT;
  v_child_family_id UUID;
  v_child_name      TEXT;
BEGIN
  -- Get caller's info
  SELECT family_id, role INTO v_my_family_id, v_my_role
  FROM public.profiles
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_my_family_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'לא מחובר למשפחה');
  END IF;

  -- Only parents can delete children
  IF v_my_role != 'parent' THEN
    RETURN jsonb_build_object('success', false, 'error', 'רק הורים יכולים למחוק ילדים');
  END IF;

  -- Get child's family and validate
  SELECT family_id, display_name INTO v_child_family_id, v_child_name
  FROM public.profiles
  WHERE id = p_child_id AND role = 'child';

  IF v_child_family_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'הילד לא נמצא');
  END IF;

  IF v_child_family_id != v_my_family_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'הילד לא שייך למשפחה שלך');
  END IF;

  -- Delete related data. Most child-referencing FKs are ON DELETE CASCADE, but
  -- a few are NO ACTION and must be cleared first or the profile delete fails:
  --   child_suggestions.child_id  (NO ACTION)
  --   stickers.to_child_id        (NO ACTION)
  -- The rest below are belt-and-suspenders (already cascade) but kept explicit.

  DELETE FROM public.daily_progress    WHERE child_id    = p_child_id;
  DELETE FROM public.lesson_progress   WHERE child_id    = p_child_id;
  DELETE FROM public.lesson_reflections WHERE child_id   = p_child_id;
  DELETE FROM public.credit_vault      WHERE child_id    = p_child_id;
  DELETE FROM public.store_rewards     WHERE child_id    = p_child_id;  -- was assigned_to (non-existent column)
  DELETE FROM public.tasks             WHERE assigned_to = p_child_id;
  DELETE FROM public.timetables        WHERE assigned_to = p_child_id;
  DELETE FROM public.child_suggestions WHERE child_id    = p_child_id;  -- NO ACTION FK
  DELETE FROM public.stickers          WHERE to_child_id = p_child_id;  -- NO ACTION FK

  -- Finally delete the child profile
  DELETE FROM public.profiles WHERE id = p_child_id;

  RETURN jsonb_build_object('success', true, 'deleted_name', v_child_name);
END;
$function$;
