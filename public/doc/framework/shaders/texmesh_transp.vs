attribute vec3 aVertexPosition;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat3 uNMatrix;

uniform float uAlpha;

void main(void) 
{
	vec4 position = uPMatrix * uMVMatrix * vec4( aVertexPosition, 1.0);
	
	gl_Position = position;
}