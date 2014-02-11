/**
 *
 * PKNativeControls.js
 *
 * @author Kerri Shotts
 * @version 1.0.0
 *
 * Copyright (c) 2013 Kerri Shotts, photoKandy Studios LLC
 *
 * License: MIT
 *
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
  /*global define, cordova, console*/
(function ()
{

  /**
   * Generate a universally unique identifier. It's not really unique, but the
   * chances of collisions on a single machine are extremely small.
   * from: http://stackoverflow.com/a/2117523
   * @returns {string}
   * @constructor
   */
  function UUID ()
  {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  }

  /**
   * Native Control Class
   * @param aClass - the class type, like NavigationBar
   * @param anOwner - the queue processor (typically window.nativeControls)
   * @constructor
   */
  var NativeControl = function ( aClass, anOwner )
  {
    var self = this;

    /**
     * The Queue Processor -- typically window.nativeControls
     * @type {*}
     * @private
     */
    self._owner = anOwner;

    /**
     * The class
     * @type {*}
     * @private
     */
    self._class = aClass;

    /**
     * The native control's ID #
     * @type {null}
     * @private
     */
    self._id = UUID();

    self._lastSuccessData = null;
    self._handleSuccess = function ( data )
    {
      self._lastSuccessData = data;
    }
    self._lastError = null;
    self._handleError = function ( error )
    {
      self._lastError = error;
    }

    /**
     * Title of control
     * @type {string}
     * @private
     */
    self._title = "";
    self.getTitle = function ()
    {
      return self._title;
    };

    self.setTitle = function ( theTitle )
    {
      self._title = theTitle;
      self._owner.queueExec ( self, "setTitle", theTitle, self._handleSuccess, self._handleError );
    };
    Object.defineProperty ( self, "title", { get: self.getTitle, set: self.setTitle, configurable: true } );

    /**
     * Navigation bars can be translucent or not
     * @type {boolean}
     * @private
     */
    self._translucent = true;
    self.getTranslucent = function ()
    {
      return self._translucent;
    };

    self.setTranslucent = function ( translucent )
    {
      self._translucent = translucent;
      self._owner.queueExec ( self, "setTranslucency", translucent, self._handleSuccess, self._handleError );
    };
    Object.defineProperty ( self, "translucent", { get: self.getTranslucent, set: self.setTranslucent, configurable: true } );


    /**
     * Frame: indicates the position of the native control on the screen
     * @type {Rect}
     * @private
     */
    self._frame = { origin: { x: 0, y: 0 }, size: { w: 0, h: 0 } };
    self.getFrame = function ()
    {
      return self._frame;
    }
    self.setFrame = function ( frame )
    {
      var aFrame = {};
      aFrame.origin = { x: 0, y: 0 };
      aFrame.size = { w: 0, h: 0 };

      if (typeof frame !== "undefined")
      {
        if (typeof frame.origin !== "undefined")
        {
          if (typeof frame.origin.x !== "undefined")
          {
            aFrame.origin.x = frame.origin.x;
          }
          if (typeof frame.origin.y !== "undefined")
          {
            aFrame.origin.y = frame.origin.y;
          }
        }
        if (typeof frame.size !== "undefined")
        {
          if (typeof frame.size.w !== "undefined")
          {
            aFrame.size.w = frame.size.w;
          }
          if (typeof frame.size.h !== "undefined")
          {
            aFrame.size.h = frame.size.h;
          }
        }
      }
      return self._owner.queueExec ( self, "setFrame", [ aFrame.origin.x, aFrame.origin.y, aFrame.size.w, aFrame.size.h ],
                                     self._handleSuccess, self._handleError  );
    }
    Object.defineProperty ( self, "frame", { get: self.getFrame, set: self.setFrame, configurable: true } );

    /**
     * Text of control (generally only useful for message boxes or other controls that have Title & Text
     * @type {string}
     * @private
     */
    self._text = "";
    self.getText = function ()
    {
      return self._text;
    };
    self.setText = function ( theText )
    {
      self._text = theText;
      return self._owner.queueExec ( self, "setText", theText, self._handleSuccess, self._handleError  );
    };
    Object.defineProperty ( self, "text", { get: self.getText, set: self.setText, configurable: true } );

    /**
     * The image to use on the native control
     * @type {string}
     * @private
     */
    self._image = "";
    self.getImage = function ()
    {
      return self._image;
    }
    self.setImage = function ( theImage )
    {
      self._image = theImage;
      return self._owner.queueExec ( self, "setImage", theImage, self._handleSuccess, self._handleError  );
    }
    Object.defineProperty ( self, "image", { get: self.getImage, set: self.setImage, configurable: true } );

    /**
     * The tint color
     * @type {Color}
     * @private
     */
    self._tintColor = {r: 0, g: 0, b: 0, a: 0};
    self.getTintColor = function ()
    {
      return self._tintColor;
    }
    self.setTintColor = function ( aColor )
    {
      if (typeof aColor !== "undefined")
      {
        if (typeof aColor.r !== "undefined") { self._tintColor.r = aColor.r; }
        if (typeof aColor.g !== "undefined") { self._tintColor.g = aColor.g; }
        if (typeof aColor.b !== "undefined") { self._tintColor.b = aColor.b; }
        if (typeof aColor.a !== "undefined") { self._tintColor.a = aColor.a; }
      }
      return self._owner.queueExec( self, "setTintColor", [self._tintColor.r, self._tintColor.g, self._tintColor.b, self._tintColor.a], self._handleSuccess, self._handleError );
    }
    Object.defineProperty ( self, "tintColor", { get: self.getTintColor, set: self.setTintColor, configurable: true } );

    /**
     * The bar tint color
     * @type {Color}
     * @private
     */
    self._barTintColor = {r: 0, g: 0, b: 0, a: 0};
    self.getBarTintColor = function ()
    {
      return self._barTintColor;
    }
    self.setBarTintColor = function ( aColor )
    {
      if (typeof aColor !== "undefined")
      {
        if (typeof aColor.r !== "undefined") { self._barTintColor.r = aColor.r; }
        if (typeof aColor.g !== "undefined") { self._barTintColor.g = aColor.g; }
        if (typeof aColor.b !== "undefined") { self._barTintColor.b = aColor.b; }
        if (typeof aColor.a !== "undefined") { self._barTintColor.a = aColor.a; }
      }
      return self._owner.queueExec( self, "setBarTintColor", [self._barTintColor.r, self._barTintColor.g, self._barTintColor.b, self._barTintColor.a], self._handleSuccess, self._handleError );
    }
    Object.defineProperty ( self, "barTintColor", { get: self.getBarTintColor, set: self.setBarTintColor, configurable: true } );

    /**
     * Create the control on the native side
     */
    self.createControl = function ()
    {
      return self._owner.queueExec ( self, "create", null, self._handleSuccess, self._handleError  );
    };

    /**
     * Ask the native side to destroy the native control.
     */
    self.destroy = function ()
    {
      return self._owner.queueExec ( self, "destroy", null,
                                     function success ( data)
                                     {
                                       self._id = null;
                                       self._handleSuccess( data );
                                     }, self._handleError
      );
    };

    /**
     * Add the native control to the native side's view
     */
    self.addToView = function ()
    {
      return self._owner.queueExec( self, "addToView", null, self._handleSuccess, self._handleError  );
    };

    /**
     * Navigation bars can have navigation items pushed onto them.
     * @param aNavigationItem
     * @returns {*}
     */
    self.push = function ( aNavigationItem )
    {
      if (self._class !== "NavigationBar")
      {
        throw new Error ( "Only Navigation Bars support pushes." );
      }
      if (typeof aNavigationItem === "undefined" )
      {
        throw new Error ( "When pushing, a navigation item must be supplied." );
      }
      if (aNavigationItem._class !== "NavigationItem" )
      {
        throw new Error ( "Navigation Items can only be pushed onto Navigation Bars." );
      }
      return self._owner.queueExec( self, "push", aNavigationItem._id, self._handleSuccess, self._handleError  );
    };

    /**
     * Pop a navigation item from a navigation bar
     * @returns {*}
     */
    self.pop = function ()
    {
      if (self._class !== "NavigationBar")
      {
        throw new Error ( "Only Navigation Bars support pushes." );
      }
      return self._owner.queueExec( self, "pop", null, self._handleSuccess, self._handleError  );
    };

    /**
     * Navigation Items support a "leftButtons" array of BarButtons; these appear on the
     * left-side of a navigation bar.
     * @type {Array}
     * @private
     */
    self._leftButtons = [];
    self.getLeftButtons = function ()
    {
      return self._leftButtons;
    };
    self.setLeftButtons = function ( buttons )
    {
      if (self._class !== "NavigationItem")
      {
        throw new Error ( "Only Navigation Items support left buttons." );
      }

      self._leftButtons = buttons.map ( function (button) {
        return button._id;
      });
      return self._owner.queueExec( self, "setLeftButtons", self._leftButtons, self._handleSuccess, self._handleError  );
    };
    Object.defineProperty ( self, "leftButtons", { get: self.getLeftButtons, set: self.setLeftButtons, configurable: true } );

    /**
     * Buttons for the right-side of a navigation bar's item
     * @type {Array}
     * @private
     */
    self._rightButtons = [];
    self.getRightButtons = function ()
    {
      return self._rightButtons;
    };
    self.setRightButtons = function ( buttons )
    {
      if (self._class !== "NavigationItem")
      {
        throw new Error ( "Only Navigation Items support right buttons." );
      }

      self._rightButtons = buttons.map ( function (button) {
        return button._id;
      });
      return self._owner.queueExec( self, "setRightButtons", self._rightButtons, self._handleSuccess, self._handleError  );
    };
    Object.defineProperty ( self, "rightButtons", { get: self.getRightButtons, set: self.setRightButtons, configurable: true } );

    /**
     * Buttons for a toolbar
     * @type {Array}
     * @private
     */
    self._buttons = [];
    self.getButtons = function ()
    {
      return self._buttons;
    };
    self.setButtons = function ( buttons )
    {
      if (self._class !== "ToolBar")
      {
        throw new Error ( "Only tool bars support buttons." );
      }

      self._buttons = buttons.map ( function (button) {
        return button._id;
      });
      return self._owner.queueExec( self, "setButtons", self._rightButtons, self._handleSuccess, self._handleError  );
    };
    Object.defineProperty ( self, "buttons", { get: self.getButtons, set: self.setButtons, configurable: true } );

    self._cancelButtonIndex = -1;
    self.getCancelButtonIndex = function ()
    {
      return self._cancelButtonIndex;
    }
    self.setCancelButtonIndex = function ( idx )
    {
      self._cancelButtonIndex = idx;
      return self._owner.queueExec( self, "setCancelButton", self._cancelButtonIndex,
                                    self._handleSuccess, self._handleError );
    }
    Object.defineProperty ( self, "cancelButtonIndex", { get: self.getCancelButtonIndex, set: self.setCancelButtonIndex, configurable: true } );

    self._destructiveButtonIndex = -1;
    self.getDestructiveButton = function ()
    {
      return self._destructiveButtonIndex;
    }
    self.setDestructiveButton = function ( idx )
    {
      self._destructiveButtonIndex = idx;
      return self._owner.queueExec( self, "setDestructiveButton", self._destructiveButtonIndex,
                                    self._handleSuccess, self._handleError );
    }
    Object.defineProperty ( self, "destructiveButtonIndex", { get: self.getDestructiveButton, set: self.setDestructiveButton, configurable: true } );

    self.addButton = function ( buttonText )
    {
      self.addButtons ( [ buttonText ] );
    }

    self.addButtons = function ( buttons )
    {
      if (self._class !== "ActionSheet" && self._class !== "MessageBox")
      {
        throw new Error ( "Only Message Boxes and Actionsheets support adding buttons" );
      }

      return self._owner.queueExec( self, "addButtons", buttons, self._handleSuccess, self._handleError  );
    }

    self.show = function ()
    {
      if (self._class !== "ActionSheet" && self._class !== "MessageBox")
      {
        throw new Error ( "Only Message Boxes and Actionsheets support showing" );
      }

      return self._owner.queueExec( self, "show", null, self._handleSuccess, self._handleError  );
    }

    self.hide = function ()
    {
      if (self._class !== "ActionSheet" && self._class !== "MessageBox")
      {
        throw new Error ( "Only Message Boxes and Actionsheets support hiding" );
      }

      return self._owner.queueExec( self, "hide", null, self._handleSuccess, self._handleError  );
    }

    self.removeFromView = function ()
    {
      return self._owner.queueExec( self, "removeFromView", null, self._handleSuccess, self._handleError  );
    }
    /**
     * Add an event listener to a control.
     * @param event
     * @param handler
     */
    self.addEventListener = function ( event, handler )
    {
      document.addEventListener( self._id + "_" + event, handler, false );
    };

    /**
     * Remove an event handler from a control.
     * @param event
     * @param handler
     */
    self.removeEventListener = function ( event, handler )
    {
      document.removeEventListener( self._id + "_" + event, handler );
    };
  };

  var NativeControls = function ()
  {
    var self = this;

    /**
     * Internal queue; all requests to the system are pushed here, and each one is processed in order.
     * @type {Array}
     * @private
     */
    var _execQueue = [];

    /**
     * Indicates if we're waiting on a result from the bridge. If we are, events can't be processed until
     * the result comes back
     * @type {boolean}
     * @private
     */
    var _waitingForResult = false;

    /**
     * Last Success Data -- in case the native control doesn't specify anything to handle this
     * @type {null}
     * @private
     */
    self._lastSuccessData = null;

    /**
     * Last (unhandled) error
     * @type {null}
     * @private
     */
    self._lastError = null;

    /**
     * Create a new control
     * @param theControlType -- class of control
     * @returns {NativeControl}
     */
    self.createNewControl = function ( theControlType )
    {
      var nc = new NativeControl ( theControlType, self );
      nc.createControl();
      return nc;
    };

    /**
     * Look at the first item in the queue
     * @returns {*}
     * @private
     */
    self._queueLook = function ()
    {
      if (_execQueue.length > 0)
      {
        return _execQueue[0];
      }
      else
      {
        return null;
      }
    };

    /**
     * Push an item on the queue
     * @param i
     * @private
     */
    self._queuePush = function ( i )
    {
      _execQueue.push ( i );
    };

    /**
     * Pop an item from the queue and shift the items
     * @returns {*}
     * @private
     */
    self._queuePop = function ()
    {
      if ( _execQueue.length > 0)
      {
        return _execQueue.shift();
      }
      else
      {
        return null;
      }
    };

    /**
     * Queue a command
     * @param theControl - the Native Control
     * @param theOperation - the Operation (like setTitle)
     * @param theValue - The value (like "Hello, world!")
     * @param onSuccess - the success handler (optional)
     * @param onFailure - the failure handler (optional)
     */
    self.queueExec = function ( theControl, theOperation, theValue, onSuccess, onFailure )
    {
      var execToProcess = {};
      if (typeof theControl !== "undefined")
      {
        execToProcess.control = theControl;
      }
      else
      {
        throw new Error ( "Can't process a command without the native control." );
      }

      if (typeof theOperation !== "undefined" )
      {
        execToProcess.operation = theOperation;
      }
      else
      {
        throw new Error ( "Can't process a command without the operation." );
      }

      if ( typeof theValue !== "undefined" )
      {
        execToProcess.value = theValue;
      }
      else
      {
        execToProcess.value = null;
      }

      if ( typeof onSuccess !== "undefined" )
      {
        execToProcess.successHandler = onSuccess;
      }

      if ( typeof onFailure !== "undefined" )
      {
        execToProcess.failureHandler = onFailure;
      }

      self._queuePush ( execToProcess );
      setTimeout ( self._processExec, 0);
    };

    /**
     * Process the queue; it is called after every exec, and will continue to process until the queue
     * is emptied.
     * @private
     */
    self._processExec = function ()
    {
      if (_execQueue.length > 0 && !_waitingForResult)
      {
        _waitingForResult = true;
        var execToProcess = self._queueLook();
        if ( execToProcess.control._id === null && execToProcess.operation !== "createAndGetID" )
        {
          execToProcess = self._queuePop();
          throw new Error ( "Native control doesn't have an ID yet; can't process.");
        }

        execToProcess = self._queuePop();
        cordova.exec ( function success( data )
                       {
                         if (execToProcess.successHandler)
                         {
                           try
                           {
                             execToProcess.successHandler ( data );
                           }
                           catch ( e )
                           {
                             self._lastSuccessData = data;
                             console.log (e.message);
                           }
                         }
                         _waitingForResult = false;
                         setTimeout (self._processExec, 0);
                       },
                       function failure ( error )
                       {
                         if (execToProcess.failureHandler)
                         {
                           try
                           {
                             execToProcess.failureHandler ( error );
                           }
                           catch ( e )
                           {
                             self._lastError = e;
                             console.log (e.message);
                           }
                         }
                         _waitingForResult = false;
                         setTimeout (self._processExec, 0);
                       },
                       "PKNativeControls", "handleOperation", [ execToProcess.control._class, execToProcess.control._id, execToProcess.operation, execToProcess.value ]
        );
      }
      else
      {
        setTimeout ( self._processExec, 10);
      }
    };

    /**
     * Return a new Navigation Bar
     * @returns {NativeControl}
     * @constructor
     */
    self.NavigationBar = function ()
    {
      return self.createNewControl ( "NavigationBar" );
    };

    /**
     * Return a new ToolBar
     * @returns {NativeControl}
     * @constructor
     */
    self.ToolBar = function ()
    {
      return self.createNewControl ( "ToolBar" );
    };

    /**
     * Return a new BarButton
     * @returns {NativeControl}
     * @constructor
     */
    self.BarButton = function ()
    {
      return self.createNewControl ( "BarButton" );
    };

    /**
     * Return a new Tab Bar
     * @returns {NativeControl}
     * @constructor
     */
    self.TabBar = function ()
    {
      return self.createNewControl ( "TabBar" );
    };

    /**
     * Return a new Action Sheet
     * @returns {NativeControl}
     * @constructor
     */
    self.ActionSheet = function ()
    {
      return self.createNewControl ( "ActionSheet" );
    };

    /**
     * Return a new Message Box
     * @returns {NativeControl}
     * @constructor
     */
    self.MessageBox = function ()
    {
      return self.createNewControl ( "MessageBox" );
    };

    /**
     * Return a new Navigation Item
     * @returns {NativeControl}
     * @constructor
     */
    self.NavigationItem = function ()
    {
      return self.createNewControl ( "NavigationItem" );
    };

    /**
     * Return a new Popover
     * @returns {NativeControl}
     * @constructor
     */
    self.Popover = function ()
    {
      return self.createNewControl ( "Popover" );
    };

    /**
     * Returns a new Rect
     * @param x - x position
     * @param y - y position
     * @param w - width
     * @param h - height
     * @returns {Rect}
     * @constructor
     */
    self.Rect = function ( x, y, w, h )
    {

      var aRect = {};
      aRect.origin = { x: 0, y: 0 };
      aRect.size = { w: 0, h: 0 };

      if (typeof x !== "undefined")
      {
        aRect.origin.x = x;
      }
      if (typeof y !== "undefined")
      {
        aRect.origin.y = y;
      }
      if (typeof w !== "undefined")
      {
        aRect.size.w = w;
      }
      if (typeof h !== "undefined")
      {
        aRect.size.h = h;
      }

      return aRect;
    }

    /**
     * Returns a new color. If only red is specified, it is a lookup value, such as "blue" or "gray".
     * @param r - red (0-255)
     * @param g - green (0-255)
     * @param b - blue (0-255)
     * @param a - alpha (0-1)
     * @returns {Color}
     * @constructor
     */
    self.Color = function ( r, g, b, a )
    {
      var aNewColor = { r:0, g: 0, b: 0, a: 1 };
      if (typeof r !== "undefined" && typeof g == "undefined" && typeof b == "undefined")
      {
        // look up in a color array
        var colors =
        {
          "BLACK":        {r:   0, g:   0, b:   0, a:1.0 },
          "DARKGRAY":     {r:  85, g:  85, b:  85, a:1.0 },
          "GRAY":         {r: 127, g: 127, b: 127, a:1.0 },
          "LIGHTGRAY":    {r: 170, g: 170, b: 170, a:1.0 },
          "WHITE":        {r: 255, g: 255, b: 255, a:1.0 },
          "CYAN":         {r:   0, g: 255, b: 255, a:1.0 },
          "YELLOW":       {r: 255, g: 255, b:   0, a:1.0 },
          "MAGENTA":      {r: 255, g:   0, b: 255, a:1.0 },
          "ORANGE":       {r: 255, g: 127, b:   0, a:1.0 },
          "PURPLE":       {r: 127, g:   0, b: 127, a:1.0 },
          "BROWN":        {r: 153, g: 102, b:  51, a:1.0 },
          "CLEAR":        {r:   0, g:   0, b:   0, a:0.0 },
          "BLUE":         {r:   0, g:   0, b: 255, a:1.0 },
          "GREEN":        {r:   0, g: 255, b:   0, a:1.0 },
          "RED":          {r: 255, g:   0, b:   0, a:1.0 }
        }

        var foundColor = colors[r.toUpperCase().trim()];
        if (foundColor)
        {
          aNewColor.r = foundColor.r;
          aNewColor.g = foundColor.g;
          aNewColor.b = foundColor.b;
        }
        return aNewColor;
      }

      if (typeof r !== "undefined") { aNewColor.r = r; }
      if (typeof g !== "undefined") { aNewColor.g = g; }
      if (typeof b !== "undefined") { aNewColor.b = b; }
      if (typeof a !== "undefined") { aNewColor.a = a; }
      return aNewColor;
    }

  };

  //
  // only clobber window.nativeControls if it isn't already defined
  if (typeof window.nativeControls === "undefined" )
  {
    window.nativeControls = new NativeControls ();
  }

})();
