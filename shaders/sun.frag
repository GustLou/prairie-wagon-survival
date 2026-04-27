#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTexCoord;

uniform sampler2D uSampler;
uniform vec3 uCameraPosition;
uniform vec3 uCameraDirection;
uniform vec3 uSunCenter;

void main(){
    vec3 camToSun = normalize(uSunCenter - uCameraPosition); // vertex from sun to current camera position
    float alignment = dot(normalize(uCameraDirection),camToSun);

    // tightness of glow cone (higher = tighter)
    float glowFactor = pow(max(0.0, alignment), 12.0);

    vec4 texColor = texture2D(uSampler, vTexCoord);
    vec3 glowColor = vec3(1.0, 0.9, 0.5);

    vec3 finalColor = texColor.rgb + glowFactor * glowColor * 0.8;
    gl_FragColor = vec4(finalColor, texColor.a);
}