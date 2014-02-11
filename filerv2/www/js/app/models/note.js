/**
 *
 * Note Model
 * 
 * note.js
 * @author Kerri Shotts
 * @version 1.0.0
 *
 * Copyright (c) 2013 PacktPub Publishing
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
define ( ["yasmf"], function ( _y )
{
   /**
    * Model supporting a basic note.
    *
    * A note needs a UID for unique identification; we'll use the time.
    * The note also stores the date it was created and the date it was last
    * modified.
    * The note also stores its name and contents, and generates a linecount
    * based on the number of line breaks.
    * The note can return a JSON representation via .JSON (using _serialize).
    * 
    * Methods
    *  init
    *  initWithJSON
    *  initWithOptions
    *  
    * Can Send Notifications:
    *  uidChanged
    *  nameChanged
    *  contentsChanged
    */
   var _className = "Note";
   var Note = function ()
   {
      // We descend from BaseObject
      var self = new _y.BaseObject();

      // subclass the base object so that we look like a "Note"
      self.subclass ( _className );

      // register the notifications the model can send
      self.registerNotification ( "uidChanged" );
      self.registerNotification ( "nameChanged" );
      self.registerNotification ( "contentsChanged" );
      
      // private properties are prefixed with _
      
      /**
       * The note's unique identifier. getUID is the getter, and
       * setUID is the setter. Two properties can be used to
       * access it: uid and UID.
       * @type {String}
       */
      self._uid = undefined;  
      self.getUID = function ()
      {
         return self._uid;
      }
      self.setUID = function ( theUID )
      {
         self._uid = theUID;
         self.notify ( "uidChanged" );
      }
      Object.defineProperty ( self, "UID", {get: self.getUID, set: self.setUID, configurable: true });
      Object.defineProperty ( self, "uid", {get: self.getUID, set: self.setUID, configurable: true });

      /**
       * The date the note was created. Read-only; the createdDate
       * property only uses a getter (getCreatedDate).
       * @type {Date}
       */
      self._createdDate = undefined; 

      /** 
       * The date the note was modified. Read-only; the modifiedDate
       * property only uses a getter (getModifiedDate). It is reset
       * whenever the contents change or the name changes.  
       * @type {Date}
       */
      self._modifiedDate = undefined; // and a modification date

      self.getCreatedDate = function ()
      {
         return self._createdDate;
      }
      Object.defineProperty ( self, "createdDate", {get: self.getCreatedDate, configurable: true });

      self.getModifiedDate = function ()
      {
         return self._modifiedDate;
      }
      Object.defineProperty ( self, "modifiedDate", {get: self.getModifiedDate, configurable: true });

      /**
       * The visible name of the note. Read-write with setName and
       * getName; the property is name.
       * @type {String}
       */
      self._name = "";
      self.getName = function ()
      {
         return self._name;
      }
      self.setName = function ( theName )
      {
         self._name = theName;
         self._modifiedDate = new Date();
         self.notify ( "nameChanged" );
      }
      Object.defineProperty ( self, "name", {get: self.getName, set: self.setName, configurable: true });

      /**
       * The linecount is a read-only property readable with getLineCount
       * or lineCount. Calculated whenever the contents change.
       * @type {Number}
       */
      self._lineCount = 0;
      self.getLineCount = function ()
      {
         return self._lineCount;
      }
      Object.defineProperty ( self, "lineCount", {get: self.getLineCount, configurable: true });

      /**
       * For text notes, the contents property contains text. Read/write using
       * get and setContents, or the contents property.
       * @type {String}
       */
      self._contents = "";  
      self.getContents = function ()
      {
         return self._contents;
      }
      self.setContents = function ( theContents )
      {
         self._contents = theContents;
         self._modifiedDate = new Date();
         self._lineCount = self._contents.split("\n").length;
         self.notify ( "contentsChanged" );
      }
      Object.defineProperty ( self, "contents", {get: self.getContents, set: self.setContents, configurable: true });

      /**
       * Serializes the object into a JSON string ready
       * for saving in storage.
       * @return {String} JSON-style string of the object
       */
      self._serialize = function ()
      {
         return JSON.stringify
         ({
            "uid": self.uid,
            "createdDate" : self.createdDate,
            "modifiedDate" : self.modifiedDate,
            "name": self.name,
            "contents": self.contents
         });
      }
      Object.defineProperty ( self, "JSON", {get: self._serialize, configurable: true });

      /**
       * Deserializes the JSON String passed in, and returns true if
       * successful, or false if there was an error.
       * @param  {String} theSerializedObject A JSON-style string
       * @return {Boolean} true if successful; false if not
       */
      self._deserialize = function ( theSerializedObject )
      {
         try
         {
            var aNote = JSON.parse (theSerializedObject);

            // once we have the JSON parsed, assign our values.
            self.uid = aNote.uid;
            self._createdDate = new Date(aNote.createdDate);
            self.name = aNote.name;
            self.contents = aNote.contents;

            // but assign this one last so we have the proper modification date
            self._modifiedDate = new Date(aNote.modifiedDate);
            return true;
         }
         catch ( e )
         {
            return false;
         }
      };

      /**
       * The init function can take an optional UID parameter; if provided
       * uid is set to that; otherwise it is left at "".
       */
      self.overrideSuper ( self.class, "init", self.init );
      self.init = function ( theUID )
      {
         self.super ( _className, "init" ); // BaseObject super doesn't take any parameters
         self._createdDate = new Date(); // if not overridden otherwise, this will be the current datetime.
         if ( typeof theUID !== "undefined" ) { self.uid = theUID; }
      }

      /**
       * Initializes the note with the specified JSON; akin to initWithOptions.
       * @param  {String} theJSON The JSON representing the note
       * @return {Boolean}         True if successfully deserialized.
       */
      self.initWithJSON = function ( theJSON )
      {
         self.init ();
         if ( typeof theJSON !== "undefined" )
         {
            return self._deserialize ( theJSON );
         }
         else
         {
            return false; // no JSON to init with.
         }
      }

      /**
       * Initialize the note with the values specified in options. The fieldnames in
       * options match those in the object, so uid, name, and contents. Any options
       * not specified are left unspecified with no other defaults.
       * @param  {Object} options Properties
       * @return {Void}         
       */
      self.initWithOptions = function ( options )
      {
         self.init();
         if ( typeof options !== "undefined" )
         {
            if ( typeof options.uid !== "undefined" )      { self.uid = options.uid; }
            if ( typeof options.createdDate !== "undefined" ) { self._createdDate = options.createdDate; }
            if ( typeof options.name !== "undefined" )     { self.name = options.name; }
            if ( typeof options.contents !== "undefined" ) { self.contents = options.contents; }
            if ( typeof options.modifiedDate !== "undefined" ) { self._modifiedDate = options.modifiedDate; }
         }
      }

      // return our new object
      return self;
   };

   return Note;
});