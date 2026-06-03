/**
 * Default generator policy. Every value here is one of the open §8 decisions
 * from DOMAIN_RESEARCH.md, expressed as data so policy can change without
 * touching the generator. Phase 2 can source this from remote config.
 *
 * Defaults preserve today's onboarding shape (3 main + up to 2 bonus, cap 5)
 * so the engine is a drop-in for the positional logic it replaces.
 */
import type { GeneratorConfig } from './types';

export const DEFAULT_GENERATOR_CONFIG: GeneratorConfig = {
  taskCap: 5,
  minTasks: 1,
  mainCount: 3,                 // ONBOARDING_CONFIG.DEFAULT_TASKS_COUNT
  maxAdditionalChallenges: 2,
  perAdditionalCount: 1,
  guaranteeSexLean: true,       // §8.1 — surface ≥1 leaned task when one exists
  tune6to8: false,             // §8.3 — evidence weakest at 6-8; keep unified
  dedupeAcrossChallenges: true, // §8.4
  sexLeanBonus: 2,
  oppositeLeanPenalty: -1,      // deprioritized, not excluded (§0.3 guardrail)
};

export function resolveConfig(
  override?: Partial<GeneratorConfig>,
): GeneratorConfig {
  return { ...DEFAULT_GENERATOR_CONFIG, ...(override ?? {}) };
}
