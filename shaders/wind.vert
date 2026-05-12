attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat4 uNMatrix;

uniform float uTime;
uniform float uWindSpeed;
uniform float uWindStrength;
uniform vec2 uBladeWorldPos; // world XZ of this blade's root, set per-blade

varying vec2 vTextureCoord;

void main() {
    vec3 pos = aVertexPosition;

    // Bend grows quadratically from root to tip
    float weight = pow(pos.y, 2.0);

    // Phase driven by world position — each blade at a different XZ gets a
    // different phase, producing a smooth travelling wave across the field
    float phase = uBladeWorldPos.x * 0.4 + uBladeWorldPos.y * 0.3;

    // Primary sway
    float dispX = sin(uTime * uWindSpeed + phase) * uWindStrength * weight;
    // Secondary wave (different frequency + offset) for organic, non-robotic feel
    float dispX2 = sin(uTime * uWindSpeed * 0.7 + phase * 1.7 + 1.2)
                   * uWindStrength * 0.3 * weight;
    // Slight Z sway so motion isn't perfectly planar
    float dispZ = sin(uTime * uWindSpeed * 0.5 + phase + 0.8)
                  * uWindStrength * 0.2 * weight;

    pos.x += dispX + dispX2;
    pos.z += dispZ;

    gl_Position = uPMatrix * uMVMatrix * vec4(pos, 1.0);
    vTextureCoord = aTextureCoord;
}
