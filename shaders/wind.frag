#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;
uniform float uHealth;

void main() {
    vec3 lushGreen = vec3(0.3, 0.6, 0.1);
    vec3 deadBrown = vec3(0.5, 0.4, 0.2);

    vec3 mixedColor = mix(deadBrown, lushGreen, uHealth);

    // vertical shading gradient, darker at base and lighter at tip
    float shadow = 0.6 + 0.4 * (1.0 - vTextureCoord.y);

    gl_FragColor = vec4(mixedColor * shadow, 1.0);
}