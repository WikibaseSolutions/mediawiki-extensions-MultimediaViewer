( function ( mw, $ ) {
	QUnit.module( 'mmv.lightboxInterface', QUnit.newMwEnvironment() );

	QUnit.test( 'Sanity test, object creation and ui construction', 23, function ( assert ) {
		var lightbox = new mw.mmv.LightboxInterface( mw.mmv.mediaViewer );

		function checkIfUIAreasAttachedToDocument( inDocument ) {
			var msg = inDocument === 1 ? ' ' : ' not ';
			assert.strictEqual( $( '.mlb-wrapper' ).length, inDocument, 'Wrapper area' + msg + 'attached.' );
			assert.strictEqual( $( '.mlb-main' ).length, inDocument, 'Main area' + msg + 'attached.' );
			assert.strictEqual( $( '.mlb-overlay' ).length, inDocument, 'Overlay area' + msg + 'attached.' );
			assert.strictEqual( $( '.mw-mlb-title' ).length, inDocument, 'Title area' + msg + 'attached.' );
			assert.strictEqual( $( '.mw-mlb-author' ).length, inDocument, 'Author area' + msg + 'attached.' );
			assert.strictEqual( $( '.mw-mlb-image-desc' ).length, inDocument, 'Description area' + msg + 'attached.' );
			assert.strictEqual( $( '.mw-mlb-image-links' ).length, inDocument, 'Links area' + msg + 'attached.' );
		}

		// UI areas not attached to the document yet.
		checkIfUIAreasAttachedToDocument(0);

		// Attach lightbox to testing fixture to avoid interference with other tests.
		lightbox.attach( '#qunit-fixture' );

		// UI areas should now be attached to the document.
		checkIfUIAreasAttachedToDocument(1);

		// Check that the close button on the lightbox still follow the spec (being visible right away)
		assert.strictEqual( $( '#qunit-fixture .mlb-close' ).length, 1, 'There should be a close button' );
		assert.ok( $( '#qunit-fixture .mlb-close' ).is(':visible'), 'The close button should be visible' );

		// Unattach lightbox from document
		lightbox.unattach();

		// UI areas not attached to the document anymore.
		checkIfUIAreasAttachedToDocument(0);
	} );

	QUnit.test( 'Handler registration and clearance work OK', 2, function ( assert ) {
		var lightbox = new mw.mmv.LightboxInterface( mw.mmv.mediaViewer ),
			handlerCalls = 0;

		function handleEvent() {
			handlerCalls++;
		}

		lightbox.handleEvent( 'test', handleEvent );
		$( document ).trigger( 'test' );
		assert.strictEqual( handlerCalls, 1, 'The handler was called when we triggered the event.' );
		lightbox.clearEvents();
		$( document ).trigger( 'test' );
		assert.strictEqual( handlerCalls, 1, 'The handler was not called after calling lightbox.clearEvents().' );
	} );

	QUnit.asyncTest( 'Check we are saving the resize listener', 2, function ( assert ) {
		var img = new mw.mmv.LightboxImage('http://en.wikipedia.org/w/skins/vector/images/search-ltr.png'),
			lightbox = new mw.mmv.LightboxInterface( mw.mmv.mediaViewer );

		// resizeListener not saved yet
		assert.strictEqual( this.resizeListener, undefined, 'Listener is not saved yet' );

		// Save original showImage
		lightbox.originalShowImage = lightbox.showImage;

		// Mock showImage
		lightbox.showImage = function ( image, $ele ) {
			// Call original showImage
			this.originalShowImage( image, $ele );

			// resizeListener should have been saved
			assert.notStrictEqual( this.resizeListener, undefined, 'Saved listener !' );
			QUnit.start();
		};

		lightbox.load(img);
	} );

	QUnit.test( 'Fullscreen mode', 8, function ( assert ) {
		var lightbox = new mw.mmv.LightboxInterface( mw.mmv.mediaViewer ),
			oldFnEnterFullscreen = $.fn.enterFullscreen,
			oldFnExitFullscreen = $.fn.exitFullscreen,
			oldSupportFullscreen = $.support.fullscreen;

		// Since we don't want these tests to really open fullscreen
		// which is subject to user security confirmation,
		// we use a mock that pretends regular jquery.fullscreen behavior happened
		$.fn.enterFullscreen = mw.mmv.testHelpers.enterFullscreenMock;
		$.fn.exitFullscreen = mw.mmv.testHelpers.exitFullscreenMock;

		// Attach lightbox to testing fixture to avoid interference with other tests.
		lightbox.attach( '#qunit-fixture' );

		$.support.fullscreen = false;
		lightbox.setupFullscreenButton();

		assert.ok( !lightbox.$fullscreenButton.is(':visible'),
			'Fullscreen button is hidden when fullscreen mode is unavailable' );

		$.support.fullscreen = true;
		lightbox.setupFullscreenButton();

		assert.ok( lightbox.$fullscreenButton.is(':visible'),
			'Fullscreen button is visible when fullscreen mode is available' );

		// Entering fullscreen
		lightbox.$fullscreenButton.click();

		assert.strictEqual( lightbox.$main.hasClass( 'jq-fullscreened' ) , true,
			'Fullscreened area has the fullscreen class');
		assert.strictEqual( lightbox.isFullscreen , true, 'Lightbox knows it\'s in fullscreen mode');

		// Exiting fullscreen
		lightbox.$fullscreenButton.click();

		assert.strictEqual( lightbox.$main.hasClass( 'jq-fullscreened' ) , false,
			'Fullscreened area doesn\'t have the fullscreen class anymore');
		assert.strictEqual( lightbox.isFullscreen , false, 'Lightbox knows it\'s not in fullscreen mode');

		// Entering fullscreen
		lightbox.$fullscreenButton.click();

		// Hard-exiting fullscreen
		lightbox.$closeButton.click();

		// Re-attach after hard-exit
		lightbox.attach( '#qunit-fixture' );

		assert.strictEqual( lightbox.$main.hasClass( 'jq-fullscreened' ) , false,
			'Fullscreened area doesn\'t have the fullscreen class anymore');
		assert.strictEqual( lightbox.isFullscreen , false, 'Lightbox knows it\'s not in fullscreen mode');

		// Unattach lightbox from document
		lightbox.unattach();



		$.fn.enterFullscreen = oldFnEnterFullscreen;
		$.fn.exitFullscreen = oldFnExitFullscreen;
		$.support.fullscreen = oldSupportFullscreen;
	} );

	QUnit.test( 'Fullscreen mode', 8, function ( assert ) {
		var lightbox = new mw.mmv.LightboxInterface( mw.mmv.mediaViewer ),
			oldFnEnterFullscreen = $.fn.enterFullscreen,
			oldFnExitFullscreen = $.fn.exitFullscreen,
			oldRevealButtonsAndFadeIfNeeded,
			oldPreloadDistance = mw.mmv.mediaViewer.preloadDistance,
			buttonOffset;

		// ugly hack to avoid preloading which would require lightbox list being set up
		mw.mmv.mediaViewer.preloadDistance = -1;

		// Since we don't want these tests to really open fullscreen
		// which is subject to user security confirmation,
		// we use a mock that pretends regular jquery.fullscreen behavior happened
		$.fn.enterFullscreen = mw.mmv.testHelpers.enterFullscreenMock;
		$.fn.exitFullscreen = mw.mmv.testHelpers.exitFullscreenMock;

		// Attach lightbox to testing fixture to avoid interference with other tests.
		lightbox.attach( '#qunit-fixture' );
		lightbox.viewer.ui = lightbox;
		lightbox.viewer.lightbox = lightbox;

		assert.ok( !lightbox.isFullscreen, 'Lightbox knows that it\'s not in fullscreen mode' );
		assert.ok( lightbox.panel.$imageMetadata.is( ':visible' ), 'Image metadata is visible' );

		lightbox.buttons.fadeOut = function() {
			assert.ok( true, 'Opening fullscreen triggers a fadeout' );
		};

		// Pretend that the mouse cursor is on top of the button
		buttonOffset = lightbox.buttons.$fullscreen.offset();
		lightbox.mousePosition = { x: buttonOffset.left, y: buttonOffset.top };

		// Enter fullscreen
		lightbox.buttons.$fullscreen.click();

		lightbox.buttons.fadeOut = $.noop;
		assert.ok( lightbox.isFullscreen, 'Lightbox knows that it\'s in fullscreen mode' );

		oldRevealButtonsAndFadeIfNeeded = lightbox.buttons.revealAndFade;

		lightbox.buttons.revealAndFade = function( position ) {
			assert.ok( true, 'Moving the cursor triggers a reveal + fade' );

			oldRevealButtonsAndFadeIfNeeded.call( this, position );
		};

		// Pretend that the mouse cursor moved to the top-left corner
		lightbox.mousemove( { pageX: 0, pageY: 0 } );

		lightbox.buttons.revealAndFadeIfNeeded = $.noop;

		assert.ok( !lightbox.panel.$imageMetadata.is( ':visible' ), 'Image metadata is hidden' );

		// Exiting fullscreen
		lightbox.buttons.$fullscreen.click();

		assert.ok( lightbox.panel.$imageMetadata.is( ':visible' ), 'Image metadata is visible' );
		assert.ok( !lightbox.isFullscreen, 'Lightbox knows that it\'s not in fullscreen mode' );

		// Unattach lightbox from document
		lightbox.unattach();

		$.fn.enterFullscreen = oldFnEnterFullscreen;
		$.fn.exitFullscreen = oldFnExitFullscreen;
		mw.mmv.mediaViewer.preloadDistance = oldPreloadDistance;
	} );

	QUnit.test( 'isAnyActiveButtonHovered', 20, function ( assert ) {
		var lightbox = new mw.mmv.LightboxInterface( mw.mmv.mediaViewer );

		// Attach lightbox to testing fixture to avoid interference with other tests.
		lightbox.attach( '#qunit-fixture' );

		$.each ( lightbox.buttons.$buttons, function ( idx, e ) {
			var $e = $( e ),
				offset = $e.show().offset(),
				width = $e.width(),
				height = $e.height(),
				disabled = $e.hasClass( 'disabled' );

			assert.strictEqual( lightbox.buttons.isAnyActiveButtonHovered( offset.left, offset.top ),
				!disabled,
				'Hover detection works for top-left corner of element' );
			assert.strictEqual( lightbox.buttons.isAnyActiveButtonHovered( offset.left + width, offset.top ),
				!disabled,
				'Hover detection works for top-right corner of element' );
			assert.strictEqual( lightbox.buttons.isAnyActiveButtonHovered( offset.left, offset.top + height ),
				!disabled,
				'Hover detection works for bottom-left corner of element' );
			assert.strictEqual( lightbox.buttons.isAnyActiveButtonHovered( offset.left + width, offset.top + height ),
				!disabled,
				'Hover detection works for bottom-right corner of element' );
			assert.strictEqual( lightbox.buttons.isAnyActiveButtonHovered(
				offset.left + ( width / 2 ), offset.top + ( height / 2 ) ),
				!disabled,
				'Hover detection works for center of element' );
		} );

		// Unattach lightbox from document
		lightbox.unattach();
	} );

	QUnit.test( 'Metadata scrolling', 15, function ( assert ) {
		var lightbox = new mw.mmv.LightboxInterface( mw.mmv.mediaViewer ),
			keydown = $.Event( 'keydown' ),
			$document = $( document ),
			scrollTopBeforeOpeningLightbox,
			originalJQueryScrollTop = $.fn.scrollTop,
			memorizedScrollToScroll = 0,
			originalJQueryScrollTo = $.scrollTo,
			oldMWLightbox = mw.mmv.mediaViewer.lightbox,
			oldMWUI = mw.mmv.mediaViewer.ui;

		// Pretend that we have things hooked up
		mw.mmv.mediaViewer.ui = lightbox;

		// We need to set up a proxy on the jQuery scrollTop function
		// that will let us pretend that the document really scrolled
		// and that will return values as if the scroll happened
		$.fn.scrollTop = function ( scrollTop ) {
			// On some browsers $.scrollTo() != $document
			if ( $.scrollTo().is( this ) ) {
				if ( scrollTop !== undefined ) {
					memorizedScrollToScroll = scrollTop;
					return this;
				} else {
					return memorizedScrollToScroll;
				}
			}

			return originalJQueryScrollTop.call( this, scrollTop );
		};

		// Same idea as above, for the scrollTo plugin
		$.scrollTo = function ( scrollTo ) {
			var $element;

			if ( scrollTo !== undefined ) {
				memorizedScrollToScroll = scrollTo;
			}

			$element = originalJQueryScrollTo.call( this, scrollTo, 0 );

			if ( scrollTo !== undefined ) {
				// Trigger event manually
				mw.mmv.mediaViewer.scroll();
			}

			return $element;
		};

		// First phase of the test: up and down arrows

		mw.mmv.mediaViewer.hasAnimatedMetadata = false;
		localStorage.removeItem( 'mmv.hasOpenedMetadata' );

		// Attach lightbox to testing fixture to avoid interference with other tests.
		lightbox.attach( '#qunit-fixture' );

		// Pretend that we have things hooked up
		mw.mmv.mediaViewer.lightbox = { currentIndex: 0 };

		// This lets us avoid pushing a state to the history, which might interfere with other tests
		lightbox.comingFromHashChange = true;
		// Load is needed to start listening to metadata events
		lightbox.load( { getImageElement: function() { return $.Deferred().reject(); } } );

		assert.strictEqual( $.scrollTo().scrollTop(), 0, 'scrollTo scrollTop should be set to 0' );
		assert.ok( !lightbox.panel.$dragIcon.hasClass( 'pointing-down' ),
			'Chevron pointing up' );

		assert.ok( !localStorage.getItem( 'mmv.hasOpenedMetadata' ),
			'The metadata hasn\'t been open yet, no entry in localStorage' );

		keydown.which = 38; // Up arrow
		$document.trigger( keydown );

		assert.strictEqual( Math.round( $.scrollTo().scrollTop() ),
			lightbox.panel.$imageMetadata.height() + 1,
			'scrollTo scrollTop should be set to the metadata height + 1 after pressing up arrow' );
		assert.ok( lightbox.panel.$dragIcon.hasClass( 'pointing-down' ),
			'Chevron pointing down after pressing up arrow' );
		assert.ok( localStorage.getItem( 'mmv.hasOpenedMetadata' ),
			'localStorage knows that the metadata has been open' );

		keydown.which = 40; // Down arrow
		$document.trigger( keydown );

		assert.strictEqual( $.scrollTo().scrollTop(), 0,
			'scrollTo scrollTop should be set to 0 after pressing down arrow' );
		assert.ok( !lightbox.panel.$dragIcon.hasClass( 'pointing-down' ),
			'Chevron pointing up after pressing down arrow' );

		lightbox.panel.$dragIcon.click();

		assert.strictEqual( Math.round( $.scrollTo().scrollTop() ),
			lightbox.panel.$imageMetadata.height() + 1,
			'scrollTo scrollTop should be set to the metadata height + 1 after clicking the chevron once' );
		assert.ok( lightbox.panel.$dragIcon.hasClass( 'pointing-down' ),
			'Chevron pointing down after clicking the chevron once' );

		lightbox.panel.$dragIcon.click();

		assert.strictEqual( $.scrollTo().scrollTop(), 0,
			'scrollTo scrollTop should be set to 0 after clicking the chevron twice' );
		assert.ok( !lightbox.panel.$dragIcon.hasClass( 'pointing-down' ),
			'Chevron pointing up after clicking the chevron twice' );

		// Unattach lightbox from document
		lightbox.unattach();


		// Second phase of the test: scroll memory

		// Scroll down a little bit to check that the scroll memory works
		$.scrollTo( 10, 0 );

		scrollTopBeforeOpeningLightbox = $.scrollTo().scrollTop();

		// Attach lightbox to testing fixture to avoid interference with other tests.
		lightbox.attach( '#qunit-fixture' );

		// To make sure that the details are out of view, the lightbox is supposed to scroll to the top when open
		assert.strictEqual( $.scrollTo().scrollTop(), 0, 'Page scrollTop should be set to 0' );

		// Scroll down to check that the scrollTop memory doesn't affect prev/next (bug 59861)
		$.scrollTo( 20, 0 );

		// This extra attach() call simulates the effect of prev/next seen in bug 59861
		lightbox.attach( '#qunit-fixture' );

		// The lightbox was already open at this point, the scrollTop should be left untouched
		assert.strictEqual( $.scrollTo().scrollTop(), 20, 'Page scrollTop should be set to 20' );

		// Unattach lightbox from document
		lightbox.unattach();

		// Lightbox is supposed to restore the document scrollTop value that was set prior to opening it
		assert.strictEqual( $.scrollTo().scrollTop(), scrollTopBeforeOpeningLightbox, 'document scrollTop value has been restored correctly' );



		// Let's restore all originals, to make sure this test is free of side-effect
		$.fn.scrollTop = originalJQueryScrollTop;
		$.scrollTo = originalJQueryScrollTo;
		mw.mmv.mediaViewer.lightbox = oldMWLightbox;
		mw.mmv.mediaViewer.ui = oldMWUI;
	} );

	QUnit.test( 'Unblur', 3, function ( assert ) {
		var lightbox = new mw.mmv.LightboxInterface( mw.mediaViewer ),
			oldAnimate = $.fn.animate;

		$.fn.animate = function ( target, options ) {
			var self = this,
				lastValue;

			$.each( target, function ( key, value ) {
				lastValue = self.key = value;
			} );

			if ( options ) {
				if ( options.step ) {
					options.step.call( this, lastValue );
				}

				if ( options.complete ) {
					options.complete.call( this );
				}
			}
		};

		// Attach lightbox to testing fixture to avoid interference with other tests.
		lightbox.attach( '#qunit-fixture' );
		lightbox.$image =  $( '<img>' );

		lightbox.unblur();

		assert.ok( !lightbox.$image.css( '-webkit-filter' ) || !lightbox.$image.css( '-webkit-filter' ).length,
			'Image has no filter left' );
		assert.strictEqual( parseInt( lightbox.$image.css( 'opacity' ), 10 ), 1,
			'Image is fully opaque' );
		assert.ok( !lightbox.$image.hasClass( 'blurred' ), 'Image has no "blurred" class' );

		lightbox.unattach();

		$.fn.animate = oldAnimate;
	} );
}( mediaWiki, jQuery ) );