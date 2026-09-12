// Sound Effects Manager
// Maps directly to /public/Sound Effects/ based on filenames:
// - ANIMATION SOUND TO OTHER NAVS.wav
// - GLITCH SOUND EFFECT.wav
// - ID LACE DROP AND UP.wav
// - ID SWITCH BACK AND FRONT.wav
// - WHEN CLICKING BUTTONS.wav

let soundMuted = false

export function setSoundMuted(muted) {
  soundMuted = muted
}

export function isSoundMuted() {
  return soundMuted
}

const SOUND_PATHS = {
  glitch: '/Sound%20Effects/GLITCH%20SOUND%20EFFECT.wav',
  idLace: '/Sound%20Effects/ID%20LACE%20DROP%20AND%20UP.wav',
  idSwitch: '/Sound%20Effects/ID%20SWITCH%20BACK%20AND%20FRONT.wav',
  nav: '/Sound%20Effects/ANIMATION%20SOUND%20TO%20OTHER%20NAVS.wav',
  buttonClick: '/Sound%20Effects/WHEN%20CLICKING%20BUTTONS.wav',
}

const SOUND_VOLUMES = {
  glitch: 0.22,
  idLace: 0.55,
  idSwitch: 0.5,
  nav: 0.5,
  buttonClick: 0.45,
}

let lastGlitchTime = 0
let lastButtonTime = 0

export function playSound(type) {
  if (soundMuted || typeof window === 'undefined') return

  const now = Date.now()
  if (type === 'glitch') {
    if (now - lastGlitchTime < 1800) return
    lastGlitchTime = now
  } else if (type === 'buttonClick') {
    if (now - lastButtonTime < 120) return
    lastButtonTime = now
  }

  const path = SOUND_PATHS[type]
  if (!path) return

  try {
    const audio = new Audio(path)
    audio.volume = SOUND_VOLUMES[type] ?? 0.5
    const promise = audio.play()
    if (promise && typeof promise.catch === 'function') {
      promise.catch(() => {
        // Safe catch for browser autoplay restrictions before first user interaction
      })
    }
  } catch {
    // Ignore audio initialization errors
  }
}

export const playGlitchSound = () => playSound('glitch')
export const playIdLaceSound = () => playSound('idLace')
export const playIdSwitchSound = () => playSound('idSwitch')
export const playNavSound = () => playSound('nav')
export const playButtonClickSound = () => playSound('buttonClick')

