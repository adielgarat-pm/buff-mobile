/**
 * LowPowerContext — provides the kid's "low power day" state and the
 * actions tied to it (sendSos, awardInstantBuff) to child-screen subtrees.
 *
 * Why a context (not just calling useDailyVibe everywhere):
 * - Each call to useDailyVibe spins up a Supabase realtime subscription.
 *   Avoiding N duplicates across dashboard sub-components is worth a context.
 * - Keeps the low-power-specific surface area cleanly scoped — components
 *   like SosButton and InstantBuffCard read from this, not from
 *   useDailyVibe directly.
 *
 * The dashboard owns the single useDailyVibe call and passes the relevant
 * slice into <LowPowerProvider value={...}>. No internal hook call here —
 * keeps the provider pure and avoids accidental duplicate subscriptions.
 */
import { createContext, useContext, type ReactNode } from 'react';

export interface LowPowerContextValue {
  /** True when today's vibe_level <= 2 (or persisted low_power_mode). */
  isLowPower: boolean;
  /** True once the kid has tapped SOS today and it persisted to the row. */
  sosSent: boolean;
  /** True if the kid has any vibe row for today (rated or persisted). */
  hasVibedToday: boolean;
  /** Flip child_vibes.parent_sos_sent = true on today's row. */
  sendSos: () => Promise<{ error: Error | null }>;
  /** Add +5 BUFFs to credit_vault for self-care prompt completion. */
  awardInstantBuff: () => Promise<{ error: Error | null; newBalance: number | null }>;
}

const LowPowerContext = createContext<LowPowerContextValue | undefined>(undefined);

export function LowPowerProvider({
  value,
  children,
}: {
  value: LowPowerContextValue;
  children: ReactNode;
}) {
  return (
    <LowPowerContext.Provider value={value}>
      {children}
    </LowPowerContext.Provider>
  );
}

export function useLowPower(): LowPowerContextValue {
  const ctx = useContext(LowPowerContext);
  if (!ctx) {
    throw new Error('useLowPower must be used within a LowPowerProvider');
  }
  return ctx;
}
