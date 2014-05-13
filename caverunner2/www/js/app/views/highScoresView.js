/**
 *
 * High Scores View
 *
 * highScoresView.js
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
/*global define, console, Parse*/
define( [ "yasmf", "text!html/highScoresView.html!strip",
  "text!html/highScoreItem.html!string", "hammer"
], function( _y, highScoresViewHTML, highScoreItemHTML, Hammer ) {
  var _className = "HighScoresView";
  var HighScoresView = function() {
    var self = new _y.UI.ViewContainer();
    self.subclass( _className );
    self._highScoresList = null;
    self._backButton = null;
    self.goBack = function() {
      self.navigationController.popView();
    }
    self.overrideSuper( self.class, "render", self.render );
    self.render = function() {
      return _y.template( highScoresViewHTML, {
        "BACK": _y.T( "BACK" ),
        "PLAYER": _y.T( "PLAYER" ),
        "CONTROL": _y.T( "CONTROL" ),
        "LEVEL": _y.T( "LEVEL" ),
        "DISTANCE": _y.T( "DISTANCE" ),
        "SCORE": _y.T( "SCORE" ),
        "HIGH_SCORES": _y.T( "HIGH_SCORES" )
      } );
    }
    self.overrideSuper( self.class, "renderToElement", self.renderToElement );
    self.renderToElement = function() {
      self.super( _className, "renderToElement" );
      self._highScoresList = self.element.querySelector( ".high-scores-list" );
      self._backButton = self.element.querySelector( ".high-scores-back" );
      Hammer( self._backButton ).on( "tap", self.goBack );
      _y.UI.backButton.addListenerForNotification( "backButtonPressed", self.goBack );
    }
    self.getHighScores = function() {
      var GameScore = Parse.Object.extend( "Scores" );
      var query = new Parse.Query( GameScore );
      var controlType = "slide";
      if ( typeof localStorage.controlScheme !== "undefined" ) {
        controlType = localStorage.controlScheme;
      }
      query.equalTo( "ControlType", controlType );
      query.descending( "Score" );
      query.limit( 20 );
      query.find().then( function( results ) {
        self._highScoresList.innerHTML = results.reduce( function( previousValue,
          currentValue, index, array ) {
          return previousValue += _y.template( highScoreItemHTML, {
            "SCREEN_NAME": currentValue.get( "ScreenName" ),
            "CONTROL": currentValue.get( "ControlType" ),
            "LEVEL": currentValue.get( "HighestLevel" ),
            "DISTANCE": currentValue.get( "TotalDistance" ),
            "SCORE": Math.max( 0, currentValue.get( "Score" ) )
          } );
        }, "" );
      } );
    }
    self.overrideSuper( self.class, "init", self.init );
    self.init = function( theParentElement ) {
      self.super( _className, "init", [ undefined, "div", self.class +
        " highScoresView ui-container", theParentElement
      ] );
      self.addListenerForNotification( "viewWasPopped", self.releaseBackButton );
      self.addListenerForNotification( "viewWasPopped", self.destroy );
      self.addListenerForNotification( "viewWillAppear", self.getHighScores );
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
      self.removeListenerForNotification( "viewWillAppear", self.getHighScores );
      self._backButton = null;
      self._highScoresList = null;
      self.super( _className, "destroy" );
    }
    return self;
  };
  /**
   * add translations we need
   */
  _y.addTranslations( {
    "PLAYER": {
      "EN": "Player"
    },
    "CONTROL": {
      "EN": "Control"
    },
    "LEVEL": {
      "EN": "Level"
    },
    "DISTANCE": {
      "EN": "Distance"
    },
    "SCORE": {
      "EN": "Score"
    },
  } );
  return HighScoresView;
} );
