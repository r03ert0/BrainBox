define( ["jquery", 'io', 'webgl-debug'], (function($) {

var gl = {}; // stores the webgl context
var shaders = {}; // set storing the shaders
var shaderPrograms = {}; // array storing the loaded shader programs

var viewportWidth = 500;
var viewportHeight = 500;

var peels = {C0:null, D0:null, D1:null, D2:null, C1:null, C2:null, C3:null, EXTENT_TEXTURE:null};
var textureN = {C0:gl.TEXTURE2, D0:gl.TEXTURE3, D1:gl.TEXTURE4, D2:gl.TEXTURE5,
                                   C1:gl.TEXTURE6, C2:gl.TEXTURE7, C3:gl.TEXTURE8, 
                                   EXTENT_TEXTURE:gl.TEXTURE9};

var peelFramebuffer = null;
var peelRenderbuffer = null;
var sizeMult = 1;

//***************************************************************************************************
//
//	init webgl
//
//***************************************************************************************************/
function initGL(canvas) {
	//gl = WebGLDebugUtils.makeDebugContext(canvas.getContext("experimental-webgl"));
	gl = canvas.getContext("experimental-webgl", {preserveDrawingBuffer: true});
	//gl = canvas.getContext("experimental-webgl", { alpha: false } );
	viewportWidth =  $(canvas).width();
	viewportHeight = $(canvas).height();
	gl.viewportWidth =  $(canvas).width();
	gl.viewportHeight = $(canvas).height();
	
	loadShaders();
}

function initPeel() {
	for (var T in peels) {
        makeTexture(T); 
	}
	
	peelFramebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, peelFramebuffer);

    peelRenderbuffer = gl.createRenderbuffer(); // create depth buffer
    gl.bindRenderbuffer(gl.RENDERBUFFER, peelRenderbuffer);
    
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, sizeMult * viewportWidth, sizeMult * viewportHeight);
    //gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, sizeMult * viewportHeight, sizeMult * viewportHeight);
    
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, peelRenderbuffer);
    
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

function makeTexture(T) {
    peels[T] = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, peels[T]);
    
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, sizeMult * viewportWidth, sizeMult * viewportHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    //gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, sizeMult * viewportHeight, sizeMult * viewportHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    
    gl.bindTexture(gl.TEXTURE_2D, null);
}

function resizeGL(canvas) {
	viewportWidth =  $(canvas).width();
	viewportHeight = $(canvas).height();
	gl.viewportWidth =  $(canvas).width();
	gl.viewportHeight = $(canvas).height();
	initPeel();
}

//***************************************************************************************************
//
//	shader management
//
//***************************************************************************************************/
function loadShaders() {
	getShader('slice');
	getShader('mesh');
	getShader('mesh_transp');
	getShader('texmesh');
	getShader('texmesh_transp');
	getShader('fibre_l');
	getShader('fibre_l_transp');
	getShader('fibre_t');
	getShader('fibre_t_transp');
	getShader('merge');

	return shaderPrograms;
}

function getShader(name) {
	getShader1( name, 'vs' );
	getShader1( name, 'fs' );
	
	initShader(name);
}

function getShader1(name, type) {
	var shader;
	$.ajax({
		url : '../framework/shaders/' + name + '.' + type,
		async : false,
		dataType: "text",
		success : function(data) {

			if (type == 'fs') {
				shader = gl.createShader(gl.FRAGMENT_SHADER);
			} else {
				shader = gl.createShader(gl.VERTEX_SHADER);
			}
			//console.log("shader: " + data + " " + data.text);
			gl.shaderSource(shader, data);
			gl.compileShader(shader);

			if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
				alert(gl.getShaderInfoLog(shader));
				return null;
			}
			shaders[name + '_' + type] = shader;
		}
	});
}


function initShader(name) {
	shaderPrograms[name] = gl.createProgram();
	gl.attachShader(shaderPrograms[name], shaders[name + '_vs']);
	gl.attachShader(shaderPrograms[name], shaders[name + '_fs']);
	gl.linkProgram(shaderPrograms[name]);

	if (!gl.getProgramParameter(shaderPrograms[name], gl.LINK_STATUS)) {
		alert("Could not initialise shaders\n" + gl.LINK_STATUS);
	}

	gl.useProgram(shaderPrograms[name]);
	
	shaderPrograms[name].aVertexPosition = gl.getAttribLocation(shaderPrograms[name], "aVertexPosition");
	shaderPrograms[name].aVertexNormal   = gl.getAttribLocation(shaderPrograms[name], "aVertexNormal");
	shaderPrograms[name].aVertexColor    = gl.getAttribLocation(shaderPrograms[name], "aVertexColor");
	shaderPrograms[name].aTextureCoord   = gl.getAttribLocation(shaderPrograms[name], "aTextureCoord");
	
	shaderPrograms[name].uTex0           = gl.getUniformLocation(shaderPrograms[name], "uTex0");
	shaderPrograms[name].uTex1           = gl.getUniformLocation(shaderPrograms[name], "uTex1");
	
	shaderPrograms[name].uPMatrix        = gl.getUniformLocation(shaderPrograms[name], "uPMatrix");
	shaderPrograms[name].uMVMatrix       = gl.getUniformLocation(shaderPrograms[name], "uMVMatrix");
	shaderPrograms[name].uMVMatrixInvert = gl.getUniformLocation(shaderPrograms[name], "uMVMatrixInvert");
	shaderPrograms[name].uOMatrix        = gl.getUniformLocation(shaderPrograms[name], "uOMatrix");
	shaderPrograms[name].uLightLocation  = gl.getUniformLocation(shaderPrograms[name], "uLightLocation");
	
	shaderPrograms[name].uMinorMode      = gl.getUniformLocation(shaderPrograms[name], "uMinorMode");
	shaderPrograms[name].uCanvasSize     = gl.getUniformLocation(shaderPrograms[name], "uCanvasSize");
	
	shaderPrograms[name].C0              = gl.getUniformLocation(shaderPrograms[name], "C0");
	shaderPrograms[name].C1              = gl.getUniformLocation(shaderPrograms[name], "C1");
	shaderPrograms[name].C2              = gl.getUniformLocation(shaderPrograms[name], "C2");
	shaderPrograms[name].C3              = gl.getUniformLocation(shaderPrograms[name], "C3");
	shaderPrograms[name].D0              = gl.getUniformLocation(shaderPrograms[name], "D0");
	shaderPrograms[name].D1              = gl.getUniformLocation(shaderPrograms[name], "D1");
	shaderPrograms[name].D2              = gl.getUniformLocation(shaderPrograms[name], "D2");
	shaderPrograms[name].uSampler        = gl.getUniformLocation(shaderPrograms[name], "uSampler");
	shaderPrograms[name].uSampler1       = gl.getUniformLocation(shaderPrograms[name], "uSampler1");
	
	shaderPrograms[name].uColorMap       = gl.getUniformLocation(shaderPrograms[name], "uColorMap");
	shaderPrograms[name].uMin            = gl.getUniformLocation(shaderPrograms[name], "uMin");
	shaderPrograms[name].uMax            = gl.getUniformLocation(shaderPrograms[name], "uMax");
	shaderPrograms[name].uThreshold1     = gl.getUniformLocation(shaderPrograms[name], "uThreshold1");
	shaderPrograms[name].uThreshold2     = gl.getUniformLocation(shaderPrograms[name], "uThreshold2");
	shaderPrograms[name].uAlpha          = gl.getUniformLocation(shaderPrograms[name], "uAlpha");
	shaderPrograms[name].uAlpha2         = gl.getUniformLocation(shaderPrograms[name], "uAlpha2");
	
	shaderPrograms[name].uFibreColor      = gl.getUniformLocation(shaderPrograms[name], "uFibreColor");
	shaderPrograms[name].uFibreColorMode  = gl.getUniformLocation(shaderPrograms[name], "uFibreColorMode");
	shaderPrograms[name].uZoom            = gl.getUniformLocation(shaderPrograms[name], "uZoom");
	shaderPrograms[name].uThickness       = gl.getUniformLocation(shaderPrograms[name], "uThickness");
}

return {
	initGL : initGL,
	initPeel : initPeel,
	loadShaders: loadShaders,
	gl : function () { return gl; },
	shaderPrograms : function () { return shaderPrograms; },
	viewportWidth : function () { return viewportWidth; },
	viewportHeight : function () { return viewportHeight; },
	
	peels : function () { return peels; },
	peelFramebuffer : function () { return peelFramebuffer; }, 
	peelRenderbuffer : function () { return peelRenderbuffer; },
	
	resizeGL : resizeGL
};
}));