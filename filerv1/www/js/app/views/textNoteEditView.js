/**
 *
 * Note Edit View
 *
 * textNoteEditView.js
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
define( [ "yasmf", "app/models/noteStorageSingleton",
  "text!html/textNoteEditView.html!strip"
], function( _y, noteStorageSingleton, textNoteEditViewHTML ) {
  // store our classname for easy overriding later
  var _className = "TextNoteEditView";
  var TextNoteEditView = function() {
    // This time we descend from a simple ViewContainer
    var self = new _y.UI.ViewContainer();
    // always subclass
    self.subclass( _className );
    // our internal pointers to specific elements
    self._navigationBar = null;
    self._nameEditor = null;
    self._scrollContainer = null;
    self._contentsEditor = null;
    self._backButton = null;
    self._deleteButton = null;
    // the note we're editing
    self._note = null;
    /**
     * Save the specific note by copying the name and contents
     * from the DOM
     */
    self.saveNote = function() {
      self._note.name = self._nameEditor.innerText;
      self._note.textContents = self._contentsEditor.value;
      noteStorageSingleton.saveNote( self._note );
    };
    /**
     * Delete the specific note. NO WARNING!
     */
    self.deleteNote = function() {
      noteStorageSingleton.removeNote( self._note.uid );
      // return to the previous view.
      self.destroy();
    };
    /**
     * Go back to the previous view after saving the note.
     */
    self.goBack = function() {
      self.saveNote();
      self.destroy();
    };
    /**
     * Render the template, passing the note contents and
     * translated text.
     */
    self.overrideSuper( self.class, "render", self.render );
    self.render = function() {
      // no need to call super; it's abstract
      return _y.template( textNoteEditViewHTML, {
        "NOTE_NAME": self._note.name,
        "NOTE_CONTENTS": self._note.textContents,
        "BACK": _y.T( "BACK" ),
        "DELETE_NOTE": _y.T( "app.nev.DELETE_NOTE" )
      } );
    };
    /**
     * RenderToElement renders the template, finds our elements in the DOM
     * and hooks up the necessary event handling
     */
    self.overrideSuper( self.class, "renderToElement", self.renderToElement );
    self.renderToElement = function() {
      self.super( _className, "renderToElement" );
      self._navigationBar = self.element.querySelector( ".ui-navigation-bar" );
      self._nameEditor = self.element.querySelector( ".ui-navigation-bar .ui-title" );
      self._backButton = self.element.querySelector(
        ".ui-navigation-bar .ui-bar-button-group.ui-align-left .ui-back-button" );
      self._deleteButton = self.element.querySelector(
        ".ui-navigation-bar .ui-bar-button-group.ui-align-right .ui-bar-button" );
      self._scrollContainer = self.element.querySelector( ".ui-scroll-container" );
      self._contentsEditor = self.element.querySelector( ".ui-text-box" );
      // the back and delete buttons should have an event listener
      _y.UI.event.addListener( self._backButton, "click", self.goBack )
      _y.UI.event.addListener( self._deleteButton, "click", self.deleteNote );
      _y.UI.backButton.addListenerForNotification( "backButtonPressed", self.goBack );
    };
    /**
     * Initializes our view -- theParentElement is the DOM element to attach to, and
     * theUID is the specific note to edit.
     */
    self.overrideSuper( self.class, "init", self.init );
    self.init = function( theParentElement, theNote ) {
      // get the note
      self._note = theNote;
      // call super
      self.super( _className, "init", [ undefined, "div", self.class +
        " noteEditView ui-container", theParentElement
      ] );
    };
    self.overrideSuper( self.class, "initWithOptions", self.init );
    self.initWithOptions = function( options ) {
      var theParentElement;
      var theNote;
      if ( typeof options !== "undefined" ) {
        if ( typeof options.parent !== "undefined" ) {
          theParentElement = options.parent;
        }
        if ( typeof options.note !== "undefined" ) {
          theNote = options.note;
        }
      }
      self.init( theParentElement, theNote );
    };
    self.releaseBackButton = function() {
      // and make sure we forget about the physical back button
      _y.UI.backButton.removeListenerForNotification( "backButtonPressed", self.goBack );
    };
    /**
     * When destroy is called, release all our elements and
     * remove our backButton listener.
     */
    self.overrideSuper( self.class, "destroy", self.destroy );
    self.destroy = function() {
      self.releaseBackButton();
      // release our objects
      self._navigationBar = null;
      self._backButton = null;
      self._deleteButton = null;
      self._scrollContainer = null;
      self._nameEditor = null;
      self._contentsEditor = null;
      self.super( _className, "destroy" );
    };
    return self;
  };
  /**
   * add translations we need
   */
  _y.addTranslations( {
    "app.nev.DELETE_NOTE": {
      "EN": "Delete",
      "ES": "Eliminar"
    }
  } );
  return TextNoteEditView;
} );
