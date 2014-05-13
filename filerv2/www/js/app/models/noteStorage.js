/**
 *
 * Note Storage
 *
 * noteStorage.js
 * @author Kerri Shotts
 * @version 2.0.0
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
    // the file manager
    self._fileManager = null;
    self.getFileManager = function() {
      return self._fileManager;
    };
    Object.defineProperty( self, "fileManager", {
      get: self.getFileManager,
      configurable: true
    } );
    self._initializeFileManager = function() {
      if ( self._fileManager === null ) {
        var deferred = Q.defer();
        // create a new file manager
        var fm = new _y.FileManager();
        self._fileManager = fm;
        // then we need to init it
        fm.init( fm.PERSISTENT, 1024 * 1024 ).then( function() {
          return fm.createDirectory( "com.packtpub.phonegaphotshot.filer" );
        } ).then( fm.changeDirectory ).then( function() { // when we're done, resolve the promise
          deferred.resolve();
        } ).catch( function( e ) { // but if we failed, reject it
          deferred.reject( e );
        } ).done();
        return deferred.promise;
      } else {
        return Q(); // return a blank promise
      }
    };
    // the collection of notes
    self._notes = {};
    /**
     * the collection property is read-only and uses getCollection
     * as the getter.
     */
    self.getCollection = function() {
      return self._notes;
    };
    Object.defineProperty( self, "collection", {
      get: self.getCollection,
      configurable: true
    } );
    /**
     * Parse the contents of a note
     */
    self._parseNoteContents = function( theNoteType, aNoteJSON ) {
      var aNote = noteFactory.createNote( theNoteType );
      if ( aNote.initWithJSON( aNoteJSON ) ) {
        self._notes[ aNote.uid ] = aNote;
      } else {
        throw new Error( "Couldn't initWithJSON" );
      }
    };
    /**
     * Parse the contents of a collection file
     */
    self._parseCollectionContents = function( allNoteIDsJSON ) {
      var fm = self._fileManager;
      // if we have some notes to load, clear the existing ones first
      self._notes = {};
      if ( allNoteIDsJSON !== null ) {
        // then parse out all the IDs
        try {
          var allNoteIDs = JSON.parse( allNoteIDsJSON );
          var allNotePromises = [];
          allNoteIDs.forEach( function( theNote ) {
            allNotePromises.push( fm.readFileContents( "note" + theNote.UID +
              ".txt", {}, fm.FILETYPE.TEXT ).then( function( theNoteJSON ) {
              return [ theNote.type, theNoteJSON ];
            } ).spread( self._parseNoteContents ) );
          } );
          return Q.all( allNotePromises );
        } catch ( e ) {
          self.notify( "collectionFailedLoading", [ e.message ] );
          throw e;
        }
      } else {
        return Q();
      }
    };
    /**
     * Load the collection from storage
     */
    self.loadCollection = function() {
      self.notify( "collectionLoading" );
      // first, load the collection of note UIDs from notes.txt:
      self._initializeFileManager().then( function fileSystemInited() {
        var fm = self._fileManager;
        return fm.readFileContents( "notes.txt", {}, fm.FILETYPE.TEXT );
      } ).then( self._parseCollectionContents ).then( function notifyComplete() {
        self.notify( "collectionLoaded" );
      } ).catch( function anErrorHappened( anError ) {
        self.notify( "collectionFailedLoading", [ anError.message ] );
      } ).done();
    };
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
        self._initializeFileManager().then( function fileSystemInited() {
          var fm = self._fileManager;
          return fm.writeFileContents( "notes.txt", {
            create: true,
            exclusive: false
          }, new Blob( [ allNoteIDsJSON ], {
            type: 'text/plain'
          } ) );
        } ).then( function colletionSaved() {
          self.notify( "collectionSaved" );
        } ).catch( function anErrorHappened( anError ) {
          self.notify( "collectionFailedSaving", [ anError.message ] );
        } ).done();
      } catch ( anError ) {
        self.notify( "collectionFailedSaving", [ anError.message ] );
      }
    };
    /**
     * Create a note of the requested type
     */
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
      var fm = self.fileManager;
      var deferred = Q.defer();
      if ( newMediaFileName !== "" ) {
        fm.getFileEntry( newMediaFileName, {
          create: true,
          exclusive: false
        } ).then( function gotFile( theFile ) {
          aNote.mediaContents = theFile.fullPath;
          self.notify( "noteCreated", [ aNote.uid ] );
          self.saveNote( aNote );
          deferred.resolve( aNote );
        } ).catch( function( anError ) {
          deferred.reject( anError );
        } ).done();
      } else {
        deferred.resolve( aNote );
        self.notify( "noteCreated", [ aNote.uid ] );
        self.saveNote( aNote );
      }
      return deferred.promise;
    };
    /**
     * Return a specific note
     */
    self.getNote = function( theUID ) {
      return self._notes[ theUID ];
    };
    /**
     * Saves the note
     */
    self.saveNote = function( theNote ) {
      try {
        // attempt to deserialize the note
        var theJSON = theNote.JSON;
        self._initializeFileManager().then( function fileSystemInited() {
          var fm = self._fileManager;
          return fm.writeFileContents( "note" + theNote.uid + ".txt", {
            create: true,
            exclusive: false
          }, new Blob( [ theJSON ], {
            type: 'text/plain'
          } ) );
        } ).then( function noteSaved() {
          self.notify( "noteSaved", [ theNote.uid ] );
          self.notify( "collectionChanged" );
        } ).catch( function anErrorHappened( anError ) {
          self.notify( "noteFailedSaving", [ theNote, anError.message ] );
        } ).done();
      } catch ( e ) {
        self.notify( "noteFailedSaving", [ theNote, e.message ] );
      }
    };
    /**
     * Remove a specific note
     */
    self.removeNote = function( theUID ) {
      try {
        self._initializeFileManager().then( function fileSystemInited() {
          var fm = self._fileManager;
          return fm.deleteFile( "note" + theUID + ".txt" );
        } ).then( function fileDeleted() {
          var fm = self._fileManager;
          var aNote = self.getNote( theUID );
          self._notes[ theUID ] = null;
          self.notify( "noteRemoved", [ theUID ] );
          self.notify( "collectionChanged" );
          // the note has been removed -- but what about the media?
          if ( aNote.mediaContents !== null ) {
            return fm.deleteFile( aNote.mediaContents );
          }
        } ).catch( function anErrorHappened( anError ) {
          self.notify( "noteFailedRemoving", [ theUID, anError.message ] );
        } ).done();
      } catch ( e ) {
        self.notify( "noteFailedRemoving", [ theUID, e.message ] );
      }
    };
    /**
     * Listen to changes in the collection -- and when they occur,
     * save the collection.
     */
    self._collectionChangedListener = function() {
      self.saveCollection();
    };
    self.overrideSuper( self.class, "init", self.init );
    self.init = function() {
      self.super( _className, "init" ); // BaseObject has no parameters
      self.addListenerForNotification( "collectionChanged", self._collectionChangedListener );
    };
    return self;
  };
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
