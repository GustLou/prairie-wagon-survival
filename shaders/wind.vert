attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat4 uNMatrix;

uniform float uTime;           // Driven by MyScene's update(t)
uniform float uWindSpeed;      // How fast the sway is
uniform float uWindStrength;   // How far it bends

varying vec2 vTextureCoord;

void main() {
    vec3 pos = aVertexPosition;

    // 1. Calculate the weight based on height
    // Using a power of 2 creates a more natural parabolic bend
    float weight = pow(pos.y, 2.0);

    // 2. Add a phase offset based on position
    // This prevents all grass in the prairie from moving in a "robotic" sync
    float phase = aVertexPosition.x * 0.8 + aVertexPosition.z * 0.8;

    // 3. Calculate displacement using a sine wave
    float displacement = sin(uTime * uWindSpeed + phase) * uWindStrength * weight;

    // 4. Apply displacement to the horizontal axis
    pos.x += displacement;

    gl_Position = uPMatrix * uMVMatrix * vec4(pos, 1.0);
    vTextureCoord = aTextureCoord;
}