attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat4 uNMatrix;

uniform float uBob; // precomputed bob offset in [-0.2, 0.2], set from JS
varying float vLocalY;

void main() {
    float bob = uBob;

    vec3 pos  = aVertexPosition;
    pos.y    += bob;

    gl_Position = uPMatrix * uMVMatrix * vec4(pos, 1.0);
    vLocalY = aVertexPosition.y;
}