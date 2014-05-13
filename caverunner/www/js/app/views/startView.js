/**
 *
 * Start View
 *
 * startView.js
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
define( [ "yasmf", "text!html/startView.html!strip", "app/views/gameView",
  "app/views/optionsView", "hammer"
], function( _y, startViewHTML, GameView, OptionsView, Hammer ) {
  var _className = "StartView";
  var StartView = function() {
    var self = new _y.UI.ViewContainer();
    self.subclass( _className );
    self._playButton = null;
    self._optionsButton = null;
    self.overrideSuper( self.class, "render", self.render );
    self.render = function() {
      return _y.template( startViewHTML, {
        "APP_TITLE": _y.T( "APP_TITLE" ),
        "PLAY": _y.T( "PLAY" ),
        "OPTIONS": _y.T( "OPTIONS" )
      } );
    }
    self.quitApp = function() {
      navigator.app.exitApp();
    }
    self.playGame = function() {
      var aGameView = new GameView();
      aGameView.init();
      self.navigationController.pushView( aGameView );
    }
    self.showOptions = function() {
      var anOptionsView = new OptionsView();
      anOptionsView.init();
      self.navigationController.pushView( anOptionsView );
    }
    self.overrideSuper( self.class, "renderToElement", self.renderToElement );
    self.renderToElement = function() {
      self.super( _className, "renderToElement" );
      self._playButton = self.element.querySelector( ".game-actions .game-play" );
      Hammer( self._playButton ).on( "tap", self.playGame );
      self._optionsButton = self.element.querySelector( ".game-actions .game-options" );
      Hammer( self._optionsButton ).on( "tap", self.showOptions );
      _y.UI.backButton.addListenerForNotification( "backButtonPressed", self.quitApp );
    }
    self.startAnimation = function() {
      var e = self.element.querySelector( ".game-title" );
      e.style.webkitAnimationName = "animateTitle";
    }
    self.stopAnimation = function() {
      var e = self.element.querySelector( ".game-title" );
      e.style.webkitAnimationName = "inherit";
    }
    self.overrideSuper( self.class, "init", self.init );
    self.init = function( theParentElement ) {
      self.super( _className, "init", [ undefined, "div", "startView ui-container",
        theParentElement
      ] );
      self.addListenerForNotification( "viewWillAppear", self.startAnimation );
      self.addListenerForNotification( "viewWillDisappear", self.stopAnimation );
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
    self.overrideSuper( self.class, "destroy", self.destroy );
    self.destroy = function() {
      self._playButton = null;
      self._optionsButton = null;
      self.super( _className, "destroy" );
    }
    return self;
  };
  _y.addTranslations( {
    "APP_TITLE": {
      "EN": "Cave Runner"
    },
    "BACK": {
      "EN": "Back",
      "ES": "Volver"
    },
    "CANCEL": {
      "EN": "Cancel",
      "ES": "Cancelar"
    },
    "PLAY": {
      "EN": "Play!"
    },
    "OPTIONS": {
      "EN": "Options"
    }
  } );
  return StartView;
} );
