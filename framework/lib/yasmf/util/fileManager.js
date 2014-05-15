/**
 *
 * FileManager implements methods that interact with the HTML5 API
 *
 * core.js
 * @module core.js
 * @author Kerri Shotts
 * @version 0.4
 *
 * Copyright (c) 2013 Kerri Shotts, photoKandy Studios LLC
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
         camelcase:true,
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
         onevar:false,
         loopfunc:true
 */
/*global define, Q, LocalFileSystem, console*/

define (["Q", "yasmf/util/object"], function ( Q, BaseObject ) {
/**
 * @typedef {{}} Promise
 */

  var DEBUG = false;
  /**
   * Requests a quota from the file system
   * @param  {*} fileSystemType    PERSISTENT or TEMPORARY
   * @param  {Number} requestedDataSize The quota we're asking for
   * @return {Promise}                   The promise
   */
  function _requestQuota ( fileSystemType, requestedDataSize )
  {
    var deferred = Q.defer ();
    if (DEBUG) { console.log ( [ "_requestQuota: ", fileSystemType, requestedDataSize ].join (" ") ) }

    // make sure we can actually ask for a quota
    // Chrome currently has navigator.webkitPersistentStorage and navigator.webkitTemporaryStorage
    // No idea what this is going to be unprefixed...
    try
    {
      var PERSISTENT =  (typeof LocalFileSystem !== "undefined") ? LocalFileSystem.PERSISTENT : window.PERSISTENT ;
      var storageInfo = fileSystemType == PERSISTENT ? navigator.webkitPersistentStorage
                                                     : navigator.webkitTemporaryStorage;

      if (storageInfo)
      {
        // now make sure we can request a quota
        if (storageInfo.requestQuota)
        {
          // request the quota
          storageInfo.requestQuota ( requestedDataSize,
            function success ( grantedBytes ) { if (DEBUG) { console.log ( [ "_requestQuota: quota granted: ", fileSystemType, grantedBytes ].join (" ") ) }
                                                deferred.resolve ( grantedBytes ); },
            function failure ( anError )      { if (DEBUG) { console.log ( [ "_requestQuota: quota rejected: ", fileSystemType, requestedDataSize, anError ].join (" ") ) }
                                                deferred.reject ( anError ); }
          );
        }
        else
        {
          // not everything supports asking for a quota -- like Cordova
          // instead, let's assume we get permission
          if (DEBUG) { console.log ( [ "_requestQuota: couldn't request quota -- no requestQuota: ", fileSystemType, requestedDataSize ].join (" ") ) }
          deferred.resolve ( requestedDataSize );
        }
      }
      else
      {
        if (DEBUG) { console.log ( [ "_requestQuota: couldn't request quota -- no storageInfo: ", fileSystemType, requestedDataSize ].join (" ") ) }
        deferred.resolve (requestedDataSize );
      }
    }
    catch ( anError )
    {
      deferred.reject ( anError );
    }

    return deferred.promise;
  }

  /**
   * Request a file system with the requested size (obtained first by getting a quota)
   * @param  {*} fileSystemType    TEMPORARY or PERSISTENT
   * @param  {Number} requestedDataSize The quota
   * @return {Promise}                   The promise
   */
  function _requestFileSystem ( fileSystemType, requestedDataSize)
  {
    var deferred = Q.defer();
    if (DEBUG) { console.log ( [ "_requestFileSystem: ", fileSystemType, requestedDataSize ].join (" ") ) }
    try
    {
      var requestFileSystem = window.webkitRequestFileSystem || window.requestFileSystem;
      requestFileSystem ( fileSystemType, requestedDataSize,
        function success ( theFileSystem ) { if (DEBUG) { console.log ( [ "_requestFileSystem: got a file system", theFileSystem ].join (" ") ) }
                                             deferred.resolve ( theFileSystem ); },
        function failure ( anError )       { if (DEBUG) { console.log ( [ "_requestFileSystem: couldn't get a file system", fileSystemType ].join (" ") ) }
                                             deferred.reject ( anError ); }
      );
    }
    catch ( anError )
    {
      deferred.reject ( anError );
    }
    return deferred.promise;
  }

  /**
   * Resolves theURI to a fileEntry or directoryEntry, if possible.
   * @param  {String} theURL the path, should start with file://, but if it doesn't we'll add it.
   */
  function _resolveLocalFileSystemURL ( theURL )
  {
    var deferred = Q.defer();
    if (DEBUG) { console.log ( [ "_resolveLocalFileSystemURL: ", theURL ].join(" "))}
    try
    {
      var parts = theURL.split(":");
      var protocol, path;
      if (parts.length > 2)
      {
        throw new Error ( "The URI is not well-formed; missing protocol: " + theURL );
      }
      if (parts.length < 2)
      {
        protocol = "file";
        path = parts[0];
      }
      else
      {
        protocol = parts[0];
        path = parts[1];
      }

      var pathComponents = path.split ("/");
      var newPathComponents = [];
      pathComponents.forEach( function ( part )
                              {
                                part = part.trim();
                                if (part !== "")
                                { // remove /private if it is the first item in the new array, for iOS sake
                                  if (!((part === "private" ||
                                         part === "localhost") && 
                                        newPathComponents.length === 0)) {
                                    newPathComponents.push ( part );
                                  }
                                }
                              });
      var theNewURI = newPathComponents.join ("/");
      theNewURI = protocol + ":///" + theNewURI;


      window.resolveLocalFileSystemURL ( theNewURI,
        function (theEntry) { deferred.resolve (theEntry); },
        function (anError) { deferred.reject (anError); }
      );

    }
    catch ( anError )
    {
      deferred.reject ( anError );
    }
    return deferred.promise;

  }

  /**
   * @typedef {{}} DirectoryEntry
   */
  /**
   * Returns a directory entry based on the path from the parent using
   * the specified options ( or {} )
   * @param  {DirectoryEntry} parent  The parent that path is relative from (or absolute)
   * @param  {String} path    The relative or absolute path
   * @param  {Object} options The options (that is, create the directory if it doesn't exist, etc.)
   * @return {Promise}         The promise
   */
  function _getDirectoryEntry ( parent, path, options )
  {
    if (DEBUG) { console.log ( [ "_getDirectoryEntry:", parent, path, options ].join (" ") ) }
    var deferred = Q.defer();
    try
    {
      if (typeof path === "object") { deferred.resolve ( path ); }
      else
      {
        parent.getDirectory ( path, options || {},
          function success ( theDirectoryEntry )  { deferred.resolve ( theDirectoryEntry ); },
          function failure ( anError ) { deferred.reject ( anError ); }
        );
      }
    }
    catch ( anError )
    {
      deferred.reject ( anError );
    }
    return deferred.promise;
  }

  /**
   * Returns a file entry based on the path from the parent using
   * the specified options ( or {} )
   * @param  {DirectoryEntry} parent  The parent that path is relative from (or absolute)
   * @param  {String} path    The relative or absolute path
   * @param  {Object} options The options (that is, create the file if it doesn't exist, etc.)
   * @return {Promise}         The promise
   */
  function _getFileEntry ( parent, path, options )
  {
    if (DEBUG) { console.log ( [ "_getFileEntry:", parent, path, options ].join (" ") ) }
    var deferred = Q.defer();
    try
    {
      if (typeof path === "object") { deferred.resolve ( path ); }
      else
      {
        parent.getFile ( path, options || {},
          function success ( theFileEntry )  { deferred.resolve ( theFileEntry ); },
          function failure ( anError ) { deferred.reject ( anError ); }
        );
      }
    }
    catch ( anError )
    {
      deferred.reject ( anError );
    }
    return deferred.promise;
  }

  /**
   * @typedef {{}} FileEntry
   */
  /**
   * Returns a file object based on the file entry.
   * @param  {FileEntry} fileEntry The file Entry
   * @return {Promise}           The Promise
   */
  function _getFileObject ( fileEntry )
  {
    if (DEBUG) { console.log ( [ "_getFileObject:", fileEntry ].join (" ") ) }
    var deferred = Q.defer();
    try
    {
      fileEntry.file (
        function success ( theFile ) { deferred.resolve ( theFile ); },
        function failure ( anError ) { deferred.reject ( anError ); }
      );
    }
    catch ( anError )
    {
      deferred.reject ( anError );
    }
    return deferred.promise;
  }

  /**
   * Reads the file contents from a file object. readAsKind indicates how
   * to read the file ("Text", "DataURL", "BinaryString", "ArrayBuffer").
   * @param  {File} fileObject File to read
   * @param  {String} readAsKind "Text", "DataURL", "BinaryString", "ArrayBuffer"
   * @return {Promise}            The Promise
   */
  function _readFileContents ( fileObject, readAsKind )
  {
    if (DEBUG) { console.log ( [ "_readFileContents:", fileObject, readAsKind ].join (" ") ) }
    var deferred = Q.defer();
    try
    {
      var fileReader = new FileReader();
      fileReader.onloadend = function ( e )
      {
        deferred.resolve ( e.target.result );
      };
      fileReader.onerror = function ( anError )
      {
        deferred.reject ( anError );
      };
      fileReader["readAs" + readAsKind]( fileObject );
    }
    catch ( anError )
    {
      deferred.reject ( anError );
    }
    return deferred.promise;
  }

  /**
   * Creates a file writer for the file entry
   * @param  {FileEntry} fileEntry The file entry to write to
   * @return {Promise}           the Promise
   */
  function _createFileWriter ( fileEntry )
  {
    if (DEBUG) { console.log ( [ "_createFileWriter:", fileEntry ].join (" ") ) }
    var deferred = Q.defer();
    try
    {
      var fileWriter = fileEntry.createWriter (
        function success ( theFileWriter ) { deferred.resolve ( theFileWriter ); },
        function failure ( anError )       { deferred.reject  ( anError ); }
      );
    }
    catch ( anError )
    {
      deferred.reject ( anError );
    }
    return deferred.promise;
  }

  /**
   * @typedef {{}} FileWriter
   */
  /**
   * Write the contents to the fileWriter
   * @param  {FileWriter} fileWriter Obtained from _createFileWriter
   * @param  {*} contents   The contents to write
   * @return {Promise}            the Promise
   */
  function _writeFileContents ( fileWriter, contents )
  {
    if (DEBUG) { console.log ( [ "_writeFileContents:", fileWriter, contents ].join (" ") ) }
    var deferred = Q.defer();
    try
    {
      fileWriter.onwrite = function ( e )
      {
        fileWriter.onwrite = function ( e )
        {
          deferred.resolve ( e );
        };
        fileWriter.write ( contents );
      };
      fileWriter.onError = function ( anError )
      {
        deferred.reject ( anError );
      };
      fileWriter.truncate ( 0 ); // clear out the contents, first
    }
    catch ( anError )
    {
      deferred.reject ( anError );
    }
    return deferred.promise;
  }

  /**
   * Copy the file to the specified parent directory, with an optional new name
   * @param  {FileEntry} theFileEntry            The file to copy
   * @param  {DirectoryEntry} theParentDirectoryEntry The parent directory to copy the file to
   * @param  {String} theNewName              The new name of the file ( or undefined simply to copy )
   * @return {Promise}                         The Promise
   */
  function _copyFile ( theFileEntry, theParentDirectoryEntry, theNewName )
  {
    if (DEBUG) { console.log ( [ "_copyFile:", theFileEntry, theParentDirectoryEntry, theNewName ].join (" ") ) }
    var deferred = Q.defer();
    try
    {
      theFileEntry.copyTo ( theParentDirectoryEntry, theNewName,
        function success ( theNewFileEntry ) { deferred.resolve ( theNewFileEntry ); },
        function failure ( anError )         { deferred.reject  ( anError ); }
      );
    }
    catch ( anError )
    {
      deferred.reject ( anError );
    }
    return deferred.promise;
  }

  /**
   * Move the file to the specified parent directory, with an optional new name
   * @param  {FileEntry} theFileEntry            The file to move or rename
   * @param  {DirectoryEntry} theParentDirectoryEntry The parent directory to move the file to (or the same as the file in order to rename)
   * @param  {String} theNewName              The new name of the file ( or undefined simply to move )
   * @return {Promise}                         The Promise
   */
  function _moveFile ( theFileEntry, theParentDirectoryEntry, theNewName )
  {
    if (DEBUG) { console.log ( [ "_moveFile:", theFileEntry, theParentDirectoryEntry, theNewName ].join (" ") ) }
    var deferred = Q.defer();
    try
    {
      theFileEntry.moveTo ( theParentDirectoryEntry, theNewName,
        function success ( theNewFileEntry ) { deferred.resolve ( theNewFileEntry ); },
        function failure ( anError )         { deferred.reject  ( anError ); }
      );
    }
    catch ( anError )
    {
      deferred.reject ( anError );
    }
    return deferred.promise;
  }

  /**
   * Remove the file from the file system
   * @param  {FileEntry} theFileEntry The file to remove
   * @return {Promise}              The Promise
   */
  function _removeFile ( theFileEntry )
  {
    if (DEBUG) { console.log ( [ "_removeFile:", theFileEntry ].join (" ") ) }
    var deferred = Q.defer();
    try
    {
      theFileEntry.remove (
        function success ()          { deferred.resolve (); },
        function failure ( anError ) { deferred.reject ( anError ); }
      );
    }
    catch ( anError )
    {
      deferred.reject ( anError );
    }
    return deferred.promise;
  }

  /**
   * Copies a directory to the specified directory, with an optional new name. The directory
   * is copied recursively.
   * @param  {DirectoryEntry} theDirectoryEntry       The directory to copy
   * @param  {DirectoryEntry} theParentDirectoryEntry The parent directory to copy the first directory to
   * @param  {String} theNewName              The optional new name for the directory
   * @return {Promise}                         A promise
   */
  function _copyDirectory ( theDirectoryEntry, theParentDirectoryEntry, theNewName )
  {
    if (DEBUG) { console.log ( [ "_copyDirectory:", theDirectoryEntry, theParentDirectoryEntry, theNewName ].join (" ") ) }
    var deferred = Q.defer();
    try
    {
      theDirectoryEntry.copyTo ( theParentDirectoryEntry, theNewName,
        function success ( theNewDirectoryEntry ) { deferred.resolve ( theNewDirectoryEntry ); },
        function failure ( anError )              { deferred.reject  ( anError ); }
      );
    }
    catch ( anError )
    {
      deferred.reject ( anError );
    }
    return deferred.promise;
  }

  /**
   * Moves a directory to the specified directory, with an optional new name. The directory
   * is moved recursively.
   * @param  {DirectoryEntry} theDirectoryEntry       The directory to move
   * @param  {DirectoryEntry} theParentDirectoryEntry The parent directory to move the first directory to
   * @param  {String} theNewName              The optional new name for the directory
   * @return {Promise}                         A promise
   */
  function _moveDirectory ( theDirectoryEntry, theParentDirectoryEntry, theNewName )
  {
    if (DEBUG) { console.log ( [ "_moveDirectory:", theDirectoryEntry, theParentDirectoryEntry, theNewName ].join (" ") ) }
    var deferred = Q.defer();
    try
    {
      theDirectoryEntry.moveTo ( theParentDirectoryEntry, theNewName,
        function success ( theNewDirectoryEntry ) { deferred.resolve ( theNewDirectoryEntry ); },
        function failure ( anError )              { deferred.reject  ( anError ); }
      );
    }
    catch ( anError )
    {
      deferred.reject ( anError );
    }
    return deferred.promise;
  }

  /**
   * Removes a directory from the file system. If recursively is true, the directory is removed
   * recursively.
   * @param  {DirectoryEntry} theDirectoryEntry The directory to remove
   * @param  {Boolean} recursively       If true, remove recursively
   * @return {Promise}                   The Promise
   */
  function _removeDirectory ( theDirectoryEntry, recursively )
  {
    if (DEBUG) { console.log ( [ "_removeDirectory:", theDirectoryEntry, "recursively", recursively ].join (" ") ) }
    var deferred = Q.defer();
    try
    {
      if (!recursively)
      {
        theDirectoryEntry.remove (
          function success ()          { deferred.resolve (); },
          function failure ( anError ) { deferred.reject ( anError ); }
        );
      } else {
        theDirectoryEntry.removeRecursively (
          function success ()          { deferred.resolve (); },
          function failure ( anError ) { deferred.reject ( anError ); }
        );
      }
    }
    catch ( anError )
    {
      deferred.reject ( anError );
    }
    return deferred.promise;
  }

  /**
   * Reads the contents of a directory
   * @param  {DirectoryEntry} theDirectoryEntry The directory to list
   * @return {Promise}                   The promise
   */
  function _readDirectoryContents ( theDirectoryEntry )
  {
    if (DEBUG) { console.log ( [ "_readDirectoryContents:", theDirectoryEntry ].join (" ") ) }
    var deferred = Q.defer();
    try
    {
      var directoryReader = theDirectoryEntry.createReader();
      var entries = [];

      function readEntries()
      {
        directoryReader.readEntries (
          function success ( theEntries ) {
            if (!theEntries.length)
            {
              deferred.resolve ( entries );
            }
            else
            {
              entries = entries.concat ( Array.prototype.slice.call ( theEntries || [], 0 ) );
              readEntries();
            }
          },
          function failure ( anError )    { deferred.reject ( anError ); }
        );
      }
      readEntries();
    }
    catch ( anError )
    {
      deferred.reject ( anError );
    }
    return deferred.promise;
  }


  var _className = "UTIL.FileManager";
  var FileManager = function ()
  {
    var self;
    var hasBaseObject = (typeof BaseObject !== "undefined");

    if (hasBaseObject) { self = new BaseObject ();
                         self.subclass ( _className );
                         self.registerNotification ( "changedCurrentWorkingDirectory"); }
                 else  { self = {}; }

    // get the persistent and temporary filesystem constants
    self.PERSISTENT = (typeof LocalFileSystem !== "undefined") ? LocalFileSystem.PERSISTENT : window.PERSISTENT;
    self.TEMPORARY = (typeof LocalFileSystem !== "undefined") ? LocalFileSystem.TEMPORARY : window.TEMPORARY;
    self.FILETYPE = { TEXT: "Text", DATA_URL: "DataURL", BINARY: "BinaryString", ARRAY_BUFFER: "ArrayBuffer"};

    self.getGlobalDebug = function ()
    {
      return DEBUG;
    };
    self.setGlobalDebug = function ( debug )
    {
      DEBUG = debug;
    };
    Object.defineProperty ( self, "globalDebug", { get: self.getGlobalDebug,
                                                   set: self.setGlobalDebug,
                                                   configurable: true});

    /**
     * the fileSystemType can either be self.PERSISTENT or self.TEMPORARY, and is only
     * set during an INIT operation. It cannot be set at any other time.
     */
    self._fileSystemType = null; // can only be changed during INIT
    self.getFileSystemType = function ()
    {
      return self._fileSystemType;
    };
    Object.defineProperty ( self, "fileSystemType", { get: self.getFileSystemType,
                                                      configurable: true });

    /**
     * The requested quota -- stored for future reference, since we ask for it
     * specifically during an INIT operation. It cannot be changed.
     */
    self._requestedQuota = 0; // can only be changed during INIT
    self.getRequestedQuota = function ()
    {
      return self._requestedQuota;
    };
    Object.defineProperty ( self, "requestedQuota", { get: self.getRequestedQuota,
                                                      configurable: true });

    /**
     * The actual quota obtained from the system. It cannot be changed, and is
     * only obtained during an INIT.
     * @type {Number}
     */
    self._actualQuota = 0;
    self.getActualQuota = function ()
    {
      return self._actualQuota;
    };
    Object.defineProperty ( self, "actualQuota", { get: self.getActualQuota,
                                                   configurable: true });

    /**
     * @typedef {{}} FileSystem
     */
    /**
     * The current filesystem -- either the temporary or persistent one; it can't be changed
     * @type {FileSystem}
     */
    self._fileSystem = null;
    self.getFileSystem = function ()
    {
      return self._fileSystem;
    };
    Object.defineProperty ( self, "fileSystem", { get: self.getFileSystem,
                                                  configurable: true });

    /**
     * Current Working Directory Entry
     * @type {[type]}
     */
    self._root = null;
    self._cwd = null;
    self.getCurrentWorkingDirectory = function ()
    {
      return self._cwd;
    };
    self.setCurrentWorkingDirectory = function ( theCWD )
    {
      self._cwd = theCWD;
      if (hasBaseObject) { self.notify ( "changedCurrentWorkingDirectory" ); }
    };
    Object.defineProperty ( self, "cwd", { get: self.getCurrentWorkingDirectory,
                                           set: self.setCurrentWorkingDirectory,
                                           configurable: true });
    Object.defineProperty ( self, "currentWorkingDirectory",
                                         { get: self.getCurrentWorkingDirectory,
                                           set: self.setCurrentWorkingDirectory,
                                           configurable: true });

    /**
     * Current Working Directory stack
     * @type {Array}
     */
    self._cwds = [];
    /**
     * Push the current working directory on to the stack
     */
    self.pushCurrentWorkingDirectory = function ()
    {
      self._cwds.push ( self._cwd );
    };
    /**
     * Pop the topmost directory on the stack and change to it
     */
    self.popCurrentWorkingDirectory = function ()
    {
      self.setCurrentWorkingDirectory ( self._cwds.pop() );
    };

    self.resolveLocalFileSystemURL = function ( theURI )
    {
      var deferred = Q.defer();
      _resolveLocalFileSystemURL ( theURI )
      .then ( function gotEntry ( theEntry ) { deferred.resolve (theEntry); } )
      .catch ( function ( anError ) { deferred.reject (anError); } )
      .done ();
      return deferred.promise;
    };

    /**
     * Returns the file entry for the given path (useful for
     * getting the full path of a file)
     */
    self.getFileEntry = function ( theFilePath, options )
    {
      var deferred = Q.defer();
      _getFileEntry ( self._cwd, theFilePath, options )
      .then ( function gotFileEntry ( theFileEntry ) { deferred.resolve ( theFileEntry ); } )
      .catch ( function ( anError ) { deferred.reject (anError); } )
      .done ();
      return deferred.promise;
    };

    /**
     * Returns the file object for a given file (useful for getting
     * the size of a file)
     */
    self.getFile = function ( theFilePath, options )
    {
      return self.getFileEntry ( theFilePath, options )
                 .then ( _getFileObject );
    };

    /**
     * Returns the directory entry for a given path
     */
    self.getDirectoryEntry = function ( theDirectoryPath, options )
    {
      var deferred = Q.defer();
      _getDirectoryEntry ( self._cwd, theDirectoryPath, options )
      .then ( function gotDirectoryEntry ( theDirectoryEntry ) { deferred.resolve ( theDirectoryEntry ); } )
      .catch ( function ( anError ) { deferred.reject (anError); } )
      .done ();
      return deferred.promise;
    };

    /**
     * returns the URL for a given file
     */
    self.getFileURL = function ( theFilePath, options )
    {
      var deferred = Q.defer();
      _getFileEntry ( self._cwd, theFilePath, options )
      .then ( function gotFileEntry ( theFileEntry ) { deferred.resolve ( theFileEntry.toURL() ); } )
      .catch ( function ( anError ) { deferred.reject (anError); } )
      .done ();
      return deferred.promise;
    };
    /**
     * Returns a URL for the given directory
     */
    self.getDirectoryURL = function ( thePath, options )
    {
      var deferred = Q.defer();
      _getDirectoryEntry ( self._cwd, thePath || "." , options )
      .then ( function gotDirectoryEntry ( theDirectoryEntry ) { deferred.resolve ( theDirectoryEntry.toURL() ); } )
      .catch ( function ( anError ) { deferred.reject (anError); } )
      .done ();
      return deferred.promise;
    };

    self.getNativeURL = function ( theEntry )
    {
      var thePath = theEntry;
      if (typeof theEntry !== "string")
      {
        thePath = theEntry.fullPath();
      }
      var isAbsolute = (thePath.substr(0,1)==="/");
      var theRootPath = isAbsolute ? self._root.nativeURL : self.cwd.nativeURL;
      return theRootPath + (isAbsolute ? "" : "/") + thePath;
    };
    /**
     * returns the native file path for a given file
     */
    self.getNativeFileURL = function ( theFilePath, options )
    {

      var deferred = Q.defer();
      _getFileEntry ( self._cwd, theFilePath, options )
        .then ( function gotFileEntry ( theFileEntry ) { deferred.resolve ( theFileEntry.nativeURL ); } )
        .catch ( function ( anError ) { deferred.reject (anError); } )
        .done ();
      return deferred.promise;
    };
    /**
     * Returns a URL for the given directory
     */
    self.getNativeDirectoryURL = function ( thePath, options )
    {
      var deferred = Q.defer();
      _getDirectoryEntry ( self._cwd, thePath || "." , options )
        .then ( function gotDirectoryEntry ( theDirectoryEntry ) { deferred.resolve ( theDirectoryEntry.nativeURL ); } )
        .catch ( function ( anError ) { deferred.reject (anError); } )
        .done ();
      return deferred.promise;
    };

    /**
     * Change to an arbitrary directory
     * @param  {String} theNewPath The path to the directory, relative to cwd
     * @return {Promise}            The Promise
     */
    self.changeDirectory = function ( theNewPath )
    {
      var deferred = Q.defer();
      _getDirectoryEntry ( self._cwd, theNewPath, {} )
      .then ( function gotDirectory ( theNewDirectory ) { self.cwd = theNewDirectory; } )
      .then ( function allDone () { deferred.resolve( self ); } )
      .catch ( function ( anError ) { deferred.reject (anError); } )
      .done ();
      return deferred.promise;
    };

    /**
     * Read an arbitrary file's contents.
     * @param  {String} theFilePath The path to the file, relative to cwd
     * @param  {Object} options     The options to use when opening the file (such as creating it)
     * @param  {String} readAsKind  How to read the file -- best to use self.FILETYPE.TEXT, etc.
     * @return {Promise}             The Promise
     */
    self.readFileContents = function ( theFilePath, options, readAsKind )
    {
      var deferred = Q.defer();
      _getFileEntry ( self._cwd, theFilePath, options || {} )
      .then ( function gotTheFileEntry ( theFileEntry ) { return _getFileObject ( theFileEntry ); } )
      .then ( function gotTheFileObject ( theFileObject ) { return _readFileContents ( theFileObject, readAsKind || "Text" ); } )
      .then ( function getTheFileContents ( theFileContents ) { deferred.resolve ( theFileContents ); } )
      .catch ( function ( anError ) { deferred.reject ( anError ); } )
      .done();
      return deferred.promise;
    };

    /**
     * Read an arbitrary directory's entries.
     * @param  {String} theDirectoryPath The path to the directory, relative to cwd; "." if not specified
     * @param  {Object} options          The options to use when opening the directory (such as creating it)
     * @return {Promise}             The Promise
     */
    self.readDirectoryContents = function ( theDirectoryPath, options )
    {
      var deferred = Q.defer();
      _getDirectoryEntry ( self._cwd, theDirectoryPath || "." , options || {})
      .then ( function gotTheDirectoryEntry ( theDirectoryEntry ) { return _readDirectoryContents (theDirectoryEntry); } )
      .then ( function gotTheDirectoryEntries ( theEntries ) { deferred.resolve (theEntries); } )
      .catch ( function ( anError ) { deferred.reject ( anError ); } )
      .done();
      return deferred.promise;
    };

    /**
     * Write data to an arbitrary file
     * @param  {String} theFilePath The file name to write to, relative to cwd
     * @param  {Object} options     The options to use when opening the file
     * @param  {*} theData     The data to write
     * @return {Promise}             The Promise
     */
    self.writeFileContents = function ( theFilePath, options, theData )
    {
      var deferred = Q.defer();
      _getFileEntry ( self._cwd, theFilePath, options || { create: true, exclusive: false })
      .then ( function gotTheFileEntry ( theFileEntry ) { return _createFileWriter ( theFileEntry ); } )
      .then ( function gotTheFileWriter ( theFileWriter ) { return _writeFileContents ( theFileWriter, theData ); })
      .then ( function allDone () { deferred.resolve ( self ); } )
      .catch ( function ( anError ) { deferred.reject ( anError ); } )
      .done ();
      return deferred.promise;
    };

    /**
     * Creates an arbitrary directory
     * @param  {String} theDirectoryPath The path, relative to cwd
     * @return {Promise}                  The Promise
     */
    self.createDirectory = function ( theDirectoryPath )
    {
      var deferred = Q.defer();
      _getDirectoryEntry ( self._cwd, theDirectoryPath, { create: true, exclusive: false } )
      .then ( function gotDirectory ( theNewDirectory ) { deferred.resolve ( theNewDirectory ); } )
      .catch ( function ( anError ) { deferred.reject (anError); } )
      .done ();
      return deferred.promise;
    };

    /**
     * Copies a file to a new directory, with an optional new name
     * @param  {String} sourceFilePath      Path to file, relative to cwd
     * @param  {String} targetDirectoryPath Path to new directory, relative to cwd
     * @param  {String} withNewName         New name, if desired
     * @return {Promise}                     The Promise
     */
    self.copyFile = function ( sourceFilePath, targetDirectoryPath, withNewName )
    {
      var deferred = Q.defer();
      var theFileToCopy;
      _getFileEntry ( self._cwd, sourceFilePath, {} )
      .then ( function gotFileEntry ( aFileToCopy ) { theFileToCopy = aFileToCopy;
                                                      return _getDirectoryEntry ( self._cwd, targetDirectoryPath, {} ); } )
      .then ( function gotDirectoryEntry ( theTargetDirectory ) { return _copyFile ( theFileToCopy, theTargetDirectory, withNewName ); } )
      .then ( function allDone ( theNewFileEntry ) { deferred.resolve ( theNewFileEntry ); } )
      .catch ( function ( anError ) { deferred.reject (anError); } )
      .done ();
      return deferred.promise;
    };

    /**
     * Copies a directory to a new directory, with an optional new name
     * @param  {String} sourceDirectoryPath Path to directory, relative to cwd
     * @param  {String} targetDirectoryPath Path to new directory, relative to cwd
     * @param  {String} withNewName         New name, if desired
     * @return {Promise}                     The Promise
     */
    self.copyDirectory = function ( sourceDirectoryPath, targetDirectoryPath, withNewName )
    {
      var deferred = Q.defer();
      var theDirectoryToCopy;
      _getDirectoryEntry ( self._cwd, sourceDirectoryPath, {} )
      .then ( function gotSourceDirectoryEntry ( sourceDirectoryEntry ) { theDirectoryToCopy = sourceDirectoryEntry;
                                                                          return _getDirectoryEntry ( self._cwd, targetDirectoryPath, {} ); } )
      .then ( function gotTargetDirectoryEntry ( theTargetDirectory )   { return _copyDirectory ( theDirectoryToCopy, theTargetDirectory, withNewName ); } )
      .then ( function allDone ( theNewDirectoryEntry ) { deferred.resolve ( theNewDirectoryEntry ); } )
      .catch ( function ( anError ) { deferred.reject (anError); } )
      .done ();
      return deferred.promise;
    };

    /**
     * Moves a file to a new directory, with an optional new name
     * @param  {String} sourceFilePath      Path to file, relative to cwd
     * @param  {String} targetDirectoryPath Path to new directory, relative to cwd
     * @param  {String} withNewName         New name, if desired
     * @return {Promise}                     The Promise
     */
    self.moveFile = function ( sourceFilePath, targetDirectoryPath, withNewName )
    {
      var deferred = Q.defer();
      var theFileToMove;
      _getFileEntry ( self._cwd, sourceFilePath, {} )
      .then ( function gotFileEntry ( aFileToMove ) { theFileToMove = aFileToMove;
                                                      return _getDirectoryEntry ( self._cwd, targetDirectoryPath, {} ); } )
      .then ( function gotDirectoryEntry ( theTargetDirectory ) { return _moveFile ( theFileToMove, theTargetDirectory, withNewName ); } )
      .then ( function allDone ( theNewFileEntry ) { deferred.resolve ( theNewFileEntry ); } )
      .catch ( function ( anError ) { deferred.reject (anError); } )
      .done ();
      return deferred.promise;
    };

    /**
     * Moves a directory to a new directory, with an optional new name
     * @param  {String} sourceDirectoryPath Path to directory, relative to cwd
     * @param  {String} targetDirectoryPath Path to new directory, relative to cwd
     * @param  {String} withNewName         New name, if desired
     * @return {Promise}                     The Promise
     */
    self.moveDirectory = function ( sourceDirectoryPath, targetDirectoryPath, withNewName )
    {
      var deferred = Q.defer();
      var theDirectoryToMove;
      _getDirectoryEntry ( self._cwd, sourceDirectoryPath, {} )
      .then ( function gotSourceDirectoryEntry ( sourceDirectoryEntry ) { theDirectoryToMove = sourceDirectoryEntry;
                                                                          return _getDirectoryEntry ( self._cwd, targetDirectoryPath, {} ); } )
      .then ( function gotTargetDirectoryEntry ( theTargetDirectory )   { return _moveDirectory ( theDirectoryToMove, theTargetDirectory, withNewName ); } )
      .then ( function allDone ( theNewDirectoryEntry ) { deferred.resolve ( theNewDirectoryEntry ); } )
      .catch ( function ( anError ) { deferred.reject (anError); } )
      .done ();
      return deferred.promise;
    };

    /**
     * Renames a file to a new name, in the cwd
     * @param  {String} sourceFilePath      Path to file, relative to cwd
     * @param  {String} withNewName         New name
     * @return {Promise}                     The Promise
     */
    self.renameFile = function ( sourceFilePath, withNewName )
    {
      return self.moveFile ( sourceFilePath, ".", withNewName );
    };

    /**
     * Renames a directory to a new name, in the cwd
     * @param  {String} sourceDirectoryPath Path to directory, relative to cwd
     * @param  {String} withNewName         New name
     * @return {Promise}                     The Promise
     */
    self.renameDirectory = function ( sourceDirectoryPath, withNewName )
    {
      return self.moveDirectory ( sourceDirectoryPath, ".", withNewName );
    };

    /**
     * Deletes a file
     * @param  {String} theFilePath Path to file, relative to cwd
     * @return {Promise}             The Promise
     */
    self.deleteFile = function ( theFilePath )
    {
      var deferred = Q.defer ();
      _getFileEntry ( self._cwd, theFilePath, {} )
      .then ( function gotTheFileToDelete ( theFileEntry ) { return _removeFile ( theFileEntry ); } )
      .then ( function allDone () { deferred.resolve ( self ); } )
      .catch ( function ( anError ) { deferred.reject (anError); } )
      .done ();
      return deferred.promise;
    };

    /**
     * Removes a directory, possibly recursively
     * @param  {String} theDirectoryPath path to directory, relative to cwd
     * @param  {Boolean} recursively      If true, recursive remove
     * @return {Promise}                  The promise
     */
    self.removeDirectory = function ( theDirectoryPath, recursively )
    {
      var deferred = Q.defer();
      _getDirectoryEntry ( self._cwd, theDirectoryPath, {} )
      .then ( function gotTheDirectoryToDelete ( theDirectoryEntry ) { return _removeDirectory ( theDirectoryEntry, recursively ); } )
      .then ( function allDone () { deferred.resolve ( self ); } )
      .catch ( function ( anError ) { deferred.reject (anError); } )
      .done ();
      return deferred.promise;
    };

    /**
     * Asks the browser for the requested quota, and then requests the file system
     * and sets the cwd to the root directory.
     * @return {Promise} The promise
     */
    self._initializeFileSystem = function ()
    {
      var deferred = Q.defer();
      _requestQuota ( self.fileSystemType, self.requestedQuota )
      .then ( function gotQuota ( theQuota ) {
                self._actualQuota = theQuota;
                return _requestFileSystem ( self.fileSystemType, self.actualQuota); })
      .then ( function gotFS ( theFS ) {
                self._fileSystem = theFS;
                //self._cwd = theFS.root;
                return _getDirectoryEntry ( theFS.root, "", {} );
      })
      .then ( function gotRootDirectory ( theRootDirectory)
                    {
                      self._root = theRootDirectory;
                      self._cwd = theRootDirectory;
                    })
      .then ( function allDone () { deferred.resolve( self ); })
      .catch ( function ( anError ) {
                deferred.reject ( anError ); })
      .done();
      return deferred.promise;
    };

    /**
     * Initializes the file manager with the requested file system type (self.PERSISTENT or self.TEMPORARY)
     * and requested quota size. Both must be specified.
     */
    if (self.overrideSuper) { self.overrideSuper ( self.class, "init", self.init ); }
    self.init = function ( fileSystemType, requestedQuota )
    {
      if (self.super) { self.super ( _className, "init" ); }

      // we need both:
      if (typeof fileSystemType === "undefined") { throw new Error ("No file system type specified; specify PERSISTENT or TEMPORARY."); }
      if (typeof requestedQuota === "undefined") { throw new Error ("No quota requested. If you don't know, specify ZERO."); }

      self._requestedQuota = requestedQuota;
      self._fileSystemType = fileSystemType;

      return self._initializeFileSystem(); // this returns a promise, so we can .then after.
    };

    /**
     * Initializes the file manager with the requested file system type (self.PERSISTENT or self.TEMPORARY)
     * and requested quota size. Both must be specified.
     */
    self.initWithOptions = function ( options )
    {
      if ( typeof options === "undefined" ) { throw new Error ("No options specified. Need type and quota."); }
      if (typeof options.fileSystemType === "undefined") { throw new Error ("No file system type specified; specify PERSISTENT or TEMPORARY."); }
      if (typeof options.requestedQuota === "undefined") { throw new Error ("No quota requested. If you don't know, specify ZERO."); }

      return self.init ( options.fileSystemType, options.requestedQuota );
    };

    return self;
  };

  FileManager.meta = { version: '00.04.450',
                       class: _className,
                       autoInitializable: false,
                       categorizable: false };
  return FileManager;
});
