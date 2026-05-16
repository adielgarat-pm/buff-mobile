# {Package name} — Tests

> קריטריוני pass/fail לכל פאזה. **קונקרטי וניתן לאימות.**

## איך מריצים בדיקות

ב-BUFF, רוב הבדיקות הן **בדיקות ידניות באמולטור Android** (Adi). חלק יכול להיות אוטומטי (Jest unit tests, אם יש). CC יכול להריץ tests אוטומטיים; Adi מריצה בדיקות UI.

**Sentry log health check** (convention Adi 2026-05-16): כל חבילה שעולה לproduction עוברת שתי בדיקות נגד Sentry — pre-deploy baseline ופוסט-deploy regression. ראי § Sentry log health check למטה.

---

## Sentry log health check (pre + post deploy) — convention

> חל על **כל חבילה** שמשנה קוד runtime ועולה ל-production.
> דלג רק אם החבילה היא docs-only או config-only שלא יוצרת קוד בנתיבים פעילים.

**Prerequisite:** `pkg/sentry-crash-monitoring` חייב להיות merged ל-main (סטטוס: phases 0-3 passed, phase 4 paused כש-2026-05-16). עד שזה merge — ה-Sentry check הוא דרישה מוסכמת אבל skipped בפועל, עם הערה מפורשת ב-STATUS.md.

Project: `buffadhd/react-native`. Auth token: `SENTRY_AUTH_TOKEN` (EAS project secret id `da05ed42`).

### Pre-deploy baseline — Phase last-before-merge exit deliverable

הקלט את ה-output ב-commit message תחת `Sentry baseline:` — ref frame ל-post-deploy delta.

```bash
SENTRY_AUTH_TOKEN=<paste-from-eas-env> bash -c '
  curl -s -H "Authorization: Bearer $SENTRY_AUTH_TOKEN" \
    "https://sentry.io/api/0/projects/buffadhd/react-native/issues/?statsPeriod=24h&query=is:unresolved" \
    | jq "{count: length, top: [.[0:5][] | {title, count, lastSeen}]}"
'
```

### Post-deploy regression — Closeout exit deliverable

מינימום 15 דק' אחרי merge. `DEPLOY_TIME` = ISO-8601 UTC של merge commit.

```bash
SENTRY_AUTH_TOKEN=<paste-from-eas-env> DEPLOY_TIME='YYYY-MM-DDTHH:MM:SSZ' bash -c '
  curl -s -H "Authorization: Bearer $SENTRY_AUTH_TOKEN" \
    "https://sentry.io/api/0/projects/buffadhd/react-native/issues/?query=is:unresolved+firstSeen:>$DEPLOY_TIME" \
    | jq "{new_issues_count: length, issues: [.[] | {title, firstSeen, culprit, count}]}"
'
```

**Pass:** `new_issues_count = 0`, או רק issues שלא קשורות לחבילה (לפי `title` / `culprit` lookup).
**Fail:** issue חדש שמזכיר symbol/file שהחבילה נגעה בו → investigate before tag; אם confirmed regression → revert או hotfix.

### Token sourcing

- Local one-off (Adi): `eas env:exec production -- node -e "console.log(process.env.SENTRY_AUTH_TOKEN)"`.
- CI: `SENTRY_AUTH_TOKEN` ב-GitHub Actions secrets + workflow PR-trigger ו-post-merge cron. **לא הוקם עדיין** — הצעה ל-`pkg/sentry-ci-health-checks` עתידי.

---

## פאזה 1

### בדיקות אוטומטיות (CC מריץ)
- [ ] {קריטריון בדיקתי, אם יש tests אוטומטיים}

### בדיקות ידניות באמולטור (Adi)
- [ ] {מה לבדוק במסך X}
- [ ] {האם הזרימה עובדת}
- [ ] {האם הUI נראה נכון לפי Stitch / DESIGN.md}

### בדיקות מתודולוגיות (תמיד)
- [ ] STATUS.md row נוסף עם phase=1, state=passed
- [ ] עדכוני canonical docs לפי SPEC_SYNC.md נוכחים באותו commit
- [ ] Values Check עדיין עובר אחרי implementation (לא רק בSPEC)
- [ ] INTEGRATION_LEARNINGS.md עודכן אם היו הפתעות
- [ ] **Sentry pre-deploy baseline נרשם** (בפאזה האחרונה לפני merge) — ראי § Sentry log health check. ציין "skipped" אם Sentry עדיין לא merged.

---

## פאזה 2
...

## פאזה N
...

---

## Closeout
- [ ] כל בדיקות הפאזות עוברות
- [ ] STATUS.md closeout checklist הושלם
- [ ] Git tag נוצר
- [ ] אין drift בין canonical docs לבין המערכת החיה
- [ ] בדיקת end-to-end ידנית באמולטור — כל הflow של החבילה עובד
- [ ] **Sentry post-deploy regression check עבר** — מינ' 15 דק' אחרי merge; `new_issues_count = 0` או רק unrelated issues. אם Sentry עוד לא merged → ציין "skipped — retroactive run scheduled".
