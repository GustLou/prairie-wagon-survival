#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;
uniform sampler2D uSampler;

void main() {
    vec4 color = texture2D(uSampler, vTextureCoord);

    // Transparency check: Essential if using textures with alpha channels
    if (color.a < 0.1)
        discard;

    gl_FragColor = color;
}