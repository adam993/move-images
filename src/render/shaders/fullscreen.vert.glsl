#version 300 es
// Full-screen triangle generated from gl_VertexID, so no vertex buffer is needed.
out vec2 vUv;

void main() {
  vec2 corner = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(corner * 2.0 - 1.0, 0.0, 1.0);
  // v = 0 at the top of the screen, matching textures uploaded row 0 first — nothing is Y-flipped anywhere.
  vUv = vec2(corner.x, 1.0 - corner.y);
}
