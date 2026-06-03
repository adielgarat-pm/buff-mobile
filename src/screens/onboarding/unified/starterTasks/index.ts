/**
 * Starter-task engine — public API.
 *
 * Consumers (today: UStep5_Preview) import only from here, so the internal file
 * split (data / logic / policy / learning) can change without touching callers.
 *
 * Usage:
 *   import { generateStarterTasks } from '.../starterTasks';
 *   const tasks = generateStarterTasks({ ageGroup, gender, mainChallenge, additionalChallenges });
 */
export { generateStarterTasks, leanForSelection, scoreTask } from './generateStarterTasks';
export { STARTER_TASK_LIBRARY, TASK_BY_ID } from './taskLibrary';
export { CHALLENGE_TO_DOMAIN, domainForChallenge } from './challengeMap';
export { DEFAULT_GENERATOR_CONFIG, resolveConfig } from './generatorConfig';
export { TIME_OF_DAY_TO_HHMM, DOMAIN_TO_CATEGORY, hhmmFor, categoryFor } from './timeOfDay';
export type {
  AgeBand,
  SexLean,
  TimeOfDay,
  Domain,
  StarterTaskDef,
  LearnedScores,
  GeneratorConfig,
  GenerateInput,
  GeneratedTask,
} from './types';
