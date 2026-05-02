# BUFF — Buddy System Design

**מטרה:** עיצוב מערכת BUDDY ב-BUFF — דמות, רמות חברות, מתנות (Power-Ups), ו-UI placement.

**עודכן:** 2 במאי 2026

**מבוסס על:** שיחה עם Adi ו-Itay (קו-יוצר, בן 15) ב-2.5.2026, וצילומי השראה מ-Pokémon GO (Buddy Adventure).

---

## פילוסופיה

### למה BUDDY בכלל?

BUFF הוא לא משחק — הוא כלי אימון. אבל ילד עם ADHD צריך משהו שגורם לו לחזור מחר. BUDDY הוא **הקשר שגורם לחזור** — לא הפיצ'ר שמתפתה.

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

---

## רמות החברות

### העקרון: ימים מוצלחים מצטברים

**יום מוצלח = יום שהילד השלים 70%+ מהמשימות.** זה תואם את עיקרון 70% Goal הקיים.

- **לא רצוף** — אם פספסת יום, אתה לא חוזר ל-0. ההתקדמות נשמרת
- **לא תלוי במספר משימות** — הורה שמגדיר 4 משימות וילד שמשלים 3 = יום מוצלח. הורה שמגדיר 10 וילד שמשלים 7 = יום מוצלח
- **יום מוצלח = יום מוצלח** — לא משנה כמה

### 5 הרמות

| רמה | שם | טריגר | מתנת BUDDY | בוחר |
|---|---|---|---|---|
| 1 | **Buddy Buddies** | יום 1 (התחלה) | אין מתנה — היכרות | — |
| 2 | **Good Friends** | אחרי **3 ימים מוצלחים** מצטברים | Custom Theme Color (4 צבעים) | BUDDY |
| 3 | **Close Friends** | אחרי **10 ימים מוצלחים** מצטברים | בחירה: כפל נקודות חד-פעמי **או** Buddy Mood Pack חדש | הילד |
| 4 | **Best Friends** | אחרי **30 ימים מוצלחים** מצטברים | בחירה: Skip Token **או** Custom Theme Color שני | הילד |
| 5 | **Forever Friends** | אחרי **100 ימים מוצלחים** מצטברים | בחירה: הנחת פרס (50→25 buffs) **או** Skin חדש | הילד |

### לאחר רמה 5

ב-Forever Friends, BUDDY ממשיך לתת Power-Ups **בתדירות נמוכה** — בערך אחד לכל 30 ימים מוצלחים נוספים. המטרה: לא להעמיס, לא לבזות.

### למה ה-thresholds האלה

- **3 ימים** — מספיק כדי שהילד יחווה "אני יכול לעשות את זה." לא חצי-יום, לא חודש
- **10 ימים** — סף ממשי. עכשיו זה הרגל מתחיל
- **30 ימים** — חודש. החלק הזה הוא ה-retention cliff מה-PRD ("Month 2+: novelty wears off"). מתנה ברמה 4 קוטעת את העייפות
- **100 ימים** — הישג גדול. הילד הוא חבר אמיתי של BUDDY עכשיו

---

## קטלוג ה-Power-Ups

ה-Power-Ups שהילד מקבל הם **פונקציונליים, לא קוסמטיים בלבד**. הם משפיעים על איך BUFF מתנהג עבורו.

### 1. Custom Theme Color

**מה זה:** הילד בוחר accent color של האפליקציה — ירוק (default), כחול, סגול, חם.

**אפקט:** קוסמטי + אישי. הילד מרגיש שזה "האפליקציה שלי."

**זמין ב:** רמה 2 (BUDDY בוחר 4 צבעים), רמה 4 (הילד בוחר אם רוצה להחליף)

---

### 2. כפל נקודות (×2 Buffs)

**מה זה:** ליום אחד, כל משימה נותנת ×2 buffs.

**אפקט פונקציונלי:** מגביר את ה-buffs היומיים. מאיץ את ההתקדמות לפרס.

**מתי לזה ערך:** ילד יכול "לחסוך" את זה ליום שהוא יודע שיהיה לו עומס משימות, או ליום שהוא רוצה להגיע מהר יותר לפרס מההורה.

**זמין ב:** רמה 3

---

### 3. Skip Token

**מה זה:** Token חד-פעמי שמאפשר לדלג על משימה אחת בלי לאבד את ה-70% Goal של היום.

**אפקט פונקציונלי:** מאפשר גמישות ביום קשה. במקום לאבד יום שלם, הילד מסיר משימה אחת ועדיין מצליח.

**מנגנון רגשי:** "Buddy יודע שיש ימים קשים — נתן לי דרך להתמודד."

**זמין ב:** רמה 4

---

### 4. הנחת פרס (50→25 buffs)

**מה זה:** הילד יכול לבחור פרס אחד מההורה ולקבל 50% הנחה (חד-פעמי).

**אפקט פונקציונלי:** מקצר את הזמן לפרס משמעותי. מקדם את הברית עם ההורה.

**זמין ב:** רמה 5

---

### 5. Buddy Mood Pack

**מה זה:** סט חדש של אנימציות/emojis ש-BUDDY מציג בעת השלמת משימה.

**אפקט:** קוסמטי, אבל מחדש את החוויה היומית. ילד שראה את אותה אנימציה 30 פעם מקבל משהו חדש.

**זמין ב:** רמה 3

---

### 6. Skin חדש

**מה זה:** Skin שונה ל-BUDDY (מתוך SWEET_SKINS / HEROIC_SKINS שכבר קיימים בקוד).

**אפקט:** עיצוב אישי. ילד שאוהב dragons מקבל dragon. ילד שאוהב capybaras מקבל capybara.

**זמין ב:** רמה 5 (כברירת מחדל), או דרך unlock עצמאי לפי ימים (panda@30, capybara@50, unicorn@100) — לפי הסכמה הקיימת.

---

## UI Placement — איך זה מתחבר למסכים

### העיקרון המנחה

> **שקט בברירת מחדל, מופיע ברגעי שיא, נגיש בכוונה.**

### 3 דרכים נגישות ל-"Me & Buddy"

**1. Tap על BUDDY במסך הראשי** (Itay's idea)
- הילד טאפ על דמות ה-BUDDY בדשבורד
- מופיע מסך "Me & Buddy" עם הסטטיסטיקות, הרמה, וההיסטוריה
- זאת הדרך האינטואיטיבית — ילדים נוגעים בדברים

**2. Sub-tab ב-Profile**
- כשהילד נכנס ל-Profile (לבחור skin, להגדרות), יש tab "Me & Buddy"
- זאת הדרך המסודרת

**3. Toast notification ברגעי שיא**
- כש-BUDDY מגיע לרמה חדשה: toast עליון, חד-פעמי
- "🎉 You and Buddy are now Good Friends! Tap to see what Buddy brought you"
- כפתור: See / Later
- אחרי שראה — נעלם. לא חוזר

### תגובת BUDDY לטאפ ביום רגיל

**אם אין מתנה חדשה / אירוע גדול:** טאפ → BUDDY מגיב במשהו קטן (animation/חיוך/"Hey!")

זה הופך את BUDDY לחי. כמו ללטף כלב — לא חייב משהו מיוחד, אבל **הוא מגיב.**

### במסך "Me & Buddy" — מה רואים

מבוסס על הצילומים מ-Pokémon GO Buddy Adventure:

```
┌─────────────────────────────┐
│  [Buddy Image]              │
│                             │
│  Best Friends ⭐             │
│  ❤️❤️❤️❤️❤️                  │
│                             │
│  Days together: 47          │
│  Successful days: 32        │
│  Tasks completed together:  │
│         184                 │
│                             │
│  ─────────────────          │
│  Gifts Buddy gave you:      │
│  💜 Custom Color (Day 5)    │
│  ✨ ×2 Buffs (Day 14)       │
│  🎟️ Skip Token (Day 35)    │
│  ─────────────────          │
│  Next gift in:              │
│  3 successful days          │
└─────────────────────────────┘
```

הסעיפים:
- **דמות + רמה** — הילד רואה היכן הוא עומד
- **לבבות** — visual של רמת חברות (1-5 לבבות)
- **Stats** — ימים יחד, ימים מוצלחים, משימות יחד
- **History of gifts** — מתנות שקיבל, עם תאריך
- **Next gift** — מה הבא, מתי

---

## State Management — איך זה נשמר ב-DB

### טבלאות חדשות / שדות חדשים

#### טבלה חדשה: `buddy_relationships`

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
  current_skin_id TEXT,
  current_theme_color TEXT,
  current_mood_pack TEXT,
  
  -- Flags
  has_pending_gift BOOLEAN DEFAULT false, -- toast לא נראה עדיין
  
  UNIQUE(child_profile_id)
);
```

#### טבלה חדשה: `buddy_gifts_history`

```sql
CREATE TABLE buddy_gifts_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  gift_type TEXT NOT NULL, -- 'theme_color' | 'double_buffs' | 'skip_token' | 'reward_discount' | 'mood_pack' | 'skin'
  gift_value TEXT, -- e.g. 'green', 'dragon', for choices
  given_at_level INT,
  given_at TIMESTAMPTZ DEFAULT now(),
  
  -- For consumable gifts
  used_at TIMESTAMPTZ,
  is_used BOOLEAN DEFAULT false
);
```

#### טבלה חדשה: `buddy_daily_check`

```sql
CREATE TABLE buddy_daily_check (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  check_date DATE NOT NULL,
  
  tasks_assigned INT NOT NULL,
  tasks_completed INT NOT NULL,
  completion_rate DECIMAL(3,2) NOT NULL, -- 0.00 to 1.00
  is_successful_day BOOLEAN NOT NULL, -- true if completion_rate >= 0.70
  
  UNIQUE(child_profile_id, check_date)
);
```

### Trigger / Edge Function

**ב-EOD (end of day) או ב-task completion:**

1. עדכון `buddy_daily_check` עם הסטטוס היומי
2. אם `is_successful_day = true` ו-`check_date != last_successful_day_at`:
   - `successful_days_count += 1`
   - בדוק אם חצינו threshold לרמה הבאה (3, 10, 30, 100)
   - אם כן: `friendship_level += 1`, `has_pending_gift = true`, `last_level_up_at = now()`
   - הוסף שורה ל-`buddy_gifts_history`

**בפתיחת האפליקציה:**

- אם `has_pending_gift = true`: הצג toast "BUDDY brought you something"
- אחרי הילד אישר/ראה: `has_pending_gift = false`

---

## Notifications

### המתי-ים שב-BUDDY שולח push notification

**רק 3 רגעים — לא יותר:**

1. **Level up** — חד-פעמי כשהילד הגיע לרמה חדשה
   - "🎉 You and Buddy are now Good Friends! Open BUFF to see what Buddy brought."

2. **Pending gift** — אם הילד לא פתח את האפליקציה אחרי level up
   - אחרי 24 שעות: "Buddy is waiting for you with a gift 🎁"
   - אחרי 72 שעות: לא שולח שוב

3. **Approaching milestone** — אופציונלי, אם הילד הוא 1 יום לפני level up
   - "One more successful day until you and Buddy become Best Friends!"

**עקרון:** BUDDY לא spam. הוא חשוב כי הוא נדיר.

---

## הבדלים בין Buddy Mode (6-12) ל-Teen Mode (13-15)

### Buddy Mode (6-12)

- **דמות BUDDY מוצגת באמת** — egg/hatchling/scout/guardian
- **Mood reactions** — BUDDY מגיב באנימציות בכל השלמת משימה
- **חיבת BUDDY מרכזית** — הוא בלב המסך הראשי
- **שמות הרמות בולטים** — Friendship Level הוא element עיקרי

### Teen Mode (13-15)

- **BUDDY לא מוצג ב-default** (Itay: "לא משנה לי איזה דמות / בלי דמות בכלל")
- **אבל המערכת קיימת ברקע** — Itay כן יקבל מתנות (theme color, ×2 buffs), הוא כן יראה אותן
- **גישה דרך Profile** — אין tap-on-buddy כי אין buddy במסך
- **פחות באנרים** — מתנה מופיעה כ-toast יותר עניין, פחות חגיגה
- **שמות אחרים?** — אופציה להחליף "Best Friends" ל-"Streak Crew" / משהו שמרגיש teen. **שאלה פתוחה ל-Itay**

**הליבה זהה:** ימים מוצלחים → רמות → מתנות. רק ה-UI שונה.

---

## פיצ'רים שהוסרו או נשארו פתוחים

### הוסרו (החלטות מ-2.5)

- ❌ **Streaks רגילים** (1 יום בלי השלמה = שובר). הוחלפו על ידי Winning Streak (70%+ ברצף, מ-PRD)
- ❌ **חנות Power-Ups** — Itay אמר "לא רוצה חנות, BUDDY נותן." זה מתאים לפילוסופיה
- ❌ **Souvenirs קוסמטיים** — איחוד עם Power-Ups פונקציונליים. אין שני סוגים שונים

### פתוחים — להחליט בעתיד

- ❓ **שמות הרמות במצב Teen** — האם להשאיר Buddy Buddies / Good Friends, או לתת ל-Itay לבחור שמות יותר teen? (להוסיף לשאלון Itay)
- ❓ **מה קורה אם הילד "שובר" יום מוצלח** — יש פניית BUDDY מסבירה ("היה לך יום קשה, נשארנו ביחד")? או שלא מתייחסים?
- ❓ **AI/voice messages מ-BUDDY** — דחוי ל-1.1 / Phase 2. עכשיו רק טקסט מקובע

---

## תוכנית מימוש — Phases

### Phase 1 — MVP (לפני בילד פרודקשן)

- ✅ DB schema (3 טבלאות חדשות)
- ✅ Trigger לעדכון `successful_days_count` ב-EOD
- ✅ Logic לעלייה ברמות
- ✅ Mock UI של מסך "Me & Buddy" (סטטיסטיקות + רמה)
- ✅ Toast notification ברמה חדשה
- ✅ Tap על BUDDY → פתיחת מסך
- ✅ 2-3 Power-Ups בסיסיים: Custom Theme Color, ×2 Buffs (חד-פעמי)

### Phase 2 — אחרי MVP, לפני 1.1

- Skip Token (דורש פיתוח של "skip without breaking 70%")
- Buddy Mood Pack (אנימציות חדשות)
- הנחת פרס (50→25 buffs)
- Push notifications לרמות

### Phase 3 — 1.1+

- AI/voice messages
- Buddy birthday celebrations
- Multi-buddy (אחים יכולים לבחור buddies שונים)

---

## פתוחות לדיון

1. ⏳ **שמות הרמות במצב Teen** — לקבל מ-Itay
2. ⏳ **מספר ה-Mood Packs בהתחלה** — 1 או 2 ב-MVP?
3. ⏳ **Theme Colors** — איזה 4 צבעים בדיוק? (ירוק ניאון, כחול, סגול, חם — נכון?)
4. ⏳ **השפה של BUDDY** — מי כותב את ההודעות? Adi? AI? תבנית?
5. ⏳ **התנהגות אם ילד פותח אחרי 7 ימי "כישלון"** — האם BUDDY מתקרב/מקלל/מתעלם? (החלטה רגישה — אסור שיהיה לחץ)

---

**סוף מסמך.**
