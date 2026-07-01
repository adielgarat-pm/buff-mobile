/**
 * referralCapture.ts — fallback / TypeScript type anchor.
 *
 * Metro resolves referralCapture.android.ts and referralCapture.web.ts
 * at bundle time. This file is the TypeScript-visible default so that
 * `import ... from '../lib/referralCapture'` type-checks correctly.
 *
 * Behaviour is identical to the Android variant (manual entry only).
 */
export { captureRefFromUrl, saveRefCode, getRefCode, clearRefCode, sanitizeRefCode } from './referralCapture.android';
