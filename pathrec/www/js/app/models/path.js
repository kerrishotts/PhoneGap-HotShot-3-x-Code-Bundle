/**
 *
 * Path Model
 *
 * Path.js
 * @author Kerri Shotts
 * @version 1.0.0
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
define( [ "yasmf", "app/models/place" ], function( _y, Place ) {
  /**
   * Model supporting a path that contains a list of places.
   */
  var _className = "Path";
  var Path = function() {
    // We descend from BaseObject
    var self = new _y.BaseObject();
    // subclass the base object
    self.subclass( _className );
    // register the notifications the model can send
    self.registerNotification( "uidChanged" );
    self.registerNotification( "nameChanged" );
    self.registerNotification( "pathChanged" );
    // private properties are prefixed with _
    /**
     * The path's unique identifier. getUID is the getter, and
     * setUID is the setter. Two properties can be used to
     * access it: uid and UID.
     * @type {String}
     */
    self._uid = undefined;
    self.getUID = function() {
      return self._uid;
    }
    self.setUID = function( theUID ) {
      self._uid = theUID;
      self.notify( "uidChanged" );
    }
    Object.defineProperty( self, "UID", {
      get: self.getUID,
      set: self.setUID,
      configurable: true
    } );
    Object.defineProperty( self, "uid", {
      get: self.getUID,
      set: self.setUID,
      configurable: true
    } );
    /**
     * The date the path was created. Read-only; the createdDate
     * property only uses a getter (getCreatedDate).
     * @type {Date}
     */
    self._createdDate = undefined;
    /**
     * The date the path was modified. Read-only; the modifiedDate
     * property only uses a getter (getModifiedDate). It is reset
     * whenever the contents change or the name changes.
     * @type {Date}
     */
    self._modifiedDate = undefined; // and a modification date
    self.getCreatedDate = function() {
      return self._createdDate;
    }
    Object.defineProperty( self, "createdDate", {
      get: self.getCreatedDate,
      configurable: true
    } );
    self.getModifiedDate = function() {
      return self._modifiedDate;
    }
    Object.defineProperty( self, "modifiedDate", {
      get: self.getModifiedDate,
      configurable: true
    } );
    /**
     * The visible name of the path. Read-write with setName and
     * getName; the property is name.
     * @type {String}
     */
    self._name = "";
    self.getName = function() {
      return self._name;
    }
    self.setName = function( theName ) {
      self._name = theName;
      self._modifiedDate = new Date();
      self.notify( "nameChanged" );
    }
    Object.defineProperty( self, "name", {
      get: self.getName,
      set: self.setName,
      configurable: true
    } );
    self._places = [];
    self.getPlaces = function() {
      return self._places;
    }
    self.setPlaces = function( thePlaces ) {
      self._places = thePlaces;
      self.notify( "pathChanged" );
    }
    Object.defineProperty( self, "places", {
      get: self.getPlaces,
      set: self.setPlaces,
      configurable: true
    } );
    self.addPlace = function( aPlace ) {
      self._places.push( aPlace );
      self.notify( "pathChanged" );
      self._modifiedDate = new Date();
    }
    /**
     * Serializes the object into a JSON string ready
     * for saving in storage.
     * @return {String} JSON-style string of the object
     */
    self._serialize = function() {
      // serialize each place first
      var serializedPlaces = self._places.map( function( place ) {
        return place.JSON;
      } );
      return JSON.stringify( {
        "uid": self.uid,
        "createdDate": self.createdDate,
        "modifiedDate": self.modifiedDate,
        "name": self.name,
        "places": serializedPlaces
      } );
    }
    Object.defineProperty( self, "JSON", {
      get: self._serialize,
      configurable: true
    } );
    /**
     * Deserializes the JSON String passed in, and returns true if
     * successful, or false if there was an error.
     * @param  {String} theSerializedObject A JSON-style string
     * @return {Boolean} true if successful; false if not
     */
    self._deserialize = function( theSerializedObject ) {
      try {
        var aPath = JSON.parse( theSerializedObject );
        // once we have the JSON parsed, assign our values.
        self.uid = aPath.uid;
        self._createdDate = new Date( aPath.createdDate );
        self.name = aPath.name;
        // deserialize each place
        var serializedPlaces = aPath.places;
        self._places = serializedPlaces.map( function( JSON ) {
          var aNewPlace = new Place();
          aNewPlace.initWithJSON( JSON );
          return aNewPlace;
        } );
        // but assign this one last so we have the proper modification date
        self._modifiedDate = new Date( aPath.modifiedDate );
        return true;
      } catch ( e ) {
        return false;
      }
    };
    /**
     * The init function can take an optional UID parameter; if provided
     * uid is set to that; otherwise it is left at "".
     */
    self.overrideSuper( self.class, "init", self.init );
    self.init = function( theUID ) {
      self.super( _className, "init" ); // BaseObject super doesn't take any parameters
      self._createdDate = new Date(); // if not overridden otherwise, this will be the current datetime.
      if ( typeof theUID !== "undefined" ) {
        self.uid = theUID;
      }
    }
    /**
     * Initializes the path with the specified JSON; akin to initWithOptions.
     * @param  {String} theJSON The JSON representing the path
     * @return {Boolean}         True if successfully deserialized.
     */
    self.initWithJSON = function( theJSON ) {
      self.init();
      if ( typeof theJSON !== "undefined" ) {
        return self._deserialize( theJSON );
      } else {
        return false; // no JSON to init with.
      }
    }
    /**
     * Initialize the path with the values specified in options. The fieldnames in
     * options match those in the object, so uid, name, and places. Any options
     * not specified are left unspecified with no other defaults.
     * @param  {Object} options Properties
     * @return {Void}
     */
    self.initWithOptions = function( options ) {
      self.init();
      if ( typeof options !== "undefined" ) {
        if ( typeof options.uid !== "undefined" ) {
          self.uid = options.uid;
        }
        if ( typeof options.createdDate !== "undefined" ) {
          self._createdDate = options.createdDate;
        }
        if ( typeof options.name !== "undefined" ) {
          self.name = options.name;
        }
        if ( typeof options.places !== "undefined" ) {
          self.places = options.places;
        }
        if ( typeof options.modifiedDate !== "undefined" ) {
          self._modifiedDate = options.modifiedDate;
        }
      }
    }
    // return our new object
    return self;
  };
  return Path;
} );
