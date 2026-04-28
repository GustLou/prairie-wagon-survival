#ifdef GL_ES
precision mediump float;
#endif

attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

uniform float uSeed;
uniform float uRoughness;

varying vec3  vNormal;
varying vec2  vTexCoord;
varying float vNoise;

float hash(vec3 p) {
    p  = fract(p * vec3(443.897, 441.423, 437.195));
    p += dot(p, p.yzx + 19.19);
    return fract((p.x + p.y) * p.z);
}

float noise3(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(mix(hash(i + vec3(0.0,0.0,0.0)), hash(i + vec3(1.0,0.0,0.0)), u.x),
            mix(hash(i + vec3(0.0,1.0,0.0)), hash(i + vec3(1.0,1.0,0.0)), u.x), u.y),
        mix(mix(hash(i + vec3(0.0,0.0,1.0)), hash(i + vec3(1.0,0.0,1.0)), u.x),
            mix(hash(i + vec3(0.0,1.0,1.0)), hash(i + vec3(1.0,1.0,1.0)), u.x), u.y),
        u.z
    );
}

float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
        v += a * noise3(p);
        p  = p * 2.03 + vec3(1.7, 9.2, 3.8);
        a *= 0.5;
    }
    return v;
}

void main() {
    vec3  dir  = normalize(aVertexPosition);
    float n    = fbm(dir * 2.5 + uSeed);
    float disp = (n * 2.0 - 1.0) * uRoughness;

    vec3 displaced = aVertexPosition + dir * disp;

    float eps = 0.02;
    vec3 t1   = normalize(vec3(-dir.z, 0.0, dir.x));
    vec3 t2   = normalize(cross(dir, t1));

    vec3 pd1 = (dir + eps*t1) + dir * ((fbm((dir + eps*t1)*2.5 + uSeed)*2.0 - 1.0)*uRoughness);
    vec3 pd2 = (dir + eps*t2) + dir * ((fbm((dir + eps*t2)*2.5 + uSeed)*2.0 - 1.0)*uRoughness);

    vNormal   = normalize(cross(pd1 - displaced, pd2 - displaced));
    vTexCoord = aTextureCoord;
    vNoise    = n;

    gl_Position = uPMatrix * uMVMatrix * vec4(displaced, 1.0);
}