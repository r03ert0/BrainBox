attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec3 aVertexColor;

uniform mat4 uMVMatrix;
uniform mat4 uMVMatrixInvert;
uniform mat4 uPMatrix;
uniform mat3 uNMatrix;

varying vec4 vPosition;
varying vec3 vLightPos;
varying vec3 vNormal;
varying vec4 vColor;

void main(void) 
{
/*
	vPosition = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
	vLightPos = uLightLocation;
	vNormal = normalize(aVertexNormal);
	
	gl_Position = vPosition;
	*/

	vPosition = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
	vNormal = normalize(aVertexNormal);
	
	vec3 view = normalize( ( uMVMatrixInvert * vec4( vec3( 0.0, 0.0, -1.0 ), 1.0 ) ).xyz );
	vLightPos = view;
    vec3 tangent = vNormal; //(uPMatrix * uMVMatrix * vec4(vNormal,0.)).xyz;
    vec3 offsetNN = cross( normalize( tangent.xyz ), view );
	vec3 offset = normalize(offsetNN);
	
	vColor = vec4( abs( vNormal ), 1.0 );
	
	
	vNormal = cross( vNormal, offset );
	if ( dot( vNormal, view ) >= 0.0 )
    {
		vNormal *= -1.0;
	}
	
	
	gl_Position = vPosition;
	
}