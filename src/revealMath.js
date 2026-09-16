export const revealRadius = (width, height) => Math.max(100, Math.min(width * .2, height * .32, 260))
export const damp = (current, target, delta, speed = 10) => current + (target - current) * (1 - Math.exp(-speed * Math.min(delta, .05)))

// Cover without stretching, biased slightly upward to keep the portrait's face in frame.
export function portraitUvScale(width, height, imageWidth, imageHeight) {
  const cover = Math.max(width / imageWidth, height / imageHeight)
  return [width / (imageWidth * cover), height / (imageHeight * cover)]
}
