precision mediump float;

attribute vec3 point;
attribute float index;

uniform float start;
uniform float len;

varying vec2 coord;
varying float fade;

void main() {
    coord = point.xy / 25.0;    
    gl_Position = vec4(coord, 0.0, 1.0);
    fade = pow(max(0.0, mod((index - start), len) - 1.0) / len, 1.2);
    gl_PointSize = 8.0;
}
