/**
 *
 * Options View
 *
 * optionsView.js
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
define( [ "yasmf", "text!html/optionsView.html!strip", "hammer" ], function( _y,
  optionsViewHTML, Hammer ) {
  var _className = "OptionsView";
  var OptionsView = function() {
    var self = new _y.UI.ViewContainer();
    self.subclass( _className );
    self._tiltButton = null;
    self._slideButton = null;
    self._buttonsButton = null;
    self._backButton = null;
    // new for v2
    self._screenName = null;
    self._submitScores = null;
    self.goBack = function() {
      self.navigationController.popView();
    }
    self.overrideSuper( self.class, "render", self.render );
    self.render = function() {
      return _y.template( optionsViewHTML, {
        "TILT": _y.T( "TILT" ),
        "SLIDE": _y.T( "SLIDE" ),
        "BUTTONS": _y.T( "BUTTONS" ),
        "BACK": _y.T( "BACK" ),
        "SCREEN_NAME": _y.T( "SCREEN_NAME" ),
        "SUBMIT_SCORES": _y.T( "SUBMIT_SCORES" )
      } );
    }
    self.updateScorePreferences = function() {
      if ( typeof localStorage.screenName !== "undefined" ) {
        self._screenName.value = localStorage.screenName;
      }
      self._submitScores.classList.remove( "selected" );
      if ( typeof localStorage.submitScores !== "undefined" ) {
        if ( localStorage.submitScores == "YES" ) {
          self._submitScores.classList.add( "selected" );
        }
      }
    }
    self.toggleSubmitScores = function() {
      var selected = self._submitScores.classList.contains( "selected" );
      selected = !selected;
      localStorage.submitScores = selected ? "YES" : "NO";
      self.updateScorePreferences();
    }
    self.saveScreenName = function() {
      localStorage.screenName = self._screenName.value;
    }
    self.updateControlScheme = function() {
      var controlSchemes = {
        "tilt": self._tiltButton,
        "slide": self._slideButton,
        "buttons": self._buttonsButton
      };
      for ( var scheme in controlSchemes ) {
        if ( controlSchemes.hasOwnProperty( scheme ) ) {
          controlSchemes[ scheme ].classList.remove( "selected" );
        }
      }
      var controlScheme = "slide";
      if ( typeof localStorage.controlScheme !== "undefined" ) {
        controlScheme = localStorage.controlScheme;
      }
      controlSchemes[ controlScheme ].classList.add( "selected" );
    }
    self.controlSchemeTiltSelected = function() {
      localStorage.controlScheme = "tilt";
      self.updateControlScheme();
    }
    self.controlSchemeSlideSelected = function() {
      localStorage.controlScheme = "slide";
      self.updateControlScheme();
    }
    self.controlSchemeButtonsSelected = function() {
      localStorage.controlScheme = "buttons";
      self.updateControlScheme();
    }
    self.overrideSuper( self.class, "renderToElement", self.renderToElement );
    self.renderToElement = function() {
      self.super( _className, "renderToElement" );
      self._tiltButton = self.element.querySelector( ".control-scheme-tilt" );
      Hammer( self._tiltButton ).on( "tap", self.controlSchemeTiltSelected );
      self._slideButton = self.element.querySelector( ".control-scheme-slide" );
      Hammer( self._slideButton ).on( "tap", self.controlSchemeSlideSelected );
      self._buttonsButton = self.element.querySelector( ".control-scheme-buttons" );
      Hammer( self._buttonsButton ).on( "tap", self.controlSchemeButtonsSelected );
      // make sure the correct button is selected
      self.updateControlScheme();
      self._screenName = self.element.querySelector( ".screen-name" );
      self._screenName.addEventListener( "blur", self.saveScreenName );
      self._submitScores = self.element.querySelector( ".submit-scores" );
      Hammer( self._submitScores ).on( "tap", self.toggleSubmitScores );
      self.updateScorePreferences();
      self._backButton = self.element.querySelector( ".options-back" );
      Hammer( self._backButton ).on( "tap", self.goBack );
      _y.UI.backButton.addListenerForNotification( "backButtonPressed", self.goBack );
    }
    self.overrideSuper( self.class, "init", self.init );
    self.init = function( theParentElement ) {
      self.super( _className, "init", [ undefined, "div", self.class +
        " optionsView ui-container", theParentElement
      ] );
      self.addListenerForNotification( "viewWasPopped", self.releaseBackButton );
      self.addListenerForNotification( "viewWasPopped", self.destroy );
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
    self.releaseBackButton = function() {
      _y.UI.backButton.removeListenerForNotification( "backButtonPressed", self.goBack );
    }
    self.overrideSuper( self.class, "destroy", self.destroy );
    self.destroy = function() {
      self.releaseBackButton();
      self.removeListenerForNotification( "viewWasPopped", self.releaseBackButton );
      self.removeListenerForNotification( "viewWasPopped", self.destroy );
      self._backButton = null;
      self._tiltButton = null;
      self._slideButton = null;
      self._buttonsButton = null;
      self._submitScores = null;
      self._screenName = null;
      self.super( _className, "destroy" );
    }
    return self;
  };
  /**
   * add translations we need
   */
  _y.addTranslations( {
    "TILT": {
      "EN": "Tilt"
    },
    "SLIDE": {
      "EN": "Slide"
    },
    "BUTTONS": {
      "EN": "Buttons"
    },
    "SCREEN_NAME": {
      "EN": "Screen Name"
    },
    "SUBMIT_SCORES": {
      "EN": "Submit Scores?"
    }
  } );
  return OptionsView;
} );
