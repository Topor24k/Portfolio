// Cues measured against the original 44.1 kHz Intro Opening.wav.
export const INTRO_DURATION = 7.510771
export const INTRO_WORDS = [
  { word: 'IDEAS.', caption: 'Every good thing starts with one.', start: 0, end: 1.62 },
  { word: 'DESIGN.', caption: 'Give it a point of view.', start: 1.52, end: 2.79 },
  { word: 'CODE.', caption: 'Make it real.', start: 2.69, end: 4.12 },
]

// Loudness of the same WAV sampled at 30 fps (0–1), so visuals can breathe with the sound
// even when it is muted. Hits mark the transients the graphics punch on.
export const INTRO_ENVELOPE_FPS = 30
export const INTRO_ENVELOPE = [0,0.21,0.44,0.62,0.61,0.59,0.55,0.46,0.36,0.3,0.28,0.25,0.37,0.4,0.38,0.46,0.68,0.62,0.59,0.63,0.51,0.48,0.45,0.42,0.44,0.39,0.36,0.26,0.23,0.21,0.26,0.24,0.26,0.23,0.24,0.29,0.31,0.24,0.19,0.17,0.15,0.12,0.19,0.26,0.26,0.24,0.19,0.78,0.87,0.82,0.89,1,0.94,0.93,0.9,0.94,0.94,0.95,0.73,0.67,0.76,0.86,0.65,0.47,0.45,0.48,0.56,0.62,0.55,0.53,0.38,0.26,0.2,0.2,0.2,0.21,0.22,0.19,0.19,0.26,0.28,0.48,0.57,0.53,0.59,0.67,0.6,0.56,0.62,0.61,0.57,0.45,0.32,0.21,0.3,0.43,0.45,0.4,0.41,0.38,0.38,0.32,0.29,0.3,0.25,0.27,0.35,0.34,0.35,0.34,0.42,0.44,0.44,0.43,0.43,0.33,0.13,0.14,0.15,0.15,0.21,0.21,0.21,0.17,0.22,0.26,0.2,0.19,0.24,0.22,0.21,0.22,0.28,0.27,0.24,0.2,0.14,0.12,0.14,0.16,0.17,0.16,0.16,0.13,0.13,0.18,0.17,0.14,0.11,0.1,0.11,0.13,0.12,0.11,0.12,0.12,0.12,0.13,0.12,0.11,0.09,0.07,0.05,0.06,0.05,0.05,0.07,0.07,0.07,0.06,0.06,0.05,0.04,0.03,0.03,0.03,0.02,0.02,0.02,0.02,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0]
export const INTRO_HITS = [0, .53, 1.57, 2.7, 3.17, 3.98]

export function introLevel(time) {
  const position = Math.max(0, time) * INTRO_ENVELOPE_FPS
  const index = Math.floor(position)
  const from = INTRO_ENVELOPE[index] ?? 0
  const to = INTRO_ENVELOPE[index + 1] ?? 0
  return from + (to - from) * (position - index)
}

export function introFrame(time) {
  const elapsed = Math.min(INTRO_DURATION, Math.max(0, Number.isFinite(time) ? time : 0))
  const chapter = elapsed >= 4.02 ? 3 : elapsed >= 2.69 ? 2 : elapsed >= 1.52 ? 1 : 0
  return { elapsed, chapter, progress: elapsed / INTRO_DURATION, done: elapsed >= INTRO_DURATION }
}
