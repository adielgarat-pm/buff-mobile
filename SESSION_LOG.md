# BUFF Mobile — Session Log

> Updated automatically by Claude each session.
>
> ---
>
> ## DEADLINE: May 1
>
> - [ ] RevenueCat — connect Google Play, replace test key with goog_ key
> - [ ] Founding Members — DB + codes + flow
> - [x] Google OAuth — done (28.4)
>
> ## Open Bugs
>
> - [x] Missions not showing for new child — fixed (28.4)
> - [ ] RTL inconsistent across screens
> - [ ] AuthCallbackScreen flickers briefly after child joins (race condition — profile loads after SIGNED_IN event)
> - [ ] Child who joins via code has no tasks — parent must set up this child via onboarding first. Need to decide on empty state with guidance to parent.
>
> ## Done
>
> - [x] Date picker — replaced with native datetimepicker
> - [x] scheduleDays fallback — fixed to 7 days (useChildProgress.ts)
> - [x] Debug logs — added to ChildTasksScreen + UStep5_Preview
> - [x] GitHub repo buff-mobile created and connected (28.4)
> - [x] ParentOnboardingModals crash — replaced with Stack.Group (28.4)
> - [x] expo-document-picker / expo-image-picker — converted to dynamic imports (28.4)
> - [x] TypeScript errors — RouteProp, todayTasks, enterChildPreview type, syntax error in useChildProgress (28.4)
> - [x] Google OAuth — buff://auth/callback scheme, Google Cloud Console + Supabase provider configured (28.4)
> - [x] Missions bug root cause — ParentOnboardingModals navigator crash + scheduleDays (28.4)
> - [x] expo-clipboard — converted to dynamic import (29.4)
> - [x] Child join flow — keyboard fix (KeyboardAvoidingView), email confirm disabled, rate limit workaround (29.4)
>
> ## Backlog
>
> - [ ] Section B in Step 3 (multi-select checkboxes)
> - [ ] ScrollView in Step 3
> - [ ] Homework and grades → Homework and focus
> - [ ] Missions → Quests + Multi-motivator (Step 4)
> - [ ] Deep link buff://join/:code (Option B, after RevenueCat)
> - [ ] FCM Notifications
> - [ ] Dashboard children fix
> - [ ] Capybara skin
>
> ## Sessions
>
> ### April 29 2026
> - Fixed expo-clipboard crash: converted to dynamic import in ParentSettingsScreen
> - Added copy button to Family Code row in Settings (copy icon → checkmark feedback)
> - Fixed ChildJoinScreen keyboard issue on Android: KeyboardAvoidingView behavior undefined on Android
> - Fixed child signup: disabled Supabase email confirmation (children use fake @buff.app emails)
> - Tested child join flow end-to-end: child joined family KWYEL5, landed in ChildTabs
> - Identified: child joined via code has no tasks until parent sets them up via onboarding
>
> ### April 28 2026
> - Set up Claude Code (CLI) — עובד ב-VS Code terminal
> - Fixed 4 TypeScript errors: RouteProp import, todayTasks/today undefined, enterChildPreview type mismatch, duplicate scheduleDays syntax error in useChildProgress.ts
> - Fixed ParentOnboardingModals crash: custom component inside Stack.Navigator → replaced with Stack.Group
> - Fixed expo-document-picker + expo-image-picker startup crash: converted to dynamic imports in TimetableScreen
> - Diagnosed + fixed Missions not showing for new child: root cause was the navigator crash blocking navigation post-login
> - Configured Google OAuth end-to-end: Google Cloud Console OAuth 2.0 client, Supabase provider, buff://auth/callback redirect URI
> - Fixed OAuth redirect URI: makeRedirectUri({ scheme: 'buff', path: 'auth/callback' })
> - Fixed Android Chrome Custom Tab dismiss handling via Linking deep link fallback
> - Verified full Google OAuth flow working on Android emulator (Pixel_7 AVD)
> - Git push: commit 5dc0f3b
>
> ### April 28 2025
> - Created GitHub repo buff-mobile
> - Fixed scheduleDays fallback to 7 days
> - Added debug logs for Missions investigation
> - Set up Claude in Chrome workflow
