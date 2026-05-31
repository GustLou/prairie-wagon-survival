attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

varying vec2  vTextureCoord;
varying float vDistFromCenter; // 0 = inner edge, 1 = outer edge

uniform float uInnerRadius;
uniform float uOuterRadius;

void main() {
    // aTextureCoord.x runs 0->1 across the ring (angular), .y runs 0->1 radially
    // We remap .y so 0 = inner edge, 1 = outer edge
    vDistFromCenter = aTextureCoord.y;
    vTextureCoord   = aTextureCoord;

    // Slope the skirt gently downward outward — 0.08 world units of drop
    float drop = aTextureCoord.y * 0.08 * uOuterRadius;
    vec3 pos = vec3(aVertexPosition.x, aVertexPosition.y - drop, aVertexPosition.z);

    gl_Position = uPMatrix * uMVMatrix * vec4(pos, 1.0);
}