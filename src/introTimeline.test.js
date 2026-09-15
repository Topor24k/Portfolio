import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { INTRO_DURATION, INTRO_WORDS, introFrame } from './introTimeline.js'

test('chapters meet the measured accents and resolve into the Home name', () => {
  assert.equal(introFrame(0).chapter, 0)
  assert.equal(introFrame(1.65).chapter, 1)
  assert.equal(introFrame(2.7).chapter, 2)
  assert.equal(introFrame(4.1).chapter, 3)
  assert.equal(INTRO_WORDS.length, 3)
})

test('progress is bounded and finishing cannot overflow', () => {
  assert.equal(introFrame(-2).progress, 0)
  assert.equal(introFrame(NaN).progress, 0)
  assert.equal(introFrame(INTRO_DURATION / 2).progress, .5)
  assert.equal(introFrame(INTRO_DURATION).done, true)
  assert.equal(introFrame(30).progress, 1)
})

test('the opening timing matches the supplied WAV, including its natural tail', () => {
  const wave = readFileSync(new URL('../public/Sound Effects/Intro Opening.wav', import.meta.url))
  assert.equal(wave.toString('ascii', 0, 4), 'RIFF')
  let byteRate, dataSize
  for (let offset = 12; offset + 8 <= wave.length;) {
    const size = wave.readUInt32LE(offset + 4)
    const type = wave.toString('ascii', offset, offset + 4)
    if (type === 'fmt ') byteRate = wave.readUInt32LE(offset + 16)
    if (type === 'data') dataSize = size
    offset += 8 + size + size % 2
  }
  assert.ok(Math.abs(dataSize / byteRate - INTRO_DURATION) < .001)
})
