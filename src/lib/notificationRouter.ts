/**
 * notificationRouter — maps notification data payload → navigation action.
 *
 * Source SPEC: docs/sessions/fcm-push-notifications/SPEC.md § Phase 5.
 * Sibling: docs/sessions/parent-notification-feed/SPEC.md (this module is shared).
 *
 * The Edge Function (Phase 3) attaches a minimal data payload:
 *   { type, entity_id, child_id, family_id }
 *
 * Tap on the toast OR tap on the system tray → this module resolves the type
 * and dispatches via the navigation ref. Per Phase 5 SPEC:
 *   - parent_sos → ParentDashboard + scroll to child card
 *   - reward_redeemed → ParentRewards tab
 *   - parent_engagement → ParentDashboard
 *   - family_joined → ParentDashboard
 *   - kid_engagement → child dashboard (kid side)
 *   - reward_approved → child rewards screen (kid side)
 *
 * Wiring to actual navigation happens in App.tsx via createNavigationContainerRef.
 */

export type PushNotificationData = {
  type?: string;
  entity_id?: string;
  child_id?: string;
  family_id?: string;
};

export type RouteAction =
  | { kind: 'parent_dashboard'; childId?: string }
  | { kind: 'parent_rewards'; entityId?: string }
  | { kind: 'parent_tasks'; childId?: string }
  | { kind: 'child_dashboard' }
  | { kind: 'child_rewards' }
  | { kind: 'noop' };

/**
 * Pure mapping from data payload → semantic action. Side-effect free.
 * Caller dispatches the action via navigation ref.
 */
export function resolveRouteAction(data: PushNotificationData): RouteAction {
  switch (data.type) {
    case 'parent_sos':
      return { kind: 'parent_dashboard', childId: data.child_id };
    case 'reward_redeemed':
      return { kind: 'parent_rewards', entityId: data.entity_id };
    case 'reward_redemption_requested':
      return { kind: 'parent_rewards', entityId: data.entity_id };
    case 'task_completed':
      return { kind: 'parent_tasks', childId: data.child_id };
    case 'child_suggestion':
      return { kind: 'parent_tasks', childId: data.child_id };
    case 'quest_milestone':
      return { kind: 'parent_dashboard', childId: data.child_id };
    case 'parent_engagement':
      return { kind: 'parent_dashboard', childId: data.child_id };
    case 'child_vibe_shared':
      // pkg/vibe-share-notification — tap lands on the parent dashboard, scrolled
      // to the child who shared their mood (same destination as parent_sos).
      return { kind: 'parent_dashboard', childId: data.child_id };
    case 'family_joined':
      return { kind: 'parent_dashboard' };
    case 'kid_engagement':
      return { kind: 'child_dashboard' };
    case 'reward_approved':
      return { kind: 'child_rewards' };
    default:
      return { kind: 'noop' };
  }
}
