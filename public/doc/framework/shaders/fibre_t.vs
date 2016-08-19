attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat3 uNMatrix;

uniform float uZoom;
uniform float uThickness;

varying vec3 vNormal;
varying vec4 vPosition;

varying vec3 vTangentR3;
varying float vTangent_dot_view;
varying float vS_param;
varying float vLocation;


void main(void) 
{
	vPosition = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
	vNormal = normalize(aVertexNormal);

	vS_param = aTextureCoord.x; //< store texture coordinate for shader
	
	vTangentR3 = vNormal;
	vec3 tangent;
	tangent = (uPMatrix * uMVMatrix * vec4(vNormal,0.)).xyz; //< transform our tangent vector
	float thickness = uThickness * uZoom / 120.;
	
	vec3 offsetNN = cross( normalize( tangent.xyz ), vec3( 0., 0., -1. ) );
	vec3 offset = normalize(offsetNN);
	vTangent_dot_view = length(offsetNN);

	offset.x *= thickness;
	offset.y *= thickness;
	
	vPosition.xyz = ( offset * vS_param ) + vPosition.xyz;

	gl_Position = vPosition; //< store final position
}