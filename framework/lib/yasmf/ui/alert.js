/**
 *
 * Provides native-like alert methods, including prompts and messages.
 *
 * alert.js
 * @module alert.js
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

define ( ["yasmf/util/core", "yasmf/util/device", "yasmf/util/object",
          "yasmf/ui/core", "Q", "yasmf/ui/event" ],
function ( _y, theDevice, BaseObject, UI, Q, event ) {

   var _className = "Alert";
   var Alert = function ()
   {
      var self = new BaseObject();
      self.subclass ( _className );

      /*
       * dismissed just indicates that the alert was dismissed (either by the user
       * or by code). buttonTapped passes along which button was tapped.
       */
      self.registerNotification ( "buttonTapped" );
      self.registerNotification ( "dismissed" );

      /**
       * The title to show in the alert.
       * @type {String}
       */
      self._title = _y.T("Alert");
      self._titleElement = null;
      self.getTitle = function ()
      {
         return self._title;
      }
      self.setTitle = function ( theTitle )
      {
         self._title = theTitle;
         if (self._titleElement !== null)
         {
            self._titleElement.innerHTML = theTitle;
         }
      }
      Object.defineProperty ( self, "title", { get: self.getTitle,
                                               set: self.setTitle,
                                               configurable: true } );

      /**
       * The body of the alert. Leave blank if you don't need to show
       * anything more than the title.
       * @type {String}
       */
      self._text = "";
      self._textElement = null;
      self.getText = function ()
      {
         return self._text;
      }
      self.setText = function ( theText )
      {
         self._text = theText;
         if (self._textElement !== null)
         {
            self._textElement.innerHTML = theText;
         }
      }
      Object.defineProperty ( self, "text", { get: self.getText,
                                              set: self.setText,
                                              configurable: true } );

      /**
       * The alert's buttons are specified in this property. The layout
       * is expected to be: [ { title: title [, type: type] [, tag: tag] } [, {} ...] ]
       *
       * Each button's type can be "normal", "bold", "destructive". The tag may be
       * null; if it is, it is assigned the button index. If a tag is specifed (common
       * for cancel buttons), that is the return value.
       * @type {Array}
       */
      self._buttons = [];
      self._buttonContainer = null;
      self.getButtons = function ()
      {
         return self._buttons;
      }
      self.setButtons = function ( theButtons )
      {
         function dismissWithIndex ( idx )
         {
            return function ()
            {
               self.dismiss ( idx );
            };
         }
         var i;
         // clear out any previous buttons in the DOM
         if ( self._buttonContainer !== null )
         {
            for ( i=0; i < self._buttons.length; i++ )
            {
               self._buttonContainer.removeChild ( self._buttons[i].element );
            }
         }

         self._buttons = theButtons;

         // determine if we need wide buttons or not
         var wideButtons = !((self._buttons.length >= 2) && (self._buttons.length <= 3));

         // add the buttons back to the DOM if we can
         if ( self._buttonContainer !== null )
         {
            for ( i=0; i < self._buttons.length; i++ )
            {
               var e = document.createElement ( "div");
               var b = self._buttons[i];
               // if the tag is null, give it (i)
               if (b.tag === null) { b.tag = i; }
               // class is ui-alert-button normal|bold|destructive [wide]
               // wide buttons are for 1 button or 4+ buttons.
               e.className = "ui-alert-button " + b.type + " " + (wideButtons ? "wide" : "");
               // title
               e.innerHTML = b.title;
               if (!wideButtons)
               {
                  // set the width of each button to fill out the alert equally
                  // 3 buttons gets 33.333%; 2 gets 50%.
                  e.style.width = "" + (100/self._buttons.length) + "%";
               }
               // listen for a touch
               event.addListener ( e, "touchend", dismissWithIndex ( i ) );
               b.element = e;
               // add the button to the DOM
               self._buttonContainer.appendChild ( b.element );
            }
         }
      }
      Object.defineProperty ( self, "buttons", { get: self.getButtons,
                                                 set: self.setButtons,
                                                 configurable: true } );


      self._rootElement = null;        // root element contains the container
      self._alertElement = null;       // points to the alert itself
      self._vaElement = null;          // points to the DIV used to vertically align us

      self._deferred = null;           // stores a promise

      /**
       * If true, show() returns a promise.
       * @type {boolean}
       */
      self._usePromise = false;
      self.getUsePromise = function ()
      {
         return self._usePromise;
      }
      Object.defineProperty ( self, "usePromise", { get: self.getUsePromise,
                                                    configurable: true } );

      self._visible = false;
      self.getVisible = function ()
      {
         return self._visible;
      }
      Object.defineProperty ( self, "visible", { get: self.getVisible,
                                                 configurable: true } );



      /**
       * Creates the DOM elements for an Alert. Assumes the styles are
       * already in the style sheet.
       */
      self._createElements = function ()
      {
         self._rootElement = document.createElement ("div");
         self._rootElement.className = "ui-alert-container";

         self._vaElement = document.createElement ( "div" );
         self._vaElement.className = "ui-alert-vertical-align";

         self._alertElement = document.createElement ( "div" );
         self._alertElement.className = "ui-alert";

         self._titleElement = document.createElement ( "div" );
         self._titleElement.className = "ui-alert-title";

         self._textElement = document.createElement ( "div" );
         self._textElement.className = "ui-alert-text";

         self._buttonContainer = document.createElement( "div" );
         self._buttonContainer.className = "ui-alert-button-container";

         self._alertElement.appendChild ( self._titleElement );
         self._alertElement.appendChild ( self._textElement );
         self._alertElement.appendChild ( self._buttonContainer );
         self._vaElement.appendChild ( self._alertElement );
         self._rootElement.appendChild ( self._vaElement );
      }

      /**
       * Called when the back button is pressed. Dismisses with a -1 index. Effectively a Cancel.
       */
      self.backButtonPressed = function ()
      {
         self.dismiss ( -1 );
      }

      /**
       * Hide dismisses the alert and dismisses it with -1. Effectively a Cancel.
       * @return {[type]} [description]
       */
      self.hide = function ()
      {
         self.dismiss ( -1 );
      }

      /**
       * Shows an alert.
       * @return {Promise} a promise if usePromise = true
       */
      self.show = function ()
      {
         if (self.visible)
         {
            if (self.usePromise && self._deferred !== null)
            {
               return self._deferred;
            }
            return; // can't do anything more.
         }
         // listen for the back button
         UI.backButton.addListenerForNotification ( "backButtonPressed", self.backButtonPressed );

         // add to the body
         document.body.appendChild ( self._rootElement );

         // animate in
         setTimeout ( function () { self._rootElement.style.opacity = "1"; }, 50 );
         setTimeout ( function () { self._alertElement.style.opacity = "1";
                                    UI.styleElement ( self._alertElement, "transform", "scale3d(1.05, 1.05,1)" ) }, 125 );
         setTimeout ( function () { UI.styleElement ( self._alertElement, "transform", "scale3d(0.95, 0.95,1)" ) }, 250 );
         setTimeout ( function () { UI.styleElement ( self._alertElement, "transform", "scale3d(1.00, 1.00,1)" ) }, 375 );

         self._visible = true;

         if (self.usePromise)
         {
            self._deferred = Q.defer();
            return self._deferred.promise;
         }
      }

      self.dismiss = function ( idx )
      {
         if (!self.visible)
         {
            return;
         }
         // drop the listener for the back button
         UI.backButton.removeListenerForNotification ( "backButtonPressed", self.backButtonPressed );

         // remove from the body
         setTimeout ( function () { self._alertElement.style.opacity = "0"; }, 10 );
         setTimeout ( function () { self._rootElement.style.opacity = "0"; }, 250 );
         setTimeout ( function () { document.body.removeChild ( self._rootElement ); }, 500 );

         // get notification tag
         var tag = -1;
         if (( idx > -1 ) && (idx < self._buttons.length))
         {
           tag = self._buttons[idx].tag;
         }

         // send our notifications as appropriate
         self.notify ( "dismissed" );
         self.notify ( "buttonTapped", [ tag ] );

         self._visible = false;

         // and resolve/reject the promise
         if (self.usePromise)
         {
            if ( tag > -1) { self._deferred.resolve ( tag ); }
            else           { self._deferred.reject ( new Error ( tag ) ); }
         }
      }

      /**
       * Initializes the Alert and calls _createElements.
       */
      self.overrideSuper ( self.class, "init", self.init );
      self.init = function init ()
                      {
                        self.super ( _className, "init" );
                        self._createElements();
                      };

      /**
       * Initializes the Alert. Options includes title, text, buttons, and promise.
       */
      self.overrideSuper (self.class, "initWithOptions", self.initWithOptions);
      self.initWithOptions =  function initWithOptions ( options )
                      {
                        self.init();
                        if ( typeof options !== "undefined" )
                        {
                           if ( typeof options.title !== "undefined" ) { self.title = options.title; }
                           if ( typeof options.text  !== "undefined" ) { self.text = options.text; }
                           if ( typeof options.buttons !== "undefined" ) { self.buttons = options.buttons; }
                           if ( typeof options.promise !== "undefined" )
                           {
                              self._usePromise = options.promise;
                           }
                        }
                      };

      /**
       * Clean up after ourselves.
       */
      self.overrideSuper (self.class, "destroy", self.destroy);
      self.destroy = function destroy ()
                      {
                        if (self.visible)
                        {
                           self.hide();
                           setTimeout ( destroy, 600 ); // we won't destroy immediately.
                           return;
                        }
                        self._rootElement = null;
                        self._vaElement = null;
                        self._alertElement = null;
                        self._titleElement = null;
                        self._textElement = null;
                        self._buttonContainer = null;
                        self.super ( _className, "destroy" );
                      };
      return self;
   }

   /**
    * Creates a button suitable for an Alert
    * @param  {String} title   The title of the button
    * @param  {Object} options The additional options: type and tag
    * @return {Object}         A button
    */
   Alert.button = function ( title, options )
   {
      var button = {};
      button.title = title;
      button.type = "normal"; // normal, bold, destructive
      button.tag = null; // assign for a specific tag
      button.enabled = true; // false = disabled.
      button.element = null; // attached DOM element

      if (typeof options !== "undefined")
      {
         if (typeof options.type !== "undefined") { button.type = options.type; }
         if (typeof options.tag !== "undefined") { button.tag = options.tag; }
         if (typeof options.enabled !== "undefined") { button.enabled = options.enabled; }

      }

      return button;
   }

   /**
    * Creates an OK-style Alert. It only has an OK button.
    * @param {Object} options Specify the title, text, and promise options if desired.
    */
   Alert.OK = function ( options )
   {
      var anOK = new Alert();
      var anOKOptions = { title: _y.T("OK"), text: "",
                                  buttons: [ Alert.button ( _y.T("OK"), { type: "bold" } ) ] };
      if (typeof options !== "undefined")
      {
         if ( typeof options.title !== "undefined" ) { anOKOptions.title = options.title; }
         if ( typeof options.text !== "undefined" ) { anOKOptions.text = options.text; }
         if ( typeof options.promise !== "undefined" ) { anOKOptions.promise = options.promise }
      }
      anOK.initWithOptions ( anOKOptions );
      return anOK;

   }

   /**
    * Creates an OK/Cancel-style Alert. It only has an OK and CANCEL button.
    * @param {Object} options Specify the title, text, and promise options if desired.
    */
   Alert.Confirm = function ( options )
   {
      var aConfirmation = new Alert();
      var confirmationOptions = { title: _y.T("Confirm"), text: "",
                                  buttons: [ Alert.button ( _y.T("OK") ),
                                             Alert.button ( _y.T("Cancel"), {type: "bold", tag: -1} ) ] };
      if (typeof options !== "undefined")
      {
         if ( typeof options.title !== "undefined" ) { confirmationOptions.title = options.title; }
         if ( typeof options.text !== "undefined" ) { confirmationOptions.text = options.text; }
         if ( typeof options.promise !== "undefined" ) { confirmationOptions.promise = options.promise }
      }
      aConfirmation.initWithOptions ( confirmationOptions );
      return aConfirmation;
   }


   return Alert;
});
