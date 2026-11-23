// pmndrs "postprocessing" chain (?pp=1, default): real bokeh depth of field (sprites respect their alpha), mipmap bloom,
// SMAA, and the studio grade (ACES + exposure, warm/purple grade, sun rays, vignette, grain) as one custom Effect.
// Returns adapters with the same names main.js used for the three/examples chain (grade.uniforms, bloomPass, bokeh).
import * as THREE from 'three';
import { EffectComposer, RenderPass, EffectPass, BloomEffect, DepthOfFieldEffect, SMAAEffect, SMAAPreset, Effect, BlendFunction } from 'postprocessing';

export function makePost({ renderer, scene, camera, W, H, RAYS_GLSL }) {
  renderer.toneMapping = THREE.NoToneMapping;   // tone mapping happens in the grade effect (HDR buffer before it)
  const composer = new EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType });
  composer.setSize(W, H);
  composer.addPass(new RenderPass(scene, camera));
  const dofE = new DepthOfFieldEffect(camera, { focusDistance: 2, focusRange: 1, bokehScale: 3.5, resolutionScale: 0.75 });
  const dofPass = new EffectPass(camera, dofE); dofPass.enabled = false; composer.addPass(dofPass);
  const bloomE = new BloomEffect({ mipmapBlur: true, intensity: 0.5, luminanceThreshold: 0.9, luminanceSmoothing: 0.25, radius: 0.6 });
  const U = new Map(Object.entries({ uTime: 0, uFade: 0, uExp: 1, uTeal: 0, uWarm: 0, uCon: 1, uSat: 1, uVig: 1, uLift: new THREE.Vector3(), uSun: new THREE.Vector2(0.5, 1.2), uRays: 0,
    uShTint: new THREE.Vector3(0.82, 0.98, 1.12), uMul: new THREE.Vector3(1, 1, 1), uRes: new THREE.Vector2(W, H) }).map(([k, v]) => [k, new THREE.Uniform(v)]));
  const frag = `uniform float uTime, uFade, uExp, uTeal, uWarm, uCon, uSat, uVig, uRays; uniform vec3 uLift, uMul, uShTint; uniform vec2 uSun, uRes;
    vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0); }
    vec3 toS(vec3 c){ return mix(c * 12.92, 1.055 * pow(max(c, 0.0), vec3(1.0/2.4)) - 0.055, step(0.0031308, c)); }
    vec3 toL(vec3 c){ return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
    vec3 rays(vec2 uv){ vec2 d = (uv - uSun) / 40.0; vec2 p = uv; float il = 1.0; vec3 acc = vec3(0.0);
      for (int i = 0; i < 40; i++){ p -= d; vec3 s = toS(aces(texture2D(inputBuffer, clamp(p, 0.001, 0.999)).rgb * uExp)); float b = max(0.0, dot(s, vec3(0.3,0.59,0.11)) - 0.72); acc += s * b * il; il *= 0.955; }
      return acc * 0.09 * uRays; }
    void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor){
      vec3 c = toS(aces(inputColor.rgb * uExp)); if (uRays > 0.0) c += rays(uv) * vec3(1.0, 0.86, 0.6);
      float l = dot(c, vec3(0.299,0.587,0.114));
      c = mix(c, c * uShTint, (1.0 - l) * uTeal); c = mix(c, c * vec3(1.14, 1.0, 0.82), l * uWarm);
      c = (c - 0.5) * uCon + 0.5; c = mix(vec3(dot(c, vec3(0.299,0.587,0.114))), c, uSat);
      float v = smoothstep(1.05, 0.3, length((uv - 0.5) * vec2(1.0, 1.25))); c *= mix(uVig, 1.0, v);
      c = c * 0.95 * uMul + uLift; c += (h(uv * uRes + uTime * 60.0) - 0.5) * 0.03; c *= 1.0 - uFade;
      outputColor = vec4(toL(clamp(c, 0.0, 1.0)), inputColor.a); }`;
  class GradeEffect extends Effect { constructor() { super('GradeEffect', frag, { blendFunction: BlendFunction.NORMAL, uniforms: U }); } }
  const gradeE = new GradeEffect();
  composer.addPass(new EffectPass(camera, bloomE, gradeE));
  composer.addPass(new EffectPass(camera, new SMAAEffect({ preset: SMAAPreset.HIGH })));
  const uniforms = Object.fromEntries(U);
  const grade = { uniforms };
  const bloomPass = { set strength(v) { bloomE.intensity = v * 1.1; }, set radius(v) { bloomE.mipmapBlurPass.radius = Math.min(0.9, 0.4 + v * 0.4); }, set threshold(v) { bloomE.luminanceMaterial.threshold = Math.min(1.5, v * 1.05); } };
  // the old BokehPass API: focus (world distance), aperture (bigger = shallower)
  const bokeh = { get enabled() { return dofPass.enabled; }, set enabled(v) { dofPass.enabled = v; },
    uniforms: { focus: { set value(v) { dofE.cocMaterial.focusDistance = v; } }, aperture: { set value(a) { dofE.cocMaterial.focusRange = Math.max(0.08, 0.006 / Math.max(1e-4, a)); dofE.bokehScale = 2.5 + Math.min(3, a * 120); } }, maxblur: { set value(v) {} } } };
  const render = () => { uniforms.uExp.value = renderer.toneMappingExposure; composer.render(); };
  // optional ambient occlusion (n8ao) right after the scene render: contact shadows in corners / under furniture (office set, 2026-11-10)
  const addAO = async (o = {}) => { const { N8AOPostPass } = await import('n8ao'); const ao = new N8AOPostPass(scene, camera, W, H); Object.assign(ao.configuration, { aoRadius: 0.9, distanceFalloff: 0.8, intensity: 2.6, color: new THREE.Color('#3a2a22'), halfRes: false }, o); composer.passes.splice(1, 0, ao); ao.renderToScreen = false; return ao; };
  return { composer, grade, bloomPass, bokeh, render, addAO };
}
