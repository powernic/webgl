attribute vec3 a_position;
attribute vec3 a_color;
uniform vec3 u_position;
varying vec3 v_color;

void main(void) {
    v_color = a_color;
    gl_Position = vec4(u_position + a_position, 1.0);
}