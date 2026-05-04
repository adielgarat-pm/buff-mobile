# AUDIT — Lovable Admin codebase

**Date:** 2026-05-04
**Source:** https://github.com/adielgarat-pm/buff (cloned to /tmp/buff-lovable)
**Lovable last commit:** `37a425f5` — "עדכן grace ל-31.12.26" (2026-05-02 05:54 UTC)

## Snapshot Header

- Files read: AdminDashboard.tsx (661), admin/AppPulseTabV2.tsx (758), admin/AppPulseTab.tsx (800), admin/FamilyDrilldownModal.tsx (610), admin/RedFlagsSection.tsx (247), admin/AdminUsersTab.tsx (345), admin/AdminReviewsTab.tsx (244), admin/EmailHistoryTab.tsx (219), admin/FunnelOverview.tsx (143), admin/GrowthEngagementChart.tsx (121), admin/CategoryCompletionChart.tsx (164), admin/DateRangeFilter.tsx (121), admin/ParentSummaryModal.tsx (155), hooks/useAdminAccess.ts (139), hooks/useAdminAnalyticsV2.ts (266), App.tsx (routing only), integrations/supabase/client.ts (18), integrations/supabase/types.ts (partial — RPC signatures and table rows), integrations/lovable/index.ts (full), package.json (deps)
- Files searched-but-not-found: src/pages/Admin*.tsx (none), src/pages/admin/ (none — all admin code is in src/components/admin/)
- Total admin-related lines: 4,993

---

## Section 1 — Inventory

```
src/
├── App.tsx                          ← AdminGuard at line 112; /admin route at line 157
├── components/
│   ├── AdminDashboard.tsx           661 lines — tab shell + orchestrator
│   └── admin/
│       ├── AppPulseTab.tsx          800 lines — V1 (superseded by V2, not imported)
│       ├── AppPulseTabV2.tsx        758 lines — ACTIVE: renders Funnel + KPIs + Charts
│       ├── AdminUsersTab.tsx        345 lines — user list + pro status management
│       ├── AdminReviewsTab.tsx      244 lines — reviews tab (DEFERRED per SPEC)
│       ├── EmailHistoryTab.tsx      219 lines — email_logs table view
│       ├── FamilyDrilldownModal.tsx 610 lines — family deep-dive + JSON export
│       ├── RedFlagsSection.tsx      247 lines — Attention Needed cards
│       ├── FunnelOverview.tsx       143 lines — 4-stage funnel display
│       ├── GrowthEngagementChart.tsx 121 lines — dual-axis line chart (recharts)
│       ├── CategoryCompletionChart.tsx 164 lines — bar/pie toggle chart (recharts)
│       ├── DateRangeFilter.tsx      121 lines — cohort filter + exclude-test-accounts toggle
│       └── ParentSummaryModal.tsx   155 lines — parent profile summary modal
├── hooks/
│   ├── useAdminAccess.ts            139 lines — admin auth check + families overview fetch
│   └── useAdminAnalyticsV2.ts       266 lines — main analytics data hook
└── integrations/
    ├── lovable/index.ts              ← @lovable.dev/cloud-auth-js wrapper (OAuth only)
    └── supabase/
        ├── client.ts                ← createClient with VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY
        └── types.ts                 ← full generated type definitions (33,606 bytes)
```

```
supabase/
├── config.toml
├── functions/
│   ├── daily-summary/
│   ├── generate-parent-summary/
│   ├── lemon-squeezy-webhook/
│   ├── parse-schedule/
│   ├── send-recovery-emails/
│   ├── translate-review/
│   └── unsubscribe/
└── migrations/                      ← 103 migration files, 20260124–20260406
```

---

## Section 2 — Admin files found

### `src/components/AdminDashboard.tsx` — 661 lines

**Top-level imports:** `useAdminAccess`, `usePWAInstall`, `usePWAAnalytics`, `FamilyDrilldownModal`, `AppPulseTabV2`, `AdminUsersTab`, `EmailHistoryTab`, `AdminReviewsTab`. All from local paths — no Lovable-specific imports.

**Exports:** `AdminDashboard` (named export)

**Tab structure** (lines 168–193):

| Tab value | Component | Status |
|---|---|---|
| `pulse` | `<AppPulseTabV2 />` | ACTIVE |
| `users` | `<AdminUsersTab />` | ACTIVE |
| `emails` | `<EmailHistoryTab />` | ACTIVE |
| `pwa` | Inline PWA analytics (pwaReport state) | DEFERRED per SPEC |
| `families` | Inline families table | ACTIVE |
| `reviews` | `<AdminReviewsTab />` | DEFERRED per SPEC |

**Auth guard** — two layers:
1. `AdminGuard` in `App.tsx:112-117`: `if (user?.email !== 'adi.elgarat@gmail.com')` — email hardcode
2. `useAdminAccess` hook: queries `user_roles` table — `supabase.from('user_roles').select('role').eq('role', 'admin')` (line 56)

**Note:** The Lovable app uses email hardcode as primary guard (App.tsx:114) and `user_roles` table as secondary check (useAdminAccess.ts:56). The port uses `admin_users` table + `is_admin()` function per SPEC §3.2.

---

### `src/components/admin/AppPulseTabV2.tsx` — 758 lines

**Imports:** recharts (AreaChart, LineChart, BarChart, PieChart), all shadcn/ui components, `useAdminAnalyticsV2`, `FunnelOverview`, `RedFlagsSection`, `GrowthEngagementChart`, `CategoryCompletionChart`, `DateRangeFilter`.

**Renders:** Date range filter → Funnel → Attention Needed (RedFlags) → KPI long-term cards → KPI daily cards → Growth chart → Category chart → completion rate gauges.

**Data source:** `useAdminAnalyticsV2` hook → RPC `get_admin_app_pulse_v2`.

---

### `src/hooks/useAdminAnalyticsV2.ts` — 266 lines

**Core Supabase call** (line 182):
```typescript
supabase.rpc('get_admin_app_pulse_v2', {
  p_start_date: start,
  p_end_date: end,
  p_exclude_test_accounts: excludeTestAccounts,
})
```
Returns `Json`. Cast to `AppPulseDataV2` interface containing: `funnel`, `red_flags`, `kpis`, `daily_trends`, `category_stats`, `completions_today`, `completions_7d`, `potential_today`, `potential_7d`, `active_children_7d`, `total_children`, `device_breakdown`.

**State:** `dateRange` (7/30/90/custom), `excludeTestAccounts` (boolean toggle, default false), `data`, `loading`, `error`.

---

### `src/hooks/useAdminAccess.ts` — 139 lines

**Calls:**
- `supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin')` (line 56)
- `supabase.rpc('get_admin_families_overview')` (line 87)
- `supabase.rpc('get_admin_orphaned_users')` (line 88)

**Returns:** `{ isAdmin, loading, families, orphanedUsers, fetchingFamilies, refetchFamilies }`

---

### `src/components/admin/FamilyDrilldownModal.tsx` — 610 lines

**Core Supabase call** (line 128):
```typescript
supabase.rpc('get_admin_family_drilldown', { p_family_id: familyId })
```
Returns `Json` containing: `children[]`, `tasks[]`, `rewards[]`, `timetables[]`, `tracking[]`.

**JSON export** (lines 177–211): Downloads `family-{familyName}-{yyyy-MM-dd}.json` with structure matching SPEC §4.6.

**5 tabs:** ילדים / מערכת / פרסים / משימות / מעקב (lines inferred from component structure).

---

### `src/components/admin/RedFlagsSection.tsx` — 247 lines

**Props:** `{ redFlags: { stuck_onboarding: StuckOnboardingItem[], churn_risk: number, low_engagement: number } }` (lines 15–28). Data comes from `get_admin_app_pulse_v2`.red_flags.

**3 cards:** Stuck in Onboarding, Churn Risk, Low Engagement. **No "Blocked Registrations" card** — this is new per SPEC §4.2.

---

### `src/components/admin/AdminUsersTab.tsx` — 345 lines

**Calls:**
- `supabase.rpc('get_admin_profiles_overview')` (line 55) → user list
- `supabase.rpc('admin_set_pro_status', { p_profile_id, p_is_pro, p_is_lifetime_access })` (lines 77, 106) → toggle pro

---

### `src/components/admin/EmailHistoryTab.tsx` — 219 lines

**Call:** `supabase.from('email_logs').select(...)` (line 35)

---

### `src/components/admin/AdminReviewsTab.tsx` — 244 lines

**Calls:** `supabase.from('reviews')` × 3 (lines 33, 53, 86). **Deferred per SPEC §4.5.**

---

### `src/components/admin/GrowthEngagementChart.tsx` — 121 lines

**Lib:** recharts — `LineChart`, `Line`, `XAxis`, `YAxis`, `Tooltip`, `CartesianGrid`, `Legend`, `ResponsiveContainer`.
**Data shape:** `DailyTrend[]` — `{ date, new_signups, active_families }`. Source: `get_admin_app_pulse_v2`.daily_trends.

---

### `src/components/admin/CategoryCompletionChart.tsx` — 164 lines

**Lib:** recharts — `BarChart`, `Bar`, `PieChart`, `Pie`, `Cell`, `Legend`. Bar/pie toggle via local state.
**Data shape:** `CategoryCompletion[]` — `{ category, ... }`. Source: `get_admin_app_pulse_v2`.category_stats.

---

## Section 3 — Supabase tables referenced

### Direct `.from()` queries

| Table | File | Columns selected | Notes |
|---|---|---|---|
| `user_roles` | useAdminAccess.ts:56 | `role` | Admin auth check. **Must exist in mobile DB.** |
| `email_logs` | EmailHistoryTab.tsx:35 | unknown (need full read) | May not exist in mobile DB — see Open Questions |
| `reviews` | AdminReviewsTab.tsx:33,53,86 | multiple | **Deferred per SPEC.** May not exist in mobile DB. |

### RPC functions (all return Json unless noted)

| RPC | Args | Returns | Used by |
|---|---|---|---|
| `get_admin_app_pulse_v2` | `p_start_date`, `p_end_date`, `p_exclude_test_accounts` | Json | useAdminAnalyticsV2.ts:182 |
| `get_admin_families_overview` | none | row[] | useAdminAccess.ts:87 |
| `get_admin_orphaned_users` | none | row[] | useAdminAccess.ts:88 |
| `get_admin_family_drilldown` | `p_family_id` | Json | FamilyDrilldownModal.tsx:128 |
| `get_admin_profiles_overview` | none | Json | AdminUsersTab.tsx:55 |
| `admin_set_pro_status` | `p_profile_id`, `p_is_pro`, `p_is_lifetime_access` | Json | AdminUsersTab.tsx:77,106 |

**All RPCs are Lovable-project RPCs.** None are confirmed to exist in the mobile Supabase project. See Open Questions.

---

## Section 4 — Lovable-specific dependencies

| Dependency | Version | Location | Used in Admin? | Replacement |
|---|---|---|---|---|
| `@lovable.dev/cloud-auth-js` | ^1.0.0 | integrations/lovable/index.ts | **No** — only OAuth (Google/Apple). Admin uses email+user_roles check. | Remove entirely for admin-web/. Admin uses Magic Link (SPEC §3.2). |
| `VITE_SUPABASE_PUBLISHABLE_KEY` (env var name) | — | integrations/supabase/client.ts | Yes (Supabase client init) | Rename to `VITE_SUPABASE_ANON_KEY` per SPEC §3.3. Functionally identical. |

**All other dependencies are portable:**
- `@supabase/supabase-js@^2.91.1` — use same version
- `@tanstack/react-query@^5.83.0` — use same version
- `recharts@^2.15.4` — use same version
- `tailwindcss@^3.4.17` — use same version
- `shadcn/ui` components (Badge, Button, Card, Dialog, Input, Label, Popover, Progress, ScrollArea, Select, Skeleton, Switch, Table, Tabs) — all portable
- `vite@^5.4.19` — use same version
- `date-fns` — use same version

**AppPulseTab.tsx (v1, 800 lines)** — not imported anywhere in current AdminDashboard.tsx. **Do not port.** V2 supersedes it.

---

## Section 5 — Mapping to SPEC §4

| SPEC §4 section | Lovable file(s) | Supabase source | Port complexity |
|---|---|---|---|
| §4.1 User Funnel | FunnelOverview.tsx (143 lines) | `get_admin_app_pulse_v2`.funnel | Low — self-contained component, standard props |
| §4.2 Attention Needed | RedFlagsSection.tsx (247 lines) | `get_admin_app_pulse_v2`.red_flags | Medium — Blocked Registrations card is new (no Lovable equivalent) |
| §4.3 KPI Cards | AppPulseTabV2.tsx (758 lines, inline) | `get_admin_app_pulse_v2` top-level fields | Medium — KPI cards are inline in AppPulseTabV2, not extracted to separate component |
| §4.4 Charts | GrowthEngagementChart.tsx (121) + CategoryCompletionChart.tsx (164) | `get_admin_app_pulse_v2`.daily_trends + .category_stats | Low — pure recharts, no Lovable deps |
| §4.5 Tabs | AdminDashboard.tsx (661 lines) | — | Low — shadcn Tabs, straightforward |
| §4.6 Family Deep-dive Modal | FamilyDrilldownModal.tsx (610 lines) | `get_admin_family_drilldown` | High — largest single file; JSON export inline at lines 177–211 |

**cohort filter (DateRangeFilter.tsx, 121 lines):** Shared by §4.1–4.4. Contains `p_exclude_test_accounts` toggle — see Open Questions.

---

## Section 6 — UNVERIFIED CLAIMS

All claims below cannot be confirmed without querying the live mobile Supabase project:

1. **RPCs exist in mobile DB.** The 6 RPC functions (`get_admin_app_pulse_v2`, `get_admin_families_overview`, `get_admin_orphaned_users`, `get_admin_family_drilldown`, `get_admin_profiles_overview`, `admin_set_pro_status`) are defined in the Lovable Supabase project. Whether any of them are already present in the mobile Supabase project is unknown. Source for these RPCs' existence: `src/integrations/supabase/types.ts` (Lovable project types).

2. **`p_exclude_test_accounts` maps to a real column.** The parameter is passed to `get_admin_app_pulse_v2` (useAdminAnalyticsV2.ts:185), but the underlying SQL (which would reveal the column name) is not in this repo. The mobile DB may have no equivalent column.

3. **`email_logs` table exists in mobile DB.** Found in Lovable `types.ts` at line 215 with a `profile_id` FK. Not confirmed in mobile schema.

4. **`user_roles` table exists in mobile DB.** Used for admin check (useAdminAccess.ts:56). Not confirmed in mobile `buff-mobile/supabase/` folder (which has only `.temp/` and `functions/`).

---

## Section 7 — Open questions for Adi

1. **RPCs in mobile Supabase?** The 6 admin RPCs exist in Lovable's Supabase. Do any exist in the mobile project? If not, all must be created as migrations — likely the largest Phase 3 effort. **(CC will check `buff-mobile/supabase/` in Phase 3.)**

2. **`user_roles` table in mobile DB?** `useAdminAccess.ts:56` queries it for admin auth. The mobile DB auth strategy uses `admin_users` + `is_admin()` per SPEC §3.2, but the families-overview fetch also depends on the admin flag. Is `user_roles` already in mobile schema?

3. **`email_logs` table in mobile DB?** `EmailHistoryTab.tsx:35` queries it. If the table doesn't exist in mobile, EmailHistoryTab needs to be replaced or removed. **(Adi: does the mobile app log emails?)**

4. **`p_exclude_test_accounts` — what field?** The parameter is sent to `get_admin_app_pulse_v2`. The mobile DB may have no `is_test_account` field. **(SPEC §9 item 4 raises this — still unresolved.)**

5. **AppPulseTab.tsx (v1, 800 lines)** — not imported in current AdminDashboard.tsx. Confirm: do not port v1?

6. **Domain decision.** SPEC §9 item 1: `admin.buffadhd.com` vs `admin.buff.app`. Needed before Phase 10 (Vercel deploy). **(Adi)**

7. **Vercel account.** SPEC §9 item 2. **(Adi)**

8. **JSON export filename.** SPEC §9 item 7 suggests `family-{name}-{date}.json` — confirmed in FamilyDrilldownModal.tsx:211: `a.download = \`family-${familyName}-${format(new Date(), 'yyyy-MM-dd')}.json\``. Format matches. No decision needed.

9. **`reviews` data.** AdminReviewsTab.tsx queries `reviews` table. SPEC defers this to V1.1. Confirm: skip entirely in port?
