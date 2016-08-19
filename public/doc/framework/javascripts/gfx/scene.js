define ( ['io', './arcball', 'utils'], (function(io, arcball, utils) {
//state of the currently displayed scene

variables = {};
variables["zoom"] = 1.0;
variables["needsRedraw"] = false;
variables["axial"] = 80;
variables["coronal"] = 100;
variables["sagittal"] = 80;
variables["tex1"] = 'none';
variables["tex2"] = "none"; //"fmri1";
variables["localFibreColor"] = false;
variables["showSlices"] = true;
variables["renderTubes"] = true;
variables["threshold1"] = 0.0;
variables["threshold2"] = 0.0;
variables["colormap"] = 0;
variables["alpha2"] = 1.0;
variables["interpolate"] = true;
variables["loadingComplete"] = false;

var meshes = {};
var fibres = {};
var textures = {};
var scenes = {};

function init () {
	meshes = io.meshes();
	fibres = io.fibres();
	textures = io.textures();
	scenes = io.scenes();
}

function getValue( name ) {
	return variables[name];
}

function ival( name ) {
	return parseInt( variables[name] );
}

function fval( name ) {
	return parseFloat( variables[name] );
}


function setValue( name, value ) {
	variables[name] = value;
}

function getColormapValues( suggest, callback ) {
	var id = variables["tex2"];

	var t1min = 0;
	var t1max = 0;
	var t1step = 0;
	var t2min = 0;
	var t2max = 0;
	var t2step = 0;
	if ( id === 'none') {
		colormap = 0;
	}
	else {
		t1min = io.niftiis()[id].getMin();
		t1max = 0;
		t1step = io.niftiis()[id].getMin() / 100 * -1.0;
		t2min = 0;
		t2max = io.niftiis()[id].getMax();
		t2step = io.niftiis()[id].getMax() / 100;
		
		if ( suggest ) {
			if ( io.niftiis()[id].getType() === 'anatomy' || io.niftiis()[id].getType() === 'rgb' ) {
				variables["colormap"] = 0;
			}
			else if ( io.niftiis()[id].getType() === 'fmri' ) {
				variables["colormap"] = 1;
			}
			else if ( io.niftiis()[id].getType() === 'overlay' ) {
				variables["colormap"] = 3;
			}
		}
	}
	
	callback( {
		'id' : variables["colormap"],
		't1' :variables["threshold1"],
		't1min' : t1min,
		't1max' : t1max,
		't1step' : t1step,
		't2' : variables["threshold2"],
		't2min' : t2min,
		't2max' : t2max,
		't2step' : t2step
	});
	
}

function toggleElement(id, callback) {
	if (id in meshes) {
		meshes[id].display = !meshes[id].display;
		if ( callback )
			callback( id, meshes[id].display || meshes[id].display2 );
	}
	else if (id in fibres) {
		fibres[id].display = !fibres[id].display;
		if ( callback )
			callback( id, fibres[id].display || fibres[id].display2 );
	}
	else if (id in textures) {
		variables["tex1"] = id;
	}
	else if (id == "slices" ) {
		variables["showSlices"] = !variables["showSlices"];
	}
	else if (id in scenes) {
		toggleScene( id );
	}
	else {
		console.warn('Element "' + id + '" is unknown.');
		return false;
	}
}

function toggleElements(ids, callback) {
	$.each( ids, function( index, id ) {
	if (id in meshes) {
		meshes[id].display = !meshes[id].display;
		if ( callback )
			callback( id, meshes[id].display || meshes[id].display2 );
	}
	else if (id in fibres) {
		fibres[id].display = !fibres[id].display;
		if ( callback )
			callback( id, fibres[id].display || fibres[id].display2 );
	}
	else if (id in textures) {
		variables["tex1"] = id;
	}
	else if (id in scenes) {
		toggleScene( id );
	}
	else if (id == "slices" ) {
		variables["showSlices"] = !variables["showSlices"];
	}
	else {
		console.warn('Element "' + id + '" is unknown.');
		return false;
	}
	});
}

function showElement(id, callback) {
	if (id in meshes) {
		meshes[id].display = true;
		if ( callback )
			callback( id, meshes[id].display || meshes[id].display2 );
	}
	else if (id in fibres) {
		fibres[id].display = true;
		if ( callback )
			callback( id, fibres[id].display || fibres[id].display2 );
	}
	else if (id == "slices" ) {
		variables["showSlices"] = true;
	}
	else if (id in scenes) {
		activateScene( id );
	}
	else {
		console.warn('Element "' + id + '" is unknown.');
		return false;
	}
}

function mouseEnterElement(id, callback) {
	if (id in meshes) {
		meshes[id].display2 = true;
		if ( callback )
			callback( id, meshes[id].display || meshes[id].display2 );
	}
	else if (id in fibres) {
		fibres[id].display2 = true;
		if ( callback )
			callback( id, fibres[id].display || fibres[id].display2 );
	}
	else {
		console.warn('Element "' + id + '" is unknown.');
		return false;
	}
}

function showElements(ids, callback) {
	$.each( ids, function( index, id ) {
	if (id in meshes) {
		meshes[id].display = true;
		if ( callback )
			callback( id, meshes[id].display || meshes[id].display2 );
	}
	else if (id in fibres) {
		fibres[id].display = true;
		if ( callback )
			callback( id, fibres[id].display || fibres[id].display2 );
	}
	else if (id == "slices" ) {
		variables["showSlices"] = true;
	}
	else if (id in scenes) {
		activateScene( id );
	}
	else {
		console.warn('Element "' + id + '" is unknown.');
		return false;
	}
	});
}

function mouseEnterElements(ids, callback) {
	$.each( ids, function( index, id ) {
	if (id in meshes) {
		meshes[id].display2 = true;
		if ( callback )
			callback( id, meshes[id].display || meshes[id].display2 );
	}
	else if (id in fibres) {
		fibres[id].display2 = true;
		if ( callback )
			callback( id, fibres[id].display || fibres[id].display2 );
	}
	else if (id in textures) {
	}
	else {
		console.warn('Element "' + id + '" is unknown.');
		return false;
	}
	});
}

function hideElement(id, callback) {
	if (id in meshes) {
		meshes[id].display = false;
		if ( callback )
			callback( id, meshes[id].display || meshes[id].display2 );
	}
	else if (id in fibres) {
		fibres[id].display = false;
		if ( callback )
			callback( id, fibres[id].display || fibres[id].display2 );
	}
	else if (id == "slices" ) {
		variables["showSlices"] = false;
	}
	else if (id in scenes) {
		deactivateScene( id );
	}
	else {
		console.warn('Element "' + id + '" is unknown.');
		return false;
	}
}

function mouseLeaveElement(id, callback) {
	if (id in meshes) {
		meshes[id].display2 = false;
		if ( callback )
			callback( id, meshes[id].display || meshes[id].display2 );
	}
	else if (id in fibres) {
		fibres[id].display2 = false;
		if ( callback )
			callback( id, fibres[id].display || fibres[id].display2 );
	}
	else {
		console.warn('Element "' + id + '" is unknown.');
		return false;
	}
}

function hideElements(ids, callback) {
	$.each( ids, function( index, id ) {
	if (id in meshes) {
		meshes[id].display = false;
		if ( callback )
			callback( id, meshes[id].display || meshes[id].display2 );
	}
	else if (id in fibres) {
		fibres[id].display = false;
		if ( callback )
			callback( id, fibres[id].display || fibres[id].display2 );
	}
	else if (id == "slices" ) {
		variables["showSlices"] = false;
	}
	else if (id in scenes) {
		deactivateScene( id );
	}
	else {
		console.warn('Element "' + id + '" is unknown.');
		return false;
	}
	});
}

function mouseLeaveElements(ids, callback) {
	$.each( ids, function( index, id ) {
	if (id in meshes) {
		meshes[id].display2 = false;
		if ( callback )
			callback( id, meshes[id].display || meshes[id].display2 );
	}
	else if (id in fibres) {
		fibres[id].display2 = false;
		if ( callback )
			callback( id, fibres[id].display || fibres[id].display2 );
	}
	else if (id in textures) {
	}
	else {
		console.warn('Element "' + id + '" is unknown.');
		return false;
	}
	});
}

function getElementAlpha(id) {
	if ( meshes[id] ) {
		return meshes[id].transparency;
	}
	if ( io.fibres[id] ) {
		return fibres[id].transparency;
	}
}

function setElementAlpha(id, alpha) {
	if ( meshes[id] ) {
		meshes[id].transparency = alpha;
	}
	if ( fibres[id] ) {
		fibres[id].transparency = alpha;
	}
}

function toggleValue( name ) {
	variables[name] = !variables[name];
}

function toggleScene( id ) {
	if ( id in scenes ) {
		console.log( "toggle scene " + id );
		$.each(scenes[id].elementsActive, function() {
			toggleElement( this );
		});
		
		arcball.setZoom( scenes[id].cameraZoom );
		arcball.setTranslation( scenes[id].cameraTranslation[0], scenes[id].cameraTranslation[1] );
		
		var nextRot = mat4.create();
		mat4.identity(nextRot);
		mat4.rotateX(nextRot, scenes[id].cameraPosition[0]);
		mat4.rotateY(nextRot, scenes[id].cameraPosition[1]);
		mat4.rotateZ(nextRot, scenes[id].cameraPosition[2]);
		
		arcball.setRotation( nextRot );
	}
}


function deactivateScene( id ) {
	if ( id in scenes ) {
		console.log( "deactivate scene " + id );
		$.each(scenes[id].elementsActive, function() {
			hideElement( this );
		});
	}
}
/*
function activateScene( id ) {
	if ( id in scenes ) {
		$.each( fibres, function(i, fib ) {
			fib.display = false;
		});
		$.each( meshes, function(i, mesh ) {
			mesh.display = false;
		});
		console.log( "activate scene " + id );
				
		$.each(scenes[id].elementsActive, function() {
			showElement( this );
		});
		
		arcball.setZoom( scenes[id].cameraZoom );
		arcball.setTranslation( scenes[id].cameraTranslation[0], scenes[id].cameraTranslation[1] );
		
		var nextRot = mat4.create();
		mat4.identity(nextRot);
		mat4.rotateX(nextRot, scenes[id].cameraPosition[0]);
		mat4.rotateY(nextRot, scenes[id].cameraPosition[1]);
		mat4.rotateZ(nextRot, scenes[id].cameraPosition[2]);
		
		arcball.setRotation( nextRot );
	}
}
*/

var quatOldRot;
var quatNextRot;
var step = 0;
var rotateInterval;

var screenMoveXOld;
var screenMoveYOld;
var zoomOld;

var screenMoveXNext;
var screenMoveYNext;
var zoomNext;

function activateScene(id)
{
	if ( id in scenes ) 
	{
		if ( rotateInterval )
			clearInterval(rotateInterval);
	    
	    nextScene = id;
		
		nextRot = mat4.create();
		mat4.identity(nextRot);
		mat4.rotateX(nextRot, scenes[id].cameraPosition[0]);
		mat4.rotateY(nextRot, scenes[id].cameraPosition[1]);
		mat4.rotateZ(nextRot, scenes[id].cameraPosition[2]);
		
		quatOldRot = utils.mat4toQuat( arcball.get() );
		quatNextRot = utils.mat4toQuat( nextRot );
		
		screenMoveXNext = scenes[id].cameraTranslation[0];
		screenMoveYNext = scenes[id].cameraTranslation[1];
		zoomNext = scenes[id].cameraZoom;
		
		zoomOld = variables["zoom"];
		screenMoveXOld = 0; // screenMoveX;
		screenMoveYOld = 0; // screenMoveY;
		
		step = 0;
		transitionOngoing = true;
		rotateInterval = setInterval(rotateToNextPosition, 50);
	}
}

function rotateToNextPosition()
{
	++step;
	if ( step == 20 )
	{
		clearInterval(rotateInterval);
		activateScene1(nextScene);
		transitionOngoing = false;
	}
	
	d = Math.log(step) / Math.log(20);
	
	m_lastRot = mat4.create();
	mat4.identity(m_lastRot);
	m_thisRot = mat4.create();
	mat4.identity(m_thisRot);
	
	q = quat4.create();
	q = utils.slerp(quatOldRot, quatNextRot, d);
	quat4.toMat4(q, m_thisRot);
	arcball.setRotation( m_thisRot );
	
	zoom = (1.0 - d) * zoomOld + d * zoomNext;
	var screenMoveX = (1.0 - d) * screenMoveXOld + d * screenMoveXNext;
	var screenMoveY = (1.0 - d) * screenMoveYOld + d * screenMoveYNext;
	arcball.setTranslation( screenMoveX, screenMoveY );
	
	
	variables["needsRedraw"] = true;
}

function activateScene1(id)
{
	$.each( fibres, function(i, fib ) {
		fib.display = false;
	});
	$.each( meshes, function(i, mesh ) {
		mesh.display = false;
	});
	console.log( "activate scene " + id );
			
	$.each(scenes[id].elementsActive, function() {
		showElement( this );
	});
	
	variables["needsRedraw"] = true;
}


function needsRedraw()
{
	var ret = variables["needsRedraw"];
	variables["needsRedraw"] = false;
	return ret;
}

return {
	init : init,
	setValue : setValue,
	getValue : getValue,
	ival : ival,
	fval : fval,
	getColormapValues: getColormapValues,
	toggleElement : toggleElement,
	toggleElements : toggleElements,
	showElement : showElement,
	mouseEnterElement : mouseEnterElement,
	mouseEnterElements : mouseEnterElements,
	showElements : showElements,
	hideElement : hideElement,
	mouseLeaveElement : mouseLeaveElement,
	hideElements : hideElements,
	mouseLeaveElements : mouseLeaveElements,
	getElementAlpha : getElementAlpha,
	setElementAlpha : setElementAlpha,
	toggleValue : toggleValue,
	activateScene : activateScene,
	deactivateScene : deactivateScene,
	toggleScene : toggleScene,
	needsRedraw : needsRedraw
};
}));