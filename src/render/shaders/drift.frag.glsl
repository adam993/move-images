#version 300 es
precision highp float;
precision highp sampler2DArray;

#define MAX_LAYERS 8
#define TAU 6.28318530718

uniform sampler2D uImage;
uniform sampler2DArray uMasks;   // slice i = selection weight of layer i
uniform vec2 uImageSize;         // source pixels
uniform float uTime;             // seconds
uniform int uLayerCount;
uniform int uModes[MAX_LAYERS];     // 0 wave, 1 orbit, 2 pulse, 3 turbulence, 4 glitch, 5 jitter (see uniforms.ts)
uniform vec4 uParamsA[MAX_LAYERS];  // amplitude px, scale px, speed Hz, phase rad
uniform vec4 uParamsB[MAX_LAYERS];  // direction xy, center xy (0-1)
uniform vec4 uParamsC[MAX_LAYERS];  // rate (jumps/s), unused, unused, unused
uniform int uView;                  // 0 animated, 1 mask, 2 original
uniform int uActiveLayer;
uniform float uLoopDuration;         // seconds; > 0 makes turbulence repeat exactly (export loops)

in vec2 vUv;
out vec4 outColor;

// @include simplex-noise

float fbm(vec3 q) {
  return 0.67 * snoise(q) + 0.33 * snoise(q * 2.03 + 17.0);
}

// "Hash without Sine" by Dave Hoskins, MIT License (https://www.shadertoy.com/view/4djSRW). Returns [0, 1).
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

// Which jump a stepped pattern is on. In a loop the index wraps, so the random sequence repeats exactly.
float jumpIndex(float rate) {
  float index = floor(rate * uTime);
  if (uLoopDuration > 0.0) index = mod(index, max(1.0, floor(rate * uLoopDuration + 0.5)));
  return index;
}

// Displacement of layer i at source-pixel position p, in source pixels.
vec2 layerDisplacement(int i, vec2 p) {
  float amplitude = uParamsA[i].x;
  float scale = uParamsA[i].y;
  float speed = uParamsA[i].z;
  float phase = uParamsA[i].w;
  int mode = uModes[i];

  if (mode == 0) {
    // Transverse wave: pixels sway along dir while the wave travels across the perpendicular axis.
    vec2 dir = uParamsB[i].xy;
    vec2 across = vec2(-dir.y, dir.x);
    return dir * amplitude * sin(TAU * (dot(p, across) / scale - speed * uTime) + phase);
  }
  if (mode == 1) {
    // Small circles whose phase varies smoothly in space, so neighbouring areas swirl out of step.
    float angle = TAU * speed * uTime + TAU * snoise(vec3(p / scale, 0.0)) + phase;
    return amplitude * vec2(cos(angle), sin(angle));
  }
  if (mode == 2) {
    // Radial ripple from the center point.
    vec2 fromCenter = p - uParamsB[i].zw * uImageSize;
    float radius = length(fromCenter);
    vec2 outward = radius > 0.5 ? fromCenter / radius : vec2(0.0);
    return outward * amplitude * sin(TAU * (radius / scale - speed * uTime) + phase);
  }
  if (mode == 4) {
    // Glitch: bands across the direction jump sideways by random amounts, re-rolled every jump;
    // about 40% of bands move at a time.
    vec2 dir = uParamsB[i].xy;
    vec2 across = vec2(-dir.y, dir.x);
    vec2 seed = vec2(floor(dot(p, across) / scale), jumpIndex(uParamsC[i].x)) + phase;
    float moves = step(0.6, hash12(seed));
    return dir * amplitude * moves * (hash12(seed + 17.13) * 2.0 - 1.0);
  }
  if (mode == 5) {
    // Jitter: the whole selection jumps to a new random offset along the direction every jump.
    float offset = hash12(vec2(jumpIndex(uParamsC[i].x), phase)) * 2.0 - 1.0;
    return uParamsB[i].xy * amplitude * offset;
  }
  // Turbulence: noise evolving through time instead of scrolling, so the motion stays in place.
  vec3 q = vec3(p / scale, speed * uTime + phase / TAU);
  if (uLoopDuration > 0.0) {
    // Walk a circle instead of a line through noise time, with the same distance per loop: the path
    // returns to its start after uLoopDuration seconds, so the last frame flows into the first. The circle
    // starts at the preview's point and heading (phase included), so frame 0 matches the preview and a
    // speed-0 layer stays identical to it.
    float radius = speed * uLoopDuration / TAU;
    float angle = TAU * uTime / uLoopDuration;
    q = vec3(p / scale + vec2(radius * (cos(angle) - 1.0), 0.0), phase / TAU + radius * sin(angle));
  }
  return amplitude * vec2(fbm(q), fbm(q + vec3(31.7, 11.3, 0.0)));
}

void main() {
  if (uView == 2) {
    outColor = vec4(texture(uImage, vUv).rgb, 1.0);
    return;
  }

  vec2 p = vUv * uImageSize;
  vec2 displacement = vec2(0.0);
  for (int i = 0; i < MAX_LAYERS; i++) {
    if (i >= uLayerCount) break;
    float weight = texture(uMasks, vec3(vUv, float(i))).r;
    if (weight > 0.0) displacement += weight * layerDisplacement(i, p);
  }

  // Backward mapping: each output pixel pulls from its displaced source position, so nothing tears open.
  // The mip level comes from the undisplaced UV: the displaced UV's derivatives jump at mask edges and
  // would pick a blurrier level there, leaving a soft seam around every selection.
  vec3 color = textureGrad(uImage, vUv + displacement / uImageSize, dFdx(vUv), dFdy(vUv)).rgb;

  if (uView == 1 && uActiveLayer >= 0) {
    float selected = texture(uMasks, vec3(vUv, float(uActiveLayer))).r;
    vec3 dimmed = vec3(dot(color, vec3(0.2126, 0.7152, 0.0722)) * 0.25);
    vec3 highlighted = mix(color, vec3(1.0, 0.15, 0.55), 0.35);
    color = mix(dimmed, highlighted, selected);
  }

  outColor = vec4(color, 1.0);
}
