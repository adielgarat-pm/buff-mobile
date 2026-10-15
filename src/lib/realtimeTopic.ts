// Unique Supabase realtime channel topics.
//
// supabase.channel(topic) RETURNS THE EXISTING CHANNEL when one with the same
// topic is still registered (it stays registered until the server acks the
// leave). Chaining .on('postgres_changes', ...) onto that already-joining
// channel throws "cannot add postgres_changes callbacks ... after subscribe()"
// and blanks the mounting screen.
//
// Date.now() alone is NOT unique: two instances of the same hook mounted in one
// commit (e.g. useSubscription → useFamilyMembers called by both
// ParentDashboardScreen and CoachTrialNote) run their effects back-to-back in
// the same millisecond. A module-level counter can't collide in-process.
let seq = 0;

export function uniqueTopic(prefix: string): string {
  seq += 1;
  return `${prefix}-${Date.now()}-${seq}`;
}
