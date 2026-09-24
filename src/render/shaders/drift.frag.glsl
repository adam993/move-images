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
uniform int uModes[MAX_LAYERS];     // 0 wave, 1 orbit, 2 pulse, 3 turbulence (see uniforms.ts)
uniform vec4 uParamsA[MAX_LAYERS];  // amplitude px, scale px, speed Hz, phase rad
uniform vec4 uParamsB[MAX_LAYERS];  // direction xy, center xy (0-1)
uniform int uView;                  // 0 animated, 1 mask, 2 original
uniform int uActiveLayer;

in vec2 vUv;
out vec4 outColor;

// @include simplex-noise

float fbm(vec3 q) {
  return 0.67 * snoise(q) + 0.33 * snoise(q * 2.03 + 17.0);
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
  // Turbulence: noise evolving through time instead of scrolling, so the motion stays in place.
  vec3 q = vec3(p / scale, speed * uTime + phase / TAU);
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
