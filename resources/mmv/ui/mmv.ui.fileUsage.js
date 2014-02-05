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

( function ( mw, $ ) {
	/**
	 * File usage interface (what wiki pages is this file used on?)
	 * @class mw.mmv.interface.FileUsage
	 * @constructor
	 * @param {jQuery} $container
	 */
	function FileUsage( $container ) {
		/**
		 * The HTML element in which the file usage shall be shown.
		 * @property {jQuery}
		 */
		this.$container = $container;

		/**
		 * The title of the file usage block.
		 * @property {jQuery}
		 */
		this.$title = null;

		/**
		 * The list which contains the wiki pages using the file (and also some miscellaneous
		 * stuff like 'view more' links).
		 * @property {jQuery}
		 */
		this.$usageList = null;
	}

	/** Never show more than this many local usages */
	FileUsage.prototype.MAX_LOCAL = 3;
	/** Never show more than this many global usages */
	FileUsage.prototype.MAX_GLOBAL = 3;

	/**
	 * Sets up the interface. Must be called before any other methods.
	 */
	FileUsage.prototype.init = function() {
		this.$title = $( '<h3>' ).appendTo( this.$container );
		this.$usageList = $( '<ul>' ).appendTo( this.$container );
		this.$container.addClass( 'mw-mlb-fileusage-container' );
	};

	/**
	 * Clears the interface.
	 */
	FileUsage.prototype.empty = function() {
		this.$title.text( '' );
		this.$usageList.empty();
		this.$container.addClass( 'empty' );
	};

	/**
	 * Displays file usage based on the passed usage objects..
	 * @param {mw.mmv.model.FileUsage} localUsage
	 * @param {mw.mmv.model.FileUsage} globalUsage
	 */
	FileUsage.prototype.set = function( localUsage, globalUsage ) {
		var usageCount = localUsage.totalCount + globalUsage.totalCount,
			countMessage = 'multimediaviewer-fileusage-count';

		if ( localUsage.totalCount || globalUsage.totalCount ) {
			this.$container.removeClass( 'empty' );

			if ( localUsage.totalCountIsLowerBound || globalUsage.totalCountIsLowerBound ) {
				// "more than 100 uses" sounds nicer than "more than 103 uses"
				usageCount = Math.max( localUsage.totalCount, globalUsage.totalCount );
				countMessage = 'multimediaviewer-fileusage-count-more';
			}
			this.$title.msg( countMessage, mw.language.convertNumber( usageCount ) );

			this.$usageList.empty();
			this.addSection( localUsage, mw.mmv.model.FileUsage.Scope.LOCAL, this.MAX_LOCAL,
				this.getLocalUsageUrl( localUsage.file ) );
			this.addSection( globalUsage, mw.mmv.model.FileUsage.Scope.GLOBAL, this.MAX_GLOBAL,
				this.getGlobalUsageUrl( globalUsage.file ) );
		} else {
			this.empty();
		}
	};

	/**
	 * Adds a usage section to the list - a title, a list of links, and a 'view more' link
	 * (some or all of these might be omitted when it makes sense).
	 * @param {mw.mmv.model.FileUsage} fileUsage
	 * @param {mw.mmv.model.FileUsage.Scope} sectionType will be used for the section title
	 * @param {number} limit max number of entries to show
	 * @param {string} viewAllLink a link for the rest of entries, if there are more than the limit
	 * @protected
	 */
	FileUsage.prototype.addSection = function( fileUsage, sectionType, limit, viewAllLink ) {
		var $section;

		if ( fileUsage.totalCount ) {
			$section = $( '<li>' ).addClass( 'mw-mlb-fileusage-' + sectionType + '-section' )
					.msg( 'multimediaviewer-fileusage-' + sectionType + '-section' );

			this.$usageList.append( $section );
			this.addPageLinks( fileUsage.pages.slice( 0, limit ) );

			if ( fileUsage.pages.length > limit ) {
				this.addViewAllLink( $section, viewAllLink );
			}
		}
	};

	/**
	 * Appends links pointing to the given pages to the end of the usage list.
	 * @param {{wiki: (string|null), page: mw.Title}[]} pages
	 * @protected
	 */
	FileUsage.prototype.addPageLinks = function( pages ) {
		var ui = this;

		this.$usageList.append( $.map( pages, function( item ) {
			var pageUrl = ui.getFileUrl( item.page, item.wiki ),
				pageLink = $( '<a>' ).attr( 'href', pageUrl ).text( item.page.getMainText() );

			if ( item.wiki ) {
				// external link - show the wiki name next to it
				return $( '<li>' ).append( pageLink ).append(
					$( '<aside>' ).text( item.wiki )
				);
			} else {
				return $( '<li>' ).append( pageLink );
			}
		} ) );
	};

	/**
	 * Adds a 'View all' link (with the given URL) to the end of the usage list.
	 * @param {jQuery} $section file usage section element
	 * @param {string} url
	 * @protected
	 */
	FileUsage.prototype.addViewAllLink = function( $section, url ) {
		$section.append(
			$( '<span>' ).addClass( 'mw-mlb-fileusage-view-all' ).append(
				$( '<a>' ).msg( 'multimediaviewer-fileusage-link' )
					.attr( 'href', url )
			)
		);
	};

	/**
	 * Returns an URL to the given file.
	 * @param {mw.Title} page
	 * @param {string} wiki domain name
	 * @protected
	 */
	FileUsage.prototype.getFileUrl = function( page, wiki ) {
		// TODO the nice way to handle this would be to have a mw.IwTitle class for interwiki links
		if ( wiki ) {
			return new mw.Uri( wiki + page.getUrl() ).toString();
		} else {
			return page.getUrl();
		}
	};

	/**
	 * Creates a Special:WhatLinksHere link for the given file.
	 * @param {mw.Title} file
	 * @protected
	 */
	FileUsage.prototype.getLocalUsageUrl = function( file ) {
		// TODO special page name should be localized
		return new mw.Uri( mw.config.get( 'wgScript' ) ).extend( {
			title: 'Special:WhatLinksHere/' + file.getPrefixedDb(),
			hidetrans: 1,
			hidelinks: 1,
			hideredirs: 1
		} ).toString();
	};

	/**
	 * Creates a Special:GlobalUsage link for the given file.
	 * @param {mw.Title} file
	 * @protected
	 */
	FileUsage.prototype.getGlobalUsageUrl = function( file ) {
		// TODO special page name should be localized
		return new mw.Uri( mw.config.get( 'wgScript' ) ).extend( {
			title: 'Special:GlobalUsage',
			target: file.getMain(),
			filterlocal: 1
		} ).toString();
	};

	mw.mmv.ui = mw.mmv.ui || {};
	mw.mmv.ui.FileUsage = FileUsage;
} ) ( mediaWiki, jQuery );