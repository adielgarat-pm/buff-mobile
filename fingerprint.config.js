// @ts-check
const { SourceSkips } = require('@expo/fingerprint');

/**
 * Stabilizes the EAS `runtimeVersion` fingerprint against cosmetic / tooling
 * edits that have nothing to do with the native runtime.
 *
 * Why this exists (2026-07-24 dead-OTA incident): the runtimeVersion policy is
 * `fingerprint`, and @expo/fingerprint by default hashes the project's
 * `.gitignore` AND every `package.json` script. Two harmless edits — #390 added
 * `!.claude/settings.json` to `.gitignore`, #389 added a `check:*` npm script —
 * each moved the fingerprint off the live binary, so every OTA published
 * afterwards targeted a runtime NO shipped binary had and silently reached ZERO
 * devices. It took two failed republishes to find them.
 *
 * `GitIgnore` + `PackageJsonScriptsAll` drop exactly those two non-native inputs
 * from the hash, so a `.gitignore` tweak or a new npm script can no longer kill
 * OTA delivery. Native code, dependencies, plugins, and app config still move the
 * fingerprint (as they must — those genuinely need a new binary).
 *
 * IMPORTANT: adopting this config changes the fingerprint ONCE. It must therefore
 * ride the NEXT production binary (vc69), NOT an OTA — an OTA published under the
 * new fingerprint could not reach the current vc68 binary. The #428 drift guard
 * will confirm the match once vc69 is built.
 */
module.exports = {
  sourceSkips: SourceSkips.GitIgnore | SourceSkips.PackageJsonScriptsAll,
};
