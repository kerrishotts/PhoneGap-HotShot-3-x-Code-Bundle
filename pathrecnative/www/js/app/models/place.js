/**
 *
 * Place Model
 *
 * place.js
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
define( [ "yasmf", "gmaps" ], function( _y, gmaps ) {
  var _className = "Place";
  var Place = function() {
    // We descend from BaseObject
    var self = new _y.BaseObject();
    // subclass the base object
    self.subclass( _className );
    // register the notifications the model can send
    self.registerNotification( "positionChanged" )
    // the position all the other read-only properties use
    self._position = null;
    self.getPosition = function() {
      return self._position;
    }
    self.setPosition = function( position ) {
      var tempPosition = {};
      var properties = [ "latitude", "longitude", "altitude", "heading", "speed" ];
      var setProperty = function( property ) {
        if ( typeof position.coords !== "undefined" ) {
          if ( typeof position.coords[ property ] !== "undefined" ) {
            tempPosition.coords[ property ] = position.coords[ property ];
          }
        }
        if ( typeof position[ property ] !== "undefined" ) {
          tempPosition[ property ] = position[ property ];
        }
      }
      if ( typeof position !== "undefined" ) {
        if ( typeof position.timestamp !== "undefined" ) {
          tempPosition.timestamp = position.timestamp;
        }
        if ( typeof position.coords !== "undefined" ) {
          tempPosition.coords = {};
        }
        properties.forEach( setProperty );
      }
      self._position = tempPosition;
      self.notify( "positionChanged" );
    }
    Object.defineProperty( self, "position", {
      get: self.getPosition,
      set: self.setPosition,
      configurable: true
    } );
    // timestamp
    self.getTimestamp = function() {
      if ( self._position !== null ) {
        return self._position.timestamp;
      }
    }
    Object.defineProperty( self, "timestamp", {
      get: self.getTimestamp,
      configurable: true
    } );
    // coordinate properties
    self._getCoordinateProperty = function( theProperty ) {
      if ( self._position !== null ) {
        var coords = ( typeof self._position.coords !== "undefined" ) ? self._position
          .coords : self._position;
        return coords[ theProperty ];
      }
      return undefined;
    }
    self.getLatitude = function() {
      return self._getCoordinateProperty( "latitude" );
    }
    Object.defineProperty( self, "latitude", {
      get: self.getLatitude,
      configurable: true
    } );
    self.getLongitude = function() {
      return self._getCoordinateProperty( "longitude" );
    }
    Object.defineProperty( self, "longitude", {
      get: self.getLongitude,
      configurable: true
    } );
    self.getAltitude = function() {
      return self._getCoordinateProperty( "altitude" );
    }
    Object.defineProperty( self, "altitude", {
      get: self.getAltitude,
      configurable: true
    } );
    self.getHeading = function() {
      return self._getCoordinateProperty( "heading" );
    }
    Object.defineProperty( self, "heading", {
      get: self.getHeading,
      configurable: true
    } );
    self.getSpeed = function() {
      return self._getCoordinateProperty( "speed" );
    }
    Object.defineProperty( self, "speed", {
      get: self.getSpeed,
      configurable: true
    } );
    self.getFormattedLatitudeLongitude = function() {
      return self.latitude + "," + self.longitude;
    }
    Object.defineProperty( self, "formattedLatitudeLongitude", {
      get: self.getFormattedLatitudeLongitude,
      configurable: true
    } );
    self.getGoogleLatitudeLongitude = function() {
      return new gmaps.LatLng( self.latitude, self.longitude );
    }
    Object.defineProperty( self, "googleLatitudeLongitude", {
      get: self.getGoogleLatitudeLongitude,
      configurable: true
    } );
    self.getGoogleMarker = function( withMap ) {
      return new gmaps.Marker( {
        map: withMap,
        title: self.formattedLatitudeLongitude,
        draggable: false,
        position: self.googleLatitudeLongitude
      } );
    }
    self._serialize = function() {
      return JSON.stringify( {
        "timestamp": self.timestamp,
        "latitude": self.latitude,
        "longitude": self.longitude,
        "altitude": self.altitude,
        "heading": self.heading,
        "speed": self.speed
      } );
    }
    self._deserialize = function( theJSON ) {
      try {
        var parsedPosition = JSON.parse( theJSON );
        self.position = parsedPosition;
      } catch ( e ) {
        return false;
      }
    }
    Object.defineProperty( self, "JSON", {
      get: self._serialize,
      set: self._deserialize,
      configurable: true
    } );
    self.overrideSuper( self.class, "init", self.init )
    self.init = function( position ) {
      self.super( _className, "init" );
      if ( typeof position !== "undefined" ) {
        self.position = position;
      }
    }
    self.initWithJSON = function( theJSON ) {
      self.init();
      if ( typeof theJSON !== "undefined" ) {
        return self._deserialize( theJSON );
      } else {
        return false;
      }
    }
    // return our new object
    return self;
  };
  return Place;
} );
