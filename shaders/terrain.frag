#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;
varying vec3 vViewPos;
varying vec3 vNormal;

uniform sampler2D uColorMap;   // unit 0 — grass map
uniform sampler2D uDirtMap;    // unit 2 — dirt patches
uniform vec3 uLightDir;
uniform float uAmbient;

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
    vec4 grassColor = texture2D(uColorMap, vTextureCoord * 3.0);
    vec4 dirtColor  = texture2D(uDirtMap,  vTextureCoord * 5.0);

    // Generate a noise mask in a different "world space" scale
    // so dirt patches are independent from the height noise
    float mask = fbm(vTextureCoord * 3.0);

    // Blend: where mask > ~0.55 → dirt, below → grass
    // smoothstep gives soft organic edges
    float blend = smoothstep(0.45, 0.65, mask);
    vec4 color = mix(grassColor, dirtColor, blend);

    float lambert = max(dot(normalize(vNormal), normalize(uLightDir)), 0.0);
    float intensity = uAmbient + 0.9 * lambert;

    gl_FragColor = vec4(color.rgb * intensity, color.a);
}