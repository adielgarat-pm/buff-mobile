# Email Authentication & DMARC — buffadhd.com

> Ops note. Tracks the email-auth posture for the `buffadhd.com` domain (SPF / DKIM / DMARC)
> and the open follow-up for custom DKIM. Not a code package — reference doc.

**Owner:** Adi · **Last updated:** 2026-06-19

---

## TL;DR

The domain receives **DMARC aggregate reports** from Google (and any other mailbox provider
configured to send them). The report that prompted this note (window **2026-06-16 → 06-17**,
1 message) showed everything healthy:

- **SPF:** pass + aligned to `buffadhd.com` → **DMARC passed.**
- **DKIM signature:** valid (pass).
- **DKIM alignment:** fail — *harmless* (see below).
- **Message delivered normally. No spoofing. No action required.**

There is **no incident here.** DMARC reports are routine telemetry, not problem alerts.

---

## How to read a Google DMARC report

The file arrives as a `.zip` named like:

```
google.com!buffadhd.com!<begin-epoch>!<end-epoch>.zip
```

Inside is one XML (`<feedback>`). Format: `receiver ! your-domain ! day-start ! day-end`.
It summarizes **every message sent claiming to be from buffadhd.com** during that ~1‑day window.

Key fields:

| Field | Meaning |
|-------|---------|
| `policy_published.p` | Current enforcement. We are on **`none`** = monitor only, nothing is blocked. |
| `record.row.count` | How many messages this row represents. |
| `policy_evaluated.spf` / `.dkim` | The **aligned** result DMARC actually uses. |
| `auth_results.spf` / `.dkim` | The **raw** auth result (before alignment). |
| `disposition` | What the receiver did. `none` = delivered. |

**DMARC passes if EITHER SPF or DKIM is _both pass AND aligned_** to the header-From domain.

### Why DKIM can show "fail" while everything is fine

Google Workspace signs outbound mail by default with its own DKIM domain
(`buffadhd-com.<date>.gappssmtp.com`) instead of `buffadhd.com`. The signature is valid,
but because the signing domain ≠ `buffadhd.com`, **DKIM _alignment_ fails**. SPF still aligns,
so DMARC passes overall. This is expected default behavior until custom DKIM is configured.

---

## Current state (2026-06-19)

- `p=none`, `sp=none`, `np=none`, `pct=100`, `adkim=r` (relaxed), `aspf=r` (relaxed).
- SPF aligned & passing on Google-originated mail.
- DKIM signing via Google default `gappssmtp.com` domain → not aligned (cosmetic).
- Net: legitimate mail authenticates; nothing is being rejected or quarantined.

---

## Open follow-up — enable custom DKIM (NOT urgent)

Belt-and-suspenders. Do this **before** sending marketing / transactional email at volume,
to maximize deliverability and get DKIM aligned too.

**Steps (Google Admin Console):**
1. Admin Console → **Apps → Google Workspace → Gmail → Authenticate email**.
2. Select domain `buffadhd.com` → **Generate new record** (2048-bit).
3. Add the provided `google._domainkey` **TXT record** to DNS (wherever buffadhd.com DNS lives).
4. Wait for propagation, then **Start authentication** in the console.
5. Verify in the next DMARC report that `auth_results.dkim.domain` = `buffadhd.com` and alignment passes.

**Later hardening (only after custom DKIM is verified and reports are clean for a while):**
- Move DMARC policy from `p=none` → `p=quarantine` → `p=none`… i.e. step up to `quarantine`,
  then `reject`, once confident no legitimate sender is failing. Do this gradually.

**Do NOT** tighten the policy while DKIM is still unaligned and unverified — could start
dropping legitimate mail.

---

## Reference

- Source report: `google.com!buffadhd.com!1781654400!1781740799.xml` (window 2026-06-16→17, 1 msg, DMARC pass).
- Google DMARC help: https://support.google.com/a/answer/2466580
- Google custom DKIM: https://support.google.com/a/answer/174124
