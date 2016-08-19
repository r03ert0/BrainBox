define( ['./gfx/glMatrix-0.9.5.min'], (function() {

// some variables from the dataset we use
// these must be changed if another dataset is used for correct coordinate transformation
var extentx = 128.0;
var extenty = 175.0;
var extentz = 121.0;
var cax = 80.4783;
var cay = 81.7334;
var caz = 89.9905;
var voxelx = 1.0;
var voxely = 1.0;
var voxelz = 1.0;

var views = {};
views[0] = new Array( 1.57, -1.57, 0 ); // left
views[1] = new Array( 1.57, 1.57, 0 ); // right
views[2] = new Array( 3.14, 0, 3.14 ); // inferior
views[3] = new Array( 0, 0, 0 ); // superior
views[4] = new Array( -1.57, 0, 3.14 ); // anterior
views[5] = new Array( 1.57, 0, 0 ); // posterior


function tal2pixel(x, y, z) {
	xscale = 135.0 / extentx;
	yscale = 175.0 / extenty;
	zscale = 118.0 / extentz;

	var returnCoord = new Array(3);
	
	returnCoord[0] = x / xscale + cax;
	returnCoord[1] = 200 - (cay - y / yscale);
	returnCoord[2] = 160 - (caz - z / zscale);
	
	returnCoord[0] /= voxelx;
	returnCoord[1] /= voxely;
	returnCoord[2] /= voxelz;
	
	returnCoord[0] = Math.round( returnCoord[0] * 100) / 100;
	returnCoord[1] = Math.round( returnCoord[1] * 100) / 100;
	returnCoord[2] = Math.round( returnCoord[2] * 100) / 100;
	
	return returnCoord;
}

function pixel2tal(x, y, z) 
{
	xscale = 135.0 / extentx;
	yscale = 175.0 / extenty;
	zscale = 118.0 / extentz;

	var returnCoord = new Array(3);
	
	returnCoord[0] = Math.round((( x * voxelx ) - cax ) * xscale);
	returnCoord[1] = Math.round(((200 - y * voxely ) - cay ) * (-1.0 * yscale));
	returnCoord[2] = Math.round(((160 - z * voxelz ) - caz ) * (-1.0 * zscale));
	
	return returnCoord;
}

function createSphere( rad, x_, y_, z_, color )
{
	var sphere = {};
	var vertices = [];
	var normals = [];
	sphere.indices = [];
	var colors = [];
	
	var nlat = 20,
	   nlong = 20,
	   radius = rad,
	   startLat = 0,
	   endLat = 3.14159265,
	   latRange = endLat - startLat,
	   startLong = 0,
	   endLong = 2 * 3.14159265,
	   longRange = endLong - startLong;
	   //numVertices = (nlat + 1) * (nlong + 1);

	if (typeof radius == 'number') 
	{
		var value = radius;
		radius = function(n1, n2, n3, u, v) 
		{
			return value;
		};
	}

	//Create vertices, normals and texCoords
	for (var y = 0; y <= nlong; y++) 
	{
		for (var x = 0; x <= nlat; x++) 
		{
			var u = x / nlat,
				v = y / nlong,
				theta = longRange * u,
				phi = latRange * v,
				sinTheta = Math.sin(theta),
				cosTheta = Math.cos(theta),
				sinPhi = Math.sin(phi),
				cosPhi = Math.cos(phi),
				ux = cosTheta * sinPhi,
				uy = cosPhi,
				uz = sinTheta * sinPhi,
				r = radius(ux, uy, uz, u, v);

				vertices.push(r * ux, r * uy, r * uz);
				normals.push(-ux, -uy, -uz);
				//texCoords.push(u, v);
		}
	}
	//Create indices
	var numVertsAround = nlat + 1;
	for (x = 0; x < nlat; x++) 
	{
		for (y = 0; y < nlong; y++) 
		{
			sphere.indices.push( y * numVertsAround + x,
						 		(y + 1) * numVertsAround + x,
						 		 y * numVertsAround + x + 1);

			sphere.indices.push((y + 1) * numVertsAround + x,
						 (y + 1) * numVertsAround + x + 1,
						 y * numVertsAround + x + 1);
		}
	}
	for (x = 0; x < ( vertices.length / 3);++x)
	{
		colors.push(color.r);
		colors.push(color.g);
		colors.push(color.b);
		colors.push(1);
	}
	
	sphere.vertices = [];
	for ( var i = 0; i < vertices.length /3; ++i ) {
		sphere.vertices.push( vertices[ i * 3 ] + x_ );
		sphere.vertices.push( vertices[ i * 3 + 1 ] + y_ );
		sphere.vertices.push( vertices[ i * 3 + 2 ] + z_);
		sphere.vertices.push( normals[ i * 3 ] );
		sphere.vertices.push( normals[ i * 3 + 1 ] );
		sphere.vertices.push( normals[ i * 3 + 2 ] );
		sphere.vertices.push( colors[ i * 4 ]);
		sphere.vertices.push( colors[ i * 4 + 1 ]);
		sphere.vertices.push( colors[ i * 4 + 2 ]);
	}
	
	return sphere;
}

function addSphere( id, name, x, y, z, size, r, g, b, a )
{
        newActiv = createSphere( size, x, y, z, {"r": r, "g": g, "b": b} );
        newActiv.name = name;
        newActiv.type = 'mesh';
        newActiv.display = true;
        newActiv.id = id;
        newActiv.hasBuffer = false;
        newActiv.fromJSON = false;
        newActiv.transparency = a;
        
        newActiv.rgb = {"r": r, "g": g, "b": b};
        pickColor = createPickColor(variables.picking.pickIndex);
        variables.picking.pickIndex++;
        variables.picking.pickArray[pickColor.join()] = id;
        pc = [];
        pc[0] = pickColor[0] / 255;
        pc[1] = pickColor[1] / 255;
        pc[2] = pickColor[2] / 255;
        newActiv.pickColor = pc;
        
        elements.meshes[id] = newActiv;
}

function mat4toQuat(m)
{
	var q = quat4.create();
	
	tr = m[0] + m[5] + m[10];

	if (tr > 0) 
	{ 
		S = Math.sqrt(tr+1.0) * 2; // S=4*qw 
		q[3] = 0.25 * S;
		q[0] = (m[9] - m[6]) / S;
		q[1] = (m[2] - m[8]) / S; 
		q[2] = (m[4] - m[1]) / S; 
	} 
	else if ((m[0] > m[5])&(m[0] > m[10])) 
	{ 
		S = Math.sqrt(1.0 + m[0] - m[5] - m[10]) * 2; // S=4*qx 
		q[3] = (m[9] - m[6]) / S;
		q[0] = 0.25 * S;
		q[1] = (m[1] + m[4]) / S; 
		q[2] = (m[2] + m[8]) / S; 
	} 
	else if (m[5] > m[10]) 
	{ 
		S = Math.sqrt(1.0 + m[5] - m[0] - m[10]) * 2; // S=4*qy
		q[3] = (m[2] - m[8]) / S;
		q[0] = (m[1] + m[4]) / S; 
		q[1] = 0.25 * S;
		q[2] = (m[6] + m[9]) / S; 
	} 
	else 
	{ 
		S = Math.sqrt(1.0 + m[10] - m[0] - m[5]) * 2; // S=4*qz
		q[3] = (m[4] - m[1]) / S;
		q[0] = (m[2] + m[8]) / S;
		q[1] = (m[6] + m[9]) / S;
		q[2] = 0.25 * S;
	}
	
	return q;
}

function slerp(qa, qb, t) 
{
	// quaternion to return
	qm = quat4.create();
	// Calculate angle between them.
	cosHalfTheta = qa[3] * qb[3] + qa[0] * qb[0] + qa[1] * qb[1] + qa[2] * qb[2];
	// if qa=qb or qa=-qb then theta = 0 and we can return qa
	if (Math.abs(cosHalfTheta) >= 1.0)
	{
		qm[3] = qa[3];qm[0] = qa[0];qm[1] = qa[1];qm[2] = qa[2];
		return qm;
	}
	// Calculate temporary values.
	halfTheta = Math.acos(cosHalfTheta);
	sinHalfTheta = Math.sqrt(1.0 - cosHalfTheta*cosHalfTheta);
	// if theta = 180 degrees then result is not fully defined
	// we could rotate around any axis normal to qa or qb
	if (Math.abs(sinHalfTheta) < 0.001)
	{ // fabs is floating point absolute
		qm[3] = (qa[3] * 0.5 + qb[3] * 0.5);
		qm[0] = (qa[0] * 0.5 + qb[0] * 0.5);
		qm[1] = (qa[1] * 0.5 + qb[1] * 0.5);
		qm[2] = (qa[2] * 0.5 + qb[2] * 0.5);
		return qm;
	}
	ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta;
	ratioB = Math.sin(t * halfTheta) / sinHalfTheta; 
	//calculate Quaternion.
	qm[3] = (qa[3] * ratioA + qb[3] * ratioB);
	qm[0] = (qa[0] * ratioA + qb[0] * ratioB);
	qm[1] = (qa[1] * ratioA + qb[1] * ratioB);
	qm[2] = (qa[2] * ratioA + qb[2] * ratioB);
	return qm;
}	


function getOctant(m)
{
	dots = new Array(8);
	v1 = vec3.create();
	v1[0] = 0; v1[1] = 0; v1[2] = 1;
	v2 = vec3.create();
	v2[0] = 1; v2[1] = 1; v2[2] = 1;

	view = vec3.create();

	mat4.multiplyVec3(m, v1, view);
	
	dots[0] = vec3.dot( v2, view );

	v2[2] = -1;
	dots[1] = vec3.dot( v2, view );

	v2[1] = -1;
	dots[2] = vec3.dot( v2, view );

	v2[2] = 1;
	dots[3] = vec3.dot( v2, view );

	v2[0] = -1;
	dots[4] = vec3.dot( v2, view );

	v2[2] = -1;
	dots[5] = vec3.dot( v2, view );

	v2[1] = 1;
	dots[6] = vec3.dot( v2, view );

	v2[2] = 1;
	dots[7] = vec3.dot( v2, view );

	max = 0.0;
	octant = 0;
	for ( var i = 0; i < 8; ++i )
	{
		if ( dots[i] > max )
		{
			max = dots[i];
			octant = i + 1;
		}
	}
	return octant;
}		

function sortMeshIndices( elem, mvMat, pMat )
{
	if ( !elem.indices ) return;
	var numTris = elem.indices.length / 3;
	var sortedTris = [numTris];
	for ( var l = 0; l < numTris; ++l )
	{
		sortedTris[l] = l;
	}
	
	var v1 = vec3.create();
	var v2 = vec3.create();
	var v3 = vec3.create();
	var triMean = [];
	for ( var ii = 0; ii < elem.indices.length; ++ii)
	{
		v1[0] = elem.vertices[elem.indices[ii]*3];
		v1[1] = elem.vertices[elem.indices[ii]*3+1];
		v1[2] = elem.vertices[elem.indices[ii]*3+2];
		mat4.multiplyVec3(mvMat, v1);
		++ii;
		v2[0] = elem.vertices[elem.indices[ii]*3];
		v2[1] = elem.vertices[elem.indices[ii]*3+1];
		v2[2] = elem.vertices[elem.indices[ii]*3+2];
		mat4.multiplyVec3(mvMat, v2);
		++ii;
		v3[0] = elem.vertices[elem.indices[ii]*3];
		v3[1] = elem.vertices[elem.indices[ii]*3+1];
		v3[2] = elem.vertices[elem.indices[ii]*3+2];
		//mat4.multiplyVec3(pMat, v3);
		mat4.multiplyVec3(mvMat, v3);
		
		triMean.push( ( v1[2] + v2[2] + v3[2] ) / -3.0 );
		
	}
	
	quicksort(0, numTris -1 );
	
	elem.sortedIndices = [];
	for ( var k = 0; k < numTris; ++k )
	{
		elem.sortedIndices.push( elem.indices[sortedTris[k]*3]);
		elem.sortedIndices.push( elem.indices[sortedTris[k]*3+1]);
		elem.sortedIndices.push( elem.indices[sortedTris[k]*3+2]);
	}
	
	function quicksort( left, right )
	{
		if ( left < right )
		{
			div = divide( left, right );
			
			quicksort( left, div -1 );
			quicksort( div + 1, right );
		}
	}
	
	function divide( left, right )
	{
		var i = left;
		var j = right - 1;

		var pivot = triMean[sortedTris[right]];
		
		do 
		{
			while ( ( triMean[sortedTris[i]] <= pivot ) && ( i < right ) )
			{
				++i;
			}
			while ( ( triMean[sortedTris[j]] > pivot ) && ( j > left ) )
			{
				--j;
			}
			if ( i < j )
			{
				var tmp = sortedTris[i];
				sortedTris[i] = sortedTris[j];
				sortedTris[j] = tmp;
			}
			
		} while ( i < j );
		
		if ( triMean[sortedTris[i]] > pivot )
		{
			var tmp = sortedTris[i];
			sortedTris[i] = sortedTris[right];
			sortedTris[right] = tmp;
		}
		
		return i;
	}
}

function sortLineMeans( elem, mvMat, pMat )
{
	var numLines = elem.indices.length;
	var sortedLines = [numLines];
	for ( var l = 0; l < numLines; ++l )
	{
		sortedLines[l] = l;
	}
	
	var v1 = vec3.create();
	var v2 = vec3.create();
	
	var lineMean = [];
	for ( var ii = 0; ii < elem.indices.length; ++ii)
	{
		var firstPoint = elem.lineStarts[ii] * 3;
		var lastPoint = firstPoint + ( ( elem.indices[ii] - 1 ) * 3 );
		
		v1[0] = elem.vertices[firstPoint];
		v1[1] = elem.vertices[firstPoint+1];
		v1[2] = elem.vertices[firstPoint+2];
		mat4.multiplyVec3(mvMat, v1);
		
		v2[0] = elem.vertices[lastPoint];
		v2[1] = elem.vertices[lastPoint+1];
		v2[2] = elem.vertices[lastPoint+2];
		mat4.multiplyVec3(mvMat, v2);
		
		lineMean.push( ( v1[2] + v2[2] ) / 2.0 );
		
	}
	
	quicksort(0, numLines -1 );
	
	elem.sortedLines = sortedLines;
	
	function quicksort( left, right )
	{
		if ( left < right )
		{
			div = divide( left, right );
			
			quicksort( left, div -1 );
			quicksort( div + 1, right );
		}
	}
	
	function divide( left, right )
	{
		var i = left;
		var j = right - 1;

		var pivot = lineMean[sortedLines[right]];
		
		do 
		{
			while ( ( lineMean[sortedLines[i]] <= pivot ) && ( i < right ) )
			{
				++i;
			}
			while ( ( lineMean[sortedLines[j]] > pivot ) && ( j > left ) )
			{
				--j;
			}
			if ( i < j )
			{
				var tmp = sortedLines[i];
				sortedLines[i] = sortedLines[j];
				sortedLines[j] = tmp;
			}
			
		} while ( i < j );
		
		if ( lineMean[sortedLines[i]] > pivot )
		{
			var tmp = sortedLines[i];
			sortedLines[i] = sortedLines[right];
			sortedLines[right] = tmp;
		}
		
		return i;
	}
}


function createPickColor(index) {
	hash = [];
	hash[0] = index % 256;
	hash[1] = ((index / 256) >> 0) % 256;
	hash[2] = ((index / (256 * 256)) >> 0) % 256;
	return hash;
}

return {
	createPickColor : createPickColor,
	mat4toQuat : mat4toQuat,
	slerp : slerp
};

}));
