requirejs.config({
    //By default load any module IDs from framework/javascripts/util
    baseUrl: '../framework/javascripts/util',
    //except, if the module ID starts with "gfx",
    //load it from the framework/javascripts/gfx directory. paths
    //config is relative to the baseUrl, and
    //never includes a ".js" extension since
    //the paths config could be for a directory.
    paths: {
        gfx: '../gfx',
    }
});

require(['jquery', 'ui', 'io', 'gfx/viewer', 'gfx/mygl', 'gfx/scene', 'html5slider'], 
	function($, ui, io, viewer, mygl, scene ) {
    $(function() {
    	// Sobald wir mit dem DOM arbeiten koennen,
        $(document).ready(function() {
        	/**
        	 * Provides requestAnimationFrame in a cross browser way.
        	 */
        	window.requestAnimFrame = (function() {
        	  return window.requestAnimationFrame ||
        	         window.webkitRequestAnimationFrame ||
        	         window.mozRequestAnimationFrame ||
        	         window.oRequestAnimationFrame ||
        	         window.msRequestAnimationFrame ||
        	         function(/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
        	           window.setTimeout(callback, 1000/60);
        	         };
        	})();
        	
            if (!window.WebGLRenderingContext) {
                $('html').addClass('no-webgl');
            }
            
            
            $('body').on('contextmenu', 'canvas', function(e){ return false; });
            
            $.getJSON( settings.CONFIG_URL + "ui.json", 
            	function( data ) {
	            	$.each( data, function( i, el ) {
	            		$( "#" + el.buttonID ).click( function(e) {
	    					e.preventDefault();
	    					scene.toggleElements( el.toggles, iconCallback );
	    					scene.showElements( el.enables, iconCallback );
	    					scene.hideElements( el.disables, iconCallback );
	    					return false;
	    				}).mouseenter( function(e) {
	    					e.preventDefault();
	    					scene.mouseEnterElements( el.mouseover, iconCallback );
	    					return false;
	    				}).mouseleave( function(e) {
	    					e.preventDefault();
	    					scene.mouseLeaveElements( el.mouseover, iconCallback );
	    					return false;
	    				});
	            	});
            	}
            );
            
            function iconCallback( id, status )
            {
            	var imgs = $('#'+ id ).children();
            	if ( status )
            	{
            		imgs.eq( 0 ).hide();
            		imgs.eq( 1 ).show();
            	}
            	else
            	{
            		imgs.eq( 1 ).hide();
            		imgs.eq( 0 ).show();
            	}
            }
            
            
            
            // INIT VIEWER
            $.getJSON(settings.CONFIG_URL + "config.json", function(config) {
                window.setTimeout(function() {
                	
                    /*
                	if ( !config.viewer )
                	{
                		console.log( config );
	                	$('#viewer').css( "display", "none" );
	                	$('#viewer-div').css( "display", "none" );
	                	$('#viewer-nav').css( "display", "none" );
	                	$('#toggles').css( "display", "none" );
                	}
                    */
                	
                	var $vc = $('#viewer-canvas');
	                
	                $vc.attr({
	                    'width': $vc.width(),
	                    'height': $vc.height()
	                });
	                
	                if (!$('#viewer-div').is('.deactivated')) {
	                	// hier wird der eigentliche WebGL-Viewer initialisiert 
	                	try {
	                		mygl.initGL( $vc.get(0) );
	                		mygl.initPeel();
	                	} catch (e) {
	                		console.error('webglNotSupported', e);
	                		return;
	                	}
	                	      
	                	viewer.init( config, loadElements);
	                	$(window).trigger('resize');
	                };
	            }, 200);
            });
        });
        
        function loadElements() {
        	io.loadElements( ui.loadElementStart, ui.elementLoaded, ui.allElementsLoaded );
        	io.loadScenes();
        	io.loadContent( ui.contentLoaded );
        }        
        
        
        // method for synchronous loading of json files
        // $.getJSON works asynchronous.
        $.getSyncJSON = function(url, callback) {
            return $.parseJSON(jQuery.ajax({
                'type': 'GET',
                'url': url,
                'success': callback,
                'dataType': 'json',
                'async': false
            }).responseText);
        };
    });
});
