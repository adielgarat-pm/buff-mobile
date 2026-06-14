const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// ── Exclude .claude/ from Metro's file map ───────────────────────────────────
// BUFF runs dozens of parallel git worktrees under .claude/worktrees/, each with
// its own node_modules (~648 pkgs). With no watchman installed on Windows, Metro's
// Node watcher crawls the entire project root and tries to watch tens of thousands
// of extra dirs — it exceeds its startup timeout ("Failed to start watch mode"),
// which leaves DependencyGraph._resolutionCache undefined and crashes every bundle
// (`getOrCreateMap` → "Cannot read properties of undefined (reading 'get')").
//
// resolver.blockList feeds the file-map ignorePattern (see metro's
// node-haste/DependencyGraph/createFileMap.js → getIgnorePattern), which scopes
// BOTH the crawl and the watcher — so excluding .claude keeps Metro on the real
// source tree and the watcher starts instantly.
//
// NOTE: the added RegExp must carry NO flags — Metro refuses to combine blockList
// entries with mismatched flags, and Expo's defaults are flagless.
const claudeDir = /[\\/]\.claude[\\/]/;
const prev = config.resolver.blockList;
config.resolver.blockList = Array.isArray(prev)
  ? [...prev, claudeDir]
  : prev
  ? [prev, claudeDir]
  : claudeDir;

module.exports = config;
