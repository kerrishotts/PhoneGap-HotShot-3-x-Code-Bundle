/**
 *
 * Note Storage
 *
 * noteStorage.js
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
define( [ "yasmf", "Q", "app/factories/noteFactory" ], function( _y, Q, noteFactory ) {
  /**
   * Generate a reasonably unique identifier based on the time
   * @return {Number} [description]
   */
  var _generateUID = function() {
    return _y.datetime.getUnixTime();
  };
  var _className = "NoteStorage";
  var NoteStorage = function() {
      // Again, we descend from BaseObject
      var self = new _y.BaseObject();
      // subclass ourselves so we know it
      self.subclass( _className );
      // the notifications we can send
      self.registerNotification( "collectionChanged" );
      self.registerNotification( "collectionLoading" );
      self.registerNotification( "collectionLoaded" );
      self.registerNotification( "collectionFailedLoading" );
      self.registerNotification( "collectionSaving" );
      self.registerNotification( "collectionSaved" );
      self.registerNotification( "collectionFailedSaving" );
      self.registerNotification( "noteChanged" );
      self.registerNotification( "noteSaved" );
      self.registerNotification( "noteFailedSaving" );
      self.registerNotification( "noteRemoved" );
      self.registerNotification( "noteFailedRemoving" );
      self.registerNotification( "noteCreated" );
      // the collection of notes
      self._notes = {};
      /**
       * the collection property is read-only and uses getCollection
       * as the getter.
       */
      self.getCollection = function() {
        return self._notes;
      }
      Object.defineProperty( self, "collection", {
        get: self.getCollection,
        configurable: true
      } );
      /**
       * Load the collection from storage
       */
      self.loadCollection = function() {
        self.notify( "collectionLoading" );
        try {
          // we store all the note IDs in a single localStorage value.
          var allNoteIDsJSON = localStorage.getItem( "notes" );
          if ( allNoteIDsJSON !== null ) {
            // if we have some notes to load, clear the existing ones first
            self._notes = {};
            // then parse out all the IDs
            var allNoteIDs = JSON.parse( allNoteIDsJSON );
            // loop through each one
            allNoteIDs.forEach( function( theNote ) {
              // load each note specifically
              var aNoteJSON = localStorage.getItem( "note" + theNote.UID );
              var aNote = noteFactory.createNote( theNote.type );
              if ( aNote.initWithJSON( aNoteJSON ) ) {
                self._notes[ theNote.UID ] = aNote;
              } else {
                self.notify( "collectionFailedLoading" );
                return;
              }
            } );
            // done! Notify everyone
            self.notify( "collectionLoaded" );
          } else {
            // nothing to load... :-(
            self._notes = {};
            self.notify( "collectionLoaded" );
          }
        } catch ( e ) {
          self.notify( "collectionFailedLoading", [ e.message ] );
        }
      }
      /**
       * Save the collection to storage
       */
      self.saveCollection = function() {
        self.notify( "collectionSaving" );
        try {
          //saving the collection only saves the UIDs -- not the notes themselves.
          var allNoteIDs = [];
          var aNote;
          for ( var aNoteUID in self._notes ) {
            // make sure we don't save a prototype entry
            if ( self._notes.hasOwnProperty( aNoteUID ) ) {
              aNote = self._notes[ aNoteUID ];
              // nulls mark deleted notes -- don't save those
              if ( aNote !== null ) {
                // add the UID to the list
                allNoteIDs.push( {
                  UID: aNote.UID,
                  type: aNote.class
                } );
              }
            }
          }
          // convert the list to JSON
          var allNoteIDsJSON = JSON.stringify( allNoteIDs );
          // and store it
          localStorage.setItem( "notes", allNoteIDsJSON );
          // and notify everyone
          self.notify( "collectionSaved" );
        } catch ( e ) {
          self.notify( "collectionFailedSaving", [ e.message ] );
        }
      }
      self.createNote = function( noteType ) {
        // Create a note from the Note object
        var aNote = noteFactory.createNote( noteType || noteFactory.TEXTNOTE );
        var noteUID = _generateUID();
        var newMediaFileName = noteFactory.createAssociatedMediaFileName( noteType ||
          noteFactory.TEXTNOTE, noteUID );
        // init it with a new UID, a set name and contents.
        aNote.initWithOptions( {
          "uid": noteUID,
          "name": _y.T( "app.ns.A_NEW_NOTE" ),
          "textContents": _y.T( "app.ns.WHATS_ON_YOUR_MIND" ),
          "mediaContents": newMediaFileName
        } );
        // add it to our collection
        self._notes[ aNote.uid ] = aNote;
        // tell everyone
        self.notify( "noteCreated", [ aNote.uid ] );
        // and save the note (which also changes the collection)
        self.saveNote( aNote );
        // return it for use
        return aNote;
      };
      /**
       * Return a specific note
       */
      self.getNote = function( theUID ) {
        return self._notes[ theUID ];
      }
      /**
       * Saves the note
       */
      self.saveNote = function( theNote ) {
        try {
          // attempt to deserialize the note
          var theJSON = theNote.JSON;
          // save the note to storage, which could be async if we wanted
          localStorage.setItem( "note" + theNote.uid, theJSON );
          self.notify( "noteSaved", [ theNote.uid ] );
          self.notify( "collectionChanged" );
        } catch ( e ) {
          self.notify( "noteFailedSaving", [ theNote, e.message ] );
        }
      }
      /**
       * Remove a specific note
       */
      self.removeNote = function( theUID ) {
        try {
          localStorage.removeItem( "note" + theUID );
          self._notes[ theUID ] = null;
          self.notify( "noteRemoved", [ theUID ] );
          self.notify( "collectionChanged" );
        } catch ( e ) {
          self.notify( "noteFailedRemoving", [ theUID, e.message ] );
        }
      }
      /**
       * Listen to changes in the collection -- and when they occur,
       * save the collection.
       */
      self._collectionChangedListener = function() {
        self.saveCollection();
      }
      self.overrideSuper( self.class, "init", self.init );
      self.init = function() {
        self.super( _className, "init" ); // BaseObject has no parameters
        self.addListenerForNotification( "collectionChanged", self._collectionChangedListener );
      };
      return self;
    }
    // this will add our translations, if it hasn't been done already
  _y.addTranslations( {
    "app.ns.A_NEW_NOTE": {
      "en": "A New Note",
      "es": "Una Nota Nueva"
    },
    "app.ns.WHATS_ON_YOUR_MIND": {
      "en": "What's on your mind?",
      "es": "¿Lo que está en tu mente?"
    },
    "app.ns.COULD_NOT_DESERIALIZE": {
      "en": "Could not deserialize the note.",
      "es": "No pudo deserializar la nota."
    },
    "app.ns.NOTE_SAVED": {
      "en": "The note was saved.",
      "es": "La nota se guardó."
    },
    "app.ns.NOTE_REMOVED": {
      "en": "The Note was removed.",
      "es": "La nota se eliminó."
    },
    "app.ns.NOTE_LOADED": {
      "en": "The note was loaded.",
      "es": "La nota se cargó."
    },
    "app.ns.NOTE_SAVE_FAILED": {
      "en": "The note could not be saved.",
      "es": "La nota no se guardó."
    },
    "app.ns.NOTE_LOAD_FAILED": {
      "en": "The note could not be loaded.",
      "es": "La nota no se cargó."
    },
    "app.ns.NOTE_REMOVE_FAILED": {
      "en": "The note could not be removed.",
      "es": "La nota no se eliminó."
    }
  } );
  return NoteStorage;
} );
