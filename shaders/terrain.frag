#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;
varying vec3 vViewPos;
varying vec3 vNormal;

uniform sampler2D uColorMap;   // unit 0 — grass map
uniform sampler2D uDirtMap;    // unit 2 — dirt patches
uniform sampler2D uPathMap; // unit 3 — stone path

// Path Parameters
uniform float uPathSeed;       // shifts the path's position
uniform float uPathWidth;      // how wide the path is (e.g. 0.06)
uniform float uPathAmplitude;  // how curvy (e.g. 0.15)
uniform float uPathFrequency;  // how many curves (e.g. 3.0)


uniform vec3 uLightDir;
uniform float uAmbient;

// noise for dirt patches
float random(vec2 st) {
    return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453123);
}

float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f*f*(3.0 - 2.0*f);
    return mix(a, b, u.x) + (c - a)*u.y*(1.0 - u.x) + (d - b)*u.x*u.y;
}

// Path 1: runs left→right, curves along Y
float pathH(vec2 uv){
    float c = 0.5 + uPathAmplitude * sin(uPathFrequency * uv.x * 6.2831 + uPathSeed);
    return 1.0 - smoothstep(uPathWidth - 0.01, uPathWidth + 0.01, abs(uv.y - c));
}

// Path 2: runs top→bottom, curves along X — different frequency so it looks distinct
float pathV(vec2 uv){
    float c = 0.5 + uPathAmplitude * 0.75 * sin((uPathFrequency + 1.0) * uv.y * 6.2831 + uPathSeed * 0.6);
    return 1.0 - smoothstep(uPathWidth - 0.01, uPathWidth + 0.01, abs(uv.x - c));
}

float fbm(vec2 st) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
        v += a * noise(st);
        st *= 2.0;
        a  *= 0.5;
    }
    return v;
}

void main() {
    vec2 uv = vTextureCoord;

    // sample textures
    vec4 grassColor = texture2D(uColorMap, uv * 6.0);
    vec4 dirtColor  = texture2D(uDirtMap,  uv * 4.0);
    vec4 pathColor  = texture2D(uPathMap,  uv * 8.0);

    // dirt patches
    float dirtMask = smoothstep(0.45, 0.65, fbm(uv * 3.0));
    vec4 color = mix(grassColor, dirtColor, dirtMask);

    // path logic
    float totalPath = max(pathH(uv), pathV(uv));
    color = mix(color, pathColor, totalPath);

    float lambert = max(dot(normalize(vNormal), normalize(uLightDir)), 0.0);
    float intensity = uAmbient + 0.9 * lambert;

    gl_FragColor = vec4(color.rgb * intensity, color.a);
}