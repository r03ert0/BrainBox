define( ["jquery", 'utils', 'niftii', 'gfx/mygl'], (function($, utils, niftii, mygl) { 

var niftiis = {};
var textures =  {};
var interpolate = true;

var meshes = {};
var fibres = {};
var scenes = {};
var content = {};

//picking
picking = {};
picking.pickIndex = 1; // starting index for pick colors
picking.pickArray = {};
picking.pickMode = false;
picking.oldPick = "none";
picking.showTooltips = false;

//***************************************************************************************************
//
//	load functions
//
//***************************************************************************************************/
function loadElements( addToUI, elementLoaded, allElementsLoaded ) {
	//console.log( 'start loading elements' );
	
	 $.getJSON(settings.CONFIG_URL + "elements.json", function(data) {
     // alle Elemente durchgehen, 
    	$.each(data, function(i, el) {
//    		$(viewer).trigger('loadElementStart', {
//    			'id' : el.id,
//    			'name' : el.name,
//    			'type' : el.type
//    		});

    		switch( el.type ) {

    		case "mesh" :
    			addToUI( {'id' : el.id, 'name' : el.name, 'type' : 'mesh'} );
    			loadMesh( el, elementLoaded );
    			break;
    		case "texmesh" :
    			addToUI( {'id' : el.id, 'name' : el.name, 'type' : 'texmesh'} );
    			loadTexMesh( el, elementLoaded );
    			break;
    		case "fibre" :
    			addToUI( {'id' : el.id, 'name' : el.name, 'type' : 'fibre'} );
    			loadFibre(el, elementLoaded);
    			break;
    		case "texture" :
    			addToUI( {'id' : el.id, 'name' : el.name, 'type' : 'tex'} );
    			loadTexture( el, elementLoaded );
    			break;
    			default:
    				console.log( "********" + el.id );
    		}
    	});
     	allElementsLoaded();
     });
}

function loadMesh( el, elementLoaded ) {
	var element = el;
	$.getJSON(settings.DATA_URL + el.url, function(data) {
		element.indices  = data.indices;
		
		var vertices = data.vertices;
		if (element.correction) {
			for ( var m = 0; m < data.vertices.length / 3; ++m) {
				vertices[3 * m] += data.correction[0];
				vertices[3 * m + 1] += data.correction[1];
				vertices[3 * m + 2] += data.correction[2];
			}
		}
		
		var colors = [];
		if (!data.colors) {
			colorSize = (data.vertices.length / 3) * 4;
			
			if (el.color) {
				for ( var k = 0; k < colorSize / 4; ++k) {
					colors.push(el.color.r);
					colors.push(el.color.g);
					colors.push(el.color.b);
					colors.push(1);
				}
			} else {
				for ( var k = 0; k < colorSize; ++k) {
					colors.push(1);
				}
			}
			
		}
		else {
			colors = data.colors;
		}
		
		element.vertices = [];
		for ( var i = 0; i < vertices.length /3; ++i ) {
			element.vertices.push( vertices[ i * 3 ]);
			element.vertices.push( vertices[ i * 3 + 1 ]);
			element.vertices.push( vertices[ i * 3 + 2 ]);
			element.vertices.push( data.normals[ i * 3 ]);
			element.vertices.push( data.normals[ i * 3 + 1 ]);
			element.vertices.push( data.normals[ i * 3 + 2 ]);
			element.vertices.push( colors[ i * 4 ]);
			element.vertices.push( colors[ i * 4 + 1 ]);
			element.vertices.push( colors[ i * 4 + 2 ]);
		}

		element.transparency = el.transparency;
		element.hasBuffer = false;

		picking.pickColor = utils.createPickColor(picking.pickIndex);
		picking.pickArray[picking.pickColor.join()] = el.id;
		picking.pickIndex++;
		pc = [];
		pc[0] = picking.pickColor[0] / 255;
		pc[1] = picking.pickColor[1] / 255;
		pc[2] = picking.pickColor[2] / 255;
		element.pickColor = pc;
		element.display2 = false;
		meshes[el.id] = element;
		
		elementLoaded( el );
	});
/*
	var worker = new Worker( '../framework/javascripts/util/loadmesh.js' );
	worker.addEventListener('message', function(e) {
	    console.log( "main thread:" + e.data.e1.id );
	    
	    picking.pickColor = utils.createPickColor(picking.pickIndex);
		picking.pickArray[picking.pickColor.join()] = el.id;
		picking.pickIndex++;
		pc = [];
		pc[0] = picking.pickColor[0] / 255;
		pc[1] = picking.pickColor[1] / 255;
		pc[2] = picking.pickColor[2] / 255;
		e.data.e2.pickColor = pc;
		e.data.e2.display2 = false;
		meshes[e.data.e1.id] = e.data.e2;
	    
		elementLoaded( e.data.e1 );
	}, false);
	
	worker.postMessage( { 'url' : settings.DATA_URL, 'elem' : el } );
	*/
}

function loadTexMesh( el, elementLoaded ) {
	var element = el;
	$.getJSON(settings.DATA_URL + el.url, function(data) {
		element.indices  = data.indices;
		
		var vertices = data.vertices;
		if (element.correction) {
			for ( var m = 0; m < data.vertices.length / 3; ++m) {
				vertices[3 * m] += data.correction[0];
				vertices[3 * m + 1] += data.correction[1];
				vertices[3 * m + 2] += data.correction[2];
			}
		}
		
		console.log( "vsize " + vertices.length );
		console.log( "tsize " + data.texcoords.length );
		
		element.vertices = [];
		for ( var i = 0; i < vertices.length /3; ++i ) 
		{
			element.vertices.push( vertices[ i * 3 ] );
			element.vertices.push( vertices[ i * 3 + 1 ] );
			element.vertices.push( vertices[ i * 3 + 2 ] );
			element.vertices.push( data.normals[ i * 3 ] );
			element.vertices.push( data.normals[ i * 3 + 1 ] );
			element.vertices.push( data.normals[ i * 3 + 2 ] );
			element.vertices.push( data.texcoords[ i * 2 ] );
			element.vertices.push( data.texcoords[ i * 2 + 1 ] );
		}

		element.transparency = el.transparency;
		element.hasBuffer = false;

		picking.pickColor = utils.createPickColor(picking.pickIndex);
		picking.pickArray[picking.pickColor.join()] = el.id;
		picking.pickIndex++;
		pc = [];
		pc[0] = picking.pickColor[0] / 255;
		pc[1] = picking.pickColor[1] / 255;
		pc[2] = picking.pickColor[2] / 255;
		element.pickColor = pc;
		element.display2 = false;
		meshes[el.id] = element;
		
		elementLoaded( el );
	});
}

function loadFibre(el, elementLoaded) {

	var element = el;
	$.getJSON(settings.DATA_URL + el.url, function(data) {
		element.indices = data.indices;
		var vertices = data.vertices;
		
		if (element.correction) {
			for ( var m = 0; m < element.vertices.length / 3; ++m) {
				vertices[3 * m] += data.correction[0];
				vertices[3 * m + 1] += data.correction[1];
				vertices[3 * m + 2] += data.correction[2];
			}
		}
		
		var colors = [];
		
		if (!data.colors && !el.savedColor) {
			colorSize = (data.vertices.length / 3) * 4;
			
			if (el.color) {
				for ( var k = 0; k < colorSize / 4; ++k) {
					colors.push(el.color.r);
					colors.push(el.color.g);
					colors.push(el.color.b);
					colors.push(1);
				}
			} else {
				for ( var k = 0; k < colorSize; ++k) {
					colors.push(1);
				}
			}
		}
		else {
			colors = data.colors;
		}
		
		element.transparency = el.transparency;
		element.hasBuffer = false;

		picking.pickColor = utils.createPickColor(picking.pickIndex);
		picking.pickArray[picking.pickColor.join()] = el.id;
		picking.pickIndex++;
		pc = [];
		pc[0] = picking.pickColor[0] / 255;
		pc[1] = picking.pickColor[1] / 255;
		pc[2] = picking.pickColor[2] / 255;
		element.pickColor = pc;


		tubeVertices = [];
		tubeTexCoords = [];
		tubeColors = [];
		
		for ( var m = 0; m < vertices.length / 3; ++m) {
			tubeVertices.push(vertices[3 * m]);
			tubeVertices.push(vertices[3 * m + 1]);
			tubeVertices.push(vertices[3 * m + 2]);
			tubeVertices.push(vertices[3 * m]);
			tubeVertices.push(vertices[3 * m + 1]);
			tubeVertices.push(vertices[3 * m + 2]);
			
//			tubeColors.push(colors[4 * m]);
//			tubeColors.push(colors[4 * m + 1]);
//			tubeColors.push(colors[4 * m + 2]);
//			tubeColors.push(colors[4 * m + 3]);
//			tubeColors.push(colors[4 * m]);
//			tubeColors.push(colors[4 * m + 1]);
//			tubeColors.push(colors[4 * m + 2]);
//			tubeColors.push(colors[4 * m + 3]);
			
			tubeTexCoords.push(1.0);
			tubeTexCoords.push(1.0);
			tubeTexCoords.push(-1.0);
			tubeTexCoords.push(1.0);
		}
		
		tubeNormals = calcTubeNormals(data);

		element.tubeVertices = [];
		for ( var i = 0; i < tubeVertices.length /3; ++i ) {
			element.tubeVertices.push( tubeVertices[ i * 3 ]);
			element.tubeVertices.push( tubeVertices[ i * 3 + 1 ]);
			element.tubeVertices.push( tubeVertices[ i * 3 + 2 ]);
			
			element.tubeVertices.push( tubeNormals[ i * 3 ] );
			element.tubeVertices.push( tubeNormals[ i * 3 + 1 ] );
			element.tubeVertices.push( tubeNormals[ i * 3 + 2 ] );

			element.tubeVertices.push( tubeTexCoords[ i * 2 ]);
			element.tubeVertices.push( tubeTexCoords[ i * 2 + 1 ]);
			
//			element.tubeVertices.push( tubeColors[ i * 4 ]);
//			element.tubeVertices.push( tubeColors[ i * 4 + 1 ]);
//			element.tubeVertices.push( tubeColors[ i * 4 + 2 ]);
//			element.tubeVertices.push( tubeColors[ i * 4 + 3 ]);
		}
		
		
		var lineStart = 0;
		var lineStarts = [];
		for ( var i = 0; i < element.indices.length; ++i) {
			lineStarts.push(lineStart);
			lineStart += element.indices[i];
		}
		element.lineStarts = lineStarts;

		element.color = el.color;
		element.display2 = false;
		
		fibres[el.id] = element;
		
		elementLoaded( el );	
	});	
	
}

function calcTubeNormals(elem) {
	tubeNormals = [];

	lineStart = 0;
	for ( var i = 0; i < elem.indices.length; ++i) {
		length = elem.indices[i];

		var x1=0, x2=0, y1=0, y2=0, z1=0, z2=0, nx=0, ny=0, nz=0;

		x1 = elem.vertices[0];
		y1 = elem.vertices[1];
		z1 = elem.vertices[2];
		x2 = elem.vertices[3];
		y2 = elem.vertices[4];
		z2 = elem.vertices[5];
		
		tubeNormals.push(x1-x2);
		tubeNormals.push(y1-y2);
		tubeNormals.push(z1-z2);
		tubeNormals.push(x1-x2);
		tubeNormals.push(y1-y2);
		tubeNormals.push(z1-z2);

		for ( var j = 1; j < length - 1; ++j) {
			x1 = elem.vertices[lineStart + 3 * j - 3];
			y1 = elem.vertices[lineStart + 3 * j - 2];
			z1 = elem.vertices[lineStart + 3 * j - 1];
			x2 = elem.vertices[lineStart + 3 * j + 3];
			y2 = elem.vertices[lineStart + 3 * j + 4];
			z2 = elem.vertices[lineStart + 3 * j + 5];

			nx = x1 - x2;
			ny = y1 - y2;
			nz = z1 - z2;

			tubeNormals.push(nx);
			tubeNormals.push(ny);
			tubeNormals.push(nz);
			tubeNormals.push(nx);
			tubeNormals.push(ny);
			tubeNormals.push(nz);
		}

		tubeNormals.push(nx);
		tubeNormals.push(ny);
		tubeNormals.push(nz);
		tubeNormals.push(nx);
		tubeNormals.push(ny);
		tubeNormals.push(nz);

		for ( var k = 0; k < 6; ++k)
			tubeNormals[k] = tubeNormals[6 + k];

		lineStart += elem.indices[i] * 3;
	}

	return tubeNormals;
}

function loadTexture(el, elementLoaded ) {
	var n = new Niftii();
	n.load( settings.DATA_URL + el.url );

	niftiis[el.id] = n;
	niftiis[el.id].id = el.id;
	niftiis[el.id].name = el.name;
	
	textures[el.id] = {};
	//texIds.push(el.id);
	
	elementLoaded( el );
}

var waitId=0;
var waitOrient=0;
var waitPos=0;

function getTexture(id, orient, pos) {
	if ( textures[id][orient + pos]) {
		return textures[id][orient + pos];
	} else {
		if ( niftiis[id].loaded() ) {
			textures[id][orient + pos] = mygl.gl().createTexture();
			textures[id][orient + pos].image = niftiis[id].getImage(orient, pos);
			handleLoadedTexture( textures[id][orient + pos] );
			return textures[id][orient + pos];
		}
		else {
			// start time out and look a little bit later
			waitId = id;
			waitOrient = orient;
			waitPos = pos;
			setTimeout( waitForTextureLoad, 200 );
		}
	}
}

function waitForTextureLoad() {
	if ( niftiis[waitId].loaded() ) {
		textures[waitId][waitOrient + waitPos] = mygl.gl().createTexture();
		textures[waitId][waitOrient + waitPos].image = niftiis[waitId].getImage(waitOrient, waitPos);
		handleLoadedTexture(textures[waitId][waitOrient + waitPos]);
	}
	else {
		// start time out and look a little bit later
		setTimeout( waitForTextureLoad, 200 );
	}
}

function handleLoadedTexture(texture) {
	mygl.gl().bindTexture(mygl.gl().TEXTURE_2D, texture);
	mygl.gl().texImage2D(mygl.gl().TEXTURE_2D, 0, mygl.gl().RGBA, mygl.gl().RGBA, mygl.gl().UNSIGNED_BYTE, texture.image);
	if ( interpolate ) {
		mygl.gl().texParameteri(mygl.gl().TEXTURE_2D, mygl.gl().TEXTURE_MAG_FILTER, mygl.gl().LINEAR);
		mygl.gl().texParameteri(mygl.gl().TEXTURE_2D, mygl.gl().TEXTURE_MIN_FILTER, mygl.gl().LINEAR);
	}
	else {
		mygl.gl().texParameteri(mygl.gl().TEXTURE_2D, mygl.gl().TEXTURE_MAG_FILTER, mygl.gl().NEAREST);
		mygl.gl().texParameteri(mygl.gl().TEXTURE_2D, mygl.gl().TEXTURE_MIN_FILTER, mygl.gl().NEAREST);
	}
	mygl.gl().generateMipmap(mygl.gl().TEXTURE_2D);
	mygl.gl().bindTexture(mygl.gl().TEXTURE_2D, null);
	delete texture.image;
}


function loadScenes() 
{
	$.getJSON(settings.CONFIG_URL + 'scenes.json', function(data) {
		$.each(data, function(i, sc) {
			scenes[sc.id] = {};
			scenes[sc.id].cameraPosition = sc.cameraPosition;
			scenes[sc.id].cameraTranslation = sc.cameraTranslation;
			scenes[sc.id].cameraZoom = sc.cameraZoom;
			scenes[sc.id].elementsAvailable = sc.elementsAvailable;
			scenes[sc.id].elementsActive = sc.elementsActive;
			scenes[sc.id].activationsAvailable = sc.activationsAvailable;
			scenes[sc.id].activationsActive = sc.activationsActive;
			scenes[sc.id].slices = sc.slices;
			scenes[sc.id].texture1 = sc.texture1;
			scenes[sc.id].texture2 = sc.texture2;
			scenes[sc.id].isView = sc.isView;
			scenes[sc.id].name = sc.name;
		});
	});
}

function loadContent( contentLoaded ) 
{
	$.getJSON(settings.CONFIG_URL + 'content.json', function(data) {
		$.each(data, function(i, co) {
			content[co.id] = {};
			content[co.id].title = co.title;
			content[co.id].paragraphs = co.paragraphs;
//			content[co.id].text = co.text;
//			content[co.id].image_url = co.image_url;
//			content[co.id].image_title = co.image_title;
//			content[co.id].image_text = co.image_text;
			content[co.id].scene = co.scene;
			content[co.id].viewer = co.viewer;
			content[co.id].next = co.next;
			content[co.id].previous = co.previous;
		});
		contentLoaded();
	});
}

//***************************************************************************************************
//
// 
//
//***************************************************************************************************/


function setTexInterpolation ( id, v ) {
	$.each(niftiis, function() {
		textures[this.id] = {};
	});
	interpolate = !v;
}

return {
	loadElements : loadElements,
	loadScenes : loadScenes,
	loadContent : loadContent,
	loadTexture : loadTexture,
	getTexture : getTexture,
	setTexInterpolation : setTexInterpolation,
	
	niftiis : function() {return niftiis;},
	textures : function() {return textures;},
	meshes : function() {return meshes;},
	fibres : function() {return fibres;},
	scenes : function() {return scenes;},
	content : function() {return content;},
};

}));