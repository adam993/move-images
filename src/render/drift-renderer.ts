import type { Mask } from '@/lib/mask/build-mask'
import { referenceScale } from '@/lib/units'
import type { ViewMode } from '@/state/editor-store'
import type { Layer } from '@/state/layer'
import { createProgram } from './gl-utils'
import { MAX_LAYERS } from './limits'
import fragmentTemplate from './shaders/drift.frag.glsl?raw'
import vertexSource from './shaders/fullscreen.vert.glsl?raw'
import noiseSource from './shaders/simplex-noise.glsl?raw'
import { buildLayerUniforms } from './uniforms'

export type FrameState = {
  time: number
  layers: readonly Layer[]
  view: ViewMode
  /** Index into `layers` whose mask the mask view highlights; -1 for none. */
  activeLayerIndex: number
  /** Seconds after which the animation must repeat exactly (export loops); 0 or omitted for none. */
  loopDuration?: number
}

const NOISE_INCLUDE = '// @include simplex-noise'
const VIEW_CODES: Record<ViewMode, number> = { animated: 0, mask: 1, original: 2 }
const UNIFORM_NAMES = [
  'uImage',
  'uMasks',
  'uImageSize',
  'uTime',
  'uLayerCount',
  'uModes',
  'uParamsA',
  'uParamsB',
  'uView',
  'uActiveLayer',
  'uLoopDuration',
] as const
type UniformName = (typeof UNIFORM_NAMES)[number]

/**
 * Draws the source image with every layer's masked displacement applied. Owns all GL state for one canvas:
 * the on-screen stage, or an OffscreenCanvas at export size.
 */
export class DriftRenderer {
  private readonly canvas: HTMLCanvasElement | OffscreenCanvas
  private readonly gl: WebGL2RenderingContext
  private readonly program: WebGLProgram
  private readonly vertexArray: WebGLVertexArrayObject
  private readonly locations: Record<UniformName, WebGLUniformLocation | null>
  private readonly maxTextureSize: number
  private imageTexture: WebGLTexture | null = null
  private maskTexture: WebGLTexture | null = null
  private imageSize = { width: 0, height: 0 }
  private maskSize = { width: 0, height: 0 }

  constructor(canvas: HTMLCanvasElement | OffscreenCanvas) {
    const gl = canvas.getContext('webgl2', { alpha: false, antialias: false }) as WebGL2RenderingContext | null
    if (!gl) throw new Error('WebGL2 is not available in this browser, so effects cannot be rendered.')
    if (!fragmentTemplate.includes(NOISE_INCLUDE)) {
      throw new Error(`drift.frag.glsl is missing the "${NOISE_INCLUDE}" marker`)
    }

    this.canvas = canvas
    this.gl = gl
    this.program = createProgram(gl, vertexSource, fragmentTemplate.replace(NOISE_INCLUDE, noiseSource))
    this.vertexArray = gl.createVertexArray()
    this.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number
    this.locations = Object.fromEntries(
      UNIFORM_NAMES.map((name) => [name, gl.getUniformLocation(this.program, name)]),
    ) as Record<UniformName, WebGLUniformLocation | null>
  }

  setImage(bitmap: ImageBitmap): void {
    const { gl } = this
    if (bitmap.width > this.maxTextureSize || bitmap.height > this.maxTextureSize) {
      throw new Error(
        `Image is ${bitmap.width}×${bitmap.height}, larger than this GPU's ${this.maxTextureSize} px texture limit`,
      )
    }
    if (this.imageTexture) gl.deleteTexture(this.imageTexture)

    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, bitmap)
    // Mipmaps keep a downscaled, moving image from shimmering with aliasing.
    gl.generateMipmap(gl.TEXTURE_2D)
    setSampling(gl, gl.TEXTURE_2D, gl.LINEAR_MIPMAP_LINEAR)

    this.imageTexture = texture
    this.imageSize = { width: bitmap.width, height: bitmap.height }
  }

  /** (Re)creates the mask texture array; all slices start at zero (WebGL zero-initializes storage). */
  allocateMasks(width: number, height: number): void {
    const { gl } = this
    if (this.maskTexture) gl.deleteTexture(this.maskTexture)

    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, texture)
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 1, gl.R8, width, height, MAX_LAYERS)
    setSampling(gl, gl.TEXTURE_2D_ARRAY, gl.LINEAR)

    this.maskTexture = texture
    this.maskSize = { width, height }
  }

  setMask(index: number, mask: Mask): void {
    const { gl } = this
    if (!this.maskTexture) throw new Error('allocateMasks must run before setMask')
    if (!Number.isInteger(index) || index < 0 || index >= MAX_LAYERS) {
      throw new Error(`Mask index ${index} is outside 0–${MAX_LAYERS - 1}`)
    }
    if (mask.width !== this.maskSize.width || mask.height !== this.maskSize.height) {
      throw new Error(
        `Mask is ${mask.width}×${mask.height}, but mask storage is ${this.maskSize.width}×${this.maskSize.height}`,
      )
    }

    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.maskTexture)
    // Rows of single-byte pixels are not 4-byte aligned for arbitrary widths.
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
    gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, index, mask.width, mask.height, 1, gl.RED, gl.UNSIGNED_BYTE, mask.data)
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4)
  }

  resize(cssWidth: number, cssHeight: number, devicePixelRatio: number): void {
    this.canvas.width = Math.max(1, Math.round(cssWidth * devicePixelRatio))
    this.canvas.height = Math.max(1, Math.round(cssHeight * devicePixelRatio))
  }

  render(frame: FrameState): void {
    const { gl, locations: u } = this
    gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    if (!this.imageTexture || !this.maskTexture) {
      gl.clearColor(0, 0, 0, 1)
      gl.clear(gl.COLOR_BUFFER_BIT)
      return
    }

    const layers = buildLayerUniforms(frame.layers, referenceScale(this.imageSize.width, this.imageSize.height))
    gl.useProgram(this.program)
    gl.bindVertexArray(this.vertexArray)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.imageTexture)
    gl.uniform1i(u.uImage, 0)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.maskTexture)
    gl.uniform1i(u.uMasks, 1)

    gl.uniform2f(u.uImageSize, this.imageSize.width, this.imageSize.height)
    gl.uniform1f(u.uTime, frame.time)
    gl.uniform1i(u.uLayerCount, layers.count)
    gl.uniform1iv(u.uModes, layers.modes)
    gl.uniform4fv(u.uParamsA, layers.paramsA)
    gl.uniform4fv(u.uParamsB, layers.paramsB)
    gl.uniform1i(u.uView, VIEW_CODES[frame.view])
    gl.uniform1i(u.uActiveLayer, frame.activeLayerIndex)
    gl.uniform1f(u.uLoopDuration, frame.loopDuration ?? 0)

    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  /** The last rendered frame as top-down RGBA rows. Call right after `render`, in the same task. */
  readPixels(): Uint8ClampedArray {
    const { gl } = this
    const { width, height } = this.canvas
    const bottomUp = new Uint8ClampedArray(width * height * 4)
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, bottomUp)

    // GL's origin is bottom-left; image encoders expect row 0 at the top.
    const rowBytes = width * 4
    const topDown = new Uint8ClampedArray(bottomUp.length)
    for (let y = 0; y < height; y++) {
      topDown.set(bottomUp.subarray((height - 1 - y) * rowBytes, (height - y) * rowBytes), y * rowBytes)
    }
    return topDown
  }

  /** Frees GL objects but keeps the context: React StrictMode re-creates a renderer on the same canvas. */
  dispose(): void {
    const { gl } = this
    if (this.imageTexture) gl.deleteTexture(this.imageTexture)
    if (this.maskTexture) gl.deleteTexture(this.maskTexture)
    gl.deleteVertexArray(this.vertexArray)
    gl.deleteProgram(this.program)
    this.imageTexture = null
    this.maskTexture = null
  }

  /**
   * Frees GL objects and releases the context itself. For short-lived export renderers: browsers cap live
   * WebGL contexts, so repeated exports must not wait for garbage collection.
   */
  loseContext(): void {
    this.dispose()
    this.gl.getExtension('WEBGL_lose_context')?.loseContext()
  }
}

function setSampling(gl: WebGL2RenderingContext, target: GLenum, minFilter: GLenum): void {
  gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, minFilter)
  gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
}
