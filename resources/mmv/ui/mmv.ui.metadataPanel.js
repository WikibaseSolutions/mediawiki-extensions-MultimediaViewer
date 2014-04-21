/*
 * This file is part of the MediaWiki extension MultimediaViewer.
 *
 * MultimediaViewer is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * MultimediaViewer is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with MultimediaViewer.  If not, see <http://www.gnu.org/licenses/>.
 */

( function ( mw, $, oo ) {
	// Shortcut for prototype later
	var MPP;

	/**
	 * Represents the metadata panel in the viewer
	 * @class mw.mmv.ui.MetadataPanel
	 * @extends mw.mmv.ui.Element
	 * @constructor
	 * @param {jQuery} $container The container for the panel.
	 * @param {jQuery} $controlBar The control bar element.
	 */
	function MetadataPanel( $container, $controlBar ) {
		mw.mmv.ui.Element.call( this, $container );

		this.$controlBar = $controlBar;

		/**
		 * Whether we've fired an animation for the metadata div.
		 * @property {boolean}
		 * @private
		 */
		this.hasAnimatedMetadata = window.localStorage === undefined ||
			localStorage.getItem( 'mmv.hasOpenedMetadata' );

		/** @property {mw.mmv.HtmlUtils} htmlUtils - */
		this.htmlUtils = new mw.mmv.HtmlUtils();

		this.initializeHeader();
		this.initializeImageMetadata();
		this.initializeAboutLinks();
	}

	oo.inheritClass( MetadataPanel, mw.mmv.ui.Element );

	MPP = MetadataPanel.prototype;

	MPP.attach = function() {
		var panel = this;
		this.handleEvent( 'keydown', function ( e ) {
			panel.keydown( e );
		} );

		$.scrollTo().on( 'scroll.mmvp', $.throttle( 250, function() {
			panel.scroll();
		} ) );

		this.buttons.attach();
		this.fileReuse.attach();
	};

	MPP.unattach = function() {
		this.buttons.unattach();
		this.fileReuse.unattach();
		this.fileReuse.closeDialog();
		this.clearEvents();

		$.scrollTo().off( 'scroll.mmvp' );
	};

	MPP.empty = function () {
		this.$license.empty().addClass( 'empty' );
		this.$permissionLink.hide();

		this.buttons.empty();

		this.description.empty();
		this.categories.empty();
		this.fileUsage.empty();
		this.permission.empty();

		this.$title.empty().removeClass( 'error' );
		this.$credit.empty().addClass( 'empty' );

		this.$username.empty();
		this.$usernameLi.addClass( 'empty' );

		this.$repo.empty();
		this.$repoSubtitle.empty();
		this.$repoLi.addClass( 'empty' ).removeClass( 'remote local' );

		this.$datetime.empty();
		this.$datetimeLi.addClass( 'empty' );

		this.$location.empty();
		this.$locationLi.addClass( 'empty' );

		this.$dragIcon.removeClass( 'pointing-down' );

		this.progressBar.empty();

		// need to remove this to avoid animating again when reopening lightbox on same page
		this.$container.removeClass( 'invite' );

		this.fileReuse.empty();
	};

	// **********************************************
	// *********** Initialization methods ***********
	// **********************************************

	/**
	 * Initializes the header, which contains the title, credit, and license elements.
	 */
	MPP.initializeHeader = function () {
		var panel = this;

		this.progressBar = new mw.mmv.ui.ProgressBar( this.$controlBar );

		this.$dragBar = $( '<div>' )
			.addClass( 'mw-mmv-drag-affordance' )
			.appendTo( this.$controlBar )
			.click( function () {
				panel.toggle();
			} );

		this.$dragIcon = $( '<div>' )
			.addClass( 'mw-mmv-drag-icon' )
			.appendTo( this.$dragBar );

		this.$titleDiv = $( '<div>' )
			.addClass( 'mw-mmv-title-contain' )
			.appendTo( this.$controlBar );

		this.$container.append( this.$controlBar );

		this.initializeButtons(); // float, needs to be on top
		this.initializeTitleAndCredit();
		this.initializeLicense();
	};

	/**
	 * Initializes the title and credit elements.
	 */
	MPP.initializeTitleAndCredit = function () {
		this.$titleAndCredit = $( '<div>' )
			.addClass( 'mw-mmv-title-credit' )
			.appendTo( this.$titleDiv );

		this.initializeTitle();
		this.initializeCredit();
	};

	/**
	 * Initializes the title elements.
	 */
	MPP.initializeTitle = function () {
		this.$titlePara = $( '<p>' )
			.addClass( 'mw-mmv-title-para' )
			.appendTo( this.$titleAndCredit );

		this.$title = $( '<span>' )
			.addClass( 'mw-mmv-title' );

		this.title = new mw.mmv.ui.TruncatableTextField( this.$titlePara, this.$title );
	};

	/**
	 * Initializes the credit elements.
	 */
	MPP.initializeCredit = function () {
		this.$credit = $( '<p>' )
			.addClass( 'mw-mmv-credit empty' );

		this.creditField = new mw.mmv.ui.TruncatableTextField(
			this.$titleAndCredit,
			this.$credit,
			{ max: 200, small: 160 }
		);
	};

	/**
	 * Initializes the license elements.
	 */
	MPP.initializeLicense = function () {
		var panel = this;

		this.$license = $( '<a>' )
			.addClass( 'mw-mmv-license empty' )
			.prop( 'href', '#' )
			.appendTo( this.$titlePara );

		this.$permissionLink = $( '<span>' )
			.addClass( 'mw-mmv-permission-link mw-mmv-label' )
			.text( mw.message( 'multimediaviewer-permission-link' ).text() )
			.appendTo( this.$titlePara )
			.hide()
			.on( 'click', function() {
				panel.permission.grow();
				panel.scrollIntoView( panel.permission.$box, 500 );
			} );
	};

	MPP.initializeButtons = function () {
		this.buttons = new mw.mmv.ui.StripeButtons( this.$titleDiv, window.localStorage );
	};

	/**
	 * Initializes the main body of metadata elements.
	 */
	MPP.initializeImageMetadata = function () {
		this.$imageMetadata = $( '<div>' )
			.addClass( 'mw-mmv-image-metadata' )
			.appendTo( this.$container );

		this.$imageMetadataLeft = $( '<div>' )
			.addClass( 'mw-mmv-image-metadata-column mw-mmv-image-metadata-desc-column' )
			.appendTo( this.$imageMetadata );

		this.$imageMetadataRight = $( '<div>' )
			.addClass( 'mw-mmv-image-metadata-column mw-mmv-image-metadata-links-column' )
			.appendTo( this.$imageMetadata );

		this.description = new mw.mmv.ui.Description( this.$imageMetadataLeft );
		this.permission = new mw.mmv.ui.Permission( this.$imageMetadataLeft );
		this.initializeImageLinks();
	};

	/**
	 * Initializes the list of image metadata on the right side of the panel.
	 */
	MPP.initializeImageLinks = function () {
		this.$imageLinkDiv = $( '<div>' )
			.addClass( 'mw-mmv-image-links-div' )
			.appendTo( this.$imageMetadataRight );

		this.$imageLinks = $( '<ul>' )
			.addClass( 'mw-mmv-image-links' )
			.appendTo( this.$imageLinkDiv );

		this.initializeUploader();
		this.initializeDatetime();
		this.initializeLocation();
		this.initializeCategories();
		this.initializeRepoLink();

		this.fileReuse = new mw.mmv.ui.reuse.Dialog( this.$container, this.buttons.buttons.$reuse );

		this.fileUsage = new mw.mmv.ui.FileUsage(
			$( '<div>' ).appendTo( this.$imageMetadataRight )
		);
		this.fileUsage.init();
	};

	/**
	 * Initializes the upload date/time element.
	 */
	MPP.initializeDatetime = function () {
		this.$datetimeLi = $( '<li>' )
			.addClass( 'mw-mmv-datetime-li empty' )
			.appendTo( this.$imageLinks );

		this.$datetime = $( '<span>' )
			.addClass( 'mw-mmv-datetime' )
			.appendTo( this.$datetimeLi );
	};

	/**
	 * Initializes the link to the uploader's file page.
	 */
	MPP.initializeUploader = function () {
		this.$usernameLi = $( '<li>' )
			.addClass( 'mw-mmv-username-li empty' )
			.appendTo( this.$imageLinks );

		this.$username = $( '<a>' )
			.addClass( 'mw-mmv-username' )
			.prop( 'href', '#' )
			.appendTo( this.$usernameLi );
	};

	/**
	 * Initializes the geolocation element.
	 */
	MPP.initializeLocation = function () {
		this.$locationLi = $( '<li>' )
			.addClass( 'mw-mmv-location-li empty' )
			.appendTo( this.$imageLinks );

		this.$location = $( '<a>' )
			.addClass( 'mw-mmv-location' )
			.appendTo( this.$locationLi );
	};

	/**
	 * Initializes the list of categories of the image
	 */
	MPP.initializeCategories = function () {
		this.categories = new mw.mmv.ui.Categories(
			$( '<li>' )
				.addClass( 'mw-mmv-image-category' )
				.appendTo( this.$imageLinks )
		);
	};

	/**
	 * Initializes the link to the file page on the (maybe remote) repository.
	 */
	MPP.initializeRepoLink = function () {
		this.$repoLi = $( '<li>' )
			.addClass( 'mw-mmv-repo-li empty' )
			.appendTo( this.$imageLinks );

		this.$repo = $( '<a>' )
			.addClass( 'mw-mmv-repo' )
			.prop( 'href', '#' )
			.click( function ( e ) {
				var $link = $( this ),
					redirect;

				if ( e.altKey || e.shiftKey || e.ctrlKey || e.metaKey || e.button === 1 ) {
					// They are likely opening the link in a new window or tab
					mw.mmv.logger.log( 'site-link-click' );
					return;
				}

				// If it's a plain click, we need to wait for the logging to
				// be done before navigating to the desired page
				e.preventDefault();

				redirect = function () {
					window.location.href = $link.prop( 'href' );
				};

				// We want to redirect anyway, whether logging worked or not
				mw.mmv.logger.log( 'site-link-click' ).then( redirect, redirect );
			} )
			.appendTo( this.$repoLi );

		this.$repoSubtitle = $( '<span>' )
			.addClass( 'mw-mmv-repo-subtitle' )
			.appendTo( this.$repoLi );
	};

	/**
	 * Initializes two about links at the bottom of the panel.
	 */
	MPP.initializeAboutLinks = function () {
		var separator = ' | ';

		this.$mmvAboutLink = $( '<a>' )
			.prop( 'href', mw.config.get( 'wgMultimediaViewer' ).infoLink )
			.text( mw.message( 'multimediaviewer-about-mmv' ).text() )
			.addClass( 'mw-mmv-about-link' );

		this.$mmvDiscussLink = $( '<a>' )
			.prop( 'href', mw.config.get( 'wgMultimediaViewer' ).discussionLink )
			.text( mw.message( 'multimediaviewer-discuss-mmv' ).text() )
			.addClass( 'mw-mmv-discuss-link' );

		this.$mmvHelpLink = $( '<a>' )
			.prop( 'href', mw.config.get( 'wgMultimediaViewer' ).helpLink )
			.text( mw.message( 'multimediaviewer-help-mmv' ).text() )
			.addClass( 'mw-mmv-help-link' );

		this.$mmvAboutLinks = $( '<div>' )
			.addClass( 'mw-mmv-about-links' )
			.append(
				this.$mmvAboutLink,
				separator,
				this.$mmvDiscussLink,
				separator,
				this.$mmvHelpLink
			)
			.appendTo( this.$imageMetadata );
	};

	// *********************************
	// ******** Setting methods ********
	// *********************************

	/**
	 * Sets the URL for the File: page of the image
	 * @param {string} url
	 */
	MPP.setFilePageLink = function ( url ) {
		this.$repo.prop( 'href', url );
	};

	/**
	 * Sets the display name of the repository
	 * @param {mw.mmv.model.Repo} repoInfo
	 */
	MPP.setRepoDisplay = function ( repoInfo ) {
		var repositoryMessage,
			displayName = repoInfo.displayName || mw.config.get( 'wgSiteName' ),
			isCommons = repoInfo.isCommons();

		repositoryMessage = repoInfo.isLocal ?
			mw.message( 'multimediaviewer-repository-local' ).text() :
			mw.message( 'multimediaviewer-repository', displayName ).text();
		this.$repo.text( repositoryMessage );

		this.$repoLi.css( 'background-image',
			( repoInfo.favIcon && !isCommons ) ? 'url("' + repoInfo.favIcon + '")' : '' );

		this.$repoLi.toggleClass( 'commons', isCommons );
		this.$repoSubtitle.text(
			isCommons ? mw.message( 'multimediaviewer-commons-subtitle' ).text() : '' );

		this.$repoLi.removeClass( 'empty' );
	};

	/**
	 * Sets the link to the user page where possible
	 * @param {mw.mmv.model.Repo} repoData
	 * @param {string} username
	 * @param {string} gender
	 */
	MPP.setUserPageLink = function ( repoData, username, gender ) {
		var userpage = 'User:' + username,
			articlePath = repoData.getArticlePath(),
			userlink = articlePath.replace( '$1', userpage );

		this.$username
			.text(
				mw.message( 'multimediaviewer-userpage-link', username, gender ).text()
			)
			.prop( 'href', userlink );

		this.$usernameLi.toggleClass( 'empty', !username );
	};

	/**
	 * Sets the file title in the panel
	 * @param {string} title
	 */
	MPP.setFileTitle = function ( title ) {
		this.title.set( title );
	};

	/**
	 * Sets up the file reuse data in the DOM
	 * @param {mw.mmv.model.Image} image
	 * @param {mw.mmv.model.Repo} repo
	 * @param {string} caption
	 */
	MPP.setFileReuseData = function ( image, repo, caption ) {
		this.fileReuse.set( image, repo, caption );
	};

	/**
	 * Sets the upload or creation date and time in the panel
	 * @param {string} date The formatted date to set.
	 * @param {boolean} created Whether this is the creation date
	 */
	MPP.setDateTime = function ( date, created ) {
		this.$datetime.text(
			mw.message(
				'multimediaviewer-datetime-' + ( created ? 'created' : 'uploaded' ),
				date
			).text()
		);

		this.$datetimeLi.removeClass( 'empty' );
	};

	/**
	 * Bignasty function for setting source and author. Both #setAuthor and
	 * #setSource use this with some shortcuts.
	 * @param {string} source With unsafe HTML
	 * @param {string} author With unsafe HTML
	 */
	MPP.setCredit = function ( source, author ) {
		this.source = source || null;
		this.author = author || null;

		if ( author && source ) {
			this.creditField.set(
				mw.message(
					'multimediaviewer-credit',
					this.author,
					this.source
				).plain()
			);
		} else if ( author ) {
			this.creditField.set( this.author );
		} else if ( source ) {
			this.creditField.set( this.source );
		}
	};

	/**
	 * Sets the source in the panel
	 * @param {string} source Warning - unsafe HTML sometimes goes here
	 */
	MPP.setSource = function ( source ) {
		if ( source ) {
			source = $( '<span>' )
				.addClass( 'mw-mmv-source' )
				.append( $.parseHTML( source ) )
				.get( 0 ).outerHTML;
		}

		this.setCredit( source, this.author );
	};

	/**
	 * Sets the author in the panel
	 * @param {string} author Warning - unsafe HTML sometimes goes here
	 */
	MPP.setAuthor = function ( author ) {
		if ( author ) {
			author = $( '<span>' )
				.addClass( 'mw-mmv-author' )
				.append( $.parseHTML( author ) )
				.get( 0 ).outerHTML;
		}

		this.setCredit( this.source, author );
	};

	/**
	 * Sets the license display in the panel
	 * @param {mw.mmv.model.License|null} license license data (could be missing)
	 * @param {string} filePageUrl URL of the file description page
	 */
	MPP.setLicense = function ( license, filePageUrl ) {
		var shortName, url, isCc;

		if ( license ) {
			shortName = license.getShortName();
			url = license.deedUrl || filePageUrl;
			isCc = license.isCc();
		} else {
			shortName = mw.message( 'multimediaviewer-license-default' ).text();
			url = filePageUrl;
			isCc = false;
		}

		this.$license
			.text( shortName )
			.toggleClass( 'cc-license', isCc )
			.prop( 'href', url );

		this.$license.removeClass( 'empty' );
	};

	/**
	 * Set an extra permission text which should be displayed.
	 * @param {string} permission
	 */
	MPP.setPermission = function ( permission ) {
		this.$permissionLink.show();
		this.permission.set( permission );
	};

	/**
	 * Sets location data in the interface.
	 * @param {mw.mmv.model.Image} imageData
	 */
	MPP.setLocationData = function ( imageData ) {
		var latsec, latitude, latmsg, latdeg, latremain, latmin,
			longsec, longitude, longmsg, longdeg, longremain, longmin,
			language;

		if ( !imageData.hasCoords() ) {
			return;
		}

		latitude = imageData.latitude >= 0 ? imageData.latitude : imageData.latitude * -1;
		latmsg = 'multimediaviewer-geoloc-' + ( imageData.latitude >= 0 ? 'north' : 'south' );
		latdeg = Math.floor( latitude );
		latremain = latitude - latdeg;
		latmin = Math.floor( ( latremain ) * 60 );

		longitude = imageData.longitude >= 0 ? imageData.longitude : imageData.longitude * -1;
		longmsg = 'multimediaviewer-geoloc-' + ( imageData.longitude >= 0 ? 'east' : 'west' );
		longdeg = Math.floor( longitude );
		longremain = longitude - longdeg;
		longmin = Math.floor( ( longremain ) * 60 );

		longremain -= longmin / 60;
		latremain -= latmin / 60;
		latsec = Math.round( latremain * 100 * 60 * 60 ) / 100;
		longsec = Math.round( longremain * 100 * 60 * 60 ) / 100;

		this.$location.text(
			mw.message( 'multimediaviewer-geolocation',
				mw.message(
					'multimediaviewer-geoloc-coords',

					mw.message(
						'multimediaviewer-geoloc-coord',
						mw.language.convertNumber( latdeg ),
						mw.language.convertNumber( latmin ),
						mw.language.convertNumber( latsec ),
						mw.message( latmsg ).text()
					).text(),

					mw.message(
						'multimediaviewer-geoloc-coord',
						mw.language.convertNumber( longdeg ),
						mw.language.convertNumber( longmin ),
						mw.language.convertNumber( longsec ),
						mw.message( longmsg ).text()
					).text()
				).text()
			).text()
		);

		$.each(  mw.language.data, function( key, value ) {
			value = 'go away jshint';
			language = key;
			return false;
		} );

		this.$location.prop( 'href', (
			'//tools.wmflabs.org/geohack/geohack.php?pagename=' +
			'File:' + imageData.title.getMain() +
			'&params=' +
			Math.abs( imageData.latitude ) + ( imageData.latitude >= 0 ? '_N_' : '_S_' ) +
			Math.abs( imageData.longitude ) + ( imageData.longitude >= 0 ? '_E_' : '_W_' ) +
			'&language=' + language
		) );

		this.$locationLi.removeClass( 'empty' );
	};

	/**
	 * Set all the image information in the panel
	 * @param {mw.mmv.LightboxImage} image
	 * @param {mw.mmv.model.Image} imageData
	 * @param {mw.mmv.model.Repo} repoData
	 * @param {mw.mmv.model.FileUsage} localUsage
	 * @param {mw.mmv.model.FileUsage} globalUsage
	 * @param {mw.mmv.model.User} user
	 */
	MPP.setImageInfo = function ( image, imageData, repoData, localUsage, globalUsage, user ) {
		var panel = this,
			fileTitle = image.filePageTitle;

		this.setFileTitle( fileTitle.getNameText() );
		this.setRepoDisplay( repoData );
		this.setFilePageLink( imageData.descriptionUrl );

		if ( imageData.creationDateTime ) {
			// Use the raw date until moment can try to interpret it
			panel.setDateTime( imageData.creationDateTime );

			this.formatDate( imageData.creationDateTime ).then( function ( formattedDate ) {
				panel.setDateTime( formattedDate, true );
			} );
		} else if ( imageData.uploadDateTime ) {
			// Use the raw date until moment can try to interpret it
			panel.setDateTime( imageData.uploadDateTime );

			this.formatDate( imageData.uploadDateTime ).then( function ( formattedDate ) {
				panel.setDateTime( formattedDate );
			} );
		}

		if ( imageData.source ) {
			this.setSource( imageData.source );
		}

		if ( imageData.author ) {
			this.setAuthor( imageData.author );
		}

		this.buttons.set( imageData, repoData );
		this.description.set( imageData.description, image.caption );
		this.categories.set( repoData.getArticlePath(), imageData.categories );

		this.setLicense( imageData.license, imageData.descriptionUrl );

		if ( imageData.permission ) {
			this.setPermission( imageData.permission );
		}

		this.fileUsage.set( localUsage, globalUsage );

		this.setLocationData( imageData );

		if ( user ) {
			this.setUserPageLink( repoData, imageData.lastUploader, user.gender );
		}

		// File reuse steals a bunch of information from the DOM, so do it last
		this.setFileReuseData( imageData, repoData, image.caption );
	};

	/**
	 * Show an error message, in case the data could not be loaded
	 * @param {string} error
	 */
	MPP.showError = function ( error ) {
		this.$title.addClass( 'error' )
			.text( mw.message( 'multimediaviewer-metadata-error', error ).text() );
	};

	/**
	 * Transforms a date string into localized, human-readable format.
	 * Unrecognized strings are returned unchanged.
	 * @param {string} dateString
	 * @return {jQuery.Deferred}
	 */
	MPP.formatDate = function ( dateString ) {
		var deferred = $.Deferred(),
			date;

		mw.loader.using( 'moment', function () {
			date = moment( dateString );

			if ( date.isValid() ) {
				deferred.resolve( date.format( 'LL' ) );
			} else {
				deferred.resolve( dateString );
			}
		}, function ( error ) {
			deferred.reject( error );
			if ( window.console && window.console.error ) {
				window.console.error( 'mw.loader.using error when trying to load moment', error );
			}
		} );

		return deferred.promise();
	};

	/**
	 * Animates the metadata area when the viewer is first opened.
	 */
	MPP.animateMetadataOnce = function () {
		if ( !this.hasAnimatedMetadata ) {
			this.hasAnimatedMetadata = true;
			this.$container.addClass( 'invite' );
		} else {
			this.$container.addClass( 'invited' );
		}
	};

	// ********************************
	// ******** Action methods ********
	// ********************************

	/**
	 * Toggles the metadata div being totally visible.
	 */
	MPP.toggle = function ( forceDirection ) {
		var scrollTopWhenOpen = this.$container.outerHeight() - this.$controlBar.outerHeight(),
			scrollTopTarget = $.scrollTo().scrollTop() > 0 ? 0 : scrollTopWhenOpen;

		if ( forceDirection ) {
			scrollTopTarget = forceDirection === 'down' ? 0 : scrollTopWhenOpen;
		}

		$.scrollTo( scrollTopTarget, 400 );
	};

	/**
	 * Handles keydown events for this element.
	 */
	MPP.keydown = function ( e ) {
		switch ( e.which ) {
			case 40:
				// Down arrow
				this.toggle( 'down' );
				e.preventDefault();
				break;
			case 38:
				// Up arrow
				this.toggle( 'up' );
				e.preventDefault();
				break;
		}
	};

	/**
	 * Makes sure that the given element (which must be a descendant of the metadata panel) is
	 * in view. If it isn't, scrolls the panel smoothly to reveal it.
	 * @param {HTMLElement|jQuery|string} target
	 * @param {number} [duration] animation length
	 * @param {Object} [settings] see jQuery.scrollTo
	 */
	MPP.scrollIntoView = function( target, duration, settings ) {
		var $target = $( target ),
			targetHeight = $target.height(),
			targetTop = $target.offset().top,
			targetBottom = targetTop + targetHeight,
			viewportHeight = $(window).height(),
			viewportTop = $.scrollTo().scrollTop(),
			viewportBottom = viewportTop + viewportHeight;

		// we omit here a bunch of cases which are logically possible but unlikely given the size
		// of the panel, and only care about the one which will actually happen
		if ( targetHeight <= viewportHeight ) { // target fits into screen
			if (targetBottom > viewportBottom ) {
				$.scrollTo( viewportTop + ( targetBottom - viewportBottom ), duration, settings );
			}
		}
	};

	/**
	 * Receives the window's scroll events and flips the chevron if necessary.
	 */
	MPP.scroll = function () {
		var scrolled = !!$.scrollTo().scrollTop();

		this.$dragIcon.toggleClass( 'pointing-down', scrolled );

		if (
			!this.savedHasOpenedMetadata &&
			scrolled &&
			window.localStorage !== undefined
		) {
			localStorage.setItem( 'mmv.hasOpenedMetadata', true );
			this.savedHasOpenedMetadata = true;
		}
	};

	mw.mmv.ui.MetadataPanel = MetadataPanel;
}( mediaWiki, jQuery, OO ) );
