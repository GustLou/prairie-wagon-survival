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

    float t = pos.y;
    float weight = t * t;

    // Phase driven by world position — each blade at a different XZ gets a
    // different phase, producing a smooth travelling wave across the field
    float phase = uBladeWorldPos.x * 0.4 + uBladeWorldPos.y * 0.3;

    // Slow gust envelope — smoothly varies amplitude between 0.6 and 1.0
    // so the whole field breathes in and out rather than swaying at constant strength
    float gust = 0.7 + 0.3 * sin(uTime * uWindSpeed * 0.13 + phase * 0.5);

    // Primary sway
    float dispX  = sin(uTime * uWindSpeed + phase) * uWindStrength * weight;
    // Second harmonic — irrational ratio (1.3) avoids a repeating period with the primary
    float dispX2 = sin(uTime * uWindSpeed * 1.3 + phase * 1.7 + 1.2)
                   * uWindStrength * 0.25 * weight;
    // Third harmonic — very subtle high-frequency flutter for organic texture
    float dispX3 = sin(uTime * uWindSpeed * 2.7 + phase * 2.3 + 2.4)
                   * uWindStrength * 0.08 * weight;
    // Slight Z sway so motion isn't perfectly planar
    float dispZ  = sin(uTime * uWindSpeed * 0.7 + phase + 0.8)
                   * uWindStrength * 0.15 * weight;

    float dispY = sin(uTime * uWindSpeed * 0.4 + phase * 1.1 + 3.0)
              * uWindStrength * 0.03 * weight;

    // Constant lean keeps the blade always facing the wind; the oscillations
    // layer on top but never push it "backwards", eliminating the jarring return.
    float lean = uWindStrength * weight * 1.5;
    pos.x += lean + (dispX + dispX2 + dispX3) * gust;
    pos.z += dispZ * gust;
    pos.y += dispY;

    gl_Position = uPMatrix * uMVMatrix * vec4(pos, 1.0);
    vTextureCoord = aTextureCoord;
}
