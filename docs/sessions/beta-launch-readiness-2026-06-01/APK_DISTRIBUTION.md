# APK Distribution — Beta Launch 2026-05-30 / 06-01

> The APK + WhatsApp share message + integrity hash for the Lovable-migrant cohort.

---

## APK metadata

| Field | Value |
|---|---|
| **EAS Build ID** | `be870057-359b-4ce8-85bb-dca708c11405` |
| **Build profile** | `preview` (internal distribution APK, not store AAB) |
| **Source commit** | `91e3f498` (main `3d1f20a` + egg-stage workaround) |
| **Branch** | `pkg/beta-launch-readiness-2026-06-01` |
| **Package** | `com.buffapp.mobile` |
| **App version** | `1.0.0` |
| **versionCode** | `16` |
| **SDK Version** | Expo SDK 54 (React Native 0.81.5) |
| **Sentry** | enabled — `buffadhd/react-native`, source maps uploaded at build time |
| **Build started** | 2026-05-26, 21:50:19 Israel time |
| **Build finished** | _TBD when build completes_ |
| **Application Archive URL** | _TBD_ — will be `https://expo.dev/artifacts/eas/<id>.apk` |
| **sha256** | _TBD — computed after download_ |
| **Local copy** | _TBD — `.claude/tmp/buff-beta-<sha>.apk`_ |

## Where to host the file

**Recommendation:** Google Drive direct-download link (per Adi's Q2 choice — "מה שהכי פשוט"). Adi uploads the downloaded APK to her Drive, sets share to "anyone with the link, viewer," and pastes the link below.

> **CC cannot upload to Drive** — Drive auth is bound to Adi's Google account. Adi uploads, CC fills in the link below at PR merge or via STATUS.md edit.

**Drive link (Adi fills):** ____________

To make the link force-download instead of preview, transform:
```
https://drive.google.com/file/d/FILE_ID/view?usp=sharing
→
https://drive.google.com/uc?export=download&id=FILE_ID
```

## Install instructions for the cohort (Hebrew, for WhatsApp share)

These go in the share message. Adi can copy/paste or edit.

---

### הודעת WhatsApp לקבוצה — Beta 1.0.0 (16 במאי 2026)

```
שלום משפחת BUFF! 🎉

יש לנו גרסה חדשה שלמה במובייל. הינה הקישור להוריד ולהתקין:

📱 https://drive.google.com/uc?export=download&id=____________

איך מתקינים:
1. לחצו על הקישור והורידו את הקובץ (.apk)
2. אם המכשיר שואל "Install from unknown sources?" — לחצו "OK"
3. פתחו את הקובץ → לחצו "התקן"
4. אם יש לכם BUFF ישן — מומלץ למחוק אותו לפני התקנה של החדש
5. פתחו את BUFF → הירשמו ב-Google (אותו אימייל שהייתם איתו ב-Lovable)
6. אתם פטורים מתשלום (lifetime) — לא תראו מסך תשלום

יש בעיה? כתבו לי בפרטי 💜

עדי
```

---

### Things to know (transparency for the cohort)

- **תאריך תחילת הbeta:** 30/5/2026 (שבת) — חלון auto-grant lifetime פתוח עד 30/6
- **Settings screen:** מציג נתונים זמניים (1,240 BUFFs / דרקון) — לא הנתונים שלכם. תיקון בגרסה 1.0.2
- **תאריך — בחירת תאריך לידה:** ייתכן שתראו שמות חודשים באנגלית (en-GB). נתקן בקרוב.
- **לדווח על באגים:** פרטי ל-Adi או לאימייל adi@buffadhd.com

## Integrity verification (technical, for paranoid users)

```
sha256 of buff-beta-91e3f49.apk = ____________
```

Verify on Linux/macOS: `sha256sum buff-beta-91e3f49.apk`
Verify on Windows: `Get-FileHash buff-beta-91e3f49.apk -Algorithm SHA256`

If the hash doesn't match, the file may have been tampered with — re-download from the Drive link.

## What's in this build vs. v16 AAB Adi built earlier today

| | v16 AAB (Play Store) | Preview APK (this) |
|---|---|---|
| **Profile** | production (store distribution) | preview (internal distribution) |
| **Format** | `.aab` Android App Bundle | `.apk` install package |
| **Commit** | `3d1f20a` | `91e3f498` (`3d1f20a` + egg workaround) |
| **Egg state** | Visible 🥚 + egg-crack on Pastel dashboard until 3 successful days | Skin emoji (e.g. 🐶) from day 0; no egg-crack overlay |
| **Where it goes** | Google Play Console (internal testing track) | WhatsApp share to cohort |
| **Available now** | Yes (built 12:00 IL) | Building |

**Adi's decision at PR merge time:** rebuild v17 AAB to match this APK, or ship v16 AAB to Play Store and accept the asymmetry. Tracked as [IN-2026-05-26-03](../../INTEGRATION_LEARNINGS.md).

## Sign-off checklist (Adi fills before sharing the link)

- [ ] APK downloaded successfully from EAS
- [ ] sha256 verified
- [ ] Uploaded to Google Drive with "anyone with the link" share
- [ ] Drive link substituted into the WhatsApp message template
- [ ] **SMOKE_TEST_CHECKLIST.md run on installed APK — ALL pillar gates green**
- [ ] Burner test (A4 option ii) confirmed cohort auto-grant trigger fires
- [ ] No blocker open after smoke test

Only then: send the WhatsApp message to the 24-parent cohort.
