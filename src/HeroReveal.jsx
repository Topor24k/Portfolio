import { useEffect, useRef } from 'react'
import { damp, portraitUvScale, revealRadius } from './revealMath'
import './hero-reveal.css'

const IMAGE = '/About%20Me%20Images/Kayeen%201.jpg'
const VERTEX = `attribute vec2 a_position;
varying vec2 v_uv;
void main(){ v_uv = a_position * .5 + .5; gl_Position = vec4(a_position, 0., 1.); }`
const FRAGMENT = `precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_image;
uniform vec2 u_size, u_pointer, u_velocity, u_cover;
uniform float u_radius, u_alpha, u_time, u_light, u_motion;
float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);
}
void main(){
  vec2 pixel = v_uv * u_size;
  vec2 local = (pixel-u_pointer)/u_radius;
  float speed = min(length(u_velocity)/85.,1.);
  vec2 direction = u_velocity/(length(u_velocity)+.001);
  local -= direction * dot(local,direction) * speed * .12 * u_motion;
  float angle = atan(local.y,local.x);
  float organic = (sin(angle*3.+u_time*.65)*.026 + sin(angle*5.-u_time*.4)*.018
    + (noise(pixel*.009+u_time*.17)-.5)*.065) * u_motion;
  float distance = length(local)+organic;
  float mask = (1.-smoothstep(.48,1.,distance))*u_alpha;
  if(mask < .001) discard;
  vec2 uv = v_uv*u_cover + (1.-u_cover)*vec2(.5,.62);
  vec2 displacement = vec2(noise(pixel*.011+u_time*.12),noise(pixel.yx*.013-u_time*.1))-.5;
  uv += (displacement*(3.+speed*7.) + u_velocity*.025)/u_size*u_cover*u_motion;
  vec2 blur = (.45+smoothstep(.35,1.,distance)*2.2+speed*.8)*u_cover/u_size;
  vec3 color = texture2D(u_image,uv).rgb*.4;
  color += (texture2D(u_image,uv+vec2(blur.x,0.)).rgb + texture2D(u_image,uv-vec2(blur.x,0.)).rgb
    + texture2D(u_image,uv+vec2(0.,blur.y)).rgb + texture2D(u_image,uv-vec2(0.,blur.y)).rgb)*.15;
  vec3 paper = mix(vec3(.082),vec3(.961,.949,.925),u_light);
  color = mix(color,paper,mix(.37,.48,u_light));
  gl_FragColor = vec4(color,mask*.96);
}`

function createRenderer(canvas, image) {
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' })
  if (!gl) return null
  const shaders = []
  let program, buffer, texture
  const destroy = () => {
    shaders.forEach((shader) => gl.deleteShader(shader))
    if (buffer) gl.deleteBuffer(buffer)
    if (texture) gl.deleteTexture(texture)
    if (program) gl.deleteProgram(program)
  }
  try {
    for (const [type, source] of [[gl.VERTEX_SHADER, VERTEX], [gl.FRAGMENT_SHADER, FRAGMENT]]) {
      const shader = gl.createShader(type)
      shaders.push(shader)
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error('Reveal shader unsupported')
    }
    program = gl.createProgram()
    shaders.forEach((shader) => gl.attachShader(program, shader))
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Reveal program unsupported')
    gl.useProgram(program)
    buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW)
    const position = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
    texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
    const uniforms = Object.fromEntries(['size','pointer','velocity','cover','radius','alpha','time','light','motion'].map((key) => [key, gl.getUniformLocation(program, `u_${key}`)]))
    return {
      destroy,
      clear() { gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT) },
      draw({ width, height, x, y, vx, vy, radius, alpha, time, light, motion }) {
        gl.viewport(0,0,canvas.width,canvas.height)
        gl.uniform2f(uniforms.size,width,height)
        gl.uniform2f(uniforms.pointer,x,height-y)
        gl.uniform2f(uniforms.velocity,vx,-vy)
        gl.uniform2f(uniforms.cover,...portraitUvScale(width,height,image.width,image.height))
        for (const [key,value] of Object.entries({ radius, alpha, time, light: Number(light), motion: Number(motion) })) gl.uniform1f(uniforms[key],value)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.drawArrays(gl.TRIANGLES,0,6)
      },
    }
  } catch { destroy(); return null }
}

export default function HeroReveal({ active, isLight }) {
  const layerRef = useRef(null)
  const canvasRef = useRef(null)
  useEffect(() => {
    if (!active) return
    const layer = layerRef.current
    const canvas = canvasRef.current
    const hero = layer.parentElement
    const finePointer = window.matchMedia('(any-hover: hover) and (any-pointer: fine)')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const image = new Image()
    let renderer, disposed = false, ready = false, frameId = 0, previous = 0, inside = false
    let x = 0, y = 0, targetX = 0, targetY = 0, alpha = 0
    let width = hero.clientWidth, height = hero.clientHeight
    const resize = () => {
      width = hero.clientWidth; height = hero.clientHeight
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas.width = Math.round(width*ratio); canvas.height = Math.round(height*ratio)
      if (inside) wake()
    }
    const render = (now) => {
      frameId = 0
      if (disposed || !ready) return
      const delta = previous ? (now-previous)/1000 : 1/60
      previous = now
      const motion = !reducedMotion.matches
      x = motion ? damp(x,targetX,delta,11) : targetX
      y = motion ? damp(y,targetY,delta,11) : targetY
      alpha = motion ? damp(alpha,inside ? 1 : 0,delta,inside ? 9 : 12) : Number(inside)
      const radius = revealRadius(width,height)
      if (renderer) renderer.draw({ width,height,x,y,vx:targetX-x,vy:targetY-y,radius,alpha,time:now/1000,light:isLight,motion })
      else {
        layer.style.setProperty('--reveal-x',`${x}px`)
        layer.style.setProperty('--reveal-y',`${y}px`)
        layer.style.setProperty('--reveal-radius',`${radius}px`)
        layer.style.setProperty('--reveal-alpha',alpha)
      }
      if (!inside && alpha < .002) { renderer?.clear(); layer.style.setProperty('--reveal-alpha',0); return }
      if (motion) frameId = requestAnimationFrame(render)
    }
    function wake() { if (!frameId && ready) { previous = 0; frameId = requestAnimationFrame(render) } }
    const leave = () => { inside = false; wake() }
    const move = (event) => {
      if (event.pointerType !== 'mouse' || !finePointer.matches) return
      const rect = hero.getBoundingClientRect()
      targetX = event.clientX-rect.left; targetY = event.clientY-rect.top
      if (!inside) { x = targetX; y = targetY }
      inside = true
      wake()
    }
    const visibility = () => { if (document.hidden) { inside = false; alpha = 0; cancelAnimationFrame(frameId); frameId = 0; renderer?.clear(); layer.style.setProperty('--reveal-alpha',0) } }
    const contextLost = (event) => {
      event.preventDefault()
      renderer = null
      layer.dataset.renderer = 'fallback'
      wake()
    }
    image.onload = () => {
      if (disposed) return
      renderer = createRenderer(canvas,image)
      layer.dataset.renderer = renderer ? 'webgl' : 'fallback'
      ready = true
      resize()
      wake()
    }
    image.src = IMAGE
    const observer = new ResizeObserver(resize)
    observer.observe(hero)
    hero.addEventListener('pointermove',move,{ passive:true })
    hero.addEventListener('pointerleave',leave)
    window.addEventListener('blur',leave)
    document.addEventListener('visibilitychange',visibility)
    finePointer.addEventListener('change',leave)
    reducedMotion.addEventListener('change',wake)
    canvas.addEventListener('webglcontextlost',contextLost)
    return () => {
      disposed = true
      cancelAnimationFrame(frameId)
      observer.disconnect()
      hero.removeEventListener('pointermove',move)
      hero.removeEventListener('pointerleave',leave)
      window.removeEventListener('blur',leave)
      document.removeEventListener('visibilitychange',visibility)
      finePointer.removeEventListener('change',leave)
      reducedMotion.removeEventListener('change',wake)
      canvas.removeEventListener('webglcontextlost',contextLost)
      renderer?.clear(); renderer?.destroy()
      layer.style.setProperty('--reveal-alpha',0)
      delete layer.dataset.renderer
    }
  }, [active,isLight])
  return <div ref={layerRef} className="hero-reveal" aria-hidden="true"><canvas ref={canvasRef} /><div className="hero-reveal-fallback" /></div>
}
