#ifdef GL_ES
precision mediump float;
#endif

varying vec3  vNormal;
varying vec2  vTexCoord;
varying float vNoise;

uniform float uSeed;
uniform float uTexBlend;
uniform float uNormalFlip;
uniform vec3 uLightDir;
uniform sampler2D uSampler0;
uniform sampler2D uSampler1;


float hash2(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise2(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash2(i+vec2(0.0,0.0)), hash2(i+vec2(1.0,0.0)), u.x),
               mix(hash2(i+vec2(0.0,1.0)), hash2(i+vec2(1.0,1.0)), u.x), u.y);
}

float fbm2(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 3; i++) {
        v += a * noise2(p);
        p  = p * 2.1 + vec2(3.1, 7.6);
        a *= 0.5;
    }
    return v;
}

void main() {
    vec3 N = normalize(vNormal);

    float detail    = fbm2(vTexCoord * 8.0 + uSeed);
    vec3  colA      = vec3(0.55 + detail*0.15, 0.52 + detail*0.12, 0.48 + detail*0.10);
    vec3  colB      = vec3(0.35 + detail*0.10, 0.33 + detail*0.08, 0.30 + detail*0.06);
    float blend     = smoothstep(0.35, 0.65, vNoise*0.6 + fbm2(vTexCoord*6.0 + uSeed*0.1)*0.4);
    vec3  procColor = mix(colA, colB, blend);

    vec3 tex0     = texture2D(uSampler0, vTexCoord * 3.0).rgb;
    vec3 tex1     = texture2D(uSampler1, vTexCoord * 2.5 + vec2(0.37, 0.13)).rgb;
    vec3 texColor = mix(tex0, tex1, blend);

    vec3 baseColor = mix(procColor, texColor, uTexBlend);

    float mossMask = smoothstep(0.3, 0.8, N.y) * smoothstep(0.4, 0.7, fbm2(vTexCoord*10.0 + 5.0));
    vec3  finalColor = mix(baseColor, vec3(0.30, 0.32, 0.22), mossMask * 0.55);

    float ambient = 0.45;
    float diffuse = max(dot(N, normalize(-uLightDir)), 0.0);
    gl_FragColor  = vec4(finalColor * (ambient + diffuse * 0.45), 1.0);
}