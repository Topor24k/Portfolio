export function readAudioPreference(channel, storage = globalThis.localStorage) {
  try { return storage.getItem(`kc-audio-${channel}`) !== 'off' } catch { return true }
}
export function saveAudioPreference(channel, enabled, storage = globalThis.localStorage) {
  try { storage.setItem(`kc-audio-${channel}`, enabled ? 'on' : 'off') } catch { /* Private browsing can disable storage. */ }
}
