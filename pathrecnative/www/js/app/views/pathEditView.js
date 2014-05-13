/**
 *
 * Path Edit View
 *
 * pathEditView.js
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
/*global define, console, APP*/
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
    self._scrollContainer = null;
    self._mapContainer = null;
    // native controls
    self._navigationItem = null;
    self._locateButton = null;
    self._recordButton = null;
    self._renameButton = null;
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
        self._recordButton.image = "www/js/lib/yasmf-assets/circle-outlined";
      } else {
        self._watchID = navigator.geolocation.watchPosition( self._updateLastKnownPosition,
          self._geolocationError, {
            enableHighAccuracy: true
          } );
        self._recordButton.image = "www/js/lib/yasmf-assets/pause-filled";
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
      var anAlert = window.nativeControls.MessageBox();
      anAlert.title = _y.T( "ERROR" );
      anAlert.text = error.message;
      anAlert.addButtons( _y.T( "OK" ) );
      anAlert.cancelButtonIndex = 0;
      anAlert.show();
    }
    self.getPathUID = function() {
      return self._path.UID;
    }
    /**
     * Save the specific path
     */
    self.savePath = function() {
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
    self.renamePath = function() {
      var inputBox = window.nativeControls.MessageBox();
      inputBox.alertType = "input";
      inputBox.title = _y.T( "app.pev.action.RENAME_PATH" );
      inputBox.inputText = self._path.name;
      inputBox.addButtons( [ _y.T( "app.pev.RENAME" ), _y.T( "CANCEL" ) ] );
      inputBox.cancelButtonIndex = 1;
      inputBox.addEventListener( "tap", function( evt ) {
        var data = JSON.parse( atob( evt.data ) );
        if ( data.buttonPressed != inputBox.cancelButtonIndex ) {
          if ( data.values[ 0 ].trim() !== "" ) {
            self._path.name = data.values[ 0 ];
            self._navigationItem.title = data.values[ 0 ];
            self.savePath();
          }
        }
        inputBox.destroy();
      } );
      inputBox.show();
    }
    self.deletePath = function() {
      var areYouSure = window.nativeControls.ActionSheet();
      areYouSure.title = _y.T( "app.pev.action.DELETE_PATH" );
      areYouSure.text = _y.T(
        "app.pev.action.ARE_YOU_SURE_THIS_ACTION_CANT_BE_UNDONE" );
      areYouSure.addButtons( [ _y.T( "DELETE" ), _y.T( "CANCEL" ) ] );
      areYouSure.cancelButtonIndex = 1;
      areYouSure.destructiveButtonIndex = 0;
      areYouSure.addEventListener( "tap", function( evt ) {
        if ( evt.data == areYouSure.destructiveButtonIndex ) {
          pathStorageSingleton.removePathByUID( self._path.uid );
          self._path.uid = null;
          self.popNavigation();
        }
      } );
      areYouSure.show();
    }
    self.goBack = function() {
      if ( self._path.uid !== null ) {
        self.savePath();
      }
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
      self._scrollContainer = self.element.querySelector( ".ui-scroll-container" );
      self._mapContainer = self.element.querySelector( ".map-container" );
      // and make sure we know about the physical back button
      _y.UI.backButton.addListenerForNotification( "backButtonPressed", self.goBack );
      // create native controls
      self._navigationItem = window.nativeControls.NavigationItem();
      self._navigationItem.title = self._path.name;
      self._navigationItem.addEventListener( "pop", self.goBack );
      self._renameButton = window.nativeControls.BarTextButton();
      self._recordButton = window.nativeControls.BarImageButton();
      self._locateButton = window.nativeControls.BarImageButton();
      self._renameButton.addEventListener( "tap", self.renamePath );
      self._recordButton.addEventListener( "tap", self.togglePathRecording );
      self._locateButton.addEventListener( "tap", self.centerMapAroundLocation );
      self._renameButton.title = _y.T( "app.pev.RENAME" );
      self._recordButton.image = "www/js/lib/yasmf-assets/circle-outlined";
      self._locateButton.image = "www/js/lib/yasmf-assets/gps-locate";
      self._navigationItem.rightButtons = [ self._locateButton, self._recordButton ];
      self._navigationItem.leftButtons = [ self._renameButton ];
    }
    self.pushNavigation = function() {
      APP.navigationBars[ APP.navigationBars.length - 1 ].push( self._navigationItem );
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
    self.popNavigation = function() {
      APP.navigationBars[ APP.navigationBars.length - 1 ].pop();
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
      // we also need to listen for when we are pushed or popped
      self.addListenerForNotification( "viewWasPushed", self.registerGlobalNotifications );
      self.addListenerForNotification( "viewWasPushed", self.pushNavigation );
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
      self.removeListenerForNotification( "viewWasPushed", self.pushNavigation );
      self.releaseBackButton();
      // Stop listening for our disappearance
      self.removeListenerForNotification( "viewWasPopped", self.deregisterGlobalNotifications );
      self.removeListenerForNotification( "viewWasPushed", self.registerGlobalNotifications );
      self.removeListenerForNotification( "viewWasPopped", self.releaseBackButton );
      self.removeListenerForNotification( "viewWasPopped", self.destroy );
      // release our objects
      self._navigationBar = null;
      self._backButton = null;
      self._scrollContainer = null;
      self._nameEditor = null;
      self._mapContainer = null;
      self._currentPositionMarker = null;
      self._lastKnownPosition = null;
      self._map = null;
      self._polyline = null;
      // release our native objects
      self._recordButton.destroy();
      self._locateButton.destroy();
      self._navigationItem.destroy();
      self._navigationItem = null;
      self._recordButton = null;
      self._locateButton = null;
      self.super( _className, "destroy" );
    }
    return self;
  };
  /**
   * add translations we need
   */
  _y.addTranslations( {
    "app.pev.RENAME": {
      "EN": "Rename"
    },
    "app.pev.action.RENAME_PATH": {
      "EN": "Rename Path"
    },
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
