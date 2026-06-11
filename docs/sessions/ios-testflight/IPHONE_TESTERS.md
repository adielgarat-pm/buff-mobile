# iPhone Tester List — TestFlight invites

> **Why this is a manual list, not a DB query:** BUFF has been Android-only, so every
> existing user in the DB is on Android, and 0 push tokens were ever registered — there is
> **no platform signal in the database** to find iPhone families. The iPhone families are
> exactly the ones who were *blocked* and never became users. So this list comes from Adi's
> knowledge (WhatsApp, families who said "I only have an iPhone").

## How TestFlight invites work (so we collect the right thing)
- **Internal testing** (up to 100, instant, no Apple review): invite by **Apple ID email**.
  This is the fast path for the first families.
- **External testing** (public link or email, needs one-time beta review): can use a public
  link OR email invites.
- The key field to collect per family is the **Apple ID email** the invite goes to.

## Tracking table (Adi fills)

| # | Family / parent | Apple ID email (for invite) | Note (blocked before? mixed iOS+Android?) | Invited | Installed |
|---|-----------------|-----------------------------|-------------------------------------------|---------|-----------|
| 1 | (family iPhone — smoke test) | | first smoke | | |
| 2 | | | | | |
| 3 | | | | | |
| 4 | | | | | |
| 5 | | | | | |

## Suggested first wave
1. **The family iPhone** — the 5-minute smoke test before inviting anyone else.
2. Any family that explicitly said they couldn't join because they're on iPhone.
3. Mixed iOS+Android families (ties to the verified mixed-family behavior) — good real-world
   coverage of the cross-platform family case.
