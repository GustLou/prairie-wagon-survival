#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;
varying vec3 vViewPos;
varying vec3 vNormal;

uniform sampler2D uColorMap;
uniform sampler2D uHeightMap;
uniform vec3 uLightDir;
uniform float uAmbient;

void main() {
  vec4 color = texture2D(uColorMap, vTextureCoord);

  float lambert = max(dot(normalize(vNormal), normalize(uLightDir)), 0.0);
  float intensity = uAmbient + 0.9 * lambert;

  gl_FragColor = vec4(color.rgb * intensity, color.a);
}