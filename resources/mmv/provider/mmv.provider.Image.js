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
	 * @class mw.mmv.provider.Image
	 * Loads an image.
	 */
	function Image() {
	}

	/**
	 * @method
	 * Loads an image and returns it.
	 * @param {string} url
	 * @return {jQuery.Promise<HTMLImageElement>} a promise which resolves to the image object
	 */
	Image.prototype.get = function( url ) {
		var img = new window.Image(),
			deferred = $.Deferred();

		img.src = url;
		img.onload = function() {
			deferred.resolve( img );
		};
		img.onerror = function() {
			deferred.reject( 'could not load image from ' + url );
		};

		return deferred.promise();
	};

	mw.mmv.provider.Image = Image;
}( mediaWiki, jQuery ) );