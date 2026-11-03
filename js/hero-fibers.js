/* Hero — real project renders that dissolve into glowing fibers and re-form
 * as the next project. Each render has a depth map (Depth Anything V2), so
 * the photo sits in 3D: the mouse moves the camera and the picture shifts in
 * depth like a window. During a change the photo crumbles into particles,
 * the particles flow as twisting fiber ribbons, then settle into the next
 * render from the ground up.
 *
 * Fiber ribbons, depth of field, bloom and grain adapted from "Ghost Fibers"
 * by David Haz (React Bits, reactbits.dev), MIT + Commons Clause.
 */
(function () {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const holder = canvas.closest('.hero-right');
  const caption = document.getElementById('heroCaption');
  const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false });
  if (!gl) { holder?.classList.add('no-gl'); return; }

  const mobile = matchMedia('(max-width: 768px)').matches;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Slides: real renders from the projects we list. focus = the point of the
  // image (0..1 from left, 0..1 from bottom) to keep in view.
  const SLIDES = [
    { slug: 'nyati-emerald', name: 'Nyati Emerald', place: 'Baner', focus: [0.6, 0.5], phone: [0.75, 0.5] },
    { slug: 'joyville-sensorium-hinjewadi', name: 'Joyville Sensorium', place: 'Hinjewadi', focus: [0.8, 0.55], phone: [0.82, 0.55] },
    { slug: 'kohinoor-abhimaan-shirgaon', name: 'Kohinoor Abhimaan Homes', place: 'Talegaon', focus: [0.5, 0.55], phone: [0.45, 0.55] },
    { slug: 'rohan-harita-tathawade', name: 'Rohan Harita', place: 'Tathawade', focus: [0.32, 0.55], phone: [0.25, 0.55] }
  ];

  const CAMERA = 7.5, FOV = 0.56, DEPTH = 0.75;
  const FOCAL = 1 / (2 * Math.tan(FOV / 2));
  const HOLD = 3;                                   // seconds a render stays on screen
  const DEPART = 1.9, ARRIVE_AT = 4.4, ARRIVE = 2.2, SETTLE = 0.35;
  const CHANGE = ARRIVE_AT + ARRIVE + SETTLE;      // length of one change
  const GRID = mobile ? [210, 150] : [380, 210];   // particles across × down
  const COUNT = GRID[0] * GRID[1];
  const BLOOM_LEVELS = mobile ? 4 : 5;
  const RIBBON_LENGTH = 24;
  const PLACES = [[0, 0, 0, 0], [1.9, -4.6, -0.08, 2.4], [-1.05, 2.0, 0.12, 4.1]];

  /* ── Shaders ──────────────────────────────────────────────── */

  const HEAD = '#version 300 es\nprecision highp float;\nprecision highp sampler2D;\n';
  const NOISE = `
float hash12(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1, 0)), f.x), mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * vnoise(p); p *= 2.03; a *= 0.5; } return s / 0.9375; }
// When each point of a render leaves (sweeps from the right) and arrives (rises from the ground).
// Baked once into uMask (see MASK_FRAG), so each is a single lookup.
uniform sampler2D uMask;
float leaveAt(vec2 uv) { return texture(uMask, uv).r * ${DEPART.toFixed(2)}; }
float arriveAt(vec2 uv) { return ${ARRIVE_AT.toFixed(2)} + texture(uMask, uv).g * ${ARRIVE.toFixed(2)}; }
`;

  const MASK_FRAG = `${HEAD}
${NOISE}
in vec2 vUv;
out vec4 outColor;
void main() {
  outColor = vec4(clamp(0.66 * (1.0 - vUv.x) + 0.34 * fbm(vUv * vec2(3.0, 2.2) + 3.7), 0.0, 1.0),
                  clamp(0.62 * vUv.y + 0.38 * fbm(vUv * 2.6 + 9.1), 0.0, 1.0), 0.0, 1.0);
}`;

  const FULLSCREEN = `${HEAD}
out vec2 vUv;
void main() {
  vec2 p = vec2(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0);
  vUv = p * 0.5 + 0.5;
  gl_Position = vec4(p, 0.0, 1.0);
}`;

  // The render as a depth-displaced mesh.
  const PHOTO_VERT = `${HEAD}
layout(location = 0) in vec2 aUv;
uniform mat4 uViewProj;
uniform vec4 uPlane;          // centre x, centre y, width, height (world units at z = 0)
uniform sampler2D uDepth;
out vec2 vUv;
void main() {
  vUv = aUv;
  float d = texture(uDepth, aUv).r;
  vec3 p = vec3(uPlane.xy + (aUv - 0.5) * uPlane.zw, (d - 0.45) * ${DEPTH.toFixed(2)});
  gl_Position = uViewProj * vec4(p, 1.0);
}`;
  const PHOTO_FRAG = `${HEAD}
${NOISE}
uniform sampler2D uPhoto;
uniform float uT, uMode, uAlpha;  // mode 0: leaving render, 1: arriving render
in vec2 vUv;
out vec4 outColor;
void main() {
  vec3 c = texture(uPhoto, vUv).rgb;
  float a = uMode < 0.5 ? clamp((leaveAt(vUv) - uT) / 0.18, 0.0, 1.0)
                        : smoothstep(arriveAt(vUv), arriveAt(vUv) + ${SETTLE.toFixed(2)}, uT);
  // Soft edges wherever the render does not reach the edge of the screen.
  a *= smoothstep(0.0, 0.16, vUv.x) * smoothstep(1.0, 0.94, vUv.x) * smoothstep(0.0, 0.05, vUv.y) * smoothstep(1.0, 0.96, vUv.y);
  a *= uAlpha;
  outColor = vec4(c * a, a);
}`;

  const PARTICLE_VERT = `${HEAD}
${NOISE}
uniform mat4 uViewProj;
uniform vec3 uEye;
uniform vec2 uViewport;
uniform float uDpr, uTime, uT, uHasFrom, uFocus, uDof, uMaxCoc, uIntro, uCell;
uniform vec4 uPlaneA, uPlaneB;
uniform sampler2D uPhotoA, uDepthA, uPhotoB, uDepthB;
uniform mat3 uOrient;
uniform float uScale;
uniform vec3 uGlow, uSecondary;
uniform vec2 uGrid;
out vec2 vLocal;
out float vRadius, vSegment;
out vec3 vLight;
out vec3 vColor;

vec3 onPlane(vec4 plane, sampler2D depth, vec2 uv) {
  return vec3(plane.xy + (uv - 0.5) * plane.zw, (texture(depth, uv).r - 0.45) * ${DEPTH.toFixed(2)});
}

// Ghost Fibers ribbon: a twisting sheet drifting through space.
vec3 ribbon(float s, float v, float n, int r) {
  vec4 pl = r == 0 ? vec4(${PLACES[0].join(', ')}) : r == 1 ? vec4(${PLACES[1].join(', ')}) : vec4(${PLACES[2].join(', ')});
  float t = uTime * 0.5;
  float x = s * ${RIBBON_LENGTH.toFixed(1)};
  vec3 c0 = vec3(x, 0.52 * sin(x * 0.43 + t * 0.31 + pl.w) + 0.26 * sin(x * 0.79 - t * 0.23 + 1.3 + pl.w * 0.7) + pl.x + x * pl.z,
                 0.65 * sin(x * 0.33 + t * 0.19 + 0.7 + pl.w * 1.3) + pl.y);
  float x1 = x + 0.1;
  vec3 c1 = vec3(x1, 0.52 * sin(x1 * 0.43 + t * 0.31 + pl.w) + 0.26 * sin(x1 * 0.79 - t * 0.23 + 1.3 + pl.w * 0.7) + pl.x + x1 * pl.z,
                 0.65 * sin(x1 * 0.33 + t * 0.19 + 0.7 + pl.w * 1.3) + pl.y);
  vec3 tg = normalize(c1 - c0);
  vec3 n0 = normalize(vec3(0, 1, 0) - tg * tg.y);
  vec3 b0 = cross(tg, n0);
  float th = 1.2 * 0.483 * x + t * 0.15 + pl.w * 0.6 + 0.5 * sin(x * 0.26 + t * 0.27 + pl.w);
  vec3 across = cos(th) * n0 + sin(th) * b0, sheet = -sin(th) * n0 + cos(th) * b0;
  float hw = 0.62 * (0.78 + 0.22 * cos(s * 3.14159));
  return uOrient * ((c0 + across * v * hw + sheet * n * hw) * uScale);
}

void main() {
  float id = float(gl_InstanceID);
  vec2 cell = vec2(mod(id, uGrid.x), floor(id / uGrid.x));
  vec2 jit = vec2(hash12(cell + 0.31), hash12(cell + 7.7));
  vec2 uv = (cell + jit) / uGrid;
  float seed = hash12(cell * 1.37 + 2.1);

  float leave = uHasFrom > 0.5 ? leaveAt(uv) : -9.0;
  float arrive = arriveAt(uv);
  float u = clamp((uT - leave) / (arrive - leave), 0.0, 1.0);
  float lift = smoothstep(0.0, 0.42, u), land = smoothstep(0.58, 1.0, u);
  float air = lift * (1.0 - land);

  // Which ribbon, and where on it: the picture is laid out along the fiber sheet.
  int r = int(mod(cell.y, 3.0));
  float s = fract(uv.x * 0.9 + uTime * 0.018 + seed * 0.04) - 0.5;
  float thread = floor(uv.y * 40.0);
  float v = ((thread + 0.5) / 40.0) * 2.0 - 1.0 + (hash12(vec2(thread, 4.0)) - 0.5) * 0.015;
  vec3 R = ribbon(s, v, (hash12(vec2(thread, 9.0)) - 0.5) * 0.25, r);
  vec3 A = uHasFrom > 0.5 ? onPlane(uPlaneA, uDepthA, uv) : R;
  vec3 B = onPlane(uPlaneB, uDepthB, uv);
  vec3 world = mix(mix(A, R, lift), B, land);
  // A faint shimmer while in the air (small, so the threads keep their lines).
  world += air * 0.012 * vec3(sin(uTime * 0.9 + seed * 40.0), cos(uTime * 0.7 + seed * 31.0), sin(uTime * 0.5 + seed * 17.0));

  vec3 cA = uHasFrom > 0.5 ? texture(uPhotoA, uv).rgb : uGlow;
  vec3 cB = texture(uPhotoB, uv).rgb;
  vec3 fly = mix(mix(cA, cB, u), mix(uGlow, uSecondary, hash12(vec2(thread, 2.0))), 0.82);
  vColor = mix(mix(cA, fly, lift), cB, land);

  vec4 clip = uViewProj * vec4(world, 1.0);
  float depth = clip.w;
  vec2 px = (clip.xy / clip.w * 0.5 + 0.5) * uViewport;
  float base = max(0.5 * 1.25 * uDpr * ${CAMERA.toFixed(1)} / max(depth, 0.1), 0.42);
  float rest = uCell * 0.62;                       // on the picture, dots tile it
  base = mix(rest, base, air);
  float coc = min(uDof * abs(1.0 - uFocus / max(depth, 0.1)) * uViewport.y * 0.035, uMaxCoc * uDpr) * air;
  float radius = base + coc;
  float energy = pow(base / radius, 1.25);

  float edgeFade = mix(1.0, smoothstep(0.5, 0.4, abs(s)), air);
  float visible = smoothstep(leave - 0.18, leave, uT) * (1.0 - smoothstep(arrive, arrive + ${SETTLE.toFixed(2)}, uT));
  float twinkle = pow(max(sin(uTime * (1.2 + 2.6 * seed) * 3.0 + seed * 61.0), 0.0), 36.0);
  float spark = exp(-pow((uT - leave) / 0.12, 2.0)) * uHasFrom;   // embers as the picture breaks away
  float intensity = energy * edgeFade * visible * uIntro * mix(0.95, 1.6, air) * (1.0 + twinkle * 4.0 * air + spark * 1.2);
  float highlight = clamp(twinkle * air + spark, 0.0, 1.0);

  vec2 corner = vec2(gl_VertexID == 1 || gl_VertexID == 3 ? 1.0 : 0.0, gl_VertexID >= 2 ? 1.0 : 0.0) * 2.0 - 1.0;
  vec2 position = px + corner * radius;
  vLocal = corner * radius;
  vRadius = radius;
  vSegment = 0.0;
  vLight = vec3(intensity, highlight, coc / max(radius, 1e-3));
  if (intensity < 0.002) position = vec2(-1e4);
  gl_Position = vec4(position / uViewport * 2.0 - 1.0, 0.0, 1.0);
}`;

  const DUST_VERT = `${HEAD}
uniform mat4 uViewProj;
uniform vec2 uViewport;
uniform float uDpr, uTime, uFocus, uDof, uMaxCoc, uIntro;
out vec2 vLocal;
out float vRadius, vSegment;
out vec3 vLight;
out vec3 vColor;
uniform vec3 uGlow, uSecondary;
float hash11(float n) { return fract(sin(n * 91.3458) * 47453.5453); }
void main() {
  float id = float(gl_InstanceID);
  vec3 seed = vec3(hash11(id * 1.37 + 0.3), hash11(id * 2.91 + 1.7), hash11(id * 4.17 + 2.9));
  vec3 p = (seed - 0.5) * vec3(9.0, 5.4, 6.0) + vec3(0.0, 0.0, 0.6);
  p += 0.22 * vec3(sin(uTime * 0.21 + seed.x * 40.0), sin(uTime * 0.17 + seed.y * 40.0) + uTime * 0.02, sin(uTime * 0.13 + seed.z * 40.0));
  vec4 clip = uViewProj * vec4(p, 1.0);
  float depth = clip.w;
  vec2 px = (clip.xy / clip.w * 0.5 + 0.5) * uViewport;
  float baseRadius = max(0.5 * 2.2 * mix(0.5, 1.4, hash11(id * 7.7)) * uDpr * ${CAMERA.toFixed(1)} / max(depth, 0.1), 0.45);
  float coc = min(uDof * abs(1.0 - uFocus / max(depth, 0.1)) * uViewport.y * 0.035, uMaxCoc * uDpr * 1.6);
  float radius = baseRadius + coc;
  float energy = pow(baseRadius / radius, 0.9);
  float twinkle = pow(max(sin(uTime * (0.8 + 1.6 * seed.y) * 2.0 + seed.z * 50.0), 0.0), 8.0);
  float intensity = energy * (0.3 + 0.7 * twinkle) * mix(0.4, 1.0, seed.x) * 0.5 * uIntro * (depth > 0.3 ? 1.0 : 0.0);
  vec2 corner = vec2(gl_VertexID == 1 || gl_VertexID == 3 ? 1.0 : 0.0, gl_VertexID >= 2 ? 1.0 : 0.0) * 2.0 - 1.0;
  vLocal = corner * radius;
  vRadius = radius;
  vSegment = 0.0;
  vLight = vec3(intensity, 0.3 + 0.6 * twinkle, coc / max(radius, 1e-3));
  vColor = mix(uGlow, uSecondary, seed.y);
  gl_Position = vec4((px + corner * radius) / uViewport * 2.0 - 1.0, 0.0, 1.0);
}`;

  // Dot shape from Ghost Fibers: sharp core in focus, flat bokeh disc out of focus.
  const DOT_FRAG = `${HEAD}
uniform vec3 uLine;
in vec2 vLocal;
in float vRadius, vSegment;
in vec3 vLight;
in vec3 vColor;
out vec4 outColor;
void main() {
  float rho = length(vLocal) / max(vRadius, 1e-3);
  if (rho > 1.0) discard;
  float soft = clamp(2.6 / max(vRadius, 1e-3), 0.14, 1.0);
  float disk = 1.0 - smoothstep(1.0 - soft, 1.0, rho);
  float bokeh = disk * (0.94 + 0.08 * smoothstep(0.55, 0.95, rho));
  float core = exp(-rho * rho * 3.2);
  float shape = mix(core, bokeh, smoothstep(0.25, 0.7, vLight.z));
  vec3 color = mix(vColor, uLine, vLight.y);
  outColor = vec4(color * shape * vLight.x, shape * vLight.x);
}`;

  const BRIGHT_FRAG = `${HEAD}
uniform sampler2D uSource;
uniform vec2 uTexel;
in vec2 vUv;
out vec4 outColor;
vec3 pick(vec2 uv) { vec3 c = texture(uSource, uv).rgb; float peak = max(max(c.r, c.g), c.b); return c * smoothstep(0.35, 1.2, peak); }
void main() {
  vec2 o = uTexel;
  outColor = vec4((pick(vUv + vec2(-o.x, -o.y)) + pick(vUv + vec2(o.x, -o.y)) + pick(vUv + vec2(-o.x, o.y)) + pick(vUv + vec2(o.x, o.y))) * 0.25, 1.0);
}`;
  const DOWN_FRAG = `${HEAD}
uniform sampler2D uSource;
uniform vec2 uTexel;
in vec2 vUv;
out vec4 outColor;
void main() {
  vec2 o = uTexel;
  vec3 c = texture(uSource, vUv).rgb * 4.0 + texture(uSource, vUv + vec2(-o.x, -o.y)).rgb + texture(uSource, vUv + vec2(o.x, -o.y)).rgb
         + texture(uSource, vUv + vec2(-o.x, o.y)).rgb + texture(uSource, vUv + vec2(o.x, o.y)).rgb;
  outColor = vec4(c / 8.0, 1.0);
}`;
  const UP_FRAG = `${HEAD}
uniform sampler2D uSource;
uniform vec2 uTexel;
in vec2 vUv;
out vec4 outColor;
void main() {
  vec2 o = uTexel;
  vec3 c = texture(uSource, vUv + vec2(-o.x * 2.0, 0.0)).rgb + texture(uSource, vUv + vec2(-o.x, o.y)).rgb * 2.0
         + texture(uSource, vUv + vec2(0.0, o.y * 2.0)).rgb + texture(uSource, vUv + vec2(o.x, o.y)).rgb * 2.0
         + texture(uSource, vUv + vec2(o.x * 2.0, 0.0)).rgb + texture(uSource, vUv + vec2(o.x, -o.y)).rgb * 2.0
         + texture(uSource, vUv + vec2(0.0, -o.y * 2.0)).rgb + texture(uSource, vUv + vec2(-o.x, -o.y)).rgb * 2.0;
  outColor = vec4(c / 12.0, 1.0);
}`;
  const COMPOSITE_FRAG = `${HEAD}
uniform sampler2D uPhoto, uScene, uBloom;
uniform float uGlowAmt, uGrain, uVignette, uFrame, uDpr;
uniform vec2 uView;
uniform vec3 uBg;
in vec2 vUv;
out vec4 outColor;
float hash(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
void main() {
  vec4 photo = texture(uPhoto, vUv);
  vec3 light = texture(uScene, vUv).rgb + texture(uBloom, vUv).rgb * uGlowAmt;
  vec3 color = uBg * (1.0 - photo.a) + photo.rgb;
  color += (1.0 - exp(-light * 1.25)) * (1.0 - photo.a * 0.35);
  vec2 d = vUv - 0.5;
  color *= 1.0 - uVignette * dot(d, d) * 1.6;
  vec2 cell = floor(vUv * uView / max(uDpr, 1.0));
  float grain = hash(cell + uFrame * 17.31) + hash(cell * 1.31 + uFrame * 3.7 + 9.1) - 1.0;
  color += grain * uGrain * (0.35 + 0.65 * sqrt(max(max(color.r, color.g), color.b)));
  outColor = vec4(max(color, 0.0), 1.0);
}`;

  /* ── GL setup ─────────────────────────────────────────────── */

  const link = (vs, fs) => {
    const make = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
      return s;
    };
    const v = make(gl.VERTEX_SHADER, vs), f = make(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return null;
    const p = gl.createProgram();
    gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { console.warn(gl.getProgramInfoLog(p)); return null; }
    const u = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const name = gl.getActiveUniform(p, i).name; u[name] = gl.getUniformLocation(p, name); }
    return { p, u };
  };
  const photoProg = link(PHOTO_VERT, PHOTO_FRAG);
  const partProg = link(PARTICLE_VERT, DOT_FRAG);
  const dustProg = link(DUST_VERT, DOT_FRAG);
  const brightProg = link(FULLSCREEN, BRIGHT_FRAG);
  const downProg = link(FULLSCREEN, DOWN_FRAG);
  const upProg = link(FULLSCREEN, UP_FRAG);
  const compProg = link(FULLSCREEN, COMPOSITE_FRAG);
  const maskProg = link(FULLSCREEN, MASK_FRAG);
  if (![photoProg, partProg, dustProg, brightProg, downProg, upProg, compProg, maskProg].every(Boolean)) { holder?.classList.add('no-gl'); return; }

  const floatTargets = !!gl.getExtension('EXT_color_buffer_float');
  const target = hdr => ({ tex: null, fb: gl.createFramebuffer(), w: 0, h: 0, hdr });
  const allocate = (t, w, h) => {
    if (t.tex && t.w === w && t.h === h) return;
    if (t.tex) gl.deleteTexture(t.tex);
    t.tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t.tex);
    gl.texStorage2D(gl.TEXTURE_2D, 1, t.hdr && floatTargets ? gl.RGBA16F : gl.RGBA8, w, h);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, t.fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t.tex, 0);
    t.w = w; t.h = h;
  };
  const photoT = target(false), sceneT = target(true);
  const chain = Array.from({ length: BLOOM_LEVELS }, () => target(true));

  const emptyVao = gl.createVertexArray();
  const maskT = target(false);
  allocate(maskT, 512, 512);
  gl.bindFramebuffer(gl.FRAMEBUFFER, maskT.fb);
  gl.viewport(0, 0, 512, 512);
  gl.useProgram(maskProg.p);
  gl.bindVertexArray(emptyVao);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  // Photo mesh: a grid of uv points.
  const MESH = mobile ? [96, 64] : [160, 100];
  const meshVao = gl.createVertexArray();
  gl.bindVertexArray(meshVao);
  const uvs = [], idx = [];
  for (let y = 0; y <= MESH[1]; y++) for (let x = 0; x <= MESH[0]; x++) uvs.push(x / MESH[0], y / MESH[1]);
  for (let y = 0; y < MESH[1]; y++) for (let x = 0; x < MESH[0]; x++) {
    const a = y * (MESH[0] + 1) + x, b = a + 1, c = a + MESH[0] + 1, d = c + 1;
    idx.push(a, b, d, a, d, c);
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(idx), gl.STATIC_DRAW);
  gl.bindVertexArray(null);

  /* ── Slides ───────────────────────────────────────────────── */

  const texture = img => {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    img.close?.();
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  };
  // Fetch and decode off the main thread; upload() puts it on the GPU, and the
  // loop only calls that while a render is holding still.
  const decode = src => fetch(src).then(r => { if (!r.ok) throw new Error(src); return r.blob(); })
    .then(b => createImageBitmap(b, { imageOrientation: 'flipY' }));
  const load = slide => {
    slide.decoded ||= Promise.all([
      decode(`/images/hero/${slide.slug}${mobile ? '-m' : ''}.webp`),
      decode(`/images/hero/${slide.slug}-depth.jpg`)
    ]).then(([photo, depth]) => { slide.bitmaps = [photo, depth]; slide.aspect = photo.width / photo.height; return slide; })
      .catch(err => { slide.decoded = null; throw err; });
    return slide.decoded;
  };
  const upload = slide => {
    if (slide.photo || !slide.bitmaps) return;
    slide.photo = texture(slide.bitmaps[0]);
    slide.depth = texture(slide.bitmaps[1]);
    slide.bitmaps = null;
  };

  /* ── Camera and layout ───────────────────────────────────── */

  let width = 1, height = 1, dpr = 1;
  const halfH = Math.tan(FOV / 2) * CAMERA;

  // Place a render on the z = 0 plane: cover the right of the hero (all of it
  // on phones) with its focus point in view, overscanned for the parallax.
  const planeFor = slide => {
    const aspect = width / height, hw = halfH * aspect, wide = aspect > 1.1;
    let h = halfH * 2 * 1.14, w = h * slide.aspect;
    const minW = wide ? hw * 1.55 : hw * 2 * 1.12;
    if (w < minW) { w = minW; h = w / slide.aspect; }
    const tx = wide ? hw * 0.4 : 0;
    const focus = wide ? slide.focus : slide.phone;
    let cx = tx - (focus[0] - 0.5) * w;
    cx = Math.max(cx, hw * 1.1 - w / 2);              // reach the right edge
    if (!wide) cx = Math.min(cx, -hw * 1.1 + w / 2);  // and the left one on phones
    const cy = Math.max(Math.min(-(focus[1] - 0.5) * h * 0.4, h / 2 - halfH * 1.07), -(h / 2 - halfH * 1.07));
    return [cx, cy, w, h];
  };

  const frustum = (aspect) => {
    const f = 1 / Math.tan(FOV / 2), n = 0.1, fa = 60, nf = 1 / (n - fa);
    return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (fa + n) * nf, -1, 0, 0, 2 * fa * n * nf, 0];
  };
  const lookAt = (e, t) => {
    let z = [e[0] - t[0], e[1] - t[1], e[2] - t[2]]; let l = Math.hypot(...z); z = z.map(v => v / l);
    let x = [z[2], 0, -z[0]]; l = Math.hypot(...x); x = x.map(v => v / l);
    const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
    const d = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -d(x, e), -d(y, e), -d(z, e), 1];
  };
  const multiply = (a, b) => {
    const o = new Float32Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    return o;
  };
  const orient = (yaw, pitch, roll) => {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll);
    const m3 = (a, b) => { const o = []; for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) o[c * 3 + r] = a[r] * b[c * 3] + a[3 + r] * b[c * 3 + 1] + a[6 + r] * b[c * 3 + 2]; return o; };
    return new Float32Array(m3([cr, sr, 0, -sr, cr, 0, 0, 0, 1], m3([1, 0, 0, 0, cp, sp, 0, -sp, cp], [cy, 0, -sy, 0, 1, 0, sy, 0, cy])));
  };

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    width = Math.max(1, r.width); height = Math.max(1, r.height);
    const base = Math.min(window.devicePixelRatio || 1, mobile ? 1.75 : 2);
    dpr = Math.min(base, 2400 / Math.max(width, height));
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
  };

  /* ── State and loop ──────────────────────────────────────── */

  const state = {
    time: 0, frame: 0, intro: 0,
    from: null, to: null, index: 0,
    t: 0,                         // seconds into the current change
    pointer: { x: 0, y: 0, inside: false },
    look: { x: 0, y: 0, vx: 0, vy: 0 }
  };
  const glow = [0.86, 0.3, 0.2], secondary = [0.95, 0.66, 0.36], line = [1, 0.9, 0.78], bg = [0.035, 0.027, 0.025];

  const setCaption = slide => {
    if (!caption) return;
    caption.classList.remove('is-shown');
    setTimeout(() => {
      caption.href = `/projects/${slide.slug}`;
      caption.querySelector('.hsc-name').textContent = slide.name;
      caption.querySelector('.hsc-place').textContent = slide.place;
      caption.classList.add('is-shown');
    }, 50);
  };

  const pass = (prog, t, src, texel) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, t.fb);
    gl.viewport(0, 0, t.w, t.h);
    gl.useProgram(prog.p);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, src.tex);
    gl.uniform1i(prog.u.uSource, 0);
    gl.uniform2f(prog.u.uTexel, texel[0], texel[1]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const render = () => {
    const W = canvas.width, H = canvas.height, aspect = width / height;
    const { look } = state;
    const drift = reduce ? 0 : Math.sin(state.time * 0.11) * 0.12;
    const eye = [look.x * 0.9 + drift, look.y * 0.45, CAMERA - Math.min(state.t, 30) * 0.008];
    const viewProj = multiply(frustum(aspect), lookAt(eye, [look.x * 0.15, look.y * 0.08, 0]));
    const t = state.t;
    const changing = t < CHANGE;

    allocate(photoT, W, H); allocate(sceneT, W, H);

    // 1. Renders.
    gl.bindFramebuffer(gl.FRAMEBUFFER, photoT.fb);
    gl.viewport(0, 0, W, H);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(photoProg.p);
    gl.bindVertexArray(meshVao);
    gl.uniformMatrix4fv(photoProg.u.uViewProj, false, viewProj);
    gl.uniform1f(photoProg.u.uT, t);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, maskT.tex); gl.uniform1i(photoProg.u.uMask, 2);
    const drawPhoto = (slide, mode) => {
      gl.uniform4fv(photoProg.u.uPlane, planeFor(slide));
      gl.uniform1f(photoProg.u.uMode, mode);
      gl.uniform1f(photoProg.u.uAlpha, 1);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, slide.photo); gl.uniform1i(photoProg.u.uPhoto, 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, slide.depth); gl.uniform1i(photoProg.u.uDepth, 1);
      gl.drawElements(gl.TRIANGLES, MESH[0] * MESH[1] * 6, gl.UNSIGNED_INT, 0);
    };
    if (state.from && changing) drawPhoto(state.from, 0);
    if (state.to) drawPhoto(state.to, 1);

    // 2. Particles and dust, additive, in HDR.
    gl.bindFramebuffer(gl.FRAMEBUFFER, sceneT.fb);
    gl.viewport(0, 0, W, H);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.bindVertexArray(emptyVao);
    const introEase = 1 - Math.pow(1 - Math.min(state.intro / 1.2, 1), 3);
    const maxCoc = mobile ? 6 : 10;
    if (changing && state.to) {
      const u = partProg.u, from = state.from || state.to, to = state.to;
      gl.useProgram(partProg.p);
      gl.uniformMatrix4fv(u.uViewProj, false, viewProj);
      gl.uniform2f(u.uViewport, W, H);
      gl.uniform1f(u.uDpr, dpr);
      gl.uniform1f(u.uTime, state.time);
      gl.uniform1f(u.uT, t);
      gl.uniform1f(u.uHasFrom, state.from ? 1 : 0);
      gl.uniform1f(u.uFocus, CAMERA);
      gl.uniform1f(u.uDof, 0.08);
      gl.uniform1f(u.uMaxCoc, maxCoc);
      gl.uniform1f(u.uIntro, introEase);
      const pa = planeFor(from), pb = planeFor(to);
      gl.uniform4fv(u.uPlaneA, pa); gl.uniform4fv(u.uPlaneB, pb);
      // Dot radius that tiles the picture: one grid cell in pixels.
      gl.uniform1f(u.uCell, Math.max(pb[2] / (2 * halfH * aspect) * W / GRID[0], pb[3] / (2 * halfH) * H / GRID[1]) * 0.75);
      gl.uniformMatrix3fv(u.uOrient, false, orient(0.18 + Math.sin(state.time * 0.23) * 0.14 + look.x * 0.22, 0.1 + Math.sin(state.time * 0.17) * 0.05 - look.y * 0.14, 12 * Math.PI / 180 + state.time * 0.02));
      gl.uniform1f(u.uScale, Math.min(Math.max(aspect / 1.5, 0.6), 1));
      gl.uniform3fv(u.uGlow, glow); gl.uniform3fv(u.uSecondary, secondary); gl.uniform3fv(u.uLine, line);
      gl.uniform2f(u.uGrid, GRID[0], GRID[1]);
      [[from.photo, 'uPhotoA'], [from.depth, 'uDepthA'], [to.photo, 'uPhotoB'], [to.depth, 'uDepthB']].forEach(([tex, name], i) => {
        gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(u[name], i);
      });
      gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, maskT.tex); gl.uniform1i(u.uMask, 4);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, COUNT);
    }
    const d = dustProg.u;
    gl.useProgram(dustProg.p);
    gl.uniformMatrix4fv(d.uViewProj, false, viewProj);
    gl.uniform2f(d.uViewport, W, H);
    gl.uniform1f(d.uDpr, dpr);
    gl.uniform1f(d.uTime, state.time);
    gl.uniform1f(d.uFocus, CAMERA);
    gl.uniform1f(d.uDof, 0.85);
    gl.uniform1f(d.uMaxCoc, maxCoc);
    gl.uniform1f(d.uIntro, introEase);
    gl.uniform3fv(d.uGlow, glow); gl.uniform3fv(d.uSecondary, secondary); gl.uniform3fv(d.uLine, line);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, mobile ? 120 : 240);
    gl.disable(gl.BLEND);

    // 3. Bloom on the particles only.
    chain.forEach((c, i) => allocate(c, Math.max(1, W >> (i + 1)), Math.max(1, H >> (i + 1))));
    pass(brightProg, chain[0], sceneT, [0.5 / W, 0.5 / H]);
    for (let i = 1; i < BLOOM_LEVELS; i++) pass(downProg, chain[i], chain[i - 1], [1 / chain[i - 1].w, 1 / chain[i - 1].h]);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
    for (let i = BLOOM_LEVELS - 1; i > 0; i--) pass(upProg, chain[i - 1], chain[i], [0.5 / chain[i].w, 0.5 / chain[i].h]);
    gl.disable(gl.BLEND);

    // 4. Composite: render + light + grain + vignette.
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, W, H);
    gl.useProgram(compProg.p);
    const c = compProg.u;
    [[photoT, 'uPhoto'], [sceneT, 'uScene'], [chain[0], 'uBloom']].forEach(([tt, name], i) => {
      gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, tt.tex); gl.uniform1i(c[name], i);
    });
    gl.uniform1f(c.uGlowAmt, 0.5);
    gl.uniform1f(c.uGrain, 0.05);
    gl.uniform1f(c.uVignette, 0.35);
    gl.uniform1f(c.uFrame, state.frame % 977);
    gl.uniform1f(c.uDpr, dpr);
    gl.uniform2f(c.uView, W, H);
    gl.uniform3fv(c.uBg, bg);
    gl.bindVertexArray(emptyVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  let raf = 0, last = 0, visible = true;
  const next = async () => {
    let slide;
    for (let tries = 0; tries < SLIDES.length && !slide; tries++) {
      try { slide = await load(SLIDES[state.index]); } catch (e) { state.index = (state.index + 1) % SLIDES.length; }
    }
    if (!slide) throw new Error('no hero renders');
    upload(slide);
    state.from = state.to;
    state.to = slide;
    state.t = 0;
    setCaption(slide);
    state.index = (state.index + 1) % SLIDES.length;
    load(SLIDES[state.index]).catch(() => {});      // fetch the next one in the background
  };

  let advancing = false;
  const bar = caption?.querySelector('.hsc-bar');
  const frame = now => {
    raf = 0;
    if (!visible || document.hidden) { last = 0; return; }
    // Real time (only long pauses are clipped), so a slow GPU never puts the loop in slow motion.
    const dt = last ? Math.min((now - last) / 1000, 0.25) : 1 / 60;
    last = now;
    try {
      state.time += dt; state.frame++; state.intro += dt; state.t += dt;
      const { pointer, look } = state;
      const lx = pointer.inside && !reduce ? (pointer.x / width - 0.5) * 0.5 : 0;
      const ly = pointer.inside && !reduce ? (0.5 - pointer.y / height) * 0.5 : 0;
      const k = Math.min(dt, 0.05);
      look.vx += (30 * (lx - look.x) - 11 * look.vx) * k; look.vy += (30 * (ly - look.y) - 11 * look.vy) * k;
      look.x += look.vx * k; look.y += look.vy * k;
      if (state.t > CHANGE + 0.5) upload(SLIDES[state.index]);
      if (!reduce && !advancing && state.t > CHANGE + HOLD) {
        advancing = true;
        next().catch(() => {}).finally(() => { advancing = false; });
      }
      if (bar) bar.style.setProperty('--p', Math.min(Math.max((state.t - ARRIVE_AT) / (HOLD + CHANGE - ARRIVE_AT), 0), 1).toFixed(4));
      render();
    } catch (e) { /* skip this frame, keep the loop alive */ }
    raf = requestAnimationFrame(frame);
  };
  const wake = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame); };

  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    state.pointer.x = e.clientX - r.left; state.pointer.y = e.clientY - r.top;
    state.pointer.inside = state.pointer.y >= 0 && state.pointer.y <= r.height;
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { state.pointer.inside = false; });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) wake(); }).observe(canvas);
  document.addEventListener('visibilitychange', wake);

  next().then(() => {
    if (reduce) state.t = CHANGE;                   // reduced motion: just the render, no changes
    holder?.classList.add('is-live');
    wake();
  }).catch(() => holder?.classList.add('no-gl'));
})();
