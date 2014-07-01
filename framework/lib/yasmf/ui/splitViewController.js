/**
 *
 * Split View Controllers provide basic support for side-by-side views
 *
 * @module splitViewController.js
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
define( [ "yasmf/ui/core", "yasmf/ui/viewContainer" ], function( UI, ViewContainer ) {
  var _className = "SplitViewController";
  var SplitViewController = function() {
    var self = new ViewContainer();
    self.subclass( _className );
    // # Notifications
    //
    // * `viewsChanged` - fired when the left or right side view changes
    //
    self.registerNotification( "viewsChanged" );
    /**
     * Indicates the type of split canvas:
     *
     * * `split`: typical split-view - left and right side shares space on screen
     * * `off-canvas`: off-canvas view AKA Facebook split view. Left side is off screen and can slide in
     * * `split-overlay`: left side slides over the right side when visible
     *
     * @property viewType
     * @type {String}
     */
    self.setViewType = function( theViewType ) {
      self.element.classList.remove( "ui-" + self._viewType + "-view" );
      self._viewType = theViewType;
      self.element.classList.add( "ui-" + theViewType + "-view" );
      self.leftViewStatus = "invisible";
    }
    self.defineProperty( "viewType", {
      read: true,
      write: true,
      default: "split"
    } );
    /**
     * Indicates whether or not the left view is `visible` or `invisible`.
     *
     * @property leftViewStatus
     * @type {String}
     */
    self.setLeftViewStatus = function( viewStatus ) {
      self.element.classList.remove( "ui-left-side-" + self._leftViewStatus );
      self._leftViewStatus = viewStatus;
      self.element.classList.add( "ui-left-side-" + viewStatus );
    }
    self.defineProperty( "leftViewStatus", {
      read: true,
      write: true,
      default: "invisible"
    } );
    /**
     * Toggle the visibility of the left side view
     * @method toggleLeftView
     */
    self.toggleLeftView = function() {
      if ( self.leftViewStatus === "visible" ) {
        self.leftViewStatus = "invisible";
      } else {
        self.leftViewStatus = "visible";
      }
    }
    /**
     * The array of views that this split view controller manages.
     * @property subviews
     * @type {Array}
     */
    self.defineProperty( "subviews", {
      read: true,
      write: false,
      default: [ null, null ]
    } );
    // internal elements
    self._leftElement = null;
    self._rightElement = null;
    /**
     * Create the left and right elements
     * @method _createElements
     * @private
     */
    self._createElements = function() {
      if ( self._leftElement !== null ) {
        self.element.removeChild( self._leftElement );
      }
      if ( self._rightElement !== null ) {
        self.element.removeChild( self._rightElement );
      }
      self._leftElement = document.createElement( "div" );
      self._rightElement = document.createElement( "div" );
      self._leftElement.className = "ui-container left-side";
      self._rightElement.className = "ui-container right-side";
      self.element.appendChild( self._leftElement );
      self.element.appendChild( self._rightElement );
    }
    /**
     * Create the left and right elements if necessary
     * @method _createElementsIfNecessary
     * @private
     */
    self._createElementsIfNecessary = function() {
      if ( self._leftElement !== null && self._rightElement !== null ) {
        return;
      }
      self._createElements();
    }
    /**
     * Assigns a view to a given side
     * @method _assignViewToSide
     * @param {DOMElement} whichElement
     * @param {ViewContainer} aView
     * @private
     */
    self._assignViewToSide = function( whichElement, aView ) {
      self._createElementsIfNecessary();
      aView.splitViewController = self;
      aView.notify( "viewWasPushed" ); // notify the view it was "pushed"
      aView.notify( "viewWillAppear" ); // notify the view it will appear
      aView.parentElement = whichElement; // and make us the parent
      aView.notify( "viewDidAppear" ); // and notify it that it's actually there.
    };
    /**
     * Unparents a view on a given side, sending all the requisite notifications
     *
     * @method _unparentSide
     * @param {Number} sideIndex
     * @private
     */
    self._unparentSide = function( sideIndex ) {
      if ( self._subviews.length >= sideIndex ) {
        var aView = self._subviews[ sideIndex ];
        if ( aView !== null ) {
          aView.notify( "viewWillDisappear" ); // notify the view that it is going to disappear
          aView.parentElement = null; // remove the view
          aView.notify( "viewDidDisappear" ); // notify the view that it did disappear
          aView.notify( "viewWasPopped" ); // notify the view that it was "popped"
          delete aView.splitViewController;
        }
      }
    };
    /**
     * Allows access to the left view
     * @property leftView
     * @type {ViewContainer}
     */
    self.getLeftView = function() {
      if ( self._subviews.length > 0 ) {
        return self._subviews[ 0 ];
      } else {
        return null;
      }
    }
    self.setLeftView = function( aView ) {
      self._unparentSide( 0 ); // send disappear notices
      if ( self._subviews.length > 0 ) {
        self._subviews[ 0 ] = aView;
      } else {
        self._subviews.push( aView );
      }
      self._assignViewToSide( self._leftElement, aView );
      self.notify( "viewsChanged" );
    }
    self.defineProperty( "leftView", {
      read: true,
      write: true,
      backingVariable: false
    } );
    /**
     * Allows access to the right view
     * @property rightView
     * @type {ViewContainer}
     */
    self.getRightView = function() {
      if ( self._subviews.length > 1 ) {
        return self._subviews[ 1 ];
      } else {
        return null;
      }
    }
    self.setRightView = function( aView ) {
      self._unparentSide( 1 ); // send disappear notices for right side
      if ( self._subviews.length > 1 ) {
        self._subviews[ 1 ] = aView;
      } else {
        self._subviews.push( aView );
      }
      self._assignViewToSide( self._rightElement, aView );
      self.notify( "viewsChanged" );
    }
    self.defineProperty( "rightView", {
      read: true,
      write: true,
      backingVariable: false
    } );
    /**
     * @method render
     * @abstract
     */
    self.override( function render() {
      return ""; // nothing to render!
    } );
    /**
     * Creates the left and right elements if necessary
     * @method renderToElement
     */
    self.override( function renderToElement() {
      self._createElementsIfNecessary();
      return; // nothing to do.
    } );
    /**
     * Initialize the split view controller
     * @method init
     * @param {ViewContainer} theLeftView
     * @param {ViewContainer} theRightView
     * @param {String} [theElementId]
     * @param {String} [theElementClass]
     * @param {String} [theElementTag]
     * @param {DOMElement} [theParentElement]
     */
    self.override( function init( theLeftView, theRightView, theElementId,
      theElementTag, theElementClass, theParentElement ) {
      if ( typeof theLeftView === "undefined" ) {
        throw new Error(
          "Can't initialize a navigation controller without a left view." );
      }
      if ( typeof theRightView === "undefined" ) {
        throw new Error(
          "Can't initialize a navigation controller without a right view." );
      }
      // do what a normal view container does
      self.super( _className, "init", [ theElementId, theElementTag,
        theElementClass,
        theParentElement
      ] );
      // now add the left and right views
      self.leftView = theLeftView;
      self.rightView = theRightView;
      return self;
    } );
    /**
     * Initialize the split view controller
     * @method initWithOptions
     */
    self.override( function initWithOptions( options ) {
      var theLeftView, theRightView, theElementId, theElementTag, theElementClass,
        theParentElement;
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
        if ( typeof options.leftView !== "undefined" ) {
          theLeftView = options.leftView;
        }
        if ( typeof options.rightView !== "undefined" ) {
          theRightView = options.rightView;
        }
      }
      self.init( theLeftView, theRightView, theElementId, theElementTag,
        theElementClass, theParentElement );
      if ( typeof options !== "undefined" ) {
        if ( typeof options.viewType !== "undefined" ) {
          self.viewType = options.viewType;
        }
        if ( typeof options.leftViewStatus !== "undefined" ) {
          self.leftViewStatus = options.leftViewStatus;
        }
      }
      return self;
    } );
    /**
     * Destroy our elements and clean up
     *
     * @method destroy
     */
    self.override( function destroy() {
      self._unparentSide( 0 );
      self._unparentSide( 1 );
      if ( self._leftElement !== null ) {
        self.element.removeChild( self._leftElement );
      }
      if ( self._rightElement !== null ) {
        self.element.removeChild( self._rightElement );
      }
      self._leftElement = null;
      self._rightElement = null;
      self.super( _className, "destroy" );
    } );
    // auto initialize
    self._autoInit.apply( self, arguments );
    return self;
  }
  return SplitViewController;
} );
