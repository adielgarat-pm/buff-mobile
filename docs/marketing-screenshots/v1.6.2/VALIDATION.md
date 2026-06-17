# VALIDATION — v1.6.2 Play Store screenshots (EN + HE)

| Field | Value |
|---|---|
| **Date** | 2026-06-17 |
| **Validator** | Claude Code |
| **Finals present** | **6 EN + 6 HE** (12 total) |
| **Verdict** | **GO** — ready to upload, with the two content flags in `STATUS.md` for Adi to decide on |

Machine checks via `check-finals.ps1` → **PASS** (all 1080×1920 PNG; 6 EN↔HE pairs, no orphans).

## Per-shot gate

Legend: ✅ pass · ⚠️ pass-with-flag

| Shot | 1 Dims | 2 Pairing | 3 No dev artifacts | 4 No PII | 5 Overlay matches copy | 6 HE RTL | 7 DFF child-safety | 8 Status bar clean |
|---|---|---|---|---|---|---|---|---|
| 1 Parent Dashboard | ✅ | ✅ | ✅ toast cropped | ✅ | ✅ | ✅ | ✅ | ✅ demo mode |
| 2 Child + Buddy | ✅ | ✅ | ✅ preview banner pre-cropped | ✅ | ✅ | ✅ | ✅ | ✅ |
| 3 Child Rewards | ✅ | ✅ | ✅ banner under band | ⚠️ "0 Buffs" pill | ✅ | ✅ dot on right | ✅ | ✅ |
| 4 Vibe Check | ✅ | ✅ | ✅ toast cropped | ✅ | ✅ | ✅ dot on right | ✅ | ✅ |
| 5 Parent Tasks | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 6 Manage Children | ✅ | ✅ | ✅ | ✅ no emails | ✅ | ✅ | ✅ | ✅ |

## Content flags (see STATUS.md → Open flags)
- ⚠️ "70% = a successful day / Ignition!" visible (shots 1, 2) — contradicts avoid-"70%" marketing guidance. Genuine in-app copy; not edited.
- ⚠️ Shot 3 header shows "0 Buffs".

## Re-run
```
powershell -File docs/marketing-screenshots/v1.6.2/render-all.ps1
powershell -File docs/marketing-screenshots/v1.6.2/check-finals.ps1 -Root docs/marketing-screenshots/v1.6.2/final
```
