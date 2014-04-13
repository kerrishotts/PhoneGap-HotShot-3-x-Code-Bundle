/**
 *
 * Core of YASMF-UI; defines the version and basic UI  convenience methods.
 *
 * core.js
 * @module core.js
 * @author Kerri Shotts
 * @version 0.4
 *
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

define ( ["yasmf/util/device", "yasmf/util/object"], function ( theDevice, BaseObject ) {
   var UI = {};

  /**
    * Version of the UI Namespace
    * @property version
    * @type Object
   **/
  UI.version = "0.4.100";

  /**
   * Styles the element with the given style and value. Adds in the browser
   * prefixes to make it easier.
   * @param  {Node} theElement
   * @param  {CssStyle} theStyle   Don't camelCase these, use dashes as in regular styles
   * @param  {value} theValue
   * @returns {void}
   */
  UI.styleElement = function (theElement, theStyle, theValue)
  {
    var prefixes = ["-webkit-","-moz-","-ms-","-o-",""];
    for (var i=0; i<prefixes.length; i++)
    {
      var thePrefix = prefixes[i];
      var theNewStyle = thePrefix + theStyle;
      //noinspection JSUnresolvedVariable
      var theNewValue = theValue.replace("%PREFIX%",thePrefix);

      //noinspection JSUnresolvedVariable
      theElement.style.setProperty (theNewStyle, theNewValue);
    }
  };

  UI.styleElements = function (theElements, theStyle, theValue)
  {
    var i;
    for (i = 0; i < theElements.length; i++)
    {
      UI.styleElement(theElements[i], theStyle, theValue);
    }
  };

  /**
   *
   * Converts a color object to an rgba(r,g,b,a) string, suitable for applying to
   * any number of CSS styles. If the color's alpha is zero, the return value is
   * "transparent". If the color is null, the return value is "inherit".
   *
   * @method colorToRGBA
   * @static
   * @param {color} theColor - theColor to convert.
   * @returns {string} a CSS value suitable for color properties
   */
  UI.colorToRGBA = function (theColor)
  {
    if (!theColor)
    {
      return "inherit";
    }
    //noinspection JSUnresolvedVariable
    if (theColor.alpha !== 0)
    {
      //noinspection JSUnresolvedVariable
      return "rgba(" + theColor.red + "," + theColor.green + "," + theColor.blue + "," + theColor.alpha + ")";
    }
    else
    {
      return "transparent";
    }
  };
  /**
   * @typedef {{red: Number, green: Number, blue: Number, alpha: Number}} color
   */
  /**
   *
   * Creates a color object of the form `{red:r, green:g, blue:b, alpha:a}`.
   *
   * @method makeColor
   * @static
   * @param {Number} r - red component (0-255)
   * @param {Number} g - green component (0-255)
   * @param {Number} b - blue component (0-255)
   * @param {Number} a - alpha component (0.0-1.0)
   * @returns {color}
   *
   */
  UI.makeColor = function (r, g, b, a)
  {
    return { red: r, green: g, blue: b, alpha: a };
  };
  /**
   *
   * Copies a color and returns it suitable for modification. You should copy
   * colors prior to modification, otherwise you risk modifying the original.
   *
   * @method copyColor
   * @static
   * @param {color} theColor - the color to be duplicated
   * @returns {color} a color ready for changes
   *
   */
  UI.copyColor = function (theColor)
  {
    //noinspection JSUnresolvedVariable
    return UI.makeColor(theColor.red, theColor.green, theColor.blue, theColor.alpha);
  };

  /**
   * UI.COLOR
   * @namespace UI
   * @class COLOR
   */
  UI.COLOR = UI.COLOR || {};
  /** @static
   * @method blackColor
   * @returns {color} a black color.
   */
  UI.COLOR.blackColor = function () { return UI.makeColor(0, 0, 0, 1.0); };
  /** @static
   * @method darkGrayColor
   * @returns {color} a dark gray color.
   */
  UI.COLOR.darkGrayColor = function () { return UI.makeColor(85, 85, 85, 1.0); };
  /** @static
   * @method GrayColor
   * @returns {color} a gray color.
   */
  UI.COLOR.GrayColor = function () { return UI.makeColor(127, 127, 127, 1.0); };
  /** @static
   * @method lightGrayColor
   * @returns {color} a light gray color.
   */
  UI.COLOR.lightGrayColor = function () { return UI.makeColor(170, 170, 170, 1.0); };
  /** @static
   * @method whiteColor
   * @returns {color} a white color.
   */
  UI.COLOR.whiteColor = function () { return UI.makeColor(255, 255, 255, 1.0); };
  /** @static
   * @method blueColor
   * @returns {color} a blue color.
   */
  UI.COLOR.blueColor = function () { return UI.makeColor(0, 0, 255, 1.0); };
  /** @static
   * @method greenColor
   * @returns {color} a green color.
   */
  UI.COLOR.greenColor = function () { return UI.makeColor(0, 255, 0, 1.0); };
  /** @static
   * @method redColor
   * @returns {color} a red color.
   */
  UI.COLOR.redColor = function () { return UI.makeColor(255, 0, 0, 1.0); };
  /** @static
   * @method cyanColor
   * @returns {color} a cyan color.
   */
  UI.COLOR.cyanColor = function () { return UI.makeColor(0, 255, 255, 1.0); };
  /** @static
   * @method yellowColor
   * @returns {color} a yellow color.
   */
  UI.COLOR.yellowColor = function () { return UI.makeColor(255, 255, 0, 1.0); };
  /** @static
   * @method magentaColor
   * @returns {color} a magenta color.
   */
  UI.COLOR.magentaColor = function () { return UI.makeColor(255, 0, 255, 1.0); };
  /** @static
   * @method orangeColor
   * @returns {color} a orange color.
   */
  UI.COLOR.orangeColor = function () { return UI.makeColor(255, 127, 0, 1.0); };
  /** @static
   * @method purpleColor
   * @returns {color} a purple color.
   */
  UI.COLOR.purpleColor = function () { return UI.makeColor(127, 0, 127, 1.0); };
  /** @static
   * @method brownColor
   * @returns {color} a brown color.
   */
  UI.COLOR.brownColor = function () { return UI.makeColor(153, 102, 51, 1.0); };
  /** @static
   * @method lightTextColor
   * @returns {color} a light text color suitable for display on dark backgrounds.
   */
  UI.COLOR.lightTextColor = function () { return UI.makeColor(240, 240, 240, 1.0); };
  /** @static
   * @method darkTextColor
   * @returns {color} a dark text color suitable for display on light backgrounds.
   */
  UI.COLOR.darkTextColor = function () { return UI.makeColor(15, 15, 15, 1.0); };
  /** @static
   * @method clearColor
   * @returns {color} a transparent color.
   */
  UI.COLOR.clearColor = function () { return UI.makeColor(0, 0, 0, 0.0); };


  /**
   * Manages the root element
   *
   * @property _rootContainer
   * @private
   * @static
   * @type Node
   */
  UI._rootContainer = null;
  /**
   * Creates the root element that contains the view hierarchy
   *
   * @method _createRootContainer
   * @static
   * @protected
   */
  UI._createRootContainer = function ()
  {
    UI._rootContainer = document.createElement("div");
    UI._rootContainer.className = "ui-container";
    UI._rootContainer.id = "rootContainer";
    document.body.appendChild(UI._rootContainer);
  };

  /**
   * Manages the root view (topmost)
   *
   * @property _rootView
   * @private
   * @static
   * @type ViewContainer
   * @default null
   */
  UI._rootView = null;

  /**
   * Assigns a view to be the top view in the hierarchy
   *
   * @method setRootView
   * @static
   * @param {ViewContainer} theView
   */
  UI.setRootView = function (theView)
  {
    if (UI._rootContainer === null)
    {
      UI._createRootContainer();
    }
    if (UI._rootView !== null)
    {
      UI.removeRootView();
    }
    UI._rootView = theView;
    UI._rootView.parentElement = UI._rootContainer;
  };

  /**
   * Removes a view from the root view
   *
   * @method removeRootView
   * @static
   */
  UI.removeRootView = function ()
  {
    if (UI._rootView !== null)
    {
      UI._rootView.parentElement = null;
    }
    UI._rootView = null;
  };

  /**
   *
   * Returns the root view
   *
   * @method getRootView
   * @static
   * @returns {ViewContainer}
   */
  UI.getRootView = function ()
  {
    return UI._rootView;
  };

  Object.defineProperty ( UI, "rootView", {get: UI.getRootView, set: UI.setRootView} );

  UI._BackButtonHandler = function ()
  {
    var self = new BaseObject();
    self.subclass("BackButtonHandler");
    self.registerNotification("backButtonPressed");
    self._lastBackButtonTime = -1;
    self.handleBackButton = function ()
    {
      var currentTime = (new Date()).getTime();
      if (self._lastBackButtonTime < currentTime - 1000)
      {
        self._lastBackButtonTime = (new Date()).getTime();
        self.notifyMostRecent("backButtonPressed");
      }
    };
    document.addEventListener('backbutton', self.handleBackButton, false);
    return self;
  };
  /**
   *
   * Global Back Button Handler Object
   *
   * Register a listener for the backButtonPressed notification in order
   * to be notified when the back button is pressed.
   *
   * Applies only to a physical back button, not one on the screen.
   *
   * @property backButton
   * @static
   * @final
   * @type _BackButtonHandler
   */
  UI.backButton = new UI._BackButtonHandler();

  UI._OrientationHandler = function ()
  {
    var self = new BaseObject();
    self.subclass("OrientationHandler");
    self.registerNotification("orientationChanged");
    self.handleOrientationChange = function ()
    {
      var curDevice;
      var curOrientation;
      var curFormFactor;
      var curScale;
      var curConvenience;

      curDevice = theDevice.platform();
      if (curDevice == "ios")
      {
        if (navigator.userAgent.indexOf("OS 7") > -1)
        {
          curDevice += " ios7";
        }
        if (navigator.userAgent.indexOf("OS 6") > -1)
        {
          curDevice += " ios6";
        }
        if (navigator.userAgent.indexOf("OS 5") > -1)
        {
          curDevice += " ios5";
        }
      }
      curFormFactor = theDevice.formFactor();
      curOrientation = theDevice.isPortrait() ? "portrait" : "landscape";
      curScale = theDevice.isRetina() ? "hiDPI" : "loDPI";
      curConvenience = "";
      if (theDevice.iPad())
      {
        curConvenience = "ipad";
      }
      if (theDevice.iPhone())
      {
        curConvenience = "iphone";
      }
      if (theDevice.droidTablet())
      {
        curConvenience = "droid-tablet";
      }
      if (theDevice.droidPhone())
      {
        curConvenience = "droid-phone";
      }

      if (typeof document.body !== "undefined" && document.body !== null)
      {
        document.body.setAttribute("class", curDevice + " " + curFormFactor + " " + curOrientation + " " + curScale + " " + curConvenience);
      }

      self.notify("orientationChanged");
    };
    window.addEventListener('orientationchange', self.handleOrientationChange, false);
    if (typeof document.body !== "undefined" && document.body !== null)
    {
      self.handleOrientationChange();
    }
    else
    {
      setTimeout ( self.handleOrientationChange, 0);
    }
    return self;
  };
  /**
   *
   * Global Orientation Handler Object
   *
   * Register a listener for the orientationChanged notification in order
   * to be notified when the orientation changes.
   *
   * @property orientationHandler
   * @static
   * @final
   * @type _OrientationHandler
   */
  UI.orientationHandler = new UI._OrientationHandler();

  /**
   * Global Notification Object
   */
  UI.globalNotifications = new BaseObject();

  /**
   * Create the root container
   */
  if (typeof document.body !== "undefined" && document.body !== null)
  {
    UI._createRootContainer();
  }
  else
  {
    setTimeout ( UI._createRootContainer, 0);
  }

  return UI;
});
