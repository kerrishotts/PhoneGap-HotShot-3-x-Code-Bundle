/**
 *
 * Base Note Model
 *
 * baseNote.js
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
define( [ "yasmf" ], function( _y ) {
  /**
   * Model supporting a basic note. Extend for enhanced functionality
   */
  var _className = "BaseNote";
  var BaseNote = function() {
    // We descend from BaseObject
    var self = new _y.BaseObject();
    // subclass the base object so that we look like a "BaseNote"
    self.subclass( _className );
    // register the notifications the model can send
    self.registerNotification( "uidChanged" );
    self.registerNotification( "nameChanged" );
    self.registerNotification( "textContentsChanged" );
    self.registerNotification( "mediaContentsChanged" );
    self.registerNotification( "unitValueChanged" );
    self.registerNotification( "unitLabelsChanged" );
    /**
     * The note's unique identifier. getUID is the getter, and
     * setUID is the setter. Two properties can be used to
     * access it: uid and UID.
     */
    self._uid = undefined;
    self.getUID = function() {
      return self._uid;
    };
    self.setUID = function( theUID ) {
      self._uid = theUID;
      self.notify( "uidChanged" );
    };
    Object.defineProperty( self, "UID", {
      get: self.getUID,
      set: self.setUID,
      configurable: true
    } );
    Object.defineProperty( self, "uid", {
      get: self.getUID,
      set: self.setUID,
      configurable: true
    } );
    /**
     * The date the note was created. Read-only; the createdDate
     * property only uses a getter (getCreatedDate).
     */
    self._createdDate = undefined;
    /** 
     * The date the note was modified. Read-only; the modifiedDate
     * property only uses a getter (getModifiedDate). It is reset
     * whenever the contents change or the name changes.
     */
    self._modifiedDate = undefined; // and a modification date
    self.getCreatedDate = function() {
      return self._createdDate;
    };
    Object.defineProperty( self, "createdDate", {
      get: self.getCreatedDate,
      configurable: true
    } );
    self.getModifiedDate = function() {
      return self._modifiedDate;
    };
    Object.defineProperty( self, "modifiedDate", {
      get: self.getModifiedDate,
      configurable: true
    } );
    /**
     * The visible name of the note. Read-write with setName and
     * getName; the property is name.
     */
    self._name = "";
    self.getName = function() {
      return self._name;
    };
    self.setName = function( theName ) {
      self._name = theName;
      self._modifiedDate = new Date();
      self.notify( "nameChanged" );
    };
    Object.defineProperty( self, "name", {
      get: self.getName,
      set: self.setName,
      configurable: true
    } );
    /**
     * Instead of the line count, we'll use a generic "unit". For the BaseNote, this
     * is still a line count, but other note types may use it differently.
     *
     * unitValue is the actual value -- in our case the number of lines.
     * unitLabels stores the labels to use when referencing the value -- in this case,
     * "lines", "line", lines" for 0, 1, and 2 lines respectively (so we properly handle
     * pluralization).
     */
    self._unitValue = 0;
    self._unitLabels = [ "app.bn.LINES", "app.bn.LINE", "app.bn.LINES" ];
    self.getUnitValue = function() {
      return self._unitValue;
    };
    self.setUnitValue = function( theValue ) {
      self._unitValue = theValue;
      self.notify( "unitValueChanged" );
    };
    Object.defineProperty( self, "unitValue", {
      get: self.getUnitValue,
      set: self.setUnitValue,
      configurable: true
    } );
    self.getUnitLabels = function() {
      return self._unitLabels;
    };
    self.setUnitLabels = function( theLabels ) {
      self._unitLabels = theLabels;
      self.notify( "unitLabelsChanged" );
    };
    Object.defineProperty( self, "unitLabels", {
      get: self.getUnitLabels,
      set: self.setUnitLabels,
      configurable: true
    } );
    self.getFormattedUnitValue = function() {
      return _y.N( self.unitValue ) + " " + _y.T( self.unitLabels[ Math.min( ( self.unitLabels
        .length - 1 ), Math.round( self.unitValue ) ) ] );
    };
    Object.defineProperty( self, "formattedUnitValue", {
      get: self.getFormattedUnitValue,
      configurable: true
    } );
    /**
     * All notes can have text in the textContents property
     */
    self._textContents = "";
    self.getTextContents = function() {
      return self._textContents;
    };
    self.setTextContents = function( theContents ) {
      self._textContents = theContents;
      self._modifiedDate = new Date();
      if ( self.class === "BaseNote" ) {
        self.unitValue = self._textContents.split( "\n" ).length;
      }
      self.notify( "textContentsChanged" );
    };
    Object.defineProperty( self, "textContents", {
      get: self.getTextContents,
      set: self.setTextContents,
      configurable: true
    } );
    /**
     * All notes, except text notes, can have additional media contents
     * Usually a path and filename (such as note1234567.jpg)
     */
    self._mediaContents = null;
    self.getMediaContents = function() {
      return self._mediaContents;
    };
    self.setMediaContents = function( theContents ) {
      self._mediaContents = theContents;
      self._modifiedDate = new Date();
      self.notify( "mediaContentsChanged" );
    };
    Object.defineProperty( self, "mediaContents", {
      get: self.getMediaContents,
      set: self.setMediaContents,
      configurable: true
    } );
    /**
     * All notes have a representation icon (a page of text, a sound wave, etc)
     */
    self._representation = "page-text-new";
    self.getRepresentation = function() {
      return self._representation;
    };
    Object.defineProperty( self, "representation", {
      get: self.getRepresentation,
      configurable: true
    } );
    /**
     * Serializes the object into a JSON string ready
     * for saving in storage.
     */
    self._serialize = function() {
      return JSON.stringify( {
        "uid": self.uid,
        "createdDate": self.createdDate,
        "modifiedDate": self.modifiedDate,
        "name": self.name,
        "textContents": self.textContents,
        "mediaContents": self.mediaContents,
        "unitValue": self.unitValue,
        "unitLabels": self.unitLabels,
        "representation": self.representation
      } );
    };
    Object.defineProperty( self, "JSON", {
      get: self._serialize,
      configurable: true
    } );
    /**
     * Deserializes the JSON String passed in, and returns true if
     * successful, or false if there was an error.
     */
    self._deserialize = function( theSerializedObject ) {
      try {
        var aNote = JSON.parse( theSerializedObject );
        // once we have the JSON parsed, assign our values.
        self.uid = aNote.uid;
        self._createdDate = new Date( aNote.createdDate );
        self.name = aNote.name;
        self.textContents = aNote.textContents;
        self.mediaContents = aNote.mediaContents;
        self.unitValue = aNote.unitValue; // so we don't have to recalc it
        // but assign this one last so we have the proper modification date
        self._modifiedDate = new Date( aNote.modifiedDate );
        return true;
      } catch ( e ) {
        return false;
      }
    };
    /**
     * The init function can take an optional UID parameter; if provided
     * uid is set to that; otherwise it is left at "".
     */
    self.overrideSuper( self.class, "init", self.init );
    self.init = function( theUID ) {
      self.super( _className, "init" ); // BaseObject super doesn't take any parameters
      self._createdDate = new Date(); // if not overridden otherwise, this will be the current datetime.
      if ( typeof theUID !== "undefined" ) {
        self.uid = theUID;
      }
    };
    /**
     * Initializes the note with the specified JSON; akin to initWithOptions.
     */
    self.initWithJSON = function( theJSON ) {
      self.init();
      if ( typeof theJSON !== "undefined" ) {
        return self._deserialize( theJSON );
      } else {
        return false; // no JSON to init with.
      }
    };
    /**
     * Initialize the note with the values specified in options. The fieldnames in
     * options match those in the object, so uid, name, and contents. Any options
     * not specified are left unspecified with no other defaults.
     */
    self.initWithOptions = function( options ) {
      self.init();
      if ( typeof options !== "undefined" ) {
        if ( typeof options.uid !== "undefined" ) {
          self.uid = options.uid;
        }
        if ( typeof options.createdDate !== "undefined" ) {
          self._createdDate = options.createdDate;
        }
        if ( typeof options.name !== "undefined" ) {
          self.name = options.name;
        }
        if ( typeof options.textContents !== "undefined" ) {
          self.textContents = options.textContents;
        }
        if ( typeof options.mediaContents !== "undefined" ) {
          self.mediaContents = options.mediaContents;
        }
        if ( typeof options.unitValue !== "undefined" ) {
          self.unitValue = options.unitValue;
        }
        if ( typeof options.modifiedDate !== "undefined" ) {
          self._modifiedDate = options.modifiedDate;
        }
      }
    };
    // return our new object
    return self;
  };
  _y.addTranslations( {
    "app.bn.LINE": {
      "EN": "Line",
      "ES": "Línea"
    },
    "app.bn.LINES": {
      "EN": "Lines",
      "ES": "Líneas"
    }
  } );
  return BaseNote;
} );
