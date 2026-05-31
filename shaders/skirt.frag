#ifdef GL_ES
precision highp float;
#endif

varying vec2  vTextureCoord;
varying float vDistFromCenter;

uniform sampler2D uColorMap;
uniform sampler2D uDirtMap;
uniform vec3      uHorizonColor;
uniform float     uAmbient;

float random(vec2 st) {
    return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453123);
}
float noise(vec2 st) {
    vec2 i = floor(st); vec2 f = fract(st);
    float a = random(i), b = random(i + vec2(1,0));
    float c = random(i + vec2(0,1)), d = random(i + vec2(1,1));
    vec2 u = f*f*(3.0 - 2.0*f);
    return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;
}
float fbm(vec2 st) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 3; i++) { v += a*noise(st); st *= 2.0; a *= 0.5; }
    return v;
}

void main() {
    vec4 grass = texture2D(uColorMap, vTextureCoord * vec2(8.0, 2.0));
    vec4 dirt  = texture2D(uDirtMap,  vTextureCoord * vec2(6.0, 1.5));
    float dirtMask = smoothstep(0.4, 0.7, fbm(vTextureCoord * 2.5));
    vec4 color = mix(grass, dirt, dirtMask);

    float fade = smoothstep(0.55, 1.0, vDistFromCenter);
    vec3 final = mix(color.rgb * uAmbient, uHorizonColor, fade);

    gl_FragColor = vec4(final, 1.0);
}