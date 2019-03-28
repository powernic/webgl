attribute vec3 a_position;
attribute vec3 a_color;
uniform mat4 u_cube;
uniform mat4 u_camera;
varying vec3 v_color;

void main(void) {
    v_color = a_color;
    gl_Position = u_camera * u_cube * vec4(a_position, 1.0);
}