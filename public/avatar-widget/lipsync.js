// Simple text-to-viseme timeline generator for browser TTS
// This is a heuristic approach: maps characters to coarse viseme classes
// and assigns approximate durations per character.

const VISEME_MAP = {
  A: 'A', a: 'A',
  E: 'E', e: 'E',
  I: 'I', i: 'I', Y: 'I', y: 'I',
  O: 'O', o: 'O',
  U: 'U', u: 'U', W: 'U', w: 'U',
  B: 'MBP', b: 'MBP', P: 'MBP', p: 'MBP', M: 'MBP', m: 'MBP'
};

function charToViseme(ch) {
  return VISEME_MAP[ch] || null;
}

// Build a simple timeline: [{ t, name, dur }]
// wpm controls overall speed; default ~160
export function buildVisemeTimeline(text, wpm = 160) {
  if (!text || typeof text !== 'string') return [];
  // Rough per-char duration based on WPM
  const words = Math.max(1, text.trim().split(/\s+/).length);
  const totalMs = (words / wpm) * 60_000; // total duration estimate
  const perChar = Math.max(40, Math.min(140, totalMs / Math.max(10, text.length)));

  const timeline = [];
  let t = 0;
  for (const ch of text) {
    const v = charToViseme(ch);
    if (!v) { t += perChar * 0.6; continue; }
    const dur = perChar; // uniform chunk; browsers will still drive audio separately
    timeline.push({ t, name: v, dur });
    t += dur;
  }
  // Collapse consecutive identical visemes
  const merged = [];
  for (const seg of timeline) {
    const last = merged[merged.length - 1];
    if (last && last.name === seg.name && (seg.t - (last.t + last.dur)) <= 10) {
      last.dur += seg.dur;
    } else {
      merged.push({ ...seg });
    }
  }
  return merged;
}

export default { buildVisemeTimeline };
