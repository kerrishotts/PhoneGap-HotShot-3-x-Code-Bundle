/**
 *
 * Tab View Controllers provide basic support for tabbed views
 *
 * @module tabViewController.js
 * @author Kerri Shotts
 * @version 0.4
 * ```
 * Copyright (c) 2013 Kerri Shotts, photoKandy Studios LLC
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
 * ```
 */
/*jshint
           asi:true,
           bitwise:true,
           browser:true,
           camelcase:true,
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
define( [ "yasmf/ui/core", "yasmf/ui/viewContainer", "yasmf/ui/event" ], function( UI,
  ViewContainer, Event ) {
  var _className = "TabViewController";
  var TabViewController = function() {
    var self = new ViewContainer();
    self.subclass( _className );
    // # Notifications
    //
    // * `viewsChanged` - Fired when the views change
    self.registerNotification( "viewsChanged" );
    // internal elements
    self._tabElements = []; // each tab on the tab bar
    self._tabBarElement = null; // contains our bar button group
    self._barButtonGroup = null; // contains all our tabs
    self._viewContainer = null; // contains all our subviews
    /**
     * Create the tab bar element
     * @method _createTabBarElement
     * @private
     */
    self._createTabBarElement = function() {
      self._tabBarElement = document.createElement( "div" );
      self._tabBarElement.className = "ui-tab-bar ui-tab-default-position";
      self._barButtonGroup = document.createElement( "div" );
      self._barButtonGroup.className = "ui-bar-button-group ui-align-center";
      self._tabBarElement.appendChild( self._barButtonGroup );
    }
    /**
     * Create the tab bar element if necessary
     * @method _createTabBarElementIfNecessary
     * @private
     */
    self._createTabBarElementIfNecessary = function() {
      if ( self._tabBarElement === null ) {
        self._createTabBarElement();
      }
    }
    /**
     * create the view container that will hold all the views this tab bar owns
     * @method _createViewContainer
     * @private
     */
    self._createViewContainer = function() {
      self._viewContainer = document.createElement( "div" );
      self._viewContainer.className =
        "ui-container ui-avoid-tab-bar ui-tab-default-position";
    }
    /**
     * @method _createViewContainerIfNecessary
     * @private
     */
    self._createViewContainerIfNecessary = function() {
      if ( self._viewContainer === null ) {
        self._createViewContainer();
      }
    }
    /**
     * Create all the elements and the DOM structure
     * @method _createElements
     * @private
     */
    self._createElements = function() {
      self._createTabBarElementIfNecessary();
      self._createViewContainerIfNecessary();
      self.element.appendChild( self._tabBarElement );
      self.element.appendChild( self._viewContainer );
    }
    /**
     * @method _createElementsIfNecessary
     * @private
     */
    self._createElementsIfNecessary = function() {
      if ( self._tabBarElement !== null || self._viewContainer !== null ) {
        return;
      }
      self._createElements();
    }
    /**
     * Create a tab element and attach the appropriate event listener
     * @method _createTabElement
     * @private
     */
    self._createTabElement = function( aView, idx ) {
      var e = document.createElement( "div" );
      e.className = "ui-bar-button ui-tint-color";
      e.innerHTML = aView.title;
      e.setAttribute( "data-tag", idx )
      Event.addListener( e, "touchstart", function() {
        self.selectedTab = parseInt( this.getAttribute( "data-tag" ), 10 );
      } );
      return e;
    }
    /**
     * The position of the the tab bar
     * Valid options include: `default`, `top`, and `bottom`
     * @property barPosition
     * @type {TabViewController.BAR\_POSITION}
     */
    self.setObservableBarPosition = function( newPosition, oldPosition ) {
      self._createElementsIfNecessary();
      self._tabBarElement.classList.remove( "ui-tab-" + oldPosition + "-position" );
      self._tabBarElement.classList.add( "ui-tab-" + newPosition + "-position" );
      self._viewContainer.classList.remove( "ui-tab-" + oldPosition + "-position" );
      self._viewContainer.classList.add( "ui-tab-" + newPosition + "-position" );
      return newPosition;
    }
    self.defineObservableProperty( "barPosition", {
      default: "default"
    } );
    /**
     * The alignment of the bar items
     * Valid options are: `left`, `center`, `right`
     * @property barAlignment
     * @type {TabViewController.BAR\_ALIGNMENT}
     */
    self.setObservableBarAlignment = function( newAlignment, oldAlignment ) {
      self._createElementsIfNecessary();
      self._barButtonGroup.classList.remove( "ui-align-" + oldAlignment );
      self._barButtonGroup.classList.add( "ui-align-" + newAlignment );
      return newAlignment;
    }
    self.defineObservableProperty( "barAlignment", {
      default: "center"
    } );
    /**
     * The array of views that this tab view controller manages.
     * @property subviews
     * @type {Array}
     */
    self.defineProperty( "subviews", {
      read: true,
      write: false,
      default: []
    } );
    /**
     * Add a subview to the tab bar.
     * @method addSubview
     * @property {ViewContainer} view
     */
    self.addSubview = function( view ) {
      self._createElementsIfNecessary();
      var e = self._createTabElement( view, self._tabElements.length );
      self._barButtonGroup.appendChild( e );
      self._tabElements.push( e );
      self._subviews.push( view );
      view.tabViewController = self;
      view.notify( "viewWasPushed" );
    }
    /**
     * Remove a specific view from the tab bar.
     * @method removeSubview
     * @property {ViewContainer} view
     */
    self.removeSubview = function( view ) {
      self._createElementsIfNecessary();
      var i = self._subviews.indexOf( view );
      if ( i > -1 ) {
        var hidingView = self._subviews[ i ];
        var hidingViewParent = hidingView.parentElement;
        if ( hidingViewParent !== null ) {
          hidingView.notify( "viewWillDisappear" );
        }
        hidingView.parentElement = null;
        if ( hidingViewParent !== null ) {
          hidingView.notify( "viewDidDisappear" );
        }
        self._subviews.splice( i, 1 );
        self._barButtonGroup.removeChild( self._tabElements[ i ] );
        self._tabElements.splice( i, 1 );
        var curSelectedTab = self.selectedTab;
        if ( curSelectedTab > i ) {
          curSelectedTab--;
        }
        if ( curSelectedTab > self._tabElements.length ) {
          curSelectedTab = self._tabElements.length;
        }
        self.selectedTab = curSelectedTab;
      }
      view.notify( "viewWasPopped" );
      delete view.tabViewController;
    }
    /**
     * Determines which tab is selected; changing will display the appropriate
     * tab.
     *
     * @property selectedTab
     * @type {Number}
     */
    self.setObservableSelectedTab = function( newIndex, oldIndex ) {
      var oldView, newView;
      self._createElementsIfNecessary();
      if ( oldIndex > -1 ) {
        oldView = self._subviews[ oldIndex ];
        if ( newIndex > -1 ) {
          newView = self._subviews[ newIndex ];
        }
        oldView.notify( "viewWillDisappear" );
        if ( newIndex > -1 ) {
          newView.notify( "viewWillAppear" );
        }
        oldView.parentElement = null;
        if ( newIndex > -1 ) {
          self._subviews[ newIndex ].parentElement = self._viewContainer;
        }
        oldView.notify( "viewDidDisappear" );
        if ( newIndex > -1 ) {
          newView.notify( "viewDidAppear" );
        }
      } else {
        newView = self._subviews[ newIndex ];
        newView.notify( "viewWillAppear" );
        self._subviews[ newIndex ].parentElement = self._viewContainer;
        newView.notify( "viewDidAppear" );
      }
      return newIndex;
    };
    self.defineObservableProperty( "selectedTab", {
      default: -1,
      notifyAlways: true
    } );
    /**
     * @method render
     */
    self.override( function render() {
      return ""; // nothing to render!
    } );
    /**
     * @method renderToElement
     */
    self.override( function renderToElement() {
      self._createElementsIfNecessary();
      return; // nothing to do.
    } );
    /**
     * Initialize the tab controller
     * @method init
     * @param {String} [theElementId]
     * @param {String} [theElementTag]
     * @param {String} [theElementClass]
     * @param {DOMElement} [theParentElement]
     * @return {Object}
     */
    self.override( function init( theElementId, theElementTag, theElementClass,
      theParentElement ) {
      // do what a normal view container does
      self.super( _className, "init", [ theElementId, theElementTag,
        theElementClass,
        theParentElement
      ] );
      return self;
    } );
    /**
     * Initialize the tab controller
     * @method initWithOptions
     * @param {Object} options
     * @return {Object}
     */
    self.override( function initWithOptions( options ) {
      var theElementId, theElementTag, theElementClass, theParentElement;
      if ( typeof options !== "undefined" ) {
        if ( typeof options.id !== "undefined" ) {
          theElementId = options.id;
        }
        if ( typeof options.tag !== "undefined" ) {
          theElementTag = options.tag;
        }
        if ( typeof options.class !== "undefined" ) {
          theElementClass = options.class;
        }
        if ( typeof options.parent !== "undefined" ) {
          theParentElement = options.parent;
        }
      }
      self.init( theElementId, theElementTag, theElementClass, theParentElement );
      if ( typeof options !== "undefined" ) {
        if ( typeof options.barPosition !== "undefined" ) {
          self.barPosition = options.barPosition;
        }
        if ( typeof options.barAlignment !== "undefined" ) {
          self.barAlignment = options.barAlignment;
        }
      }
      return self;
    } );
    // auto init
    self._autoInit.apply( self, arguments );
    return self;
  }
  TabViewController.BAR_POSITION = {
    default: "default",
    top: "top",
    bottom: "bottom"
  };
  TabViewController.BAR_ALIGNMENT = {
    center: "center",
    left: "left",
    right: "right"
  }
  return TabViewController;
} );
