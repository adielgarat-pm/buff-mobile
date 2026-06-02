/**
 * Starter-task generator — pure LOGIC layer.
 *
 * Deterministic: same input → same output, no randomness. This is what makes
 * the engine testable and what lets the LEARNING layer (Phase 3) re-weight via
 * data rather than code.
 *
 * It replaces the positional logic in UStep5_Preview.tsx:
 *   - `STARTER_TASKS_BY_CHALLENGE[main].slice(0,3)` → domain-scored selection
 *   - positional `TASK_TIMES[index]` → timeOfDay-derived HH:MM (fixes the bug
 *     where "screens off before bed" got 16:00 for being 2nd in the list)
 *
 * Pipeline (see DOMAIN_RESEARCH.md §12):
 *   resolve config → resolve sex-lean → score eligible tasks per challenge →
 *   take top-N from main + top-1 from each additional → dedupe → guarantee a
 *   leaned task when one exists → cap → map to GeneratedTask.
 */
import { ONBOARDING_CONFIG } from '../../../../config/onboardingConfig';
import type { GenerateInput, GeneratedTask, GeneratorConfig, LearnedScores, SexLean, StarterTaskDef } from './types';
import type { AgeGroup, Gender } from '../onboardingData';
import { STARTER_TASK_LIBRARY } from './taskLibrary';
import { domainForChallenge } from './challengeMap';
import { resolveConfig } from './generatorConfig';
import { categoryFor, hhmmFor } from './timeOfDay';

/**
 * The clinical-presentation lean to bias toward for this child, or null when no
 * tuning should apply. Behavior overrides sex elsewhere; here we only translate
 * the declared gender into a default lean, and we honor the §8.3 decision to
 * leave the 6-8 band unified unless explicitly enabled.
 */
export function leanForSelection(
  gender: Gender | undefined,
  ageGroup: AgeGroup,
  config: GeneratorConfig,
): SexLean | null {
  if (ageGroup === '6-8' && !config.tune6to8) return null;
  if (gender === 'boy') return 'boys';
  if (gender === 'girl') return 'girls';
  return null; // 'other' / undefined → unified, no bias
}

/** Learning key — must match LearnedScores documentation in types.ts. */
function learnedKey(ageBand: AgeGroup, gender: Gender | undefined, taskId: string): string {
  return `${ageBand}|${gender ?? 'other'}|${taskId}`;
}

/**
 * Score a single task. Higher = preferred. Pure and side-effect-free.
 * - base   = editorial baseWeight + population learning (0 in Phase 1)
 * - lean   = +bonus when the task matches the child's lean; small penalty when
 *            it's the opposite lean (kept ELIGIBLE — deprioritized, never
 *            excluded, per §0.3 guardrail). `both` tasks are lean-neutral.
 */
export function scoreTask(
  task: StarterTaskDef,
  lean: SexLean | null,
  ageBand: AgeGroup,
  gender: Gender | undefined,
  learned: LearnedScores,
  config: GeneratorConfig,
): number {
  let score = task.baseWeight + (learned[learnedKey(ageBand, gender, task.id)] ?? 0);
  if (lean !== null && task.sexLean !== 'both') {
    if (task.sexLean === lean) score += config.sexLeanBonus;
    else score += config.oppositeLeanPenalty;
  }
  return score;
}

/** Eligible = enabled, appropriate for the age band, and in the given domain. */
function eligibleForDomain(
  domain: number,
  ageBand: AgeGroup,
): StarterTaskDef[] {
  return STARTER_TASK_LIBRARY.filter(
    (t) => t.enabled && t.domain === domain && t.ageBands.includes(ageBand),
  );
}

/**
 * Deterministic comparator: score desc, then baseWeight desc, then id asc.
 * The final id tiebreak guarantees stable output for tests and analytics.
 */
function makeComparator(scoreOf: (t: StarterTaskDef) => number) {
  return (a: StarterTaskDef, b: StarterTaskDef): number => {
    const ds = scoreOf(b) - scoreOf(a);
    if (ds !== 0) return ds;
    const dw = b.baseWeight - a.baseWeight;
    if (dw !== 0) return dw;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  };
}

function toGeneratedTask(task: StarterTaskDef, source: string): GeneratedTask {
  return {
    id: task.id,
    title: task.title,
    buff_value: ONBOARDING_CONFIG.DEFAULT_BUFF_VALUE,
    timeOfDay: task.timeOfDay,
    time: hhmmFor(task.timeOfDay),
    category: categoryFor(task.domain, task.category),
    domain: task.domain,
    sexLean: task.sexLean,
    evidenceTag: task.evidenceTag,
    source,
  };
}

/**
 * Generate the onboarding starter tasks.
 *
 * Contract preserved from the old positional code so it's a drop-in for
 * UStep5_Preview: returns at most `taskCap` tasks (default 5), main challenge
 * first, then one per additional challenge; every task carries `title` and
 * `buff_value` for the preview cards and `time`/`category` for the DB insert.
 */
export function generateStarterTasks(input: GenerateInput): GeneratedTask[] {
  const config = resolveConfig(input.config);
  const learned = input.learned ?? {};
  const ageBand = input.ageGroup;
  const lean = leanForSelection(input.gender, ageBand, config);

  const scoreOf = (t: StarterTaskDef): number =>
    scoreTask(t, lean, ageBand, input.gender, learned, config);
  const comparator = makeComparator(scoreOf);

  const chosen: GeneratedTask[] = [];
  const seen = new Set<string>();

  const pushTask = (task: StarterTaskDef, source: string): boolean => {
    if (config.dedupeAcrossChallenges && seen.has(task.id)) return false;
    seen.add(task.id);
    chosen.push(toGeneratedTask(task, source));
    return true;
  };

  // 1) Primary (main) challenge → top `mainCount` tasks from its domain.
  const mainDomain = domainForChallenge(input.mainChallenge);
  if (mainDomain !== null) {
    const ranked = eligibleForDomain(mainDomain, ageBand).sort(comparator);
    for (const task of ranked) {
      if (chosen.length >= config.mainCount) break;
      pushTask(task, 'main');
    }
  }

  // 2) Each additional challenge → top `perAdditionalCount` task(s) from its
  //    domain, up to `maxAdditionalChallenges` contributing challenges.
  const additional = (input.additionalChallenges ?? []).filter(
    (c) => c && c !== input.mainChallenge,
  );
  let contributing = 0;
  for (const challenge of additional) {
    if (chosen.length >= config.taskCap) break;
    if (contributing >= config.maxAdditionalChallenges) break;
    const domain = domainForChallenge(challenge);
    if (domain === null) continue;
    const ranked = eligibleForDomain(domain, ageBand).sort(comparator);
    let taken = 0;
    for (const task of ranked) {
      if (taken >= config.perAdditionalCount) break;
      if (chosen.length >= config.taskCap) break;
      if (pushTask(task, challenge)) taken += 1;
    }
    if (taken > 0) contributing += 1;
  }

  // 3) Guarantee ≥1 sex-leaned task when the child has a lean and one exists in
  //    the chosen pool's domains but none was selected (§8.1). Swap the lowest-
  //    scoring `both` task for the highest-scoring matched-lean candidate.
  if (config.guaranteeSexLean && lean !== null && chosen.length > 0) {
    const hasLeaned = chosen.some((t) => t.sexLean === lean);
    if (!hasLeaned) {
      const domainsInPlay = new Set(chosen.map((t) => t.domain));
      const leanCandidates = STARTER_TASK_LIBRARY.filter(
        (t) =>
          t.enabled &&
          t.sexLean === lean &&
          domainsInPlay.has(t.domain) &&
          t.ageBands.includes(ageBand) &&
          !seen.has(t.id),
      ).sort(comparator);
      if (leanCandidates.length > 0) {
        // index of lowest-scoring `both` task currently chosen
        let swapIdx = -1;
        for (let i = 0; i < chosen.length; i += 1) {
          if (chosen[i].sexLean !== 'both') continue;
          if (swapIdx === -1) {
            swapIdx = i;
          } else {
            const cur = TASK_SCORE(chosen[i], scoreOf);
            const low = TASK_SCORE(chosen[swapIdx], scoreOf);
            if (cur < low) swapIdx = i;
          }
        }
        if (swapIdx !== -1) {
          const replacement = leanCandidates[0];
          const source = chosen[swapIdx].source;
          seen.delete(chosen[swapIdx].id);
          seen.add(replacement.id);
          chosen[swapIdx] = toGeneratedTask(replacement, source);
        }
      }
    }
  }

  // 4) Hard cap.
  const capped = chosen.slice(0, config.taskCap);

  // 5) Fallback — never return an empty list (keeps onboarding unbreakable).
  if (capped.length < config.minTasks) {
    return fallbackTasks(ageBand, config);
  }
  return capped;
}

/** Re-derive a chosen task's library score for the swap comparison. */
function TASK_SCORE(t: GeneratedTask, scoreOf: (d: StarterTaskDef) => number): number {
  const def = STARTER_TASK_LIBRARY.find((d) => d.id === t.id);
  return def ? scoreOf(def) : -Infinity;
}

/**
 * Fallback: highest-weighted unified, age-appropriate tasks across all domains.
 * Only hit if a challenge maps to no eligible task (e.g. unknown challenge id on
 * a narrow age band). Guarantees onboarding always shows something sensible.
 */
function fallbackTasks(ageBand: AgeGroup, config: GeneratorConfig): GeneratedTask[] {
  const ranked = STARTER_TASK_LIBRARY.filter(
    (t) => t.enabled && t.sexLean === 'both' && t.ageBands.includes(ageBand),
  ).sort((a, b) => {
    if (b.baseWeight !== a.baseWeight) return b.baseWeight - a.baseWeight;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
  return ranked.slice(0, config.mainCount).map((t) => toGeneratedTask(t, 'fallback'));
}
