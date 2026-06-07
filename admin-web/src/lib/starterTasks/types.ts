/**
 * Starter-task engine — type layer.
 *
 * Design (see docs/sessions/onboarding-starter-tasks/DOMAIN_RESEARCH.md §12):
 * separate DATA (taskLibrary) from LOGIC (generateStarterTasks) from POLICY
 * (generatorConfig) from LEARNING (learnedScores, Phase 3). This file is the
 * shared vocabulary for all four layers.
 *
 * Clinical basis: tasks are tuned by age band and by *clinical ADHD
 * presentation* (sexLean), never by interest stereotype. Only Domain 5 has
 * strong sex-difference evidence; most tasks are `both`. Behavior always
 * overrides sex — sexLean only biases a default, it never gender-locks content.
 */
import type { AgeGroup, Gender, I18nString } from './appTypes';
import type { TaskCategory } from './appTypes';

/** Age band a task is appropriate for. Mirrors onboarding's AgeGroup. */
export type AgeBand = AgeGroup; // '6-8' | '9-11' | '12-14' | '15-18'

/**
 * Clinical-presentation lean for a task.
 * - `both`  — unified; appropriate regardless of presentation (the default).
 * - `girls` — scaffolds the internalizing/masking/perfectionism pattern
 *             (anti-perfectionism, emotion-naming, RSD coping).
 * - `boys`  — scaffolds the hyperactive/impulsive/externalizing pattern
 *             (impulse-pause, movement break, pre-commit stop).
 * NOTE: a lean is a *bias*, not a lock. Opposite-lean tasks stay available to
 * any child (just lower priority); see generateStarterTasks.
 */
export type SexLean = 'both' | 'girls' | 'boys';

/** When a task naturally happens, decoupled from list position (fixes the
 *  positional TASK_TIMES bug). Mapped to a concrete HH:MM in timeOfDay.ts. */
export type TimeOfDay = 'morning' | 'school' | 'afternoon' | 'evening';

/** The 7 parent-selectable challenge domains. */
export type Domain = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/**
 * A single starter-task definition — pure data, no logic.
 * The whole §1–§7 research table is just an array of these.
 */
export interface StarterTaskDef {
  /** Stable id — used for cross-challenge dedupe AND as the learning key. */
  id: string;
  domain: Domain;
  /** Bilingual child-facing title (simple, inviting, no embedded "why"). */
  title: I18nString;
  timeOfDay: TimeOfDay;
  /** Age bands this task is appropriate for. */
  ageBands: AgeBand[];
  sexLean: SexLean;
  /** Source tag → DOMAIN_RESEARCH.md §9 (keeps the clinical basis auditable). */
  evidenceTag: string;
  /** Parent-facing rationale. NEVER shown to the child. */
  rationale: string;
  /** Soft-retire a task without deleting its history / learning data. */
  enabled: boolean;
  /** Editorial priority before learning re-weights. Higher = preferred. */
  baseWeight: number;
  /** Optional category override; defaults to the domain's category. */
  category?: TaskCategory;
  /** For A/B wording experiments — the canonical task this is a variant of. */
  variantOf?: string;
}

/**
 * Population-level learned scores, keyed by `${ageBand}|${gender}|${taskId}`.
 * Phase 1 ships empty ({}). Phase 3 fills it from anonymous aggregate
 * kept/completed counts. A positive value lifts a task; negative sinks it —
 * but baseWeight provides a floor so the loop can never fully bury an
 * editorially-important task (e.g. a meds anchor).
 */
export type LearnedScores = Record<string, number>;

/** Tunable policy — the open §8 decisions expressed as data, not code. */
export interface GeneratorConfig {
  /** Hard cap on tasks returned. */
  taskCap: number;
  /** Minimum tasks before falling back. */
  minTasks: number;
  /** Tasks taken from the primary (main) challenge. */
  mainCount: number;
  /** Max number of additional challenges that contribute a bonus task. */
  maxAdditionalChallenges: number;
  /** Bonus tasks taken from each additional challenge. */
  perAdditionalCount: number;
  /** Guarantee ≥1 sex-leaned task when one exists for this age (§8.1). */
  guaranteeSexLean: boolean;
  /** Apply sex-lean tuning to the 6-8 band? Evidence weakest here (§8.3). */
  tune6to8: boolean;
  /** De-dupe by task id across the child's selected challenges (§8.4). */
  dedupeAcrossChallenges: boolean;
  /** Score bonus added when a task's lean matches the child's. */
  sexLeanBonus: number;
  /** Score penalty for an opposite-lean task (kept eligible, deprioritized). */
  oppositeLeanPenalty: number;
}

/** Input to the generator — everything known at onboarding. */
export interface GenerateInput {
  ageGroup: AgeGroup;
  gender?: Gender;
  mainChallenge: string;
  additionalChallenges?: string[];
  /** Override defaults (tests / future remote config). */
  config?: Partial<GeneratorConfig>;
  /** Phase-3 learned re-weighting; defaults to empty (no-op). */
  learned?: LearnedScores;
}

/** A generated task, carrying everything the save layer needs. */
export interface GeneratedTask {
  id: string;
  title: I18nString;
  buff_value: number;
  timeOfDay: TimeOfDay;
  /** Concrete HH:MM derived from timeOfDay (replaces positional TASK_TIMES). */
  time: string;
  category: TaskCategory;
  domain: Domain;
  sexLean: SexLean;
  evidenceTag: string;
  /** Which challenge slot produced it — 'main' or the additional challenge id. */
  source: string;
}
