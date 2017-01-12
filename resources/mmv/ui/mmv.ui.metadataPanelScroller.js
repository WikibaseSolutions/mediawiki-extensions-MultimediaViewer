/*
 * This file is part of the MediaWiki extension MediaViewer.
 *
 * MediaViewer is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * MediaViewer is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with MediaViewer.  If not, see <http://www.gnu.org/licenses/>.
 */

( function ( mw, $, oo ) {
	var MPSP;

	/**
	 * Handles scrolling behavior of the metadata panel.
	 *
	 * @class mw.mmv.ui.MetadataPanelScroller
	 * @extends mw.mmv.ui.Element
	 * @constructor
	 * @param {jQuery} $container The container for the panel (.mw-mmv-post-image).
	 * @param {jQuery} $aboveFold The control bar element (.mw-mmv-above-fold).
	 * @param {Object} localStorage the localStorage object, for dependency injection
	 */
	function MetadataPanelScroller( $container, $aboveFold, localStorage ) {
		mw.mmv.ui.Element.call( this, $container );

		this.$aboveFold = $aboveFold;

		/** @property {Object} localStorage the window.localStorage object */
		this.localStorage = localStorage;

		/** @property {boolean} panelWasOpen state flag which will be used to detect open <-> closed transitions */
		this.panelWasOpen = null;

		/**
		 * Whether this user has ever opened the metadata panel.
		 * Based on a localstorage flag; will be set to true if the client does not support localstorage.
		 * @type {boolean}
		 */
		this.hasOpenedMetadata = undefined;

		/**
		 * Whether we've already fired an animation for the metadata div in this lightbox session.
		 * @property {boolean}
		 * @private
		 */
		this.hasAnimatedMetadata = false;

		this.initialize();
	}
	oo.inheritClass( MetadataPanelScroller, mw.mmv.ui.Element );
	MPSP = MetadataPanelScroller.prototype;

	MPSP.toggleScrollDuration = 400;

	MPSP.attach = function () {
		var panel = this;

		this.handleEvent( 'keydown', function ( e ) {
			panel.keydown( e );
		} );

		$.scrollTo().on( 'scroll.mmvp', $.throttle( 250, function () {
			panel.scroll();
		} ) );

		this.$container.on( 'mmv-metadata-open', function () {
			if ( !panel.hasOpenedMetadata && panel.localStorage ) {
				panel.hasOpenedMetadata = true;
				try {
					panel.localStorage.setItem( 'mmv.hasOpenedMetadata', true );
				} catch ( e ) {
					// localStorage is full or disabled
				}
			}
		} );

		// reset animation flag when the viewer is reopened
		this.hasAnimatedMetadata = false;
	};

	MPSP.unattach = function () {
		this.clearEvents();
		$.scrollTo().off( 'scroll.mmvp' );
		this.$container.off( 'mmv-metadata-open' );
	};

	MPSP.empty = function () {
		// need to remove this to avoid animating again when reopening lightbox on same page
		this.$container.removeClass( 'invite' );

		this.panelWasOpen = this.panelIsOpen();
	};

	/**
	 * Returns scroll top position when the panel is fully open.
	 * (In other words, the height of the area that is outside the screen, in pixels.)
	 *
	 * @return {number}
	 */
	MPSP.getScrollTopWhenOpen = function () {
		return this.$container.outerHeight() - parseInt( this.$aboveFold.css( 'min-height' ), 10 ) -
			parseInt( this.$aboveFold.css( 'padding-bottom' ), 10 );
	};

	/**
	 * Makes sure the panel does not contract when it is emptied and thus keeps its position as much as possible.
	 * This should be called when switching images, before the panel is emptied, and should be undone with
	 * unfreezeHeight after the panel has been populeted with the new metadata.
	 */
	MPSP.freezeHeight = function () {
		var scrollTop, scrollTopWhenOpen;

		if ( !this.$container.is( ':visible' ) ) {
			return;
		}

		scrollTop = $.scrollTo().scrollTop();
		scrollTopWhenOpen = this.getScrollTopWhenOpen();

		this.panelWasFullyOpen = ( scrollTop === scrollTopWhenOpen );
		this.$container.css( 'min-height', this.$container.height() );
	};

	MPSP.unfreezeHeight = function () {
		if ( !this.$container.is( ':visible' ) ) {
			return;
		}

		this.$container.css( 'min-height', '' );
		if ( this.panelWasFullyOpen ) {
			$.scrollTo( this.getScrollTopWhenOpen() );
		}
	};

	MPSP.initialize = function () {
		try {
			this.hasOpenedMetadata = !this.localStorage || this.localStorage.getItem( 'mmv.hasOpenedMetadata' );
		} catch ( e ) { // localStorage.getItem can throw exceptions
			this.hasOpenedMetadata = true;
		}
	};

	/**
	 * Animates the metadata area when the viewer is first opened.
	 */
	MPSP.animateMetadataOnce = function () {
		if ( !this.hasOpenedMetadata && !this.hasAnimatedMetadata ) {
			this.hasAnimatedMetadata = true;
			this.$container.addClass( 'invite' );
		}
	};

	/**
	 * Toggles the metadata div being totally visible.
	 *
	 * @param {string} [forceDirection] 'up' or 'down' makes the panel move on that direction (and is a noop
	 *  if the panel is already at the upmost/bottommost position); without the parameter, the panel position
	 *  is toggled. (Partially open counts as open.)
	 * @return {jQuery.Deferred} a deferred which resolves after the animation has finished.
	 */
	MPSP.toggle = function ( forceDirection ) {
		var deferred = $.Deferred(),
			scrollTopWhenOpen = this.getScrollTopWhenOpen(),
			scrollTopWhenClosed = 0,
			scrollTop = $.scrollTo().scrollTop(),
			panelIsOpen = scrollTop > scrollTopWhenClosed,
			direction = forceDirection || ( panelIsOpen ? 'down' : 'up' ),
			scrollTopTarget = ( direction === 'up' ) ? scrollTopWhenOpen : scrollTopWhenClosed;

		// don't log / animate if the panel is already in the end position
		if ( scrollTopTarget === scrollTop ) {
			deferred.resolve();
		} else {
			mw.mmv.actionLogger.log( direction === 'up' ? 'metadata-open' : 'metadata-close' );
			if ( direction === 'up' && !panelIsOpen ) {
				// FIXME nasty. This is not really an event but a command sent to the metadata panel;
				// child UI elements should not send commands to their parents. However, there is no way
				// to calculate the target scrollTop accurately without revealing the text, and the event
				// which does that (metadata-open) is only triggered later in the process, when the panel
				// actually scrolled, so we cannot use it here without risking triggering it multiple times.
				this.$container.trigger( 'mmv-metadata-reveal-truncated-text' );
				scrollTopTarget = this.getScrollTopWhenOpen();
			}
			$.scrollTo( scrollTopTarget, this.toggleScrollDuration, {
				onAfter: function () {
					deferred.resolve();
				}
			} );
		}
		return deferred;
	};

	/**
	 * Handles keydown events for this element.
	 *
	 * @param {jQuery.Event} e Key down event
	 */
	MPSP.keydown = function ( e ) {
		if ( e.altKey || e.shiftKey || e.ctrlKey || e.metaKey ) {
			return;
		}
		switch ( e.which ) {
			case 40: // Down arrow
				// fall through
			case 38: // Up arrow
				this.toggle();
				e.preventDefault();
				break;
		}
	};

	/**
	 * Returns whether the metadata panel is open. (Partially open is considered to be open.)
	 *
	 * @return {boolean}
	 */
	MPSP.panelIsOpen = function () {
		return $.scrollTo().scrollTop() > 0;
	};

	/**
	 * Receives the window's scroll events and and turns them into business logic events
	 *
	 * @fires mmv-metadata-open
	 * @fires mmv-metadata-close
	 */
	MPSP.scroll = function () {
		var panelIsOpen = this.panelIsOpen();

		if ( panelIsOpen && !this.panelWasOpen ) { // just opened
			this.$container.trigger( 'mmv-metadata-open' );
			// This will include keyboard- and mouseclick-initiated open events as well,
			// since the panel is anomated, which counts as scrolling.
			// Filtering these seems too much trouble to be worth it.
			mw.mmv.actionLogger.log( 'metadata-scroll-open' );
		} else if ( !panelIsOpen && this.panelWasOpen ) { // just closed
			this.$container.trigger( 'mmv-metadata-close' );
			mw.mmv.actionLogger.log( 'metadata-scroll-close' );
		}
		this.panelWasOpen = panelIsOpen;
	};

	mw.mmv.ui.MetadataPanelScroller = MetadataPanelScroller;
}( mediaWiki, jQuery, OO ) );
