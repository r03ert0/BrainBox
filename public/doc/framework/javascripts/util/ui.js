define(["jquery", "mousewheel", "io", "./gfx/mygl", "./gfx/viewer", "./gfx/arcball", "./gfx/scene"], 
		function($, mousewheel, io, mygl, viewer, arcball, scene ) {
	
//***************************************************************************************************
//
// resizing
//
//***************************************************************************************************/
$(window).bind('resize', function() {
	var leftOffset = ( $('#links').css('display') == 'none' ) ? 0 : parseInt( $('#links').css('width') ) + 15;
	
    
	$('#viewer-div').css('left', leftOffset  );
	
    $('#viewer-div').width( $(document).width() - ( leftOffset + 10 ) );
    $('#viewer-div').height( $(document).height() - 10 );
    var $vc = $('#viewer-canvas');
    $vc.height( $('#viewer-div').height() );
    $vc.width( $('#viewer-div').width() );
    
    w = $vc.width(),
    h = $vc.height(),
    $vc.attr({
        'width': w,
        'height': h
    });
    
    mygl.resizeGL( $vc );
    arcball.setViewportDims(mygl.viewportWidth(), mygl.viewportHeight() );
});	
	
var tabStatus = {};	
function toogleFullScreen () {
	if ( $('#links').css('display') == 'none' ) {
		$('#links').css('display', 'block');
		$('#divViewButtons').css('display', 'block');
		$('#divSceneButtons').css('display', 'block');
		
		$('#infoTab').css('display', tabStatus['infoTab']);
		$('#controlTab1').css('display', tabStatus['controlTab1']);
		$('#mriTab').css('display', tabStatus['mriTab']);
		$('#elementTab').css('display', tabStatus['elementTab']);
	} 
	else {
		$('#links').css('display', 'none');
		$('#divViewButtons').css('display', 'none');
		$('#divSceneButtons').css('display', 'none');
		
		tabStatus['infoTab'] = $('#infoTab').css('display');
		tabStatus['controlTab1'] = $('#controlTab1').css('display');
		tabStatus['mriTab'] = $('#mriTab').css('display');
		tabStatus['elementTab'] = $('#elementTab').css('display');
		
		
		$('#infoTab').css('display', 'none');
		$('#controlTab1').css('display', 'none');
		$('#mriTab').css('display', 'none');
		$('#elementTab').css('display', 'none');
	}
	$(window).trigger('resize');
}
	
//***************************************************************************************************
//
// everything mouse related
//
//***************************************************************************************************/
var leftDown = false;
var middleDown = false;
var rightDown = false;
    
function fixupMouse(event) {
	event = event || window.event;

	var e = {
		event : event,
		target : event.target ? event.target : event.srcElement,
		which : event.which ? event.which : event.button === 1 ? 1 : event.button === 2 ? 3 : event.button === 4 ? 2 : 1,
		x : event[0] ? event[0] : event.clientX,
		y : event[1] ? event[1] : event.clientY,
	};
	
	if (event.offsetX) {
		// chrome case, should work
		e.fixedX = event.offsetX;
		e.fixedY = event.offsetY;
	} else {
		e.fixedX = e.x - findPosX($('#viewer-canvas').get(0) );
		e.fixedY = e.y - findPosY($('#viewer-canvas').get(0) );
	}
	return e;
}

function findPosX(obj) {
	var curleft = 0;
	if (obj.offsetParent)
		while (1) {
			curleft += obj.offsetLeft;
			if (!obj.offsetParent)
				break;
			obj = obj.offsetParent;
		}
	else if (obj.x)
		curleft += obj.x;
	return curleft;
}

function findPosY(obj) {
	var curtop = 0;
	if (obj.offsetParent)
		while (1) {
			curtop += obj.offsetTop;
			if (!obj.offsetParent)
				break;
			obj = obj.offsetParent;
		}
	else if (obj.y)
		curtop += obj.y;
	return curtop;
}

$('#viewer-canvas').mousedown( function (event) {
	e = fixupMouse(event);
	if (e.which == 1) {
		arcball.click(e.fixedX, e.fixedY);
		leftDown = true;
	} else if (e.which == 2) {
		middleDown = true;
		arcball.midClick(e.fixedX, e.fixedY);
	}
	else if (e.which == 3) {
		rightDown = true;
	}
	event.preventDefault();

	return false;
});

$('#viewer-canvas').mouseup( function (event) {
	e = fixupMouse(event);
	if (e.which == 1) {
		leftDown = false;
	} else if (e.which == 2) {
		middleDown = false;
	}
	else if (e.which == 3) {
		rightDown = false;
	}
	event.preventDefault();

	return false;
});

$('#viewer-canvas').mousemove( function (event) {
	e = fixupMouse(event);
	if (leftDown) {
		arcball.drag(e.fixedX, e.fixedY);
	} 
	else if (middleDown) {
		arcball.midDrag(e.fixedX, e.fixedY);
	}
	event.preventDefault();
});

$('#viewer-canvas').on("mousewheel", function(event, delta, deltaX, deltaY) {
    if (middleDown) {
		return;
	}
    if ( !event.shiftKey )
	{
    	return;
	}
	if (delta < 0) {
		arcball.zoomOut();
	}
	else {
		arcball.zoomIn();
	}
});

//***************************************************************************************************
//
// keyboard functions
//
//***************************************************************************************************/
$(document).bind('keypress', function(e) {
    //console.log( "key # " + e.which);
    switch(e.which) {
        case 32: // Spacebar
            viewer.resetView();
            break;
        case 102: // f
        	toogleFullScreen();
        	break;
        case 103: // g
        	arcball.zoomOut();
        	break;
        case 104: // 
        	arcball.zoomIn();
        	break;
	}
});

//***************************************************************************************************
//
// misc functions
//
//***************************************************************************************************/



//***************************************************************************************************
//
// callbacks for element loading, create controls
//
//***************************************************************************************************/
function addElementToUI( el ) {
	if ( el.type == 'tex' ) {
		$('#textureSelect').append($('<option></option>').val(el.id).html(el.name));
		$('#textureSelect2').append($('<option></option>').val(el.id).html(el.name));
	}
	else if ( el.type != 'tex') {
        var $toggle = $('<a />');
        $toggle.append('<span/>');
        $toggle.append('<label>'+el.name+'</label>');
        $toggle.addClass('toggle');
        $toggle.addClass('disabled');
        $toggle.attr('href', '#toggle:' + el.id);
        $toggle.attr('id', 'toggle-' + el.id);
        $toggle.click(function(e) {
            e.preventDefault();
            scene.toggleElement(el.id, toggleCallback );
            return false;
        });
        
    	$('#elements').append($toggle);
    	if ( el.type === 'mesh' || el.type === 'fibre' ) {
    		$('#elementSelect').append($('<option></option>').val(el.id).html(el.name));
    	}
	}
}

function toggleCallback (id, active) {
	 $('#toggle-' + id).toggleClass('active', active);
}

var elementsLoading = 0;
var allStarted = false;
var pageToDisplay;
var currentScene;
function loadElementStart( el ) {
	console.log( 'start loading ' + el.id );
	addElementToUI( el );
	++elementsLoading;
}

function elementLoaded( el ) {
	console.log( 'finished loading ' + el.id + " " +  elementsLoading );
	$('#toggle-' + el.id).removeClass('disabled');
    $('#toggle-' + el.id).toggleClass('active', el.display);
    --elementsLoading;

    if ( allStarted && elementsLoading == 0 ) {
        // here everything is loaded 
	    console.log( 'all elements loaded' );
		$('#status').css('display', 'none');
		
		scene.setValue('tex1', 'tex1' );
        $('#sliceX').attr('max', io.niftiis()['tex1'].getDims()[0] );
        $('#sliceY').attr('max', io.niftiis()['tex1'].getDims()[1] );
        $('#sliceZ').attr('max', io.niftiis()['tex1'].getDims()[2] );
		
		scene.init();
		scene.setValue('loadingComplete', true );
		if ( pageToDisplay )
		{
			displayPage( pageToDisplay );
		}
		else
		{
			scene.activateScene( "scene1" );
		}
    }
}
function allElementsLoaded() {
	console.log( "ui: all elements loaded" );
	allStarted = true;
} 

function contentLoaded() {
	if( elementsLoading > 0 )
	{
		pageToDisplay = 'page1';
	}
	else
	{
		displayPage( 'page1' );
	}
}

function displayPage( id ) {
	$('#content').empty();
	
	var co = io.content()[id];
	
	var $nav = $('<nav />');
	$nav.addClass('prev-next top');


	console.log( "### " + co.viewer );
	if ( !co.viewer )
	{
		console.log( "ottobaer" );
		console.log( co );
    	$('#viewer').css( "display", "none" );
    	$('#viewer-div').css( "display", "none" );
    	$('#viewer-nav').css( "display", "none" );
    	$('#toggles').css( "display", "none" );
	}
	else
	{
		console.log( co );
		console.log( "morpf" );
    	$('#viewer').css( "display", "block" );
    	$('#viewer-div').css( "display", "block" );
    	$('#viewer-nav').css( "display", "block" );
    	$('#toggles').css( "display", "block" );
	}

	
	if ( co.previous != "" ) {
		var $li = $('<a />');
		$li.addClass('prev');
		$li.attr( 'href', '#' + co.previous );
		$li.append( String.fromCharCode(171) + ' previous' );
		$li.click(function(e) {
            e.preventDefault();
            displayPage( co.previous );
            return false;
        });
		$nav.append( $li );
	}
		
	
	if ( co.next != "" ) {
		var $li = $('<a />');
		$li.addClass('next');
		$li.attr( 'href', '#' + co.next );
		$li.append( 'next ' + String.fromCharCode(187) );
		$li.click(function(e) {
            e.preventDefault();
            displayPage( co.next );
            return false;
        });
		$nav.append( $li );
			
	}
	$('#content').append($nav);
	
	
	var $page = $('<div />');
	$page.addClass('section');
	$page.attr('id', 'page-body' );
	$page.append('<header>');
	$page.append('<h1>'+co.title+'</h1>');
	$page.append('</header>');
	
	for( var i = 0; i < co.paragraphs.length; ++i )
	{
		var $text = $('<div />');
		$text.addClass('document');
		var ts = "";
		for ( var k = 0; k < co.paragraphs[i].text.length; ++k  )
		{
			ts += co.paragraphs[i].text[k];
		}
		$text.append('<a id="para'+i+'" name="para'+i+'"></a>' );
		$text.append('<p>'+ts+'</p>');
		$page.append($text);
		
		var $fig = $('<figure />');
		var $img = $('<img />');
		$img.attr('src', co.paragraphs[i].image_url);
		$img.addClass('contentImage');
		//$img.attr('width', 550);
		//$img.attr('height', 437);
		
		$fig.append( $img );
		
		var $caption = $('<figcaption />');
		$caption.append( '<h1>'+co.paragraphs[i].image_title+'</h1>');
		$caption.append( '<div class="document"><p>'+co.paragraphs[i].image_text+'</p></div>');
	
		$fig.append( $caption );
		
		$page.append( $fig );
		$page.append( $('<br />') );
		$page.append( $('<br />') );
		$page.append( $('<br />') );
		
	}
	$('#content').append($page);

	function scrollToElement (selector) {
		console.log( $('#'+selector) );
  	  $('html, body').animate({
  	    scrollTop: $('#'+selector).offset().top
  	  }, 2000);    
  	};
	
	$('.a2page').each(function(i, obj) {
		console.log( obj );
		$(obj).click(function(e) {
	        e.preventDefault();
	        displayPage( $(obj).attr('href') );
	        console.log($(obj).attr('para') );
	        scrollToElement($(obj).attr('para'));
	        
	        return false;
	    });
	});
	
	
	
	
	var $nav2 = $('<nav />');
	$nav2.addClass('prev-next bottom');
	
	if ( co.previous != "" ) {
		var $li = $('<a />');
		$li.addClass('prev');
		$li.attr( 'href', '#' + co.previous );
		$li.append( String.fromCharCode(171) + ' previous' );
		$li.click(function(e) {
            e.preventDefault();
            displayPage( co.previous );
            return false;
        });
		$nav2.append( $li );
	}
	
	if ( co.next != "" ) {
		var $li = $('<a />');
		$li.addClass('next');
		$li.attr( 'href', '#' + co.next );
		$li.append( 'next ' + String.fromCharCode(187) );
		$li.click(function(e) {
            e.preventDefault();
            displayPage( co.next );
            return false;
        });
		$nav2.append( $li );
			
	}
	$('#content').append($nav2);
	
	currentScene = co.scene;
	scene.activateScene( co.scene );
	var sc = io.scenes()[co.scene];
	$('#elements').empty();
	$.each(sc.elementsAvailable, function(i, id) {
		if (id in io.meshes() ) {
			addElementToUI( io.meshes()[id] );	
			$('#toggle-' + id).removeClass('disabled');
		}
		else if (id in io.fibres() ) {
			addElementToUI( io.fibres()[id] );
			$('#toggle-' + id).removeClass('disabled');
		}
	});
	$.each(sc.elementsActive, function(i, id) {
		$('#toggle-' + id).toggleClass('active', true);
	});

}


//***************************************************************************************************
//
// bind controls
//
//***************************************************************************************************/
$('#controlsLink').click(function(e) {
    e.preventDefault();
    $('#controls').slideToggle();
    return false;
});

$('#resetLink').click(function(e) {
    e.preventDefault();
    scene.activateScene( currentScene );
    var sc = io.scenes()[currentScene];
    $.each(sc.elementsActive, function(i, id) {
		$('#toggle-' + id).toggleClass('active', true);
	});
    return false;
});


//**********************************************************************************************************
//*
//* mri tab  
//*
//**********************************************************************************************************
// SLICES
var sliderChangeHandler = function(property) {
    return function(e) {
    	var value = "";
    	value = $(this).val();
    	if ( $(this).attr('id') === "threshold1" ) {
    		value = parseFloat($(this).val()).toFixed(3);
    		document.getElementById('tn').innerHTML = value;
    	}
    	else if ( $(this).attr('id') === "threshold2" ) {
    		value = parseFloat($(this).val()).toFixed(3);
    		document.getElementById('tp').innerHTML = value;
    	}
    	else if ( $(this).attr('id') === "alpha2" ) {
    		value = parseFloat($(this).val()).toFixed(3);
    		document.getElementById('texAlpha').innerHTML = value;
    	}
    	$(this).parent().find('.value').text(value);
    	scene.setValue( property, parseFloat(value) );
    };
};
$('#sliceX').bind('input', sliderChangeHandler('sagittal')).trigger('input');
$('#sliceY').bind('input', sliderChangeHandler('coronal')).trigger('input');
$('#sliceZ').bind('input', sliderChangeHandler('axial')).trigger('input');


$('a[href="#gray"]').click(function(e) {
    e.preventDefault();
    scene.setValue( 'showSlice', true );
    scene.setValue('tex1', 'tex1' );
   return false;
});

$('a[href="#fargb"]').click(function(e) {
    e.preventDefault();
    scene.setValue( 'showSlice', true );
    scene.setValue('tex1', 'tex2' );
    return false;
});





//**********************************************************************************************************
//*
//* return visible functions  
//*
//**********************************************************************************************************
return {
	loadElementStart: loadElementStart,
	elementLoaded : elementLoaded, 
	allElementsLoaded : allElementsLoaded,
	toogleFullScreen : toogleFullScreen,
	contentLoaded : contentLoaded,
};


});