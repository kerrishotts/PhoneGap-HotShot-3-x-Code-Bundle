/**
 *
 * View Containers are simple objects that provide very basic view management with
 * a thin layer over the corresponding DOM element.
 *
 * @module viewContainer.js
 * @author Kerri Shotts
 * @version 0.4
 *
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
define( [ "yasmf/util/object" ], function( BaseObject ) {
  var _className = "ViewContainer";
  var ViewContainer = function() {
      var self = new BaseObject();
      self.subclass( _className );
      // # Notifications
      // * `viewWasPushed` is fired by a containing `ViewController` when the view is added
      //   to the view stack
      // * `viewWasPopped` is fired by a container when the view is removed from the view stack
      // * `viewWillAppear` is fired by a container when the view is about to appear (one should avoid
      //   any significant DOM changes or calculations during this time, or animations may stutter)
      // * `viewWillDisappear` is fired by a container when the view is about to disappear
      // * `viewDidAppear` is fired by a container when the view is on screen.
      // * `viewDidDisappear` is fired by a container when the view is off screen.
      self.registerNotification( "viewWasPushed" );
      self.registerNotification( "viewWasPopped" );
      self.registerNotification( "viewWillAppear" );
      self.registerNotification( "viewWillDisappear" );
      self.registerNotification( "viewDidAppear" );
      self.registerNotification( "viewDidDisappear" );
      // private properties used to manage the corresponding DOM element
      self._element = null;
      self._elementClass = "ui-container"; // default; can be changed to any class for styling purposes
      self._elementId = null; // bad design decision -- probably going to mark this as deprecated soon
      self._elementTag = "div"; // some elements might need to be something other than a DIV
      self._parentElement = null; // owning element
      /**
       * The title isn't displayed anywhere (unless you use it yourself in `renderToElement`, but
       * is useful for containers that want to know the title of their views.
       * @property title
       * @type {String}
       * @observable
       */
      self.defineObservableProperty( "title" );
      /**
       * Creates the internal elements.
       * @method createElement
       */
      self.createElement = function() {
        self._element = document.createElement( self._elementTag );
        if ( self.elementClass !== null ) {
          self._element.className = self.elementClass;
        }
        if ( self.elementId !== null ) {
          self._element.id = self.elementId;
        }
      }
      /**
       * Creates the internal elements if necessary (that is, if they aren't already in existence)
       * @method createElementIfNotCreated
       */
      self.createElementIfNotCreated = function() {
        if ( self._element === null ) {
          self.createElement();
        }
      }
      /**
       * The `element` property allow direct access to the DOM element backing the view
       * @property element
       * @type {DOMElement}
       */
      self.getElement = function() {
        self.createElementIfNotCreated();
        return self._element;
      }
      self.defineProperty( "element", {
        read: true,
        write: true,
        default: null
      } );
      /**
       * The `elementClass` property indicates the class of the DOM element. Changing
       * the class will alter the backing DOM element if created.
       * @property elementClass
       * @type {String}
       * @default "ui-container"
       */
      self.setElementClass = function( theClassName ) {
        self._elementClass = theClassName;
        if ( self._element !== null ) {
          self._element.className = theClassName;
        }
      }
      self.defineProperty( "elementClass", {
        read: true,
        write: true,
        default: "ui-container"
      } );
      /**
       * Determines the `id` for the backing DOM element. Not the best choice to
       * use, since this must be unique within the DOM. Probably going to become
       * deprecated eventually
       */
      self.setElementId = function( theElementId ) {
        self._elementId = theElementId;
        if ( self._element !== null ) {
          self._element.id = theElementId;
        }
      }
      self.defineProperty( "elementId", {
        read: true,
        write: true,
        default: null
      } );
      /**
       * Determines the type of DOM Element; by default this is a DIV.
       * @property elementTag
       * @type {String}
       * @default "div"
       */
      self.defineProperty( "elementTag", {
        read: true,
        write: true,
        default: "div"
      } );
      /**
       * Indicates the parent element, if it exists. This is a DOM element
       * that owns this view (parent -> child). Changing the parent removes
       * this element from the parent and reparents to another element.
       * @property parentElement
       * @type {DOMElement}
       */
      self.setParentElement = function( theParentElement ) {
        if ( self._parentElement !== null && self._element !== null ) {
          // remove ourselves from the existing parent element first
          self._parentElement.removeChild( self._element );
          self._parentElement = null;
        }
        self._parentElement = theParentElement;
        if ( self._parentElement !== null && self._element !== null ) {
          self._parentElement.appendChild( self._element );
        }
      }
      self.defineProperty( "parentElement", {
        read: true,
        write: true,
        default: null
      } );
      /**
       * @method render
       * @return {String|DOMElement|DocumentFragment}
       * `render` is called by `renderToElement`. The idea behind this is to generate
       * a return value consisting of the DOM tree necessary to create the view's
       * contents.
       **/
      self.render = function() {
        // right now, this doesn't do anything, but it's here for inheritance purposes
        return "Error: Abstract Method";
      }
      /**
       * Renders the content of the view. Can be called more than once, but more
       * often is called once during `init`. Calls `render` immediately and
       * assigns it to `element`'s `innerHTML` -- this implicitly creates the
       * DOM elements backing the view if they weren't already created.
       * @method renderToElement
       */
      self.renderToElement = function() {
        var renderOutput = self.render();
        if ( typeof renderOutput === "string" ) {
          self.element.innerHTML = self.render();
        } else if ( typeof renderOutput === "object" ) {
          self.element.innerHTML = "";
          self.element.appendChild( renderOutput );
        }
      }
      /**
       * Initializes the view container; returns `self`
       * @method init
       * @param {String} [theElementId]
       * @param {String} [theElementTag]
       * @param {String} [theElementClass]
       * @param {DOMElement} [theParentElement]
       * @returns {Object}
       */
      self.override( function init( theElementId, theElementTag, theElementClass,
        theParentElement ) {
        self.super( _className, "init" ); // super has no parameters
        // set our Id, Tag, and Class
        if ( typeof theElementId !== "undefined" ) {
          self.elementId = theElementId;
        }
        if ( typeof theElementTag !== "undefined" ) {
          self.elementTag = theElementTag;
        }
        if ( typeof theElementClass !== "undefined" ) {
          self.elementClass = theElementClass;
        }
        // render ourselves to the element (via render); this implicitly creates the element
        // with the above properties.
        self.renderToElement();
        // add ourselves to our parent.
        if ( typeof theParentElement !== "undefined" ) {
          self.parentElement = theParentElement;
        }
        return self;
      } );
      /**
       * Initializes the view container. `options` can specify any of the following properties:
       *
       *  * `id` - the `id` of the element
       *  * `tag` - the element tag to use (`div` is the default)
       *  * `class` - the class name to use (`ui-container` is the default)
       *  * `parent` - the parent DOMElement
       *
       * @method initWithOptions
       * @param {Object} options
       * @return {Object}
       */
      self.initWithOptions = function( options ) {
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
          if ( typeof options.title !== "undefined" ) {
            self.title = options.title;
          }
        }
        return self;
      };
      /**
       * Clean up
       * @method destroy
       */
      self.override( function destroy() {
        // remove ourselves from the parent view, if attached
        if ( self._parentElement !== null && self._element !== null ) {
          // remove ourselves from the existing parent element first
          self._parentElement.removeChild( self._element );
          self._parentElement = null;
        }
        // and let our super know that it can clean p
        self.super( _className, "destroy" );
      } );
      // handle auto-initialization
      self._autoInit.apply( self, arguments );
      // return the new object
      return self;
    }
    // return the new factory
  return ViewContainer;
} );
