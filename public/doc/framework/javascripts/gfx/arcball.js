define ( ["./glMatrix-0.9.5.min"], (function() {
	
var Epsilon = 0.00001;
var width = 500; 										// width of window
var height = 500; 										// height of window
var adjust_width  = 1.0 / ((width - 1.0) * 0.5);
var adjust_height = 1.0 / ((height - 1.0) * 0.5);
var m_zoom = 1.0;

var v_mouse_current = vec3.create();  		// mouse position at the beginning of dragging
var v_mouse_down = vec3.create();  			// mouse position at the beginning of dragging
var q_current_rotation = quat4.create();	// current rotation
var m_rot = mat4.create();				 			// current rotation matrix
mat4.identity(m_rot);
var v_from = vec3.create();
var lastRot = mat4.create();
mat4.identity( lastRot );

/// maps the specified mouse position to the sphere defined
/// with center and radius. the resulting vector lies on the
/// surface of the sphere.
function map_sphere(mouse)
{
	tmpx = (mouse[0] * adjust_width) - 1.0;
	tmpy = 1.0 - (mouse[1] * adjust_height);
	
	length = (tmpx*tmpx) + (tmpy*tmpy);

	bm = vec3.create();
	if ( length > 1.0 )
	{
		norm = 1.0 / Math.sqrt(length);
		bm[0] = tmpx * norm;
		bm[1] = tmpy * norm;
		bm[2] = 0.0;
	}
	else
	{
		bm[0] = tmpx;
		bm[1] = tmpy;
		bm[2] = Math.sqrt(1.0 - length);
	}
	return bm;			
}



// after here public functions

/// sets the window size.
function setViewportDims(width_, height_)
{ 
	width = width_; 
	height = height_; 
	adjust_width  = 1.0 / ((width - 1.0) * 0.5);
	adjust_height = 1.0 / ((height - 1.0) * 0.5);
}

/// sets the current position and calculates the current
/// rotation matrix.
function drag(x, y)
{
	v_mouse_current[0] = x;
	v_mouse_current[1] = y;
	v_mouse_current[2] = 0.0;
	
	v_to   = map_sphere(v_mouse_current);
	perp = vec3.create();
	vec3.cross( v_from, v_to, perp);

	if ( vec3.length(perp) > Epsilon )
	{
		q_current_rotation[0] = perp[0];
		q_current_rotation[1] = perp[1];
		q_current_rotation[2] = perp[2];
		q_current_rotation[3] = (v_from[0] * v_to[0]) + (v_from[1] * v_to[1]) + (v_from[2] * v_to[2]);
	}
	else
	{
		q_current_rotation[0] = 
		q_current_rotation[1] = 
		q_current_rotation[2] = 
		q_current_rotation[3] = 0;
	}
		
	quat4.toMat4( q_current_rotation, m_rot);

	mat4.multiply( lastRot, m_rot, m_rot );
}

/// indicates the beginning of the dragging.
function click(x,y)
{
	mat4.set( m_rot, lastRot  );
	v_mouse_down[0] = x;
	v_mouse_down[1] = y;
	v_mouse_down[2] = 0.0;
	v_from = map_sphere(v_mouse_down);
}

/// returns the rotation matrix to be used directly
function get()
{ 
	var mv = mat4.create();
	mat4.identity( mv );
	
	var halfMove = vec3.create();
	halfMove[0] = -moveX;
	halfMove[1] = moveY;
	halfMove[2] = 0;
	mat4.translate( mv, halfMove );
	
	
	var scale = vec3.create();
	scale[0] = m_zoom;
	scale[1] = m_zoom;
	scale[2] = m_zoom;
	mat4.scale( mv, scale );
	
	mat4.inverse( m_rot );
	mat4.multiply( mv, m_rot );
	mat4.inverse( m_rot );
	
	var halfMove = vec3.create();
	halfMove[0] = -80;
	halfMove[1] = -100;
	halfMove[2] = -80;
	
	mat4.translate( mv, halfMove );
	
	return mv;
}

function zoomIn() {
	if ( m_zoom < 1.0 ) {
		m_zoom += 0.05;
	}
	else {
		m_zoom += ( m_zoom - 0.9 ) / 2;
	}
}

function zoomOut() {
	if ( m_zoom < 1.0 ) {
		m_zoom -= 0.05;
	}
	else {
		m_zoom -= ( m_zoom - 0.9 ) / 2;
	}
	if ( m_zoom < 0.1 ) {
		m_zoom = 0.1;
	}
}

function setZoom( zoom ) {
	m_zoom = zoom;
}

var midClickX = 0;
var midClickY = 0;
var moveX = 0;
var moveY = 0;
var oldMoveX = 0;
var oldMoveY = 0;

function midClick( x, y ) {
	oldMoveX = moveX;
	oldMoveY = moveY;
	midClickX = x;
	midClickY = y;
}

function midDrag( x, y ) {
	moveX = ( midClickX - x ) / 3 + oldMoveX;
	moveY = ( midClickY - y ) / 3 + oldMoveY;
}

function reset() {
	m_rot = mat4.create();				 			// current rotation matrix
	mat4.identity(m_rot);
	v_from = vec3.create();
	lastRot = mat4.create();
	mat4.identity( lastRot );
}

function setTranslation( x, y ) {
	moveX = x;
	moveY = y;
}

function setRotation( rot ) {
	m_rot = rot;
}

return {
	setViewportDims: setViewportDims,
	click: click,
	drag: drag,
    get: get,
    zoomIn : zoomIn,
	zoomOut : zoomOut,
	setZoom : setZoom,
	midClick : midClick,
	midDrag: midDrag,
	reset: reset,
	setTranslation : setTranslation,
	setRotation : setRotation
};
}));