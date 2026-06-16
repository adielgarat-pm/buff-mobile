/**
 * gen-sfx.js — synthesize BUFF's short, low-dopamine sound effects as WAV files.
 *
 * Why generate (not download): keeps SFX in-repo + reproducible, no untrusted
 * downloads, and lets us tune them to BUFF's "calm, not gambling-like" design
 * (gentle sine tones, soft attack, smooth decay — no harsh transients).
 *
 * Output: assets/sfx/success.wav, assets/sfx/ding.wav, assets/sfx/tap.wav
 * Run:    node scripts/gen-sfx.js
 *
 * Played cross-platform via expo-audio (src/lib/sfx.ts) on web + native.
 */
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;

/** Render an array of float samples [-1,1] to a 16-bit mono WAV Buffer. */
function toWav(samples) {
  const dataLen = samples.length * 2;
  const buf = Buffer.alloc(44 + dataLen);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataLen, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);        // PCM chunk size
  buf.writeUInt16LE(1, 20);         // PCM format
  buf.writeUInt16LE(1, 22);         // mono
  buf.writeUInt32LE(SAMPLE_RATE, 24);
  buf.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  buf.writeUInt16LE(2, 32);         // block align
  buf.writeUInt16LE(16, 34);        // bits per sample
  buf.write('data', 36);
  buf.writeUInt32LE(dataLen, 40);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE((s * 32767) | 0, 44 + i * 2);
  }
  return buf;
}

/** One note: sine at `freq` for `dur` sec, soft attack + exponential decay. */
function note(freq, dur, gain = 0.5) {
  const n = Math.floor(SAMPLE_RATE * dur);
  const out = new Float32Array(n);
  const attack = Math.floor(SAMPLE_RATE * 0.006); // 6ms — removes click
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const env = (i < attack ? i / attack : 1) * Math.exp(-3.2 * (i / n));
    // sine + a soft 2nd harmonic for a slightly bell-like body
    const v = Math.sin(2 * Math.PI * freq * t) + 0.18 * Math.sin(4 * Math.PI * freq * t);
    out[i] = v * env * gain;
  }
  return out;
}

/** Concatenate note arrays (sequential), with a tiny gap to separate notes. */
function seq(...notes) {
  const gap = new Float32Array(Math.floor(SAMPLE_RATE * 0.012));
  const parts = [];
  notes.forEach((nt, i) => { parts.push(nt); if (i < notes.length - 1) parts.push(gap); });
  const total = parts.reduce((a, p) => a + p.length, 0);
  const out = new Float32Array(total);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

// Notes (Hz): A5 880, C#6 1109, E6 1319 — a gentle major rise.
const SUCCESS = seq(note(880, 0.13, 0.42), note(1109, 0.13, 0.42), note(1319, 0.22, 0.46));
const DING    = note(1175, 0.20, 0.4);   // single soft "credit" bell (D6)
const TAP     = note(660, 0.05, 0.28);   // tiny UI blip (E5)

const outDir = path.join(__dirname, '..', 'assets', 'sfx');
fs.mkdirSync(outDir, { recursive: true });
const files = { 'success.wav': SUCCESS, 'ding.wav': DING, 'tap.wav': TAP };
for (const [name, samples] of Object.entries(files)) {
  const p = path.join(outDir, name);
  fs.writeFileSync(p, toWav(samples));
  console.log(`wrote ${name} (${(fs.statSync(p).size / 1024).toFixed(1)} kB)`);
}
console.log('done.');
