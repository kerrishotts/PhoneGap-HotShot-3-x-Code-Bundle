/**
 *
 * Note List View
 *
 * noteListView.js
 * @author Kerri Shotts
 * @version 5.0.0
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
define( [ "yasmf", "app/models/noteStorageSingleton", "text!html/noteListView.html!strip",
  "text!html/noteListView_android.html!strip", "text!html/noteListItem.html!strip",
  "app/factories/noteFactory", "app/factories/noteViewFactory", "hammer"
], function( _y, noteStorageSingleton, noteListViewHTML, noteListViewAndroidHTML,
  noteListItemHTML, noteFactory, noteViewFactory, Hammer ) {
  var _className = "NoteListView";
  var NoteListView = function() {
    // we descend from a simple ViewContainer
    var self = new _y.UI.ViewContainer();
    // always subclass
    self.subclass( _className );
    // our pointers into the DOM
    self._navigationBar = null;
    self._scrollContainer = null;
    self._listOfNotes = null;
    self._newTextNoteButton = null;
    self._newAudioNoteButton = null;
    self._newImageNoteButton = null;
    self._newVideoNoteButton = null;
    self._createAndEditNote = function( noteType ) {
      // ask storage for a new note
      noteStorageSingleton.createNote( noteType ).then( function( aNewNote ) {
        // create a new editor view
        var aNoteEditView = noteViewFactory.createNoteEditView( noteType );
        // and tell it about the new note
        aNoteEditView.initWithOptions( {
          note: aNewNote
        } );
        self.navigationController.pushView( aNoteEditView );
      } ).catch( function( anError ) {
        console.log( anError )
      } ).done();
    };
    /**
     * Create a new text note
     */
    self.createNewTextNote = function() {
      self._createAndEditNote( noteFactory.TEXTNOTE );
    };
    /**
     * Create a new audio note
     */
    self.createNewAudioNote = function() {
      self._createAndEditNote( noteFactory.AUDIONOTE );
    };
    /**
     * Create a new image note
     */
    self.createNewImageNote = function() {
      self._createAndEditNote( noteFactory.IMAGENOTE );
    };
    /**
     * Create a new video note
     */
    self.createNewVideoNote = function() {
      self._createAndEditNote( noteFactory.VIDEONOTE );
    };
    /**
     * Edit an existing note. Called when a note item is tapped in the list.
     */
    self.editExistingNote = function( e ) {
      // get the UID
      var theUID = this.getAttribute( "data-uid" );
      // create a new editor view
      var aNote = noteStorageSingleton.getNote( theUID );
      var aNoteEditView = noteViewFactory.createNoteEditView( aNote.class );
      // and tell it about the note
      aNoteEditView.initWithOptions( {
        note: aNote
      } );
      self.navigationController.pushView( aNoteEditView );
    };
    /**
     * Delete an existing note
     */
    self.deleteExistingNote = function( e ) {
      var theEvent = e;
      // get the UID
      var theUID = this.getAttribute( "data-uid" );
      noteStorageSingleton.removeNote( theUID );
    };
    /**
     * Expose the underlying actions for a note; called when a right-to-left swipe is detected
     */
    self.exposeActionForNote = function( e ) {
      _y.UI.styleElement( this, "transition", "%PREFIX%transform 0.3s ease-in-out" );
      // how far do we have to go?
      var amountToTranslate = getComputedStyle( self._listOfNotes.querySelector(
        ".ui-list-action" ) ).getPropertyValue( "width" );
      _y.UI.styleElement( this, "transform", "translateX(-" + amountToTranslate + ")" );
    }
    /**
     * hide the underlying actions for a note
     */
    self.hideActionForNote = function( e ) {
      _y.UI.styleElement( this, "transition", "%PREFIX%transform 0.3s ease-in-out" );
      _y.UI.styleElement( this, "transform", "translateX(0px)" );
    };
    /**
     * Quit the app, in response to a back button event.
     */
    self.quitApp = function() {
      navigator.app.exitApp();
    };
    /**
     * Render the template, passing the app title and translated text
     */
    self.overrideSuper( self.class, "render", self.render );
    self.render = function() {
      return _y.template( _y.device.platform() === "android" ?
        noteListViewAndroidHTML : noteListViewHTML, {
          "APP_TITLE": _y.T( "APP_TITLE" )
        } );
    };
    /**
     * RenderToElement renders the HTML, finds all the elements we want to
     * have references to and attaches handlers if necessary,
     * and attaches a listener to the backButton handler.
     */
    self.overrideSuper( self.class, "renderToElement", self.renderToElement );
    self.renderToElement = function() {
      self.super( _className, "renderToElement" );
      self._navigationBar = self.element.querySelector( ".ui-navigation-bar" );
      self._scrollContainer = self.element.querySelector( ".ui-scroll-container" );
      self._listOfNotes = self.element.querySelector( ".ui-list" );
      self._newTextNoteButton = self.element.querySelector(
        ".ui-bar-button.ui-glyph-page-text-new" );
      self._newAudioNoteButton = self.element.querySelector(
        ".ui-bar-button.ui-glyph-sound-wave" );
      self._newImageNoteButton = self.element.querySelector(
        ".ui-bar-button.ui-glyph-camera" );
      self._newVideoNoteButton = self.element.querySelector(
        ".ui-bar-button.ui-glyph-camera-video" );
      Hammer( self._newTextNoteButton ).on( "tap", self.createNewTextNote );
      Hammer( self._newAudioNoteButton ).on( "tap", self.createNewAudioNote );
      Hammer( self._newImageNoteButton ).on( "tap", self.createNewImageNote );
      Hammer( self._newVideoNoteButton ).on( "tap", self.createNewVideoNote );
      _y.UI.backButton.addListenerForNotification( "backButtonPressed", self.quitApp );
    };
    /**
     * private method that handles hiding any visible actions in a list
     */
    self._hideActions = function( e ) {
      e.gesture.preventDefault();
      var allListItems = self._listOfNotes.querySelectorAll( ".ui-list-item-contents" );
      for ( var i = 0; i < allListItems.length; i++ ) {
        var el = allListItems[ i ];
        if ( el.getAttribute( "data-swiped" ) == "true" ) {
          el.setAttribute( "data-swiped", "false" );
          self.hideActionForNote.apply( el );
        }
        Hammer( el ).off( "touch", self._hideActions );
      }
    };
    /**
     * Render the note list; called whenever the storage collection changes
     */
    self.renderList = function() {
      var notes = noteStorageSingleton.collection;
      var fragment = document.createDocumentFragment();
      // loop over each note
      for ( var note in notes ) {
        // and avoid prototype entries
        if ( notes.hasOwnProperty( note ) ) {
          // null notes have been deleted -- don't show them
          if ( notes[ note ] !== null ) {
            // each entry is a li.ui-list-item with data-uid attribute and note_item_% as the id.
            var e = document.createElement( "li" );
            e.className = "ui-list-item";
            e.setAttribute( "data-uid", notes[ note ].uid );
            e.id = "note_item_" + notes[ note ].uid;
            // render the note item template
            e.innerHTML = _y.template( noteListItemHTML, {
              "UID": notes[ note ].uid,
              "TRASH": _y.T( "TRASH" ),
              "NAME": notes[ note ].name,
              "REPRESENTATION": notes[ note ].representation,
              "MODIFIED": _y.D( notes[ note ].modifiedDate, "D" ),
              "INFO": "" + _y.N( notes[ note ].formattedUnitValue )
            } );
            // attach any event handlers
            var contentsElement = e.querySelector( ".ui-list-item-contents" ),
              actionElement = e.querySelector( ".ui-list-action" );
            Hammer( contentsElement ).on( "tap", self.editExistingNote );
            // right-to-left swipe exposes action, and when it occurs, we need add code to all other itmes
            // to hide all actions
            Hammer( contentsElement, {
              swipe_velocity: 0.1,
              drag_block_horizontal: true,
              drag_block_vertical: true,
              prevent_default: true
            } ).on( "dragleft", function( e ) {
              var row = this;
              e.gesture.preventDefault();
              e.gesture.stopDetect();
              row.setAttribute( "data-swiped", "true" );
              self.exposeActionForNote.apply( row );
              var allListItems = self._listOfNotes.querySelectorAll(
                ".ui-list-item-contents" );
              for ( var i = 0; i < allListItems.length; i++ ) {
                var el = allListItems[ i ];
                Hammer( el ).on( "touch", self._hideActions );
              }
            } );
            Hammer( actionElement ).on( "tap", self.deleteExistingNote );
            // append the element to our list
            fragment.appendChild( e );
          }
        }
      }
      self._listOfNotes.innerHTML = "";
      self._listOfNotes.appendChild( fragment );
    };
    self.onOrientationChanged = function() {
      // fix a iOS bug where rotation may prevent the list from scrolling after rotation
      if ( _y.device.platform() == "ios" ) {
        // this forces the scroll container to be recalc'd. It also flickers a bit.
        // no way to avoid it, unfortunately.
        self._scrollContainer.style.display = "none";
        setTimeout( function() {
          self._scrollContainer.style.display = "";
        }, 0 );
      }
    };
    /**
     * Initialize the view and add listeners for the storage
     * collection so that when it changes, we can update appropriately
     */
    self.overrideSuper( self.class, "init", self.init );
    self.init = function( theParentElement ) {
      // call super
      self.super( _className, "init", [ undefined, "div", "noteListView ui-container",
        theParentElement
      ] );
      // register for changes in the note collection
      noteStorageSingleton.addListenerForNotification( "collectionChanged", self.renderList );
      noteStorageSingleton.addListenerForNotification( "collectionLoaded", self.renderList );
      // and ask noteStorage to load itself
      noteStorageSingleton.loadCollection();
      // we need to register for orientation changes
      _y.UI.orientationHandler.addListenerForNotification( "orientationChanged", self
        .onOrientationChanged );
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
    };
    /**
     * Be a good citizen. Clean up after ourselves when asked.
     */
    self.overrideSuper( self.class, "destroy", self.destroy );
    self.destroy = function() {
      // stop listening for orientation changes
      _y.UI.orientationHandler.removeListenerForNotification( "orientationChanged",
        self.onOrientationChanged );
      // release our objects
      self._navigationBar = null;
      self._newTextNoteButton = null;
      self._newAudioNoteButton = null;
      self._newVideoNoteButton = null;
      self._newImageNoteButton = null;
      self._scrollContainer = null;
      self._listOfNotes = null;
      self.super( _className, "destroy" );
    };
    return self;
  };
  /**
   * Add the necessary translations
   */
  _y.addTranslations( {
    "APP_TITLE": {
      "EN": "Filer"
    },
    "NEW_NOTE": {
      "EN": "New",
      "ES": "Nueva"
    },
    "BACK": {
      "EN": "Back",
      "ES": "Volver"
    },
    "TRASH": {
      "EN": "Trash",
      "ES": "Borrar"
    },
    "CANCEL": {
      "EN": "Cancel",
      "ES": "Cancelar"
    },
    "DELETE": {
      "EN": "Delete",
      "ES": "Eliminar"
    }
  } );
  return NoteListView;
} );
