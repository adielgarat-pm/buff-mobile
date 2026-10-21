/**
 * Anchor routines — pure DATA for the routine-shaped generator
 * (pkg/anchor-routine-onboarding M2).
 *
 * WHY: the 2026-10-20 sustained-families analysis
 * (docs/research/SUSTAINED_FAMILIES_2026-10-20.md) found every long-term active
 * family runs ONE fixed routine — the same 4–6 steps, same time, every day —
 * while new families got a mixed list spread across 08:00/12:00/16:00/20:00.
 *
 * A routine is an ordered list of SLOTS. Each slot is one step in natural
 * sequence; its ids are alternatives (age band / clinical lean variants of the
 * same step) and at most one id per slot is ever picked. The generator scores
 * candidates, keeps the best `routineSize` slots, then emits them in slot order
 * so the times read like a real routine (get dressed → breakfast → bag).
 *
 * Editing a routine = a DATA edit here. Every id must exist in taskLibrary.ts
 * with a timeOfDay matching the routine's moment (enforced by tests).
 */
import type { Domain, TimeOfDay } from './types';

export type RoutineMoment = 'morning' | 'afternoon' | 'evening';

export interface RoutineDef {
  moment: RoutineMoment;
  /** HH:MM of the first step. */
  start: string;
  /** Minutes between consecutive steps. */
  spacingMin: number;
  /** Ordered steps; each inner array = interchangeable alternatives. */
  slots: string[][];
}

export const ROUTINES: Record<RoutineMoment, RoutineDef> = {
  // Getting out of the house.
  morning: {
    moment: 'morning',
    start: '07:00',
    spacingMin: 5,
    slots: [
      ['d7_own_alarm'],
      ['d7_make_bed'],
      ['d1_get_dressed', 'd7_dress_self'],
      ['d1_brush_wash'],
      ['d1_eat_breakfast', 'd7_make_breakfast'],
      ['d1_calm_breaths', 'd1_move_body', 'd5_power_word'],
      ['d6_first_morning'],
      ['d7_pack_bag', 'd3_check_bag'],
      ['d1_bag_by_door'],
    ],
  },
  // After school.
  afternoon: {
    moment: 'afternoon',
    start: '16:00',
    spacingMin: 15,
    slots: [
      ['d3_empty_bag'],
      ['d2_write_due', 'd2_work_out_today'],
      ['d2_clear_desk'],
      ['d2_pick_first', 'd3_pick_one_first'],
      ['d2_open_book', 'd2_five_min', 'd2_focus_round', 'd2_calm_breath_begin'],
      ['d6_guess_time'],
      ['d4_movement_break', 'd2_move_break'],
      ['d4_precommit_stop', 'd4_after_screen'],
      ['d3_go_over_hw'],
    ],
  },
  // Before bed.
  evening: {
    moment: 'evening',
    start: '19:30',
    spacingMin: 10,
    slots: [
      ['d3_pack_timetable', 'd1_pack_bag'],
      ['d1_layout_clothes'],
      ['d6_plan_tomorrow', 'd6_main_thing'],
      ['d1_set_alarm'],
      ['d4_charge_outside'],
      ['d4_screens_off'],
      ['d5_one_good_thing', 'd5_good_at'],
    ],
  },
};

/**
 * Which moment the main challenge points at. Explicit (not inferred from data)
 * so the choice is reviewable: morning-routine and independence kids anchor on
 * leaving the house; homework/screens/time kids on after school; organisation
 * (pack the night before) and confidence (one good thing) on bedtime.
 */
export const MOMENT_FOR_DOMAIN: Record<Domain, RoutineMoment> = {
  1: 'morning',
  2: 'afternoon',
  3: 'evening',
  4: 'afternoon',
  5: 'evening',
  6: 'afternoon',
  7: 'morning',
};

/** Add minutes to an HH:MM string (same day; routines never cross midnight). */
export function addMinutes(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/** A routine's moment is also a library timeOfDay value. */
export function momentAsTimeOfDay(moment: RoutineMoment): TimeOfDay {
  return moment;
}
