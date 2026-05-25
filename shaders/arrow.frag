#ifdef GL_ES
precision mediump float;
#endif

// After the 180° flip in MyHay.display():
//   0  →  visual top   →  yellow  (1.0, 1.0, 0.0)
//   1  →  visual tip   →  orange  (1.0, 0.5, 0.0)
varying float vLocalY;

void main() {
    // Orange and yellow only differ in green:
    //   vLocalY=0 → g=1.0 (yellow)
    //   vLocalY=1 → g=0.5 (orange)
    float g = 1.0 - 0.5 * vLocalY;

    gl_FragColor = vec4(1.0, g, 0.0, 1.0);
}