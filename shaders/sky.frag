precision highp float;

varying vec3 vWorldPosition;
uniform vec3 uSunPosition;

void main() {
    // Normalize vectors
    vec3 viewDir = normalize(vWorldPosition);
    vec3 sunDir = normalize(uSunPosition);

    // 1. Base Sky Gradient (mixes between horizon color and top sky color based on Y axis)
    vec3 topColor = vec3(0.15, 0.35, 0.75); // Deep blue
    vec3 horizonColor = vec3(0.85, 0.9, 0.95); // Light foggy blue
    
    float height = viewDir.y; 
    float mixFactor = clamp(height + 0.1, 0.0, 1.0); // Offset horizon slightly
    vec3 skyColor = mix(horizonColor, topColor, mixFactor);

    gl_FragColor = vec4(skyColor, 1.0);
}