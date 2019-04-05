attribute vec3 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat4 u_cube;
uniform mat4 u_camera;
varying vec2 vTextureCoord;


void main(void) {
    gl_Position = u_camera * u_cube * vec4(aVertexPosition, 1.0);
    vTextureCoord = aTextureCoord;
}