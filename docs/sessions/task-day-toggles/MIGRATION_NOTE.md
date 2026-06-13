# Migration — backfill Saturday into old-default tasks (2026-06-13)

## What & why
Tasks onboarded on builds before the all-7-days default carry `schedule_days = [0,1,2,3,4,5]`
(Sun–Fri, **no Saturday**). On Saturdays these children see an empty task list, which reads as
"broken" (reported by tester Noa Morag re: her child Leia, 2026-06-13). Adi approved bumping the
old default to include Saturday so existing families behave like new ones.

## The update (DATA only, via execute_sql)
```sql
UPDATE tasks
SET    schedule_days = '{0,1,2,3,4,5,6}'::int[]
WHERE  coalesce(is_off_routine,false) = false
  AND  schedule_days = '{0,1,2,3,4,5}'::int[];
```
- **Scope:** 992 tasks across 96 children (the exact old-default pattern only).
- **Deliberately NOT touched:** any task with an intentionally narrowed pattern
  (`[1,2,3,4,5]`, `[0,1,2,3,4]`, `[6]`, `[5,6]`, etc.) — those were hand-set in Lovable.
- **Off-routine tasks:** excluded (already `[0-6]`).
- **Effect is immediate:** the 96 children start seeing their tasks on Saturdays.

## Reversal safety net
86 tasks were ALREADY `[0,1,2,3,4,5,6]` before this migration and must be LEFT ALONE on any revert.
To reverse the backfill (only valid before parents start hand-editing days):
```sql
UPDATE tasks
SET    schedule_days = '{0,1,2,3,4,5}'::int[]
WHERE  coalesce(is_off_routine,false) = false
  AND  schedule_days = '{0,1,2,3,4,5,6}'::int[]
  AND  id NOT IN ( /* the 86 pre-existing all-7 ids below */ );
```

### Pre-existing all-7 task IDs (the 86 to exclude from any revert)
```
0030a39e-6017-4e3a-9c1c-5c54055a6fc5, 016de0a3-ddfc-476f-941d-62112dde9091, 0666471e-3564-400a-8c77-cdc9c94a5810,
0694c202-9fdf-4e39-acc8-dd75498a69bc, 09aa5ab3-3f2c-4d3a-81d0-0e526b14b530, 0f3986c1-e5a3-4a0c-8c9b-b79f9b53e256,
19775dcd-db4a-4725-98ff-0903091afef0, 1a2a0ac7-3277-4a44-b686-801fa905b351, 224ca4c4-ca6c-48e0-9bd2-b87408a28384,
22f4a586-807b-4a4e-9a8f-39b24108a241, 2a9f6a62-c508-456c-a001-515533e76912, 2e6c3503-fba3-40c5-bb70-94e663987339,
312853e4-eb37-467b-bcbf-6c488adc64d9, 37a58a41-31fc-4ff1-a636-2ef02d7eade0, 39fc0a99-dc88-46cd-b942-72086d057f41,
3a5e94a8-db8b-48ad-b65a-108231c42437, 3b17086e-f95b-4da2-857b-6566a6566da7, 40ccb235-2c85-4c56-957b-eb32b46af83f,
40f6ac73-3337-4f44-bb02-114c46db4ff3, 42572484-960e-4bc9-839a-322d711fcc55, 42f6c08f-7724-43d0-a37f-23b5f94dba15,
449acf61-8f78-40a2-919d-a70c6b168cf8, 45ceb6d2-3e0c-4f92-84a1-30e00daa8695, 471f3ec3-6a2e-4177-afb2-a3b399464cf3,
4a625b43-38a2-4376-ba58-8ee0ac4d2e7f, 4c81f447-6d9a-4c2d-877b-1643b42f3a11, 4cb967e5-5b1e-43fd-a5b4-45e4d41706ad,
5224f4b6-9642-4556-9ad5-160c05e620cb, 564de975-de0b-40f2-9e34-e7cf0c9baec1, 5edb4014-a415-49ee-aa11-62c033db701b,
65def4f0-f6ab-4174-b544-5b76ab684dd1, 69e1e77a-73c3-4e61-9470-d3766e54a751, 6b37a7a6-e678-43d4-ac15-6271dade89bf,
6de1b82c-b402-43d3-80a2-39a3a230e9f0, 6f1484d8-6323-4cc3-b821-fb71f54efcde, 6f7cdd36-4da4-4178-9702-908d7219b714,
710ddd8a-9a54-4593-a883-cba240e664a0, 731d918e-63c6-45cb-b196-0bfa6668746b, 7afe461e-0065-430f-85c4-4cc158d3fb49,
7efd6696-6cac-40df-9723-4162913fb286, 850d74cb-76e7-4095-9460-50addf5dfd8f, 855ab329-c091-47cb-a906-3d28e400350d,
8833dcad-3473-4d52-97d3-14afbad94ed9, 92a6dd63-2a48-4eca-8e31-d684ca8fe68d, 977d454a-3a41-4c98-a4af-ca969dbeaa45,
97938e41-105c-463c-855e-0ea8225b9124, 97a45904-b8f8-4b08-81c4-0eaf33463bb7, 9b427f19-3451-423b-ad1a-817e2d1cf859,
9e23567b-8178-4381-9482-c2598b75007c, a168ce5a-06f8-4190-a748-5fa7e1fcfdf1, a221c84c-f304-47e8-b06e-973519f6b4b8,
a60d7056-59d7-4673-8789-a87968cb1d02, a8dd0eb4-d071-45c8-99df-f44e2e435ae0, a9ee9bae-996b-4c76-a26a-f9bd92f65a75,
ac2c74e6-9c6a-47b6-9c0a-00d55a137ccf, afa396d4-0f71-4f81-a227-e4b7b34db2df, b0f2cb8d-c983-460c-936c-d81557b3b6de,
b265095e-979a-40d2-b254-395ce5469516, b3723957-c53f-4d59-be3c-a4e0d87cc66a, b37bbf0f-4de2-4f39-accf-0ba2d467418c,
b4067e17-12eb-41bd-943c-766c0f8ae3f0, b681e396-957a-49b8-83ec-f19739b45589, b9e90f56-ef3d-448d-966e-58efad67b358,
bc499519-c159-4358-a54c-8728d3f7c2cf, c08f8243-f03b-464e-befa-4ffe26ee7281, c12f92bb-f929-46c6-987b-f83612b42c09,
c30d43cb-42dc-42e4-9bf1-7d3a0584c287, c510ab67-1930-4289-b305-1599d29f7e91, c7930e63-acad-4e9e-bac9-b88b059b707f,
cb667407-e02e-4772-a983-8a1eddcbb96e, cbade6bd-8d14-4ea6-a449-34c3fa8fb503, d09a639b-c9b2-42f6-b288-0df82232c468,
d0fe42a6-7c54-43b6-a563-dd8db91df36a, d3b82af2-ee62-49fe-a2ad-1e41adea84a2, d9ff9dad-d66b-4892-b4aa-feabeb16c136,
e232ae03-e412-4a82-a0cf-c5e68667f34f, e371a255-96ac-41ca-b96b-d4387dc67959, e4365581-9a42-4074-8475-1a19573ed760,
e4c5baa8-3fb0-4470-8a68-17f408126e8a, e68b8370-e9de-4ac5-b38b-4536ff3cc75b, eb807f23-f038-4395-8fd0-d141c7135e16,
ebafeebb-4558-48da-a671-00770a9ebef6, eef57d30-c5f9-4939-a8b6-d1086b551b20, efa0340a-c66c-462b-8ffb-0a1f1b0bcfed,
f19448cd-9666-47be-b777-82af3c5f3c28, f7ed9b5c-b586-48c4-b4a7-97c032ba3542
```
