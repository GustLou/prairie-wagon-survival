#ifdef GL_ES
precision mediump float;
#endif

varying vec3  vPos;
varying float vLatFade;

uniform float uTime;
uniform float uDensity;
uniform float uScale;

/* ─── Perlin noise ─────────────────────────────────────────────────────────── */

vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)),
             dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float perlin(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
            dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
        mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
            dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
        u.y
    );
}

float fbm(vec2 p) {
    float value     = 0.0;
    float amplitude = 0.5;
    vec2  shift     = vec2(100.0);
    mat2  rot       = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
    for (int i = 0; i < 6; i++) {
        value    += amplitude * perlin(p);
        p         = rot * p * 2.0 + shift;
        amplitude *= 0.5;
    }
    return value;
}

void main() {
    vec3 n = normalize(vPos);

    /*
     * TOP-DOWN XZ PROJECTION — use n.x and n.z directly as UV coordinates.
     * This treats the dome like a flat map viewed from above, giving perfectly
     * isotropic noise with no pole convergence or latitude banding.
     * (The old atan-based longitude mapping compressed many angles into a
     * tiny area at the top, creating those horizontal stripe artefacts.)
     */
    float scale = max(uScale, 1.5);
    vec2 uv = vec2(n.x, n.z) * scale;
    uv += vec2(uTime * 0.5, uTime * 0.3);

    /* Domain warping for organic, fluffy edges */
    float q     = fbm(uv);
    float r     = fbm(uv + vec2(q, q) + 0.7);
    float cloud = fbm(uv + vec2(r, r));

    float density = clamp(uDensity, 0.35, 0.8);
    cloud = smoothstep(density - 0.2, density + 0.2, cloud + 0.5);

    /* Fade clouds out toward the equator so the dome edge is invisible */
    cloud *= vLatFade;

    /*
     * Alpha-only output — colour is pure white so the cloud layer composites
     * on top of whatever the sky sphere renders underneath it.
     * When cloud == 0, this fragment is fully transparent and the sky shows through.
     */
    gl_FragColor = vec4(1.0, 1.0, 1.0, cloud);
}
