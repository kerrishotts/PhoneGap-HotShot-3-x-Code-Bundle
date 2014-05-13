/**
 *
 * Path List View
 *
 * pathListView.js
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
define( [ "yasmf", "app/models/pathStorageSingleton", "text!html/pathListView.html!strip",
  "text!html/pathListItem.html!strip", "app/views/staticView", "app/views/pathEditView",
  "hammer"
], function( _y, pathStorageSingleton, pathListViewHTML, pathListItemHTML, StaticView,
  PathEditView, Hammer ) {
  var _className = "PathListView";
  var PathListView = function() {
    // we descend from a simple ViewContainer
    var self = new _y.UI.ViewContainer();
    // always subclass
    self.subclass( _className );
    // our pointers into the DOM
    self._navigationBar = null;
    self._scrollContainer = null;
    self._pathList = null;
    self._addPathButton = null;
    self._menuButton = null;
    self._displayEditView = function( theView ) {
      if ( typeof self.navigationController.splitViewController !== "undefined" ) {
        var rightView = self.navigationController.splitViewController.rightView;
        if ( rightView.topView.class !== "StaticView" ) {
          if ( rightView.topView.isRecording ) {
            rightView.topView.togglePathRecording();
          }
          // we have an edit in-progress. Save it first.
          rightView.topView.savePath();
        }
        // change the root view of the right-side of the split view
        self.navigationController.splitViewController.rightView.rootView = theView;
        // hide our selves
        if ( self.navigationController.splitViewController.viewType !== "split" ) {
          self.navigationController.splitViewController.toggleLeftView();
        }
      } else {
        self.navigationController.pushView( theView );
      }
    }
    /**
     * Creates a new path; called when "New" is tapped
     */
    self.createNewPath = function() {
      // ask storage for a new path
      var aNewPath = pathStorageSingleton.createPath();
      // create a new editor view
      var aPathEditView = new PathEditView();
      aPathEditView.initWithOptions( {
        path: aNewPath
      } );
      self._displayEditView( aPathEditView );
    }
    /**
     * Edit an existing path. Called when a path is tapped in the list.
     */
    self.editExistingPath = function( e ) {
      // get the UID
      var theUID = this.getAttribute( "data-uid" );
      // create a new editor view
      var aPath = pathStorageSingleton.getPathByUID( theUID );
      var aPathEditView = new PathEditView();
      aPathEditView.initWithOptions( {
        path: aPath
      } );
      self._displayEditView( aPathEditView );
    }
    self.deleteExistingPath = function( e ) {
      // get the UID
      var theUID = this.getAttribute( "data-uid" );
      pathStorageSingleton.removePathByUID( theUID );
      // display a static view if we have a splitview, but only if we're deleting
      // the currently visible path
      if ( typeof self.navigationController.splitViewController !== "undefined" ) {
        var topView = self.navigationController.splitViewController.rightView.topView;
        if ( topView.class !== "StaticView" ) {
          if ( topView.getPathUID() == theUID ) {
            var staticView = new StaticView();
            staticView.initWithOptions();
            self.navigationController.splitViewController.rightView.rootView =
              staticView;
          }
        }
      }
    }
    self.popupActionsForPath = function( e ) {
      e.gesture.preventDefault();
      var theUID = this.getAttribute( "data-uid" );
      var anAlert = new _y.UI.Alert();
      anAlert.initWithOptions( {
        title: _y.T( "PATH_ACTIONS" ),
        text: _y.T( "SELECT_AN_ACTION_OR_CANCEL" ),
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
      anAlert.show().then( function( idx ) {
        if ( idx === 0 ) {
          pathStorageSingleton.removePathByUID( theUID );
        }
      } ).catch( function( e ) {
        console.log( "Promise rejected: " + e );
      } ).done();
    }
    self.exposeActionForPath = function( e ) {
      e.gesture.preventDefault();
      _y.UI.styleElement( this, "transition", "-webkit-transform 0.3s ease-in-out" );
      _y.UI.styleElement( this, "transition", "-moz-transform 0.3s ease-in-out" );
      _y.UI.styleElement( this, "transition", "-ms-transform 0.3s ease-in-out" );
      _y.UI.styleElement( this, "transition", "transform 0.3s ease-in-out" );
      // how far do we have to go?
      var amountToTranslate = getComputedStyle( self._pathList.querySelector(
        ".ui-list-action" ) ).getPropertyValue( "width" );
      _y.UI.styleElement( this, "transform", "translateX(-" + amountToTranslate + ")" );
    }
    self.hideActionForPath = function( e ) {
      e.gesture.preventDefault();
      _y.UI.styleElement( this, "transition", "-webkit-transform 0.3s ease-in-out" );
      _y.UI.styleElement( this, "transition", "-moz-transform 0.3s ease-in-out" );
      _y.UI.styleElement( this, "transition", "-ms-transform 0.3s ease-in-out" );
      _y.UI.styleElement( this, "transition", "transform 0.3s ease-in-out" );
      _y.UI.styleElement( this, "transform", "translateX(0px)" );
    }
    self.quitApp = function() {
      navigator.app.exitApp();
    }
    /**
     * Render the template, passing the app title and translated text
     */
    self.overrideSuper( self.class, "render", self.render );
    self.render = function() {
      // no need to call super; it's abstract
      return _y.template( pathListViewHTML, {
        "APP_TITLE": _y.T( "APP_TITLE" ),
        "NEW_PATH": _y.T( "NEW_PATH" )
      } );
    }
    /**
     * RenderToElement renders the HTML, finds all the elements we want to
     * have references to and attaches handlers if necessary,
     * and attaches a listener to the backButton handler.
     */
    self.overrideSuper( self.class, "renderToElement", self.renderToElement );
    self.renderToElement = function() {
      // call super, which will also get our HTML into the element
      self.super( _className, "renderToElement" );
      // and now find and link up any elements we want to keep track of
      self._navigationBar = self.element.querySelector( ".ui-navigation-bar" );
      self._scrollContainer = self.element.querySelector( ".ui-scroll-container" );
      self._pathList = self.element.querySelector( ".ui-list" );
      // all our buttons:
      self._addPathButton = self.element.querySelector(
        ".ui-navigation-bar .ui-glyph-plus" );
      self._menuButton = self.element.querySelector(
        ".ui-navigation-bar .ui-glyph-menu" );
      Hammer( self._addPathButton, {
        prevent_default: true
      } ).on( "tap", self.createNewPath );
      Hammer( self._menuButton, {
        prevent_default: true
      } ).on( "tap", function() {
        self.navigationController.splitViewController.toggleLeftView()
      } );
      // and make sure we know about the physical back button
      _y.UI.backButton.addListenerForNotification( "backButtonPressed", self.quitApp );
    }
    /**
     * Render the path list; called whenever the storage collection changes
     */
    self.renderList = function() {
      if ( _y.device.isTablet() && parseInt( window.getComputedStyle( self.element ).getPropertyValue(
        "width" ), 10 ) >= 320 ) {
        self.element.classList.add( "wide" );
      }
      var paths = pathStorageSingleton.collection;
      var fragment = document.createDocumentFragment();
      paths.forEach( function( path ) {
        if ( path !== null ) {
          // each entry is a li.ui-list-item with data-uid attribute and path_item_% as the id.
          var e = document.createElement( "li" );
          e.className = "ui-list-item";
          e.setAttribute( "data-uid", path.uid );
          e.id = "path_item_" + path.uid;
          // render the path item template
          e.innerHTML = _y.template( pathListItemHTML, {
            "UID": path.uid,
            "TRASH": _y.T( "TRASH" ),
            "NAME": path.name
          } );
          // attach any event handlers
          var contentsElement = e.querySelector( ".ui-list-item-contents" ),
            actionElement = e.querySelector( ".ui-list-action" );
          Hammer( contentsElement, {} ).on( "tap", self.editExistingPath );
          if ( !self.element.classList.contains( "wide" ) ) {
            // the following is applicable only when we're rendering a list view
            // (not a thumbnail view)
            Hammer( contentsElement, {
              swipe_velocity: 0.1,
              drag_block_horizontal: true,
              drag_block_vertical: true,
              prevent_default: true
            } ).on( "dragleft", self.exposeActionForPath );
            Hammer( contentsElement, {
              swipe_velocity: 0.1,
              drag_block_horizontal: true,
              drag_block_vertical: true,
              prevent_defaut: true
            } ).on( "dragright", self.hideActionForPath );
            Hammer( actionElement, {
              prevent_default: true
            } ).on( "tap", self.deleteExistingPath );
          } else {
            // but we'll allow a long-press on the item instead
            Hammer( contentsElement ).on( "hold", self.popupActionsForPath );
          }
          // append the element to our list
          fragment.appendChild( e );
        }
      } );
      self._pathList.innerHTML = "";
      self._pathList.appendChild( fragment );
    }
    self.onOrientationChanged = function() {
      // fix a iOS bug where rotation may prevent the list from scrolling after rotation
      if ( _y.device.platform() == "ios" ) {
        // this forces the scroll container to be recalc'd. It also flickers a bit.
        // no way to avoid it, unfortunately. 
        self._scrollContainer.style.display = "none";
        setTimeout( function() {
          self._scrollContainer.style.display = "";
        }, 0 );
      }
    }
    /**
     * Initialize the view and add listeners for the storage
     * collection so that when it changes, we can update appropriately
     */
    self.overrideSuper( self.class, "init", self.init );
    self.init = function( theParentElement ) {
      // call super
      self.super( _className, "init", [ undefined, "div", "pathListView ui-container",
        theParentElement
      ] );
      // register for changes in the path collection
      pathStorageSingleton.addListenerForNotification( "collectionChanged", self.renderList );
      pathStorageSingleton.addListenerForNotification( "collectionLoaded", self.renderList );
      // and ask pathStorage to load itself
      pathStorageSingleton.loadCollection();
      // we need to register for orientation changes
      _y.UI.orientationHandler.addListenerForNotification( "orientationChanged", self
        .onOrientationChanged );
    }
    self.overrideSuper( self.class, "initWithOptions", self.init );
    self.initWithOptions = function( options ) {
      var theParentElement;
      if ( typeof options !== "undefined" ) {
        if ( typeof options.parent !== "undefined" ) {
          theParentElement = options.parent;
        }
      }
      self.init( theParentElement );
    }
    /**
     * Be a good citizen. Clean up after ourselves when asked.
     */
    self.overrideSuper( self.class, "destroy", self.destroy );
    self.destroy = function() {
      // stop listening for orientation changes
      _y.UI.orientationHandler.removeListenerForNotification( "orientationChanged",
        self.onOrientationChanged );
      // release our objects
      self._navigationBar = null;
      self._addPathButton = null;
      self._scrollContainer = null;
      self._pathList = null;
      self._menuButton = null;
      self.super( _className, "destroy" );
    }
    return self;
  };
  /**
   * Add the necessary translations
   */
  _y.addTranslations( {
    "APP_TITLE": {
      "EN": "PathRec"
    },
    "NEW_PATH": {
      "EN": "New",
      "ES": "Nueva"
    },
    "BACK": {
      "EN": "Back",
      "ES": "Volver"
    },
    "TRASH": {
      "EN": "Trash",
      "ES": "Basura"
    },
    "CANCEL": {
      "EN": "Cancel",
      "ES": "Cancelar"
    },
    "DELETE": {
      "EN": "Delete",
      "ES": "Eliminar"
    },
    "PATH_ACTIONS": {
      "EN": "Path Actions",
      "ES": "Acciónes para la routa"
    },
    "SELECT_AN_ACTION_OR_CANCEL": {
      "EN": "Select an action or cancel.",
      "ES": "Seleccione un acción o cancelar."
    }
  } );
  return PathListView;
} );
