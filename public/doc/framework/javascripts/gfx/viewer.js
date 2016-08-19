define( ['./mygl', 'io', './arcball', './scene', './glMatrix-0.9.5.min'], 
		(function(mygl, io, arcball, scene ) { 
			
//***************************************************************************************************
//
//	definition of global variables
//
//***************************************************************************************************/
var variables = {};

var gl = {};
var shaders = {}; // array storing the loaded shader programs
	
// webgl
variables.webgl = {};
variables.webgl.needsRedraw = false; // flag indicating the scene needs redrawing, only drawing the scene 
variables.webgl.needsRedrawCount = 10; // draw every 10th animation tick even if no interaction happened

variables.webgl.mvMatrix = mat4.create(); // model view matrix
mat4.identity( variables.webgl.mvMatrix );
variables.webgl.mvMatrixInvert = mat4.create(); // model view matrix
mat4.identity( variables.webgl.mvMatrixInvert );
variables.webgl.pMatrix = mat4.create(); // projection matrix


//***************************************************************************************************
//
//	init and loading of all the elements
//
//***************************************************************************************************/
function init(opts, callback) {
	variables.config = opts.config;
	
	gl = mygl.gl();
	shaders = mygl.shaderPrograms();
	
	if ('backgroundColor' in opts) {
		variables.backgroundColor = opts.backgroundColor;
		gl.clearColor(variables.backgroundColor[0], variables.backgroundColor[1], variables.backgroundColor[2], 0.0);
	} else {
		gl.clearColor(0.0, 0.0, 0.0, 0.0);
	}
	
	resetView();

	callback();

	tick();
}

function tick() {
	requestAnimFrame(tick);
	drawScene();
}

//***************************************************************************************************
//
// main functions that actually draw the entire scene
//
//***************************************************************************************************/
function drawScene() {
	if ( !scene.getValue( 'loadingComplete' ) ) return;
	
	gl.viewport(0, 0, mygl.viewportWidth(), mygl.viewportHeight());
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	var ratio = mygl.viewportWidth() / mygl.viewportHeight();

	if ( ratio >= 1.0 ) {
		mat4.ortho( -100*ratio, 100 * ratio, -100, 100, -500, 500, variables.webgl.pMatrix );	
	}
	else {
		mat4.ortho( -100, 100, -100/ ratio, 100 / ratio, -500, 500, variables.webgl.pMatrix );
	}

	variables.webgl.mvMatrix.set( arcball.get() );
	
	mat4.set( variables.webgl.mvMatrix, variables.webgl.mvMatrixInvert );
	mat4.inverse( variables.webgl.mvMatrixInvert );
		

	gl.enable(gl.DEPTH_TEST);
	
    //***************************************************************************************************
    //
    // draw
    //
    //***************************************************************************************************/

	draw();
	
	//variables.webgl.minorMode = 4;
	//drawSlices();
}
//***************************************************************************************************
//
// function that does all the render calls for transparency
//
//***************************************************************************************************/
function draw() {
	var meshes = io.meshes();
	var fibres = io.fibres();
	
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
    gl.clearDepth(1);
    
    var peels = mygl.peels();
    var peelFramebuffer = mygl.peelFramebuffer();
    //***************************************************************************************************
    //
    // Pass 1 - draw opaque objects
    //
    //***************************************************************************************************/
	variables.webgl.minorMode = 4;
	// set render target to C0
	gl.bindFramebuffer( gl.FRAMEBUFFER, peelFramebuffer );
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, peels['C0'], 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if ( scene.getValue( 'showSlices' ) ) {
		drawSlices();
	}
	$.each(meshes, function() {
		if ( this.type === "mesh" && ( this.display || this.display2 ) && this.transparency == 1.0 ) {
			drawMesh(this);
		}
	});
	
	$.each(meshes, function() {
		if ( this.type === "texmesh" && ( this.display || this.display2 ) && this.transparency == 1.0 ) {
			drawTexMesh(this);
		}
	});
	
	$.each(fibres, function() {
		if (( this.display || this.display2 ) && this.transparency == 1.0 ) {
			drawFibers(this);
		}
	});
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	variables.webgl.minorMode = 5;
	// set render target to D0
	gl.bindFramebuffer( gl.FRAMEBUFFER, peelFramebuffer );
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, peels['D0'], 0);
    gl.clearColor(variables.backgroundColor[0], variables.backgroundColor[1], variables.backgroundColor[2], 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
	if ( scene.getValue( 'showSlices' ) ) {
		drawSlices();
	}
	
	$.each(meshes, function() {
		if ( this.type === "mesh" && ( this.display || this.display2 ) && this.transparency == 1.0 ) {
			drawMeshTransp(this);
		}
	});
	
	$.each(meshes, function() {
		if ( this.type === "texmesh" && ( this.display || this.display2 ) && this.transparency == 1.0 ) {
			drawTexMeshTransp(this);
		}
	});
	
	$.each(fibres, function() {
		if (( this.display || this.display2 ) && this.transparency == 1.0 ) {
			drawFibersTransp(this);
		}
	});
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	
	//***************************************************************************************************
    //
    // Pass 2
    //
    //***************************************************************************************************/
	variables.webgl.minorMode = 9;
	// set render target to C1
	gl.bindFramebuffer( gl.FRAMEBUFFER, peelFramebuffer );
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, peels['C1'], 0);
    gl.clearColor(variables.backgroundColor[0], variables.backgroundColor[1], variables.backgroundColor[2], 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	$.each(meshes, function() {
		if ( this.type === "mesh" && ( this.display || this.display2 ) && this.transparency < 1.0 ) {
			drawMesh(this);
		}
	});

	$.each(fibres, function() {
		if (( this.display || this.display2 ) && this.transparency < 1.0 ) {
			drawFibers(this);
		}
	});
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	
	variables.webgl.minorMode = 6;
	// set render target to D1
	gl.bindFramebuffer( gl.FRAMEBUFFER, peelFramebuffer );
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, peels['D1'], 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	$.each(meshes, function() {
		if ( this.type === "mesh" && ( this.display || this.display2 ) && this.transparency < 1.0 ) {
			drawMeshTransp(this);
		}
	});
	$.each(fibres, function() {
		if (( this.display || this.display2 ) && this.transparency < 1.0 ) {
			drawFibersTransp(this);
		}
	});
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	
	//***************************************************************************************************
    //
    // Pass 3
    //
    //***************************************************************************************************/
	variables.webgl.minorMode = 10;
	// set render target to C2
	gl.bindFramebuffer( gl.FRAMEBUFFER, peelFramebuffer );
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, peels['C2'], 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	$.each(meshes, function() {
		if ( this.type === "mesh" && ( this.display || this.display2 ) && this.transparency < 1.0 ) {
			drawMesh(this);
		}
	});
	
	$.each(fibres, function() {
		if (( this.display || this.display2 ) && this.transparency < 1.0 ) {
			drawFibers(this);
		}
	});
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	
	variables.webgl.minorMode = 7;
	// set render target to D2
	gl.bindFramebuffer( gl.FRAMEBUFFER, peelFramebuffer );
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, peels['D2'], 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	$.each(meshes, function() {
		if ( this.type === "mesh" && ( this.display || this.display2 ) && this.transparency < 1.0 ) {
			drawMeshTransp(this);
		}
	});
	$.each(fibres, function() {
		if (( this.display || this.display2 ) && this.transparency < 1.0 ) {
			drawFibersTransp(this);
		}
	});
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	
	//***************************************************************************************************
    //
    // Pass 4
    //
    //***************************************************************************************************/
	variables.webgl.minorMode = 11;
	// set render target to C3
	gl.bindFramebuffer( gl.FRAMEBUFFER, peelFramebuffer );
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, peels['C3'], 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	$.each(meshes, function() {
		if ( this.type === "mesh" && ( this.display || this.display2 ) && this.transparency < 1.0 ) {
			drawMesh(this);
		}
	});
	
	
	$.each(fibres, function() {
		if (( this.display || this.display2 ) && this.transparency < 1.0 ) {
			drawFibers(this);
		}
	});
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	
	variables.webgl.minorMode = 8;
	// set render target to D1b
	gl.bindFramebuffer( gl.FRAMEBUFFER, peelFramebuffer );
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, peels['D1'], 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	$.each(meshes, function() {
		if ( this.type === "mesh" && ( this.display || this.display2 ) && this.transparency < 1.0 ) {
			drawMeshTransp(this);
		}
	});
	$.each(fibres, function() {
		if (( this.display || this.display2 ) && this.transparency < 1.0 ) {
			drawFibersTransp(this);
		}
	});
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	
	//***************************************************************************************************
    //
    // Pass 5
    //
    //***************************************************************************************************/
	variables.webgl.minorMode = 12;
	// set render target to C3
	gl.bindFramebuffer( gl.FRAMEBUFFER, peelFramebuffer );
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, peels['D2'], 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	$.each(meshes, function() {
		if ( this.type === "mesh" && ( this.display || this.display2 ) && this.transparency < 1.0 ) {
			drawMesh(this);
		}
	});
	$.each(fibres, function() {
		if (( this.display || this.display2 ) && this.transparency < 1.0 ) {
			drawFibers(this);
		}
	});
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	
	
	//***************************************************************************************************
    //
    // Pass 6 - merge previous results and render on quad
    //
    //***************************************************************************************************/	
	gl.useProgram(shaders['merge']);
	gl.enableVertexAttribArray(shaders['merge'].aVertexPosition);
	
	var posBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
	
	var vertices = [ -gl.viewportWidth,  -10,   0, 
	                  gl.viewportWidth,  -10, 0,
	                  gl.viewportWidth,  gl.viewportHeight, 0,
	                 -gl.viewportWidth0, gl.viewportHeight, 0 ];
	
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	gl.vertexAttribPointer(shaders['merge'].aVertexPosition, 3, gl.FLOAT, false, 0, 0);
	gl.uniform2f(shaders['merge'].uCanvasSize, gl.viewportWidth, gl.viewportHeight);
	
	gl.activeTexture( gl.TEXTURE2 );
	gl.bindTexture( gl.TEXTURE_2D, peels['C0'] );
	gl.uniform1i(shaders['merge'].C0, 2);
	
	gl.activeTexture( gl.TEXTURE6 );
	gl.bindTexture( gl.TEXTURE_2D, peels['C1'] );
	gl.uniform1i(shaders['merge'].C1, 6);
	
	gl.activeTexture( gl.TEXTURE7 );
	gl.bindTexture( gl.TEXTURE_2D, peels['C2'] );
	gl.uniform1i(shaders['merge'].C2, 7);
	
	gl.activeTexture( gl.TEXTURE8 );
	gl.bindTexture( gl.TEXTURE_2D, peels['C3'] );
	gl.uniform1i(shaders['merge'].C3, 8);
	
	gl.activeTexture( gl.TEXTURE5 );
	gl.bindTexture( gl.TEXTURE_2D, peels['D2'] );
	gl.uniform1i(shaders['merge'].D2, 5);
	
	var vertexIndexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer);
	var vertexIndices = [ 0, 1, 2, 0, 2, 3 ];
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndices), gl.STATIC_DRAW);

	gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
}



//***************************************************************************************************
//
// draw routines for all available elements
//
//***************************************************************************************************/
function drawSlices() {
	gl.useProgram(shaders['slice']);
	gl.enableVertexAttribArray(shaders['slice'].aVertexPosition);
	gl.enableVertexAttribArray(shaders['slice'].aTextureCoord);

	// initialize the secondary texture with an empty one
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, null);
	gl.uniform1i(shaders['slice'].uSampler1, 1);
	gl.uniform1i(shaders['slice'].uColorMap,0);
	gl.uniform1f(shaders['slice'].uMin, 0);
	gl.uniform1f(shaders['slice'].uMax, 0);
	gl.uniform1f(shaders['slice'].uThreshold1, 0);
	gl.uniform1f(shaders['slice'].uThreshold2, 0);
	
	var axialPosBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, axialPosBuffer);
	var ap = scene.ival( 'axial' ) + 0.5;
	var vertices = [ 0,   0,   ap, 0.0, 0.0, 
	                 256, 0.5, ap, 1.0, 0.0,
	                 256, 256, ap, 1.0, 1.0,
	                 0,   256, ap, 0.0, 1.0 ];
	
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

	gl.vertexAttribPointer(shaders['slice'].aVertexPosition, 3, gl.FLOAT, false, 20, 0);
	gl.vertexAttribPointer(shaders['slice'].aTextureCoord, 2, gl.FLOAT, false, 20, 12);
	
	var axialVertexIndexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, axialVertexIndexBuffer);
	var vertexIndices = [ 0, 1, 2, 0, 2, 3 ];
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndices), gl.STATIC_DRAW);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, io.getTexture(scene.getValue( 'tex1' ), 'axial', scene.ival( 'axial' )));
	gl.uniform1i(shaders['slice'].uSampler, 0);
	gl.uniform1i(shaders['slice'].uMinorMode, variables.webgl.minorMode );

	if ( scene.getValue( 'tex2' ) != 'none' ) {
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, io.getTexture(scene.getValue( 'tex2' ), 'axial', scene.ival( 'axial' )));
		gl.uniform1i(shaders['slice'].uSampler1, 1);
		gl.uniform1i(shaders['slice'].uColorMap,scene.ival( 'colormap' ));
		gl.uniform1f(shaders['slice'].uMin, io.niftiis()[scene.getValue( 'tex2' )].getMin() );
		gl.uniform1f(shaders['slice'].uMax, io.niftiis()[scene.getValue( 'tex2' )].getMax() );
		gl.uniform1f(shaders['slice'].uThreshold1, scene.fval( 'threshold1' ));
		gl.uniform1f(shaders['slice'].uThreshold2, scene.fval( 'threshold2' ));
		gl.uniform1f(shaders['slice'].uAlpha2, scene.fval( 'alpha2' ));
	}

	gl.uniformMatrix4fv(shaders['slice'].uPMatrix, false, variables.webgl.pMatrix);
	gl.uniformMatrix4fv(shaders['slice'].uMVMatrix, false, variables.webgl.mvMatrix);

	gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);


	var coronalPosBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, coronalPosBuffer);
	var cp = scene.ival( 'coronal' ) + 0.5;
	var vertices = [ 0,   cp, 0,   0.0, 0.0,
	                 256, cp, 0,   1.0, 0.0,
	                 256, cp, 256, 1.0, 1.0,
	                 0,   cp, 256, 0.0, 1.0];
	
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	
	gl.vertexAttribPointer(shaders['slice'].aVertexPosition, 3, gl.FLOAT, false, 20, 0);
	gl.vertexAttribPointer(shaders['slice'].aTextureCoord, 2, gl.FLOAT, false, 20, 12);

	var coronalVertexIndexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, coronalVertexIndexBuffer);
	var vertexIndices = [ 0, 1, 2, 0, 2, 3 ];
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndices), gl.STATIC_DRAW);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, io.getTexture(scene.getValue( 'tex1' ), 'coronal', scene.ival( 'coronal' )));
	gl.uniform1i(shaders['slice'].sampler, 0);

	if (scene.getValue( 'tex2' ) != 'none') {
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, io.getTexture(scene.getValue( 'tex2' ), 'coronal', scene.ival( 'coronal' )));
		gl.uniform1i(shaders['slice'].uSampler1, 1);
	}

	gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

	
	var sagittalPosBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, sagittalPosBuffer);
	var sp = scene.ival( 'sagittal' ) + 0.5;
	var vertices = [ sp, 0,   0,   0.0, 0.0,
	                 sp, 0,   256, 0.0, 1.0,
	                 sp, 256, 256, 1.0, 1.0,
	                 sp, 256, 0,   1.0, 0.0 ];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

	gl.vertexAttribPointer(shaders['slice'].aVertexPosition, 3, gl.FLOAT, false, 20, 0);
	gl.vertexAttribPointer(shaders['slice'].aTextureCoord, 2, gl.FLOAT, false, 20, 12);

	var sagittalVertexIndexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sagittalVertexIndexBuffer);
	var vertexIndices = [ 0, 1, 2, 0, 2, 3 ];
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndices), gl.STATIC_DRAW);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, io.getTexture(scene.getValue( 'tex1' ), 'sagittal', scene.ival( 'sagittal' )));
	gl.uniform1i(shaders['slice'].sampler, 0);

	if (scene.getValue( 'tex2' ) != 'none') {
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, io.getTexture(scene.getValue( 'tex2' ), 'sagittal', scene.ival( 'sagittal' )));
		gl.uniform1i(shaders['slice'].uSampler1, 1);
	}

	gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);


	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
}

function setPeelUniforms( shader ) {
	gl.uniform2f(shaders[shader].uCanvasSize, gl.viewportWidth, gl.viewportHeight);
	gl.uniform1i(shaders[shader].uMinorMode, variables.webgl.minorMode );
	gl.activeTexture( gl.TEXTURE3 );
	gl.bindTexture( gl.TEXTURE_2D, mygl.peels()['D0'] );
	gl.uniform1i(shaders[shader].D0, 3);
	gl.activeTexture( gl.TEXTURE4 );
	gl.bindTexture( gl.TEXTURE_2D, mygl.peels()['D1'] );
	gl.uniform1i(shaders[shader].D1, 4);
	gl.activeTexture( gl.TEXTURE5 );
	gl.bindTexture( gl.TEXTURE_2D, mygl.peels()['D2'] );
	gl.uniform1i(shaders[shader].D2, 5);
}


function setMeshUniforms() {
	gl.useProgram(shaders['mesh']);
	gl.uniformMatrix4fv(shaders['mesh'].uPMatrix, false, variables.webgl.pMatrix);
	gl.uniformMatrix4fv(shaders['mesh'].uMVMatrix, false, variables.webgl.mvMatrix);
	gl.uniformMatrix4fv(shaders['mesh'].uMVMatrixInvert, false, variables.webgl.mvMatrixInvert );
	gl.uniform1f(shaders['mesh'].uAlpha, 1.0);
}

function setTexMeshUniforms() {
	gl.useProgram(shaders['texmesh']);
	gl.uniformMatrix4fv(shaders['texmesh'].uPMatrix, false, variables.webgl.pMatrix);
	gl.uniformMatrix4fv(shaders['texmesh'].uMVMatrix, false, variables.webgl.mvMatrix);
	gl.uniformMatrix4fv(shaders['texmesh'].uMVMatrixInvert, false, variables.webgl.mvMatrixInvert );
	gl.uniform1f(shaders['texmesh'].uAlpha, 1.0);
}


function drawMesh(elem) {
	if (!elem || !elem.indices )
		return;

	setMeshUniforms();
	gl.enableVertexAttribArray(shaders['mesh'].aVertexPosition);
	gl.enableVertexAttribArray(shaders['mesh'].aVertexNormal);
	gl.enableVertexAttribArray(shaders['mesh'].aVertexColor);
		
	if ( !elem.hasBuffer ) {
		bindMeshBuffers(elem);
	}
	
	gl.bindBuffer(gl.ARRAY_BUFFER, elem.vertexPositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, elem.vertexPositionBuffer.data, gl.STATIC_DRAW);
	
	gl.vertexAttribPointer(shaders['mesh'].aVertexPosition, 3, gl.FLOAT, false, 36, 0);
	gl.vertexAttribPointer(shaders['mesh'].aVertexNormal, 3, gl.FLOAT, false, 36, 12);
	gl.vertexAttribPointer(shaders['mesh'].aVertexColor, 3, gl.FLOAT, false, 36, 24);
	
	setPeelUniforms( 'mesh' );
	gl.uniform1f(shaders['mesh'].uAlpha, elem.transparency);
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elem.vertexIndexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, elem.vertexIndexBuffer.data, gl.STATIC_DRAW);

	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);
	gl.cullFace( gl.BACK );
	gl.frontFace( gl.CW );

	gl.drawElements(gl.TRIANGLES, elem.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	gl.disable(gl.CULL_FACE);
}

function drawMeshTransp(elem) {
	if (!elem || !elem.indices )
		return;

	gl.useProgram(shaders['mesh_transp']);
	gl.enableVertexAttribArray(shaders['mesh_transp'].aVertexPosition);
	gl.uniformMatrix4fv(shaders['mesh_transp'].uPMatrix, false, variables.webgl.pMatrix);
	gl.uniformMatrix4fv(shaders['mesh_transp'].uMVMatrix, false, variables.webgl.mvMatrix);
	
	setPeelUniforms( 'mesh_transp' );
	gl.uniform1f(shaders['mesh_transp'].uAlpha, elem.transparency);
	
	if ( !elem.hasBuffer ) {
		bindMeshBuffers(elem);
	}
	
	gl.bindBuffer(gl.ARRAY_BUFFER, elem.vertexPositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, elem.vertexPositionBuffer.data, gl.STATIC_DRAW);
	
	gl.vertexAttribPointer(shaders['mesh_transp'].aVertexPosition, 3, gl.FLOAT, false, 36, 0);
	

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elem.vertexIndexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, elem.vertexIndexBuffer.data, gl.STATIC_DRAW);

	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);
	gl.cullFace( gl.BACK );
	gl.frontFace( gl.CW );

	gl.drawElements(gl.TRIANGLES, elem.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	gl.disable(gl.CULL_FACE);
}

function handleTextureLoaded(image, texture, elem ) {
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
	gl.generateMipmap(gl.TEXTURE_2D);
	gl.bindTexture(gl.TEXTURE_2D, null);
	
	elem.texture = texture;
	
	console.log( "max tex units: " + gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS ) );
}

function drawTexMesh(elem) {
	if ( !elem || !elem.indices )
		return;

	setTexMeshUniforms();
	gl.enableVertexAttribArray(shaders['texmesh'].aVertexPosition);
	gl.enableVertexAttribArray(shaders['texmesh'].aVertexNormal);
	gl.enableVertexAttribArray(shaders['texmesh'].aTextureCoord);
		
	if ( !elem.hasBuffer ) {
		bindMeshBuffers(elem);
	}
	
	if ( !elem.texture )
	{
		meshTexture = gl.createTexture();
		texImage = new Image();
		texImage.onload = function() { handleTextureLoaded(texImage, meshTexture, elem); };
		console.log( settings.DATA_URL + elem.texurl );
		texImage.src = settings.DATA_URL + elem.texurl;
	}
	else
	{
		gl.activeTexture( gl.TEXTURE1 );
		gl.bindTexture(gl.TEXTURE_2D, elem.texture );
		gl.uniform1i(shaders['texmesh'].uSampler1, 1);
	}
	
	gl.bindBuffer(gl.ARRAY_BUFFER, elem.vertexPositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, elem.vertexPositionBuffer.data, gl.STATIC_DRAW);
	
	gl.vertexAttribPointer(shaders['texmesh'].aVertexPosition, 3, gl.FLOAT, false, 32, 0);
	gl.vertexAttribPointer(shaders['texmesh'].aVertexNormal, 3, gl.FLOAT, false, 32, 12);
	gl.vertexAttribPointer(shaders['texmesh'].aTextureCoord, 2, gl.FLOAT, false, 32, 24);
	
	setPeelUniforms( 'texmesh' );
	gl.uniform1f(shaders['texmesh'].uAlpha, 1.0);
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elem.vertexIndexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, elem.vertexIndexBuffer.data, gl.STATIC_DRAW);

	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);
	gl.cullFace( gl.BACK );
	gl.frontFace( gl.CW );

	gl.drawElements(gl.TRIANGLES, elem.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	gl.disable(gl.CULL_FACE);
}

function drawTexMeshTransp(elem) {
	if ( !elem || !elem.indices )
		return;
	
	gl.useProgram(shaders['texmesh_transp']);
	gl.enableVertexAttribArray(shaders['texmesh_transp'].aVertexPosition);
	gl.uniformMatrix4fv(shaders['texmesh_transp'].uPMatrix, false, variables.webgl.pMatrix);
	gl.uniformMatrix4fv(shaders['texmesh_transp'].uMVMatrix, false, variables.webgl.mvMatrix);
	
	setPeelUniforms( 'texmesh_transp' );
	gl.uniform1f(shaders['texmesh_transp'].uAlpha, 1.0 );

	gl.enableVertexAttribArray(shaders['texmesh_transp'].aVertexPosition);
		
	if ( !elem.hasBuffer ) {
		bindMeshBuffers(elem);
	}
	
	if ( !elem.texture )
	{
		return;
	}
	else
	{
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, elem.texture );
		gl.uniform1i(shaders['texmesh_transp'].uSampler1, 1);
	}
	
	gl.bindBuffer(gl.ARRAY_BUFFER, elem.vertexPositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, elem.vertexPositionBuffer.data, gl.STATIC_DRAW);
	
	gl.vertexAttribPointer(shaders['texmesh_transp'].aVertexPosition, 3, gl.FLOAT, false, 32, 0);
	
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elem.vertexIndexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, elem.vertexIndexBuffer.data, gl.STATIC_DRAW);

	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);
	gl.cullFace( gl.BACK );
	gl.frontFace( gl.CW );

	gl.drawElements(gl.TRIANGLES, elem.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	gl.disable(gl.CULL_FACE);
}

function bindMeshBuffers(elem) {
	var vertexPositionBuffer = gl.createBuffer();
	vertexPositionBuffer.data = new Float32Array(elem.vertices);
	
	var vertexIndexBuffer = gl.createBuffer();
	vertexIndexBuffer.data = new Uint16Array(elem.indices);
	vertexIndexBuffer.itemSize = 1;
	vertexIndexBuffer.numItems = elem.indices.length;

	elem.vertexPositionBuffer = vertexPositionBuffer;
	elem.vertexIndexBuffer    = vertexIndexBuffer;
	elem.hasBuffer = true;
}

function setFibreLineUniforms() {
	gl.useProgram(shaders['fibre_l']);
	gl.uniformMatrix4fv(shaders['fibre_l'].uPMatrix, false, variables.webgl.pMatrix);
	gl.uniformMatrix4fv(shaders['fibre_l'].uMVMatrix, false, variables.webgl.mvMatrix);
	gl.uniformMatrix4fv(shaders['fibre_l'].uMVMatrixInvert, false, variables.webgl.mvMatrixInvert );
	gl.uniform1f(shaders['fibre_l'].uAlpha, 1.0);
	//gl.uniform3f(shaders['fibre_l'].uLightLocation, variables.webgl.lightPos[0], variables.webgl.lightPos[1], variables.webgl.lightPos[2]);
}


function setFiberTubeUniforms() {
	gl.useProgram(shaders['fibre_t']);
	gl.uniformMatrix4fv(shaders['fibre_t'].uPMatrix, false, variables.webgl.pMatrix);
	gl.uniformMatrix4fv(shaders['fibre_t'].uMVMatrix, false, variables.webgl.mvMatrix);
	gl.uniform1f(shaders['fibre_t'].uZoom, scene.fval('zoom'));
	gl.uniform1i(shaders['fibre_t'].uFibreColorMode, scene.getValue('localFibreColor'));
}

function drawFibers(elem) {

	if ( !elem.hasBuffer ) {
		bindFibreBuffers(elem);
	}
	
	if ( elem.allowTube && scene.getValue('renderTubes') ) {
		setFiberTubeUniforms();
		gl.enableVertexAttribArray(shaders['fibre_t'].aVertexPosition);
		gl.enableVertexAttribArray(shaders['fibre_t'].aTextureCoord);
		gl.enableVertexAttribArray(shaders['fibre_t'].aVertexNormal);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, elem.vertexPositionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, elem.vertexPositionBuffer.data, gl.STATIC_DRAW);
		
		gl.vertexAttribPointer(shaders['fibre_t'].aVertexPosition, 3, gl.FLOAT, false, 32, 0);
		gl.vertexAttribPointer(shaders['fibre_t'].aVertexNormal, 3, gl.FLOAT, false, 32, 12);
		gl.vertexAttribPointer(shaders['fibre_t'].aTextureCoord, 2, gl.FLOAT, false, 32, 24);
	
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elem.vertexIndexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, elem.vertexIndexBuffer.data, gl.STATIC_DRAW);

		gl.uniform3f(shaders['fibre_t'].uFibreColor, elem.color.r, elem.color.g, elem.color.b);
		gl.uniform1f(shaders['fibre_t'].uThickness, 0.6);
		
		setPeelUniforms( 'fibre_t' );

		gl.uniform1f(shaders['fibre_t'].uAlpha, elem.transparency);
		gl.uniform1i(shaders['fibre_t'].uFibreColorMode, elem.savedColor );
		
		for ( var i = 0; i < elem.indices.length; ++i) {
			gl.drawArrays(gl.TRIANGLE_STRIP, elem.lineStarts[i]*2, elem.indices[i] * 2);
		}
			
	}
	else {
		setFibreLineUniforms();
		gl.enableVertexAttribArray(shaders['fibre_l'].aVertexPosition);
		gl.enableVertexAttribArray(shaders['fibre_l'].aVertexNormal);
		//gl.enableVertexAttribArray(shaders['fibre_l'].aVertexColor);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, elem.vertexPositionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, elem.vertexPositionBuffer.data, gl.STATIC_DRAW);
		
		gl.vertexAttribPointer(shaders['fibre_l'].aVertexPosition, 3, gl.FLOAT, false, 64, 0);
		gl.vertexAttribPointer(shaders['fibre_l'].aVertexNormal, 3, gl.FLOAT, false, 64, 12);
		//gl.vertexAttribPointer(shaders['fibre_l'].aVertexColor, 4, gl.FLOAT, false, 64, 24);
		
		gl.uniform3f(shaders['fibre_l'].uFibreColor, elem.color.r, elem.color.g, elem.color.b);
		gl.uniform1f(shaders['fibre_l'].uAlpha, elem.transparency);
		gl.uniform1i(shaders['fibre_l'].uFibreColorMode, elem.savedColor );
		
		setPeelUniforms( 'fibre_l' );
		
		for ( var i = 0; i < elem.indices.length; ++i) {
			gl.drawArrays(gl.LINE_STRIP, elem.lineStarts[i], elem.indices[i]);
		}
	}
					
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
}

function drawFibersTransp(elem) {

	if ( !elem.hasBuffer ) {
		bindFibreBuffers(elem);
	}
	
	if ( scene.getValue('renderTubes') ) {
		gl.useProgram(shaders['fibre_t_transp']);
		gl.uniformMatrix4fv(shaders['fibre_t_transp'].uPMatrix, false, variables.webgl.pMatrix);
		gl.uniformMatrix4fv(shaders['fibre_t_transp'].uMVMatrix, false, variables.webgl.mvMatrix);
		gl.uniform1f(shaders['fibre_t_transp'].uZoom, scene.fval('zoom'));
		gl.uniform1i(shaders['fibre_t_transp'].uFibreColorMode, elem.savedColor );
		
		gl.enableVertexAttribArray(shaders['fibre_t_transp'].aVertexPosition);
		gl.enableVertexAttribArray(shaders['fibre_t_transp'].aTextureCoord);
		gl.enableVertexAttribArray(shaders['fibre_t_transp'].aVertexNormal);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, elem.vertexPositionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, elem.vertexPositionBuffer.data, gl.STATIC_DRAW);
		
		gl.vertexAttribPointer(shaders['fibre_t_transp'].aVertexPosition, 3, gl.FLOAT, false, 32, 0);
		gl.vertexAttribPointer(shaders['fibre_t_transp'].aVertexNormal, 3, gl.FLOAT, false, 32, 12);
		gl.vertexAttribPointer(shaders['fibre_t_transp'].aTextureCoord, 2, gl.FLOAT, false, 32, 24);
	
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elem.vertexIndexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, elem.vertexIndexBuffer.data, gl.STATIC_DRAW);

		gl.uniform3f(shaders['fibre_t_transp'].uFibreColor, elem.color.r, elem.color.g, elem.color.b);
		gl.uniform1f(shaders['fibre_t_transp'].uThickness, 0.6);

		gl.uniform1f(shaders['fibre_t_transp'].uAlpha, elem.transparency);
		
		setPeelUniforms( 'fibre_t_transp' );
		
		for ( var i = 0; i < elem.indices.length; ++i) {
			gl.drawArrays(gl.TRIANGLE_STRIP, elem.lineStarts[i]*2, elem.indices[i] * 2);
		}
			
	}
	else {
		gl.useProgram(shaders['fibre_l_transp']);
		gl.uniformMatrix4fv(shaders['fibre_l_transp'].uPMatrix, false, variables.webgl.pMatrix);
		gl.uniformMatrix4fv(shaders['fibre_l_transp'].uMVMatrix, false, variables.webgl.mvMatrix);
		gl.uniform1f(shaders['fibre_l_transp'].uAlpha, 1.0);
		gl.uniform3f(shaders['fibre_l_transp'].uLightLocation, variables.webgl.lightPos[0], variables.webgl.lightPos[1], variables.webgl.lightPos[2]);
		gl.uniform1i(shaders['fibre_l_transp'].uFibreColorMode, elem.savedColor );
		
		gl.enableVertexAttribArray(shaders['fibre_l'].aVertexPosition);
		gl.enableVertexAttribArray(shaders['fibre_l'].aVertexNormal);
		//gl.enableVertexAttribArray(shaders['fibre_l'].aVertexColor);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, elem.vertexPositionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, elem.vertexPositionBuffer.data, gl.STATIC_DRAW);
		
		gl.vertexAttribPointer(shaders['fibre_l'].aVertexPosition, 3, gl.FLOAT, false, 64, 0);
		gl.vertexAttribPointer(shaders['fibre_l'].aVertexNormal, 3, gl.FLOAT, false, 64, 12);
		//gl.vertexAttribPointer(shaders['fibre_l'].aVertexColor, 4, gl.FLOAT, false, 64, 24);
		
		gl.uniform3f(shaders['fibre_l_transp'].uFibreColor, elem.color.r, elem.color.g, elem.color.b);
		gl.uniform1f(shaders['fibre_l_transp'].uAlpha, elem.transparency);
		
		setPeelUniforms( 'fibre_l_transp' );
		
		for ( var i = 0; i < elem.indices.length; ++i) {
			gl.drawArrays(gl.LINE_STRIP, elem.lineStarts[i], elem.indices[i]);
		}
	}
					
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
}

function bindFibreBuffers(elem) {
	var vertexPositionBuffer = gl.createBuffer();
	vertexPositionBuffer.data = new Float32Array(elem.tubeVertices);
	
	var vertexIndexBuffer = gl.createBuffer();
	vertexIndexBuffer.data = new Uint16Array(elem.indices);
	vertexIndexBuffer.itemSize = 1;
	vertexIndexBuffer.numItems = elem.indices.length;

	elem.vertexPositionBuffer = vertexPositionBuffer;
	elem.vertexIndexBuffer    = vertexIndexBuffer;
	elem.hasBuffer = true;
} 
//***************************************************************************************************
//
// helper functions
//
//***************************************************************************************************/
function resetView() {
	arcball.reset();
	arcball.setViewportDims( mygl.viewportWidth(), mygl.viewportHeight() );
	arcball.setZoom( 1.0 );
}


//***************************************************************************************************
//
// public functions, getters and setters
//
//***************************************************************************************************/
return {
	'init' : init,
	'resetView' : resetView
};
}));

