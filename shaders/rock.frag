#ifdef GL_ES
precision mediump float;
#endif

varying vec3  vNormal;
varying vec2  vTexCoord;
varying float vNoise;

uniform float uSeed;

/* ── 2D noise for surface detail ────────────────────────────────────────── */

float hash2(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise2(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash2(i + vec2(0.0, 0.0)), hash2(i + vec2(1.0, 0.0)), u.x),
               mix(hash2(i + vec2(0.0, 1.0)), hash2(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm2(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
        v += a * noise2(p);
        p  = p * 2.1 + vec2(3.1, 7.6);
        a *= 0.5;
    }
    return v;
}

void main() {
    vec3 N = normalize(vNormal);

    /* Two procedural stone tones blended by large-scale + fine noise */
    float detail    = fbm2(vTexCoord * 8.0 + uSeed);
    vec3  colA      = vec3(0.55 + detail * 0.15, 0.52 + detail * 0.12, 0.48 + detail * 0.10);
    vec3  colB      = vec3(0.35 + detail * 0.10, 0.33 + detail * 0.08, 0.30 + detail * 0.06);

    float blend     = smoothstep(0.35, 0.65, vNoise * 0.6 + fbm2(vTexCoord * 6.0 + uSeed * 0.1) * 0.4);
    vec3  rockColor = mix(colA, colB, blend);

    /* Subtle moss on upward-facing surfaces */
    float topFactor = smoothstep(0.3, 0.8, N.y);
    float mossMask  = topFactor * smoothstep(0.4, 0.7, fbm2(vTexCoord * 10.0 + 5.0));
    vec3  finalColor = mix(rockColor, vec3(0.30, 0.32, 0.22), mossMask * 0.55);

    /* Lighting in object space */
    float ambient = 0.25;
    float diffuse = max(dot(N, normalize(vec3(1.0, 1.5, 0.8))), 0.0);

    gl_FragColor = vec4(finalColor * (ambient + diffuse * 0.75), 1.0);
}
