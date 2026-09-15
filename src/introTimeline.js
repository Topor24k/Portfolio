// Cues measured against the original 44.1 kHz Intro Opening.wav.
export const INTRO_DURATION = 7.510771
export const INTRO_WORDS = [
  { word: 'IDEAS.', caption: 'Every good thing starts with one.', start: 0, end: 1.62 },
  { word: 'DESIGN.', caption: 'Give it a point of view.', start: 1.52, end: 2.79 },
  { word: 'CODE.', caption: 'Make it real.', start: 2.69, end: 4.12 },
]

export function introFrame(time) {
  const elapsed = Math.min(INTRO_DURATION, Math.max(0, Number.isFinite(time) ? time : 0))
  const chapter = elapsed >= 4.02 ? 3 : elapsed >= 2.69 ? 2 : elapsed >= 1.52 ? 1 : 0
  return { elapsed, chapter, progress: elapsed / INTRO_DURATION, done: elapsed >= INTRO_DURATION }
}
