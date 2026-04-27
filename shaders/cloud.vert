attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat4 uNMatrix;

varying vec3 vPos;      /* unit-sphere position, used to derive UVs in frag */
varying float vLatFade; /* pre-computed horizon fade, 1=top 0=equator */

void main() {
    /* Pass the normalised position so the frag shader can do atan/y mapping */
    vPos = normalize(aVertexPosition);

    /* Fade: aVertexPosition.y goes 1 (top) → 0 (equator) on a unit hemisphere */
    float y = clamp(aVertexPosition.y / length(aVertexPosition), 0.0, 1.0);
    vLatFade = smoothstep(0.0, 0.3, y);   /* transparent at equator, opaque at top */

    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
}
