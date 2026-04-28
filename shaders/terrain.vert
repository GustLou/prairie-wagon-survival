attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat4 uNMatrix;

varying vec2 vTextureCoord;
varying vec3 vViewPos;
varying vec3 vNormal;

uniform sampler2D uHeightMap; // heightmap bound to unit 1
uniform float uHeightScale;

float random(vec2 st){
    return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453123);
}

float noise(vec2 st){
    vec2 i = floor(st);
    vec2 f = fract(st);

    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f*f*f*(f*(f*6.0 - 15.0) + 10.0);

    return mix(a,b,u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 3; i++) {
        value     += amplitude * noise(st * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
    }
    return value;
}

void main() {
  vTextureCoord = aTextureCoord;

  float h = fbm(aVertexPosition.xy * 1.8);

  vec3 displaced = aVertexPosition + aVertexNormal * (h * uHeightScale);

  vec4 mvPos = uMVMatrix * vec4(displaced, 1.0);
  vViewPos = mvPos.xyz;
  vNormal = normalize(mat3(uNMatrix) * aVertexNormal);

  gl_Position = uPMatrix * mvPos;
}