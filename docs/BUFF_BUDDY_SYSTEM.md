# BUFF — Buddy System Design

> **Spec Status:** Target spec — V0.5 (post-2.5.2026 redesign).
> Current code: partial implementation of an earlier, simpler buddy spec
> (4 evolution stages + skins, no friendship levels, no boosters, no EOD trigger).
> Reconciliation between this doc and the codebase is deferred to the
> BUDDY implementation session, where we'll do an explicit code audit
> and decide what to keep / replace / migrate.
> **Until then:** treat this doc as the *target*, not the *current* state.

**מטרה:** עיצוב מערכת BUDDY ב-BUFF — דמות, רמות חברות, מתנות (Boosters), ו-UI placement.

**עודכן:** 2 במאי 2026 (אחרי תשובות Itay + סשן עיצוב Stitch + תובנות אמי)

**מבוסס על:** שיחה עם Adi ו-Itay (קו-יוצר, בן 15) ב-2.5.2026, וצילומי השראה מ-Pokémon GO (Buddy Adventure). הערות גם מאמי (בת 9, פרסונה עתידית ל-Children Mode).

---

## פילוסופיה

### למה BUDDY בכלל?

BUFF הוא לא משחק — הוא כלי אימון. אבל ילד עם ADHD צריך משהו שגורם לו לחזור מחר. BUDDY הוא **הקשר שגורם לחזור** — לא הפיצ'ר שמתפתה.

**יתרון נוירולוגי:** Body doubling — ההימצאות של מישהו לידך — היא טכניקה מוכרת ל-ADHD בכל גיל. גם מבוגרים משתמשים בה (Discord servers שלמים = אנשים יושבים בשקט יחד ועושים משימות). BUDDY הוא body double וירטואלי.

**אבל — חשוב:** מתבגרים מקבלים בחירה אם לראות BUDDY או לא. ילדים עד 12 — BUDDY תמיד מוצג.

### העיקרון המנחה

**"לא קוסמטיקה. קשר."**

הילד לא צובר נקודות כדי לקנות צבעים ל-buddy. הילד **משלים ימים מוצלחים**, ו-BUDDY נותן לו מתנות בתגובה. **ה-BUDDY הוא נותן, לא חנות.**

### החיבור לפילוסופיה הקיימת של BUFF

| עקרון BUFF | איך BUDDY מבטא אותו |
|---|---|
| 70% Goal | רמות חברות עולות לפי **ימים מוצלחים (70%+)**, לא רצופים |
| Safe Harbor (חיזוק חיובי בלבד) | BUDDY נותן רק. הוא לא לוקח, לא נעלב, לא מאשים |
| Be the Coach, Not the Boss | BUDDY הוא חבר במסע, לא דמות סמכותית |
| Scaffold That Fades | ברמות 1-2 BUDDY בוחר את המתנה. ברמות 3+ הילד בוחר (autonomy עולה) |
| Dopamine Bridge | מתנות חד-פעמיות במרווחים גדולים, לא reward תכוף |
| Disruption is Normal | אחרי הפסקה — BUDDY מחבק (לא מאשים, לא שואל) |
| Built for Autonomy (13+) | מתבגרים בוחרים אם לראות BUDDY או לא |

---

## רמות החברות (Friendship Levels)

### העקרון: ימים מוצלחים מצטברים

**יום מוצלח = יום שהילד השלים 70%+ מהמשימות.** זה תואם את עיקרון 70% Goal הקיים.

- **לא רצוף** — אם פספסת יום, אתה לא חוזר ל-0
- **לא תלוי במספר משימות** — הורה שמגדיר 4 משימות וילד שמשלים 3 = יום מוצלח
- **יום מוצלח = יום מוצלח** — לא משנה כמה

### 5 הרמות

| רמה | שם | טריגר | מתנת BUDDY | בוחר |
|---|---|---|---|---|
| 1 | **Buddy Buddies** | יום 1 (התחלה) | אין מתנה — היכרות | — |
| 2 | **Good Friends** | אחרי **3 ימים מוצלחים** מצטברים | Custom Theme Color (4 צבעים) | BUDDY |
| 3 | **Close Friends** | אחרי **10 ימים מוצלחים** מצטברים | בחירה: ×2 Buffs (חד-פעמי) **או** Buddy Mood Pack חדש | הילד |
| 4 | **Best Friends** | אחרי **30 ימים מוצלחים** מצטברים | בחירה: Skip Token **או** Custom Theme Color שני | הילד |
| 5 | **Forever Friends** | אחרי **100 ימים מוצלחים** מצטברים | בחירה: הנחת פרס (50→25 buffs) **או** Skin חדש | הילד |

**הערה:** ב-Teen Mode בלי Buddy, הרמות מוצגות כ-"LEVEL 1" עד "LEVEL 5" עם dots ירוקים במקום hearts.

---

## קטלוג ה-Boosters

ה-Boosters שהילד מקבל הם **פונקציונליים**. הם משפיעים על איך BUFF מתנהג עבורו.

**שם רשמי לקטגוריה:** "Boosters" (Itay בחר ב-2.5)

| Booster | מה זה עושה | זמין ב-רמה |
|---|---|---|
| Custom Theme Color | מאפשר בחירת accent color (ירוק/כחול/סגול/חם) | 2 (BUDDY בוחר 4) + 4 (הילד בוחר עוד) |
| ×2 Buffs | ליום אחד, כל משימה נותנת ×2 buffs | 3 |
| Skip Token | לדלג על משימה אחת בלי לאבד 70% Goal | 4 |
| הנחת פרס (50→25) | הנחה חד-פעמית של 50% על פרס מההורה | 5 |
| Buddy Mood Pack | סט חדש של אנימציות BUDDY | 3 |
| Skin חדש | Skin שונה ל-BUDDY | 5 |

---

## Children Mode (6-12) vs Teen Mode (13-18)

### Children Mode (6-12)

- **דמות BUDDY חובה** — egg/hatchling/scout/guardian, מוצגת תמיד
- **Mood reactions** — BUDDY מגיב באנימציות בכל השלמת משימה
- **Buddy בלב המסך הראשי**
- **שמות הרמות בולטים** — Friendship Level הוא element עיקרי
- **Boosters עם framing של "Buddy gave you"**
- **דמויות:** capybara, panda, unicorn, וכו' (קיים בקוד)
- **אסתטיקה:** בעתיד ייתכן theme alternative (pastel) בנוסף ל-neon — לא ב-MVP

### Teen Mode (13-18) — **מערכת onboarding choice**

**ב-onboarding ראשון, המתבגר נשאל:**
> "Want a Buddy character on your home screen?"

**שתי אפשרויות עם preview ויזואלי:**

#### אפשרות א': **With Buddy** (מסך 5A style)
- דמות BUDDY מוצגת (default: Wolf "STORMY", או הילד בוחר)
- Hearts בירוק (❤️❤️❤️❤️🤍 → 💚💚💚💚🤍)
- Friendship level בולט
- Framing: "Buddy gave you" / "Best Friends"
- Tap on buddy → "Me & Buddy" screen

#### אפשרות ב': **No Buddy / Just Stats** (מסך 5B style — מה ש-Itay בחר)
- אין דמות
- Sound wave / abstract pattern במקום
- "LEVEL 4" עם dots ירוקים
- Framing: "You earned" / "Active"
- Stats card → "My Stats" screen

**ההעדפה נשמרת.** ניתן לשנות מ-Settings בכל זמן.

**מערכת ה-Boosters זהה בשתי האפשרויות** — רק ה-presentation שונה.

---

## UI Placement — איך זה מתחבר למסכים

### העיקרון המנחה

> **שקט בברירת מחדל, מופיע ברגעי שיא, נגיש בכוונה.**

### 3 דרכים נגישות ל-"Me & Buddy" / "My Stats"

**1. Tap על BUDDY במסך הראשי** (Itay's idea, בעבודה ב-with-buddy mode)
- הילד טאפ על דמות ה-BUDDY בדשבורד
- מופיע מסך "Me & Buddy"
- Teen שהסתיר buddy: דרך כפתור "Stats" במסך הראשי

**2. Sub-tab ב-Profile**
- כשהילד נכנס ל-Profile, יש tab "Me & Buddy" / "My Stats"

**3. Toast notification ברגעי שיא**
- Level up: "🎉 You and Buddy are now Good Friends!"
- בגרסת no-buddy: "🎉 New milestone unlocked!"
- כפתור: See / Later
- אחרי שראה — נעלם

### Visual indicator למשימה הבאה

המשימה הבאה (next undone task in current stage) מסומנת ב-2 דרכים (אומת ב-Stitch):
1. **Green border** סביב הקארד
2. **Vertical green bar** בקצה השמאלי

זה לא רק styling — צריך לוגיקה ש "next undone task in current stage."

---

## Welcome Back Behavior — אחרי הפסקה

**Itay בחר אפשרות א: BUDDY מחבק, "We missed you, let's start fresh today" — בלי להזכיר את ההפסקה.**

### הסקריפט המוצע

**אחרי 3+ ימים בלי כניסה (לא ב-Pause Mode):**

```
Hey, you're back!
Let's start fresh today.
No pressure — just one task at a time.
[Let's go]
```

**עקרונות:**
- אין שאלות ("איפה היית?", "למה לא נכנסת?")
- אין סטטיסטיקה של ימי כישלון
- אין הצגת streak שנשבר
- מציע "fresh start" בלי דרמה

---

## Pause Mode — האפשרות המסודרת

לעומת Welcome Back שהיא **תגובה** להיעדרות, **Pause Mode** היא **תכנון**.

### מה זה

ההורה יכול להפעיל Pause Mode מראש:
- חופשים (סוכות, פסח, חופש גדול)
- יציאה משגרה (טיול ארוך)
- מצבי קיצון (מלחמה, מחלה, טראומה)

### איך עובד

**הורה מפעיל:**
- בהגדרות הורה: כפתור "Pause BUFF"
- אופציה לתאריך סיום
- הודעה לילד: "BUFF will be on a break until [date]"

**במהלך Pause:**
- אין notifications
- streaks/successful days מוקפאים — אין ירידה
- ילד פותח: באנר "BUFF is paused — see you on [date]"
- ב-Buddy Mode: BUDDY ישן (visual)

**Resume:**
- ההורה מבטל / מגיע התאריך
- ילד פותח: warm "Welcome back!" message
- streaks נמשכים מאיפה שהיו (לא reset)

---

## State Management — איך זה נשמר ב-DB

### טבלאות חדשות

#### `buddy_relationships`

```sql
CREATE TABLE buddy_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Relationship state
  friendship_level INT DEFAULT 1, -- 1-5
  successful_days_count INT DEFAULT 0,
  total_days_together INT DEFAULT 0,
  total_tasks_completed INT DEFAULT 0,
  
  -- Timestamps
  relationship_started_at TIMESTAMPTZ DEFAULT now(),
  last_level_up_at TIMESTAMPTZ,
  last_successful_day_at TIMESTAMPTZ,
  
  -- Customization
  current_skin_id TEXT,           -- 'wolf', 'capybara', 'panda', etc.
  current_theme_color TEXT,        -- 'green', 'blue', 'purple', 'warm'
  current_mood_pack TEXT,
  buddy_name TEXT DEFAULT 'Buddy', -- e.g. 'Stormy'
  
  -- Display preferences (Teen)
  buddy_visible BOOLEAN DEFAULT true, -- false = teen chose no-buddy
  
  -- Flags
  has_pending_gift BOOLEAN DEFAULT false,
  
  UNIQUE(child_profile_id)
);
```

#### `buddy_gifts_history`

```sql
CREATE TABLE buddy_gifts_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  gift_type TEXT NOT NULL,  -- 'theme_color' | 'double_buffs' | 'skip_token' | 'reward_discount' | 'mood_pack' | 'skin'
  gift_value TEXT,
  given_at_level INT,
  given_at TIMESTAMPTZ DEFAULT now(),
  
  used_at TIMESTAMPTZ,
  is_used BOOLEAN DEFAULT false
);
```

#### `buddy_daily_check`

```sql
CREATE TABLE buddy_daily_check (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  check_date DATE NOT NULL,
  
  tasks_assigned INT NOT NULL,
  tasks_completed INT NOT NULL,
  completion_rate DECIMAL(3,2) NOT NULL,
  is_successful_day BOOLEAN NOT NULL,
  
  UNIQUE(child_profile_id, check_date)
);
```

#### שדות חדשים ל-`app_settings` (לפי PRD)

```sql
ALTER TABLE app_settings ADD COLUMN pause_mode_active BOOLEAN DEFAULT false;
ALTER TABLE app_settings ADD COLUMN pause_until TIMESTAMPTZ;
```

### Trigger / Edge Function

**ב-EOD (end of day):**

1. אם `pause_mode_active = true` → לא לעדכן successful_days
2. עדכון `buddy_daily_check`
3. אם `is_successful_day = true` ו-`check_date != last_successful_day_at`:
   - `successful_days_count += 1`
   - בדוק אם חצינו threshold (3, 10, 30, 100)
   - אם כן: `friendship_level += 1`, `has_pending_gift = true`
   - הוסף שורה ל-`buddy_gifts_history`

**בפתיחת האפליקציה:**

- אם `pause_mode_active = true` → הצג Pause UI
- אם `has_pending_gift = true` → הצג toast "BUDDY brought you something"
- אם הילד לא נכנס 3+ ימים → Welcome Back screen

---

## Notifications

**רק 4 רגעים שולח BUDDY notification:**

1. **Level up** — חד-פעמי כשהילד הגיע לרמה חדשה
2. **Pending gift** — אם הילד לא פתח אחרי level up (24h, 72h max)
3. **Approaching milestone** — אופציונלי, יום לפני level up
4. **End of pause** — יום לפני סוף Pause Mode

**Teen rules (Itay):** מקסימום 2 ביום. צהריים + ערב, **לא בוקר**.

---

## Wolf STORMY — דמות ראשונה ל-Teen

### בחירת default

Itay אישר ב-Stitch את הזאב עם hoodie כברירת מחדל ל-Teen Mode (אם הילד בחר With Buddy).

### למה זה עובד

- מתאים ל-Teen aesthetic (gaming, edgy, לא חמוד-מדי)
- שונה מהדמויות הקיימות ב-Children Mode
- HEROIC vibes (תואם ל-HEROIC_SKINS הקיים בקוד)

### השם "STORMY"

Stitch בחר את השם. צריך להחליט:
- **א.** "STORMY" יישאר default — הילד יכול לשנות
- **ב.** הילד תמיד בוחר שם באונבורדינג

**החלטה זמנית:** א'. ניתן לשנות מ-Settings.

### השלכת implementation

צריך להוסיף Wolf skin לקטלוג HEROIC_SKINS בקוד.

---

## Children Mode (6-12) — תיעוד עתידי עם אמי

**אמי (בת 9, אחותו של Itay) = co-designer של Children Mode בעדכון עתידי, לא ב-MVP.**

### מה אמי כבר נתנה (2.5.2026)

- ראתה את 6 מסכי ה-Teen UI שעוצבו ע"י Itay
- הגיבה שהם "סבבה" — מאשרת את ה-base aesthetic
- לא ביקשה שינויים בשלב זה

### מה דחוי לעתיד

- Children Mode design pass עם אמי כ-co-designer
- ייתכן שיתווסף **theme alternative** (pastel, cute, לבת בת 9) בנוסף ל-neon
- שאלון נפרד לאמי בעתיד

### עיקרון

שני קו-יוצרים בני 15 ו-9 = שני קולות שונים. כרגע נבנה לפי Itay (Teen) ונשמור את אמי לסיבוב הבא.

---

## פיצ'רים שהוסרו או נשארו פתוחים

### הוסרו (החלטות מ-2.5)

- ❌ **Streaks רגילים** (1 יום בלי השלמה = שובר). הוחלפו ע"י Winning Streak (70%+)
- ❌ **חנות Boosters** — Itay ו-Adi הסכימו: BUDDY נותן, לא חנות
- ❌ **Souvenirs קוסמטיים בלבד** — איחוד עם Boosters פונקציונליים
- ❌ **Buddy default-on for teens** (החלטה מהבוקר) — הוחלף ב-onboarding choice

### פתוחים — להחליט בעתיד

- ❓ **התנהגות אם הילד "שובר" יום מוצלח** — בינתיים: לא מתייחסים (Safe Harbor)
- ❓ **AI/voice messages מ-BUDDY** — דחוי ל-1.1 / Phase 2
- ❓ **השפה של BUDDY** — Adi כותב? AI? תבנית?
- ❓ **Pet skins images quality** — לדייק תמונות BUDDY במהלך implementation
- ❓ **שם ה-Buddy** — Itay יבחר את שם ה-buddy שלו אם יבחר With Buddy

---

## תוכנית מימוש — Phases

### Phase 1 — MVP (לפני בילד פרודקשן)

- ✅ DB schema (3 טבלאות + שדות ל-app_settings)
- ✅ Trigger לעדכון `successful_days_count` ב-EOD
- ✅ Logic לעלייה ברמות (3 רמות ראשונות)
- ✅ Mock UI של "Me & Buddy" / "My Stats"
- ✅ Toast notification ברמה חדשה
- ✅ Tap על BUDDY → פתיחת מסך
- ✅ 2-3 Boosters בסיסיים: Custom Theme Color, ×2 Buffs
- ✅ Hide/Show Buddy ב-Teen Mode (default = onboarding choice)
- ✅ Welcome Back screen (3+ ימים בלי כניסה)
- ✅ Pause Mode (Parent UI + DB + Resume)
- ✅ Wolf STORMY skin ל-HEROIC_SKINS

### Phase 2 — אחרי MVP, לפני 1.1

- Skip Token (דורש פיתוח של "skip without breaking 70%")
- Buddy Mood Pack (אנימציות חדשות)
- הנחת פרס (50→25 buffs)
- Push notifications לרמות (אחרי FCM setup)
- רמות 4-5

### Phase 3 — 1.1+

- AI/voice messages
- Buddy birthday celebrations
- Multi-buddy (אחים יכולים לבחור buddies שונים)
- **Children Mode design pass עם אמי**
- **Pastel theme alternative**

---

**סוף מסמך.**
