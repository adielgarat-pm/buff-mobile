#!/usr/bin/env node
/**
 * SessionStart hook: injects git/PR reality into every Claude Code session.
 *
 * Guards against the failure modes from the 2026-07-22 retro:
 *  - committing to a branch whose PR already merged (stranded commits)
 *  - working from a branch that is behind origin/main (parallel-session drift)
 *  - stacked PRs (base != main)
 *
 * Must NEVER fail the session: always exits 0, degrades silently on errors.
 */
const { execSync } = require('child_process');

function sh(cmd, timeoutMs = 8000) {
  try {
    return execSync(cmd, { timeout: timeoutMs, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return null;
  }
}

const lines = [];
try {
  const branch = sh('git rev-parse --abbrev-ref HEAD', 4000);
  if (!branch) process.exit(0);

  // Refresh origin/main quietly; tolerate offline (falls back to cached ref).
  sh('git fetch origin main --quiet', 8000);

  const behind = sh('git rev-list --count HEAD..origin/main', 4000);
  let status = `branch: ${branch}`;
  if (behind && behind !== '0') {
    status += ` — origin/main is ${behind} commit(s) ahead`;
    if (branch !== 'main') {
      status += '. For NEW work, branch from fresh origin/main, not from here.';
    } else {
      status += '. Run git pull before editing.';
    }
  }
  lines.push(status);

  if (branch !== 'main' && branch !== 'HEAD') {
    const pr = sh(
      'gh pr view --json number,state,baseRefName --jq "{n:.number,s:.state,b:.baseRefName}"',
      8000
    );
    if (pr) {
      let info;
      try {
        info = JSON.parse(pr);
      } catch {
        info = null;
      }
      if (info) {
        if (info.s === 'MERGED' || info.s === 'CLOSED') {
          lines.push(
            `WARNING: this branch's PR #${info.n} is ${info.s}. Do NOT commit here — ` +
              'any new commit will be stranded. Create a new branch from origin/main first.'
          );
        } else if (info.b && info.b !== 'main') {
          lines.push(
            `WARNING: PR #${info.n} targets '${info.b}', not main. Stacked PRs are banned ` +
              'in this repo (they strand code when merged from phone). Retarget to main.'
          );
        } else {
          lines.push(`open PR #${info.n} -> main`);
        }
      }
    } else {
      lines.push('no open PR for this branch (or gh unavailable)');
    }
  }
} catch {
  /* never block a session */
}

if (lines.length) {
  console.log('[session-check] ' + lines.join('\n[session-check] '));
}
process.exit(0);
