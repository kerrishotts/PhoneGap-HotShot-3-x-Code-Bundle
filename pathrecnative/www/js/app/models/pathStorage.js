/**
 *
 * Path Storage
 *
 * pathStorage.js
 * @author Kerri Shotts
 * @version 2.0.0
 *
 * Copyright (c) 2013 Packt Publishing
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following
 * conditions:
 * The above copyright notice and this permission notice shall be included in all copies
 * or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
 * PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT
 * OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */
/*jshint
         asi:true,
         bitwise:true,
         browser:true,
         curly:true,
         eqeqeq:false,
         forin:true,
         noarg:true,
         noempty:true,
         plusplus:false,
         smarttabs:true,
         sub:true,
         trailing:false,
         undef:true,
         white:false,
         onevar:false 
 */
/*global define*/
define( [ "yasmf", "Q", "app/models/path" ], function( _y, Q, Path ) {
  var _generateUID = function() {
    return _y.datetime.getUnixTime();
  };
  var _className = "pathStorage";
  var pathStorage = function() {
    var self = new _y.BaseObject();
    self.subclass( _className );
    // the notifications we can send
    self.registerNotification( "collectionChanged" );
    self.registerNotification( "collectionLoading" );
    self.registerNotification( "collectionLoaded" );
    self.registerNotification( "collectionFailedLoading" );
    self.registerNotification( "collectionSaving" );
    self.registerNotification( "collectionSaved" );
    self.registerNotification( "collectionFailedSaving" );
    self.registerNotification( "pathChanged" );
    self.registerNotification( "pathSaved" );
    self.registerNotification( "pathFailedSaving" );
    self.registerNotification( "pathRemoved" );
    self.registerNotification( "pathFailedRemoving" );
    self.registerNotification( "pathCreated" );
    self._paths = [];
    self.getCollection = function() {
      return self._paths;
    }
    Object.defineProperty( self, "collection", {
      get: self.getCollection,
      configurable: true
    } );
    self.loadCollection = function() {
      self.notify( "collectionLoading" );
      try {
        var theCollection = localStorage.getItem( "paths" );
        if ( theCollection !== null ) {
          self._paths = JSON.parse( theCollection ).map( function( theUID ) {
            var thePathJSON = localStorage.getItem( "path" + theUID );
            var aPath = new Path();
            if ( aPath.initWithJSON( thePathJSON ) ) {
              return aPath;
            } else {
              self.notify( "collectionFailedLoading" );
            }
          } );
          self.notify( "collectionLoaded" );
        } else {
          self._paths = [];
          self.notify( "collectionLoaded" );
        }
      } catch ( e ) {
        self.notify( "collectionFailedLoading", [ e.message ] );
      }
    }
    self.saveCollection = function() {
      self.notify( "collectionSaving" );
      try {
        // filter out any null items (deleted paths)
        localStorage.setItem( "paths", JSON.stringify( self._paths.filter( function(
          thePath ) {
          return thePath !== null;
        } ).map( function( thePath ) {
          return thePath.UID;
        } ) ) );
        self.notify( "collectionSaving" );
      } catch ( anError ) {
        self.notify( "collectionFailedSaving", [ anError.message ] );
      }
    }
    self.createPath = function() {
      var aPath = new Path();
      aPath.initWithOptions( {
        "uid": _generateUID(),
        "name": _y.T( "app.ns.A_NEW_PATH" )
      } );
      self._paths.push( aPath );
      self.notify( "pathCreated", [ aPath.uid ] );
      self.savePath( aPath );
      return aPath;
    };
    self.getPathAtIndex = function( i ) {
      if ( ( i < self._paths.length ) && ( i > -1 ) ) {
        return self._paths[ i ];
      } else {
        throw new Error( "path index out of range" );
      }
    }
    self.getPathIndexByUID = function( theUID ) {
      // poor-man's .find(); .find is too recent (ecma 6)
      // instead reduce the array, searching for an item that matches our requirements,
      // and if found, return it. We we math.max to keep compare the current index to
      // the last one generated. -1 is not-found.
      var theIndex = self._paths.reduce( function( previousValue, currentValue, index,
        array ) {
        if ( array[ index ] !== null ) {
          return Math.max( ( array[ index ].UID == theUID ? index : -1 ),
            previousValue );
        } else {
          return previousValue;
        }
      }, -1 );
      return theIndex;
    }
    self.getPathByUID = function( theUID ) {
      var theIndex = self.getPathIndexByUID( theUID );
      if ( theIndex > -1 ) {
        return self.getPathAtIndex( theIndex );
      } else {
        return null;
      }
    }
    self.savePath = function( thePath ) {
      try {
        // attempt to deserialize the path
        var theJSON = thePath.JSON;
        localStorage.setItem( "path" + thePath.UID, theJSON );
        self.notify( "pathSaved", [ thePath.UID ] );
        self.notify( "collectionChanged" );
      } catch ( e ) {
        self.notify( "pathFailedSaving", [ thePath, e.message ] );
      }
    }
    self.removePathAtIndex = function( i ) {
      if ( ( i < self._paths.length ) && ( i > -1 ) ) {
        var theUID = self._paths[ i ].UID;
        self._paths[ i ] = null;
        self.notify( "pathRemoved", [ theUID ] );
        self.notify( "collectionChanged" );
      }
    }
    self.removePathByUID = function( theUID ) {
      self.removePathAtIndex( self.getPathIndexByUID( theUID ) );
    }
    self._collectionChangedListener = function() {
      self.saveCollection();
    }
    self.overrideSuper( self.class, "init", self.init );
    self.init = function() {
      self.super( _className, "init" );
      self.addListenerForNotification( "collectionChanged", self._collectionChangedListener );
    };
    return self;
  }
  _y.addTranslations( {
    "app.ns.A_NEW_PATH": {
      "en": "A New Path",
      "es": "Una Routa Nueva"
    }
  } );
  return pathStorage;
} );
