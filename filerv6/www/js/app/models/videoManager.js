/**
 *
 * video manager
 *
 * videoManager.js
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
/*global define, Capture*/
define( [ "yasmf", "Q" ], function( _y, Q ) {
  var _className = "VideoManager";
  var VideoManager = function() {
    var self = new _y.BaseObject();
    self.subclass( _className );
    self.registerNotification( "videoCaptured" );
    /**
     * The maximum duration for the recorded video. If -1, no limit.
     */
    self._maximumDuration = -1;
    self.getMaximumDuration = function() {
      return self._maximumDuration;
    };
    self.setMaximumDuration = function( theDuration ) {
      self._maximumDuration = theDuration;
    };
    Object.defineProperty( self, "maximumDuration", {
      get: self.getMaximumDuration,
      set: self.setMaximumDuration,
      configurable: true
    } );
    /**
     * The path + file to the recorded video. After capturing, the video file
     * will be moved to this location.
     */
    self._src = null;
    self.getSrc = function() {
      return self._src;
    };
    self.setSrc = function( theSource ) {
      self._src = theSource;
    };
    Object.defineProperty( self, "src", {
      get: self.getSrc,
      set: self.setSrc,
      configurable: true
    } );
    /**
     * After recording, this contains the length of the video, in seconds
     */
    self._capturedDuration = -1;
    self.getCapturedDuration = function() {
      return self._capturedDuration;
    };
    Object.defineProperty( self, "capturedDuration", {
      get: self.getCapturedDuration,
      configurable: true
    } );
    /**
     * Builds the options object for captureVideo
     */
    self._buildCaptureOptions = function() {
      var captureOptions = {};
      if ( typeof self.maximumDuration !== "undefined" && self.maximumDuration !==
        null && self.maximumDuration >= 0 ) {
        captureOptions.duration = self.maximumDuration;
      }
      captureOptions.limit = 1; // we only support one video at a time
      return captureOptions;
    };
    /**
     * Attempts to capture video. Returns a promise that resolves to a list
     * of media files (which should always be one, in our case) or an error.
     */
    self._captureVideo = function() {
      var deferred = Q.defer();
      try {
        navigator.device.capture.captureVideo( function( mediaFiles ) {
          deferred.resolve( mediaFiles );
        }, function( anError ) {
          deferred.reject( anError );
        }, self._buildCaptureOptions() );
      } catch ( anError ) {
        deferred.reject( anError );
      }
      return deferred.promise;
    };
    /**
     * Gets the duration of a specific media file. Only works after the
     * file has been captured from the camera. The duration is returned
     * when the promise is resolved.
     */
    self._getCapturedDuration = function( theMediaFile ) {
      var deferred = Q.defer();
      try {
        theMediaFile.getFormatData( function( theFormatData ) {
          deferred.resolve( theFormatData );
        }, function( anError ) {
          deferred.reject( anError );
        } );
      } catch ( anError ) {
        deferred.reject( anError );
      }
      return deferred.promise;
    };
    /**
     * Captures a video clip. When complete, the duration is obtained, and
     * then the file is moved to src. When that is finished, the videoCaptured
     * notification is sent.
     */
    self.captureVideo = function() {
      var fm = new _y.FileManager();
      var targetPath = _y.filename.getPathPart( self.src ).substr( 1 );
      var targetName = _y.filename.getFilePart( self.src );
      var sourcePath;
      return fm.init( fm.PERSISTENT, 0 ).then( function() {
        return self._captureVideo();
      } ).then( function( theMediaFiles ) {
        if ( theMediaFiles.length == 1 ) {
          sourcePath = theMediaFiles[ 0 ].fullPath;
          return self._getCapturedDuration( theMediaFiles[ 0 ] );
        } else {
          throw new Error( "Number of videos returned is not 1." );
        }
      } ).then( function( theMediaFileData ) {
        self._capturedDuration = theMediaFileData.duration;
        return fm.resolveLocalFileSystemURL( sourcePath );
      } ).then( function( theFileEntry ) {
        return fm.moveFile( theFileEntry, targetPath, targetName );
      } ).then( function() {
        self.notify( "videoCaptured" );
      } );
    };
    /**
     * Initialize the object; we also set up the source if it is passed
     */
    self.overrideSuper( self.class, "init", self.init );
    self.init = function( theSource ) {
      self.super( _className, "init" );
      if ( typeof theSource !== "undefined" ) {
        self.src = theSource;
      }
    };
    return self;
  };
  return VideoManager;
} );
