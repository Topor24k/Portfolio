// Sound Effects Manager
const SOUND_PATHS = {
  nav: '/Sound%20Effects/ANIMATION%20SOUND%20TO%20OTHER%20NAVS.wav',
  idLace: '/Sound%20Effects/ID%20LACE%20DROP%20AND%20UP.wav',
  idSwitch: '/Sound%20Effects/ID%20SWITCH%20BACK%20AND%20FRONT.wav',
  buttonClick: '/Sound%20Effects/WHEN%20CLICKING%20BUTTONS.wav',
  typing: '/Sound%20Effects/Typing%20Sound.mp3',
  glitch: '/Sound%20Effects/GLITCH%20SOUND%20EFFECT.wav',
}

let soundMuted = false
let activeView = 'home'
let audioCtx = null
let idLaceBuffer = null
let idSwitchBuffer = null
let buttonClickBuffer = null
let typingBuffer = null
let glitchBuffer = null
let navAudio = null
let idLaceAudio = null
let idSwitchAudio = null
let glitchAudio = null
let activeGlitchSource = null
let glitchTimeoutId = null

const BUTTON_POOL_SIZE = 8
let buttonAudioPool = []
let buttonPoolIndex = 0

const TYPING_POOL_SIZE = 8
let typingAudioPool = []
let typingPoolIndex = 0

function getAudioContext() {
  if (typeof window === 'undefined') return null
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      if (AudioContextClass) {
        audioCtx = new AudioContextClass()
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {})
    }
  } catch (_) {}
  return audioCtx
}

// Pre-load audio elements and pre-decode buffers for zero-latency playback
if (typeof window !== 'undefined') {
  try {
    navAudio = new Audio(SOUND_PATHS.nav)
    navAudio.preload = 'auto'

    idLaceAudio = new Audio(SOUND_PATHS.idLace)
    idLaceAudio.preload = 'auto'

    idSwitchAudio = new Audio(SOUND_PATHS.idSwitch)
    idSwitchAudio.preload = 'auto'

    // Multi-voice audio pool for button click to ensure repetition clicking never cuts out
    buttonAudioPool = Array.from({ length: BUTTON_POOL_SIZE }, () => {
      const a = new Audio(SOUND_PATHS.buttonClick)
      a.preload = 'auto'
      return a
    })

    // Multi-voice audio pool for typing keystrokes
    typingAudioPool = Array.from({ length: TYPING_POOL_SIZE }, () => {
      const a = new Audio(SOUND_PATHS.typing)
      a.preload = 'auto'
      return a
    })

    // Pre-decode buffers into RAM for instant Web Audio trigger
    fetch(SOUND_PATHS.idLace)
      .then((res) => res.arrayBuffer())
      .then((data) => {
        const ctx = getAudioContext()
        if (ctx) {
          ctx.decodeAudioData(data, (decoded) => {
            idLaceBuffer = decoded
          })
        }
      })
      .catch(() => {})

    fetch(SOUND_PATHS.idSwitch)
      .then((res) => res.arrayBuffer())
      .then((data) => {
        const ctx = getAudioContext()
        if (ctx) {
          ctx.decodeAudioData(data, (decoded) => {
            idSwitchBuffer = decoded
          })
        }
      })
      .catch(() => {})

    fetch(SOUND_PATHS.buttonClick)
      .then((res) => res.arrayBuffer())
      .then((data) => {
        const ctx = getAudioContext()
        if (ctx) {
          ctx.decodeAudioData(data, (decoded) => {
            buttonClickBuffer = decoded
          })
        }
      })
      .catch(() => {})

    fetch(SOUND_PATHS.typing)
      .then((res) => res.arrayBuffer())
      .then((data) => {
        const ctx = getAudioContext()
        if (ctx) {
          ctx.decodeAudioData(data, (decoded) => {
            typingBuffer = decoded
          })
        }
      })
      .catch(() => {})

    glitchAudio = new Audio(SOUND_PATHS.glitch)
    glitchAudio.preload = 'auto'

    fetch(SOUND_PATHS.glitch)
      .then((res) => res.arrayBuffer())
      .then((data) => {
        const ctx = getAudioContext()
        if (ctx) {
          ctx.decodeAudioData(data, (decoded) => {
            glitchBuffer = decoded
          })
        }
      })
      .catch(() => {})
  } catch (_) {}
}

export function setSoundMuted(muted) {
  soundMuted = Boolean(muted)
  if (soundMuted) {
    stopAllSounds()
  }
}

export function isSoundMuted() {
  return soundMuted
}

export function playNavSound() {
  if (soundMuted || typeof window === 'undefined') return
  try {
    if (!navAudio) {
      navAudio = new Audio(SOUND_PATHS.nav)
    }
    navAudio.currentTime = 0
    navAudio.volume = 0.5
    navAudio.play().catch(() => {})
  } catch (_) {}
}

export function playIdLaceSound() {
  if (soundMuted || activeView !== 'home' || typeof window === 'undefined') return
  try {
    const ctx = getAudioContext()
    if (ctx && idLaceBuffer) {
      const source = ctx.createBufferSource()
      source.buffer = idLaceBuffer
      const gain = ctx.createGain()
      gain.gain.value = 0.6
      source.connect(gain)
      gain.connect(ctx.destination)
      source.start(0, 0.075)
      return
    }

    if (!idLaceAudio) {
      idLaceAudio = new Audio(SOUND_PATHS.idLace)
    }
    idLaceAudio.currentTime = 0.075
    idLaceAudio.volume = 0.6
    idLaceAudio.play().catch(() => {})
  } catch (_) {}
}

export function playIdSwitchSound() {
  if (soundMuted || activeView !== 'home' || typeof window === 'undefined') return
  try {
    const ctx = getAudioContext()
    if (ctx && idSwitchBuffer) {
      const source = ctx.createBufferSource()
      source.buffer = idSwitchBuffer
      const gain = ctx.createGain()
      gain.gain.value = 0.5
      source.connect(gain)
      gain.connect(ctx.destination)
      source.start(0)
      return
    }

    if (!idSwitchAudio) {
      idSwitchAudio = new Audio(SOUND_PATHS.idSwitch)
    }
    idSwitchAudio.currentTime = 0
    idSwitchAudio.volume = 0.5
    idSwitchAudio.play().catch(() => {})
  } catch (_) {}
}

export function playButtonClickSound(force = false) {
  if ((soundMuted && !force) || typeof window === 'undefined') return
  try {
    const ctx = getAudioContext()
    // Web Audio API buffer playback allows unlimited overlapping rapid clicks with zero latency
    if (ctx && buttonClickBuffer) {
      const source = ctx.createBufferSource()
      source.buffer = buttonClickBuffer
      const gain = ctx.createGain()
      gain.gain.value = 0.45
      source.connect(gain)
      gain.connect(ctx.destination)
      // Skip the 245ms of dead silence at the beginning so sound triggers immediately
      source.start(0, 0.245)
      return
    }

    // Fallback: round-robin through independent audio element pool so rapid clicks don't interrupt each other
    if (buttonAudioPool.length > 0) {
      const audio = buttonAudioPool[buttonPoolIndex]
      buttonPoolIndex = (buttonPoolIndex + 1) % buttonAudioPool.length
      audio.currentTime = 0.245
      audio.volume = 0.45
      audio.play().catch(() => {})
    }
  } catch (_) {}
}

export function stopGlitchSound() {
  if (glitchTimeoutId) {
    clearTimeout(glitchTimeoutId)
    glitchTimeoutId = null
  }
  if (activeGlitchSource) {
    try {
      activeGlitchSource.stop()
      activeGlitchSource.disconnect()
    } catch (_) {}
    activeGlitchSource = null
  }
  if (glitchAudio) {
    try {
      glitchAudio.pause()
      glitchAudio.currentTime = 0
    } catch (_) {}
  }
}

export function stopAllSounds() {
  try {
    if (navAudio) {
      navAudio.pause()
      navAudio.currentTime = 0
    }
    if (idLaceAudio) {
      idLaceAudio.pause()
      idLaceAudio.currentTime = 0
    }
    if (idSwitchAudio) {
      idSwitchAudio.pause()
      idSwitchAudio.currentTime = 0
    }
    buttonAudioPool.forEach((a) => {
      try {
        a.pause()
        a.currentTime = 0
      } catch (_) {}
    })
    typingAudioPool.forEach((a) => {
      try {
        a.pause()
        a.currentTime = 0
      } catch (_) {}
    })
    stopGlitchSound()
  } catch (_) {}
}

export function playSound(type) {
  if (type === 'nav') playNavSound()
  else if (type === 'idLace') playIdLaceSound()
  else if (type === 'idSwitch') playIdSwitchSound()
  else if (type === 'buttonClick') playButtonClickSound()
  else if (type === 'typing') playTypingSound()
  else if (type === 'glitch') playGlitchSound()
}

export function playTypingSound() {
  if (soundMuted || activeView !== 'contact' || typeof window === 'undefined') return
  try {
    const ctx = getAudioContext()
    if (ctx && typingBuffer) {
      const source = ctx.createBufferSource()
      source.buffer = typingBuffer
      source.playbackRate.value = 0.95 + Math.random() * 0.1
      const gain = ctx.createGain()
      gain.gain.value = 0.35
      source.connect(gain)
      gain.connect(ctx.destination)
      source.onended = () => {
        try {
          source.disconnect()
          gain.disconnect()
        } catch (_) {}
      }
      source.start(0)
      return
    }

    if (typingAudioPool.length > 0) {
      const audio = typingAudioPool[typingPoolIndex]
      typingPoolIndex = (typingPoolIndex + 1) % typingAudioPool.length
      audio.currentTime = 0
      audio.playbackRate = 0.95 + Math.random() * 0.1
      audio.volume = 0.35
      audio.play().catch(() => {})
    }
  } catch (_) {}
}

let lastGlitchTrigger = 0

function playGlitchAudioClip() {
  if (soundMuted || typeof window === 'undefined') return
  const now = performance.now()
  if (now - lastGlitchTrigger < 400) return
  lastGlitchTrigger = now

  stopGlitchSound()

  try {
    const ctx = getAudioContext()
    if (ctx && glitchBuffer) {
      const source = ctx.createBufferSource()
      source.buffer = glitchBuffer
      const gain = ctx.createGain()
      gain.gain.value = 0.32
      source.connect(gain)
      gain.connect(ctx.destination)

      source.onended = () => {
        try {
          source.disconnect()
          gain.disconnect()
        } catch (_) {}
        if (activeGlitchSource === source) {
          activeGlitchSource = null
        }
      }

      activeGlitchSource = source
      // Play 480ms to match the visual glitch duration exactly
      source.start(0, 0, 0.48)
      return
    }

    if (!glitchAudio) {
      glitchAudio = new Audio(SOUND_PATHS.glitch)
    }
    glitchAudio.currentTime = 0
    glitchAudio.volume = 0.3
    const p = glitchAudio.play()
    if (p !== undefined) {
      p.then(() => {
        glitchTimeoutId = setTimeout(() => {
          try {
            if (glitchAudio) {
              glitchAudio.pause()
              glitchAudio.currentTime = 0
            }
          } catch (_) {}
          glitchTimeoutId = null
        }, 450)
      }).catch(() => {})
    }
  } catch (_) {}
}

export function setActiveView(view) {
  activeView = view || 'home'
  // When changing views, immediately stop and mute ALL sounds from all other views
  stopAllSounds()
}

export function getActiveView() {
  return activeView
}

export function playHomeGlitchSound() {
  if (activeView !== 'home') return
  playGlitchAudioClip()
}

export function playContactGlitchSound() {
  if (activeView !== 'contact') return
  playGlitchAudioClip()
}

export function playFooterGlitchSound(isFullFrame = false) {
  if (activeView === 'home' || !isFullFrame) return
  playGlitchAudioClip()
}

export function playGlitchSound(scope = 'home') {
  if (scope === 'home') playHomeGlitchSound()
  else if (scope === 'contact') playContactGlitchSound()
  else if (scope === 'footer') playFooterGlitchSound(true)
}
