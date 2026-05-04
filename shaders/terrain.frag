#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;
varying vec3 vViewPos;
varying vec3 vNormal;

uniform sampler2D uColorMap;   // unit 0 — grass map
uniform sampler2D uDirtMap;    // unit 2 — dirt patches
uniform sampler2D uPathMap;    // unit 3 — stone path

// MST path — each vec4 is one edge: (x1, y1, x2, y2) in UV [0,1] space
#define MAX_EDGES 20
uniform vec4  uPathEdges[MAX_EDGES];
uniform int   uNumEdges;
uniform float uPathWidth;  // edge half-width in UV space (e.g. 0.03)


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

// Distance from point p to line segment [a, b]
float segDist(vec2 p, vec2 a, vec2 b) {
    vec2 ab = b - a;
    vec2 ap = p - a;
    float t = clamp(dot(ap, ab) / dot(ab, ab), 0.0, 1.0);
    return length(p - (a + t * ab));
}

// Returns 1.0 on the MST path, 0.0 off it
float mstPath(vec2 uv) {
    float minD = 1.0e6;
    for (int i = 0; i < MAX_EDGES; i++) {
        if (i < uNumEdges) {
            minD = min(minD, segDist(uv, uPathEdges[i].xy, uPathEdges[i].zw));
        }
    }
    return 1.0 - smoothstep(uPathWidth * 0.75, uPathWidth, minD);
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
    float totalPath = mstPath(uv);
    color = mix(color, pathColor, totalPath);

    float lambert = max(dot(normalize(vNormal), normalize(uLightDir)), 0.0);
    float intensity = uAmbient + 0.9 * lambert;

    gl_FragColor = vec4(color.rgb * intensity, color.a);
}