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
	QUnit.module( 'mmv.provider.UserInfo', QUnit.newMwEnvironment() );

	QUnit.test( 'UserInfo constructor sanity check', 1, function ( assert ) {
		var api = { get: function() {} },
			userInfoProvider = new mw.mmv.provider.UserInfo( api );

		assert.ok( userInfoProvider );
	} );

	QUnit.asyncTest( 'UserInfo get test', 6, function ( assert ) {
		var apiCallCount = 0,
			api = { get: function() {
				apiCallCount++;
				return $.Deferred().resolve( {
					query: {
						users: [
							{
								userid: 4587601,
								name: 'Catrope',
								gender: 'male'
							}
						]
					}
				} );
			} },
			username = 'Catrope',
			repoInfo = {},
			foreignRepoInfo = { apiUrl: 'http://example.com/api.php' },
			userInfoProvider = new mw.mmv.provider.UserInfo( api );

		userInfoProvider.get( username, repoInfo ).then( function( user ) {
			assert.strictEqual( user.username, 'Catrope', 'username is set correctly' );
			assert.strictEqual( user.gender, mw.mmv.model.User.Gender.MALE, 'gender is set correctly' );
		} ).then( function() {
			assert.strictEqual( apiCallCount, 1 );
			// call the data provider a second time to check caching
			return userInfoProvider.get( username, repoInfo );
		} ).then( function() {
			assert.strictEqual( apiCallCount, 1 );
			// call a third time with a different user to check caching
			return userInfoProvider.get( 'OtherUser', repoInfo );
		} ).then( function() {
			assert.strictEqual( apiCallCount, 2 );
			// call again with a different repo to check caching
			return userInfoProvider.get( username, foreignRepoInfo );
		} ).then( function() {
			assert.strictEqual( apiCallCount, 3 );
			QUnit.start();
		} );
	} );

	QUnit.asyncTest( 'UserInfo missing data test', 1, function ( assert ) {
		var api = { get: function() {
				return $.Deferred().resolve( {} );
			} },
			username = 'Catrope',
			repoInfo = {},
			userInfoProvider = new mw.mmv.provider.UserInfo( api );

		userInfoProvider.get( username, repoInfo ).fail( function() {
			assert.ok( true, 'promise rejected when no data is returned' );
			QUnit.start();
		} );
	} );

	QUnit.asyncTest( 'UserInfo missing user test', 1, function ( assert ) {
		var api = { get: function() {
				return $.Deferred().resolve( {
					query: {
						users: []
					}
				} );
			} },
			username = 'Catrope',
			repoInfo = {},
			userInfoProvider = new mw.mmv.provider.UserInfo( api );

		userInfoProvider.get( username, repoInfo ).fail( function() {
			assert.ok( true, 'promise rejected when user is missing' );
			QUnit.start();
		} );
	} );

	QUnit.asyncTest( 'UserInfo missing gender test', 1, function ( assert ) {
		var api = { get: function() {
				return $.Deferred().resolve( {
					query: {
						users: [
							{
								userid: 4587601,
								name: 'Catrope'
							}
						]
					}
				} );
			} },
			username = 'Catrope',
			repoInfo = {},
			userInfoProvider = new mw.mmv.provider.UserInfo( api );

		userInfoProvider.get( username, repoInfo ).fail( function() {
			assert.ok( true, 'promise rejected when gender is missing' );
			QUnit.start();
		} );
	} );
}( mediaWiki, jQuery ) );