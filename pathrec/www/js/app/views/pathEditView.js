/**
 *
 * Path Edit View
 *
 * pathEditView.js
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
/*global define, console*/
define( [ "yasmf", "app/models/pathStorageSingleton", "text!html/pathEditView.html!strip",
  "app/views/staticView", "app/models/place", "gmaps", "hammer"
], function( _y, pathStorageSingleton, pathEditViewHTML, StaticView, Place, gmaps,
  Hammer ) {
  // store our classname for easy overriding later
  var _className = "PathEditView";
  var PathEditView = function() {
    // This time we descend from a simple ViewContainer
    var self = new _y.UI.ViewContainer();
    // always subclass
    self.subclass( _className );
    // our internal pointers to specific elements
    self._navigationBar = null;
    self._nameEditor = null;
    self._mapContainer = null;
    self._backButton = null;
    self._locateButton = null;
    self._recordButton = null;
    self._menuButton = null;
    // the path we're editing
    self._path = null;
    // the last known position
    self._lastKnownPosition = null;
    // the ID for the geolocation watch
    self._watchID = null;
    // google position marker
    self._currentPositionMarker = null;
    // indicates if the map should be kept centered
    self._keepMapCentered = true;
    // indicates if we are recording a path
    self._isRecording = false;
    self.getIsRecording = function() {
      return self._isRecording;
    }
    Object.defineProperty( self, "isRecording", {
      get: self.getIsRecording,
      configurable: true
    } );
    // the google map itself
    self._map = null;
    // and the polyline
    self._polyline = null;
    self._updateLastKnownPosition = function( position ) {
      // update our last known position
      if ( self._lastKnownPosition === null ) {
        self._lastKnownPosition = new Place();
        self._lastKnownPosition.init( position );
      } else {
        self._lastKnownPosition.position = position;
      }
      // get a Google Latitude/Longitude object
      var googleLatLong = self._lastKnownPosition.googleLatitudeLongitude;
      // pan to the center of the map
      if ( self._keepMapCentered ) {
        self._map.panTo( googleLatLong );
      }
      // update the current position marker's position
      self._currentPositionMarker.setPosition( googleLatLong );
      // if we're recording, add the position to the polyline
      // and create a new place and add it to our path
      if ( self._isRecording ) {
        self._polyline.getPath().push( googleLatLong );
        var newPlace = new Place();
        newPlace.init( position );
        self._path.addPlace( newPlace );
      }
    };
    self.togglePathRecording = function() {
      if ( self._isRecording ) {
        self._isRecording = false;
        navigator.geolocation.clearWatch( self._watchID );
        self._watchID = null;
        self._recordButton.classList.remove( "ui-glyph-pause-filled" );
        self._recordButton.classList.add( "ui-glyph-circle-outlined" );
      } else {
        self._watchID = navigator.geolocation.watchPosition( self._updateLastKnownPosition,
          self._geolocationError, {
            enableHighAccuracy: true
          } );
        self._recordButton.classList.remove( "ui-glyph-circle-outlined" );
        self._recordButton.classList.add( "ui-glyph-pause-filled" );
        self._isRecording = true;
      }
    }
    self.centerMapAroundLocation = function() {
      self._keepMapCentered = true;
      if ( !self._isRecording ) {
        navigator.geolocation.getCurrentPosition( self._updateLastKnownPosition, self
          ._geolocationError, {
            enableHighAccuracy: true
          } );
      }
    }
    self._geolocationError = function( error ) {
      // handle any errors appropriately in a production app
      var anAlert = new _y.UI.Alert.OK( {
        title: _y.T( "ERROR" ),
        text: error.message,
        buttons: [ _y.UI.Alert.button( _y.T( "DELETE" ), {
            type: "destructive"
          } ),
          _y.UI.Alert.button( _y.T( "CANCEL" ), {
            type: "bold",
            tag: -1
          } )
        ]
      } );
      anAlert.show();
    }
    self.getPathUID = function() {
      return self._path.UID;
    }
    /**
     * Save the specific path by copying the name and contents
     * from the DOM
     */
    self.savePath = function() {
      self._path.name = self._nameEditor.innerText;
      pathStorageSingleton.savePath( self._path );
    }
    self.popView = function() {
      // pops the view if we aren't in a split view
      // if we are, replaces it with a static view
      // stop recording first, though.
      if ( self._isRecording ) {
        self.togglePathRecording();
      }
      if ( typeof self.navigationController.splitViewController !== "undefined" ) {
        var staticView = new StaticView();
        staticView.initWithOptions();
        self.navigationController.splitViewController.rightView.rootView = staticView;
      } else {
        self.navigationController.popView();
      }
    }
    self.deletePath = function() {
      var areYouSure = new _y.UI.Alert();
      areYouSure.initWithOptions( {
        title: _y.T( "app.pev.action.DELETE_NOTE" ),
        text: _y.T( "app.pev.action.ARE_YOU_SURE_THIS_ACTION_CANT_BE_UNDONE" ),
        promise: true,
        buttons: [ _y.UI.Alert.button( _y.T( "DELETE" ), {
            type: "destructive"
          } ),
          _y.UI.Alert.button( _y.T( "CANCEL" ), {
            type: "bold",
            tag: -1
          } )
        ]
      } );
      areYouSure.show().then( function( idx ) {
        if ( idx > -1 ) {
          pathStorageSingleton.removePathByUID( self._path.uid );
          self.popView();
        }
      } ).catch( function( anError ) {
        return; // happens when a cancel button is pressed
      } ).done();
    }
    self.goBack = function() {
      self.savePath();
      self.popView();
    }
    self.overrideSuper( self.class, "render", self.render );
    self.render = function() {
      // no need to call super; it's abstract
      return _y.template( pathEditViewHTML, {
        "PATH_NAME": self._path.name,
        "BACK": _y.T( "BACK" )
      } );
    }
    self.overrideSuper( self.class, "renderToElement", self.renderToElement );
    self.renderToElement = function() {
      // call super, which will also get our HTML into the element
      self.super( _className, "renderToElement" );
      // and now find and link up any elements we want to keep track of
      self._navigationBar = self.element.querySelector( ".ui-navigation-bar" );
      self._nameEditor = self.element.querySelector( ".ui-navigation-bar .ui-title" );
      self._backButton = self.element.querySelector(
        ".ui-navigation-bar .ui-back-button" );
      self._menuButton = self.element.querySelector(
        ".ui-navigation-bar .ui-glyph-menu" );
      self._locateButton = self.element.querySelector(
        ".ui-navigation-bar .ui-glyph-gps-locate" );
      self._recordButton = self.element.querySelector(
        ".ui-navigation-bar .ui-glyph-circle-outlined" );
      self._mapContainer = self.element.querySelector( ".map-container" );
      // the back and delete buttons should have an event listener
      Hammer( self._backButton ).on( "tap", self.goBack );
      Hammer( self._menuButton, {
        prevent_default: true
      } ).on( "tap", function() {
        self.navigationController.splitViewController.toggleLeftView()
      } );
      Hammer( self._locateButton ).on( "tap", self.centerMapAroundLocation );
      Hammer( self._recordButton ).on( "tap", self.togglePathRecording );
      // and make sure we know about the physical back button
      _y.UI.backButton.addListenerForNotification( "backButtonPressed", self.goBack );
      setTimeout( function() {
        // create our Google Maps instance
        self._map = new gmaps.Map( self._mapContainer, {
          disableDefaultUI: true,
          center: new gmaps.LatLng( 40, -90 ),
          zoom: 15,
          mapTypeId: gmaps.MapTypeId.ROADMAP
        } );
        // intecept a drag gesture and disable map centering
        gmaps.event.addListener( self._map, 'dragstart', function() {
          self._keepMapCentered = false;
        } );
        // create the marker for the current position
        self._currentPositionMarker = new gmaps.Marker( {
          map: self._map,
          title: "Current Position"
        } );
        // and create a polyline that we can work with
        self._polyline = new gmaps.Polyline( {
          strokeColor: '#60E020',
          strokeOpacity: 0.85,
          strokeWeight: 10
        } );
        self._polyline.setMap( self._map );
        // add all the places in our path currently to the
        // polyline
        self._path.places.forEach( function( place ) {
          self._polyline.getPath().push( place.googleLatitudeLongitude );
        } )
      }, 100 );
    }
    self.registerGlobalNotifications = function registerGlobalNotifications() {
      _y.UI.globalNotifications.addListenerForNotification( "applicationPausing",
                                                           self.savePath );
    };
    self.deRegisterGlobalNotifications = function deRegisterGlobalNotifications() {
      _y.UI.globalNotifications.removeListenerForNotification( "applicationPausing",
                                                              self.savePath );
    }
    self.overrideSuper( self.class, "init", self.init );
    self.init = function( theParentElement, thePath ) {
      self._path = thePath;
      self.super( _className, "init", [ undefined, "div", self.class +
        " pathEditView ui-container", theParentElement
      ] );
      self.addListenerForNotification( "viewWasPopped", self.deRegisterGlobalNotifications );
      self.addListenerForNotification( "viewWasPopped", self.releaseBackButton );
      self.addListenerForNotification( "viewWasPopped", self.destroy );
      self.addListenerForNotification( "viewWasPushed", self.registerGlobalNotifications );
    }
    self.overrideSuper( self.class, "initWithOptions", self.init );
    self.initWithOptions = function( options ) {
      var theParentElement;
      var thePath;
      if ( typeof options !== "undefined" ) {
        if ( typeof options.parent !== "undefined" ) {
          theParentElement = options.parent;
        }
        if ( typeof options.path !== "undefined" ) {
          thePath = options.path;
        }
      }
      self.init( theParentElement, thePath );
    }
    self.releaseBackButton = function() {
      // and make sure we forget about the physical back button
      _y.UI.backButton.removeListenerForNotification( "backButtonPressed", self.goBack );
    }
    self.overrideSuper( self.class, "destroy", self.destroy );
    self.destroy = function() {
      self.releaseBackButton();
      // Stop listening for our disappearance
      self.removeListenerForNotification( "viewWasPopped", self.deregisterGlobalNotifications );
      self.removeListenerForNotification( "viewWasPushed", self.registerGlobalNotifications );
      self.removeListenerForNotification( "viewWasPopped", self.releaseBackButton );
      self.removeListenerForNotification( "viewWasPopped", self.destroy );
      // release our objects
      self._navigationBar = null;
      self._backButton = null;
      self._recordButton = null;
      self._locateButton = null;
      self._nameEditor = null;
      self._mapContainer = null;
      self._menuButton = null;
      self._currentPositionMarker = null;
      self._lastKnownPosition = null;
      self._map = null;
      self._polyline = null;
      self.super( _className, "destroy" );
    }
    return self;
  };
  /**
   * add translations we need
   */
  _y.addTranslations( {
    "app.pev.DELETE_PATH": {
      "EN": "Delete",
      "ES": "Eliminar"
    },
    "app.pev.action.DELETE_PATH": {
      "EN": "Delete Path"
    },
    "app.pev.action.ARE_YOU_SURE_THIS_ACTION_CANT_BE_UNDONE": {
      "EN": "Are you sure? This action can't be undone."
    },
    "app.pev.SAVE_PATH": {
      "EN": "Save"
    }
  } );
  return PathEditView;
} );
