/**
 *
 * Static View
 *
 * staticView.js
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
define( [ "yasmf", "text!html/staticView.html!strip", "hammer" ], function( _y,
  staticViewHTML, Hammer ) {
  var _className = "StaticView";
  var StaticView = function() {
    // we descend from a simple ViewContainer
    var self = new _y.UI.ViewContainer();
    // always subclass
    self.subclass( _className );
    self.overrideSuper( self.class, "render", self.render );
    self.render = function() {
      return _y.template( staticViewHTML, {
        "PICK_A_NOTE": _y.T( "PICK_A_NOTE" )
      } );
    };
    self.overrideSuper( self.class, "init", self.init );
    self.init = function( theParentElement ) {
      self.super( _className, "init", [ undefined, "div", "staticView ui-container",
        theParentElement
      ] );
    };
    self.overrideSuper( self.class, "initWithOptions", self.init );
    self.initWithOptions = function( options ) {
      var theParentElement;
      if ( typeof options !== "undefined" ) {
        if ( typeof options.parent !== "undefined" ) {
          theParentElement = options.parent;
        }
      }
      self.init( theParentElement );
    };
    return self;
  };
  /**
   * Add the necessary translations
   */
  _y.addTranslations( {
    "PICK_A_NOTE": {
      "EN": "Pick or create a note to begin editing."
    }
  } );
  return StaticView;
} );
