/**
 *
 * media manager
 *
 * mediaManager.js
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
/*global define, Media*/
define( [ "yasmf" ], function( _y ) {
  var _className = "MediaManager";
  var MediaManager = function() {
    /*
     * Create a new object and subclass it
     */
    var self = new _y.BaseObject();
    self.subclass( _className );
    self.registerNotification( "playingStarted" );
    self.registerNotification( "playingPaused" );
    self.registerNotification( "playingStopped" );
    self.registerNotification( "recordingStarted" );
    self.registerNotification( "recordingStopped" );
    self.registerNotification( "positionUpdated" );
    self.registerNotification( "durationUpdated" );
    self.registerNotification( "error" );
    self.registerNotification( "statusUpdated" );
    self.registerNotification( "mediaAllocated" );
    self.registerNotification( "mediaDestroyed" );
    /**
     * _media stores a reference to the object returned by the Media API
     */
    self._media = null;
    /**
     * Returns / sets the position in the stream. Position is in milliseconds.
     * If < 0, the position has yet to be determined.
     */
    self._position = -1; // in milliseconds
    self.getPosition = function() {
      // assumes _position is being updated by an interval calling _media.getCurrentPosition
      return self._position >= 0 ? self._position : 0;
    };
    self.setPosition = function( thePosition ) {
      if ( self._media !== null ) {
        self._media.seekTo( thePosition );
        self.notify( "positionUpdated" );
      } else {
        throw new Error( "Can't seek to a position without initialized Media." );
      }
    };
    Object.defineProperty( self, "position", {
      get: self.getPosition,
      set: self.setPosition,
      configurable: true
    } );
    /**
     * Returns the duration of the stream. In milliseconds.
     * If < 0, the duration has yet to be determined. Gives up after 20 seconds.
     */
    self._duration = -1; // in milliseconds
    self.getDuration = function() {
      // assumes the duration has been updated by _media.getDuration()
      return self._duration >= 0 ? self._duration : 0;
    };
    Object.defineProperty( self, "duration", {
      get: self.getDuration,
      configurable: true
    } );
    self._state = MediaManager.STATE_NONE;
    self.getState = function() {
      return self._state;
    };
    Object.defineProperty( self, "state", {
      get: self.getState,
      configurable: true
    } );
    /**
     * Determines if media is playing (true), or not (false)
     */
    self.getIsPlaying = function() {
      return self._state === MediaManager.STATE_PLAYING;
    };
    Object.defineProperty( self, "isPlaying", {
      get: self.getIsPlaying,
      configurable: true
    } );
    /**
     * Determines if media is recording (true), or not (false)
     */
    self.getIsRecording = function() {
      return self._state === MediaManager.STATE_RECORDING;
    };
    Object.defineProperty( self, "isRecording", {
      get: self.getIsRecording,
      configurable: true
    } );
    /**
     * Determines if media is paused (true), or not (false)
     */
    self.getIsPaused = function() {
      return self._state === MediaManager.STATE_PAUSED;
    };
    Object.defineProperty( self, "isPaused", {
      get: self.getIsPaused,
      configurable: true
    } );
    /**
     * Determines if media is stopped (true), or not (false)
     */
    self.getIsStopped = function() {
      return self._state === MediaManager.STATE_STOPPED;
    };
    Object.defineProperty( self, "isStopped", {
      get: self.getIsStopped,
      configurable: true
    } );
    /**
     * The position and duration are updated very frequently (1 time a second).
     */
    self._intervalId = null;
    self._updateStatus = function() {
      if ( self._media !== null ) {
        // only update the position automatically while playing.
        if ( self.isPlaying ) {
          self._media.getCurrentPosition( function( position ) {
            self._position = position * 1000; // milliseconds
            self.notify( "positionUpdated" );
          } );
        }
        // only update the duration and have yet to
        // give up calculating it (up to 100 seconds)
        var minDurationAllowed = -100;
        if ( self._duration > minDurationAllowed && self._duration < 0 ) {
          var d = self._media.getDuration();
          if ( d > -1 ) {
            self._duration = d * 1000; // milliseconds
            self.notify( "durationUpdated" );
          } else {
            if ( self._duration > minDurationAllowed ) {
              self._duration--; // this will eventually give up
            }
          }
        }
        if ( self.isRecording ) {
          self._duration += 1000; // add a second for recording. This isn't exact, and will be reset after the
          // recording is complete, but it gives us a way to update our UI about our
          // recording progress.
          self.notify( "durationUpdated" );
        }
      }
    };
    /**
     * Called when anything completes successfully
     */
    self._mediaSuccess = function() {
      self._position = 0;
      self.notify( "positionUpdated" );
      if ( self.isPlaying ) {
        self.notify( "playingStopped" );
      }
      if ( self.isRecording ) {
        self.notify( "recordingStopped" );
      }
      self._state = MediaManager.STATE_STOPPED;
      self._media.release();
    };
    /**
     * Allows access to the last error intercepted. Use .code to get the error code,
     * and .message to get the message.
     */
    self._lastError = null;
    self.getLastError = function() {
      return self._lastError;
    };
    Object.defineProperty( self, "lastError", {
      get: self.getLastError,
      configurable: true
    } );
    /**
     * Called whenever an error occurs on the _media object
     */
    self._updateMediaError = function( anError ) {
      self._lastError = anError;
      console.log( "Media Error: encountered " + anError.code +
        ". Current status is " + self.status );
      self.notify( "error" );
    };
    /**
     * The status of the media object; as described in the cordova docs.
     * @type {Number}
     */
    self._mediaStatus = -1;
    self.getMediaStatus = function() {
      return self._mediaStatus;
    };
    Object.defineProperty( self, "mediaStatus", {
      get: self.getMediaStatus,
      configurable: true
    } );
    /**
     * Called when the status of the media object changes.
     */
    self._updateMediaStatus = function( aStatus ) {
      self._status = aStatus;
      self.notify( "statusUpdated" );
    };
    /**
     * Creates the underlying _media object and sets up the recurring
     * status updates.
     */
    self._createMediaObjectIfNecessary = function() {
      if ( self._media === null ) {
        self._media = new Media( self.src, self._mediaSuccess, self._updateMediaError,
          self._updateMediaStatus );
        self._intervalId = setInterval( self._updateStatus, 1000 );
        self._state = MediaManager.STATE_STOPPED;
        self.notify( "mediaAllocated" );
      }
    };
    /**
     * Releases the underlying media object and destroys the recurring status updates.
     */
    self._destroyMediaObjectIfNecessary = function() {
      if ( self._media !== null ) {
        self._media.release();
      }
      if ( self._intervalId !== null ) {
        clearInterval( self._intervalId );
        self._intervalId = null;
      }
      self._media = null;
      self._state = MediaManager.STATE_NONE;
      self.notify( "mediaDestroyed" );
    };
    /*
     * src stores the URL to the media file. This can be a file, URL, etc., and doesn't need
     * to exist.
     */
    self._src = null;
    self.getSrc = function() {
      return self._src;
    };
    self.setSrc = function( newSrc ) {
      self._destroyMediaObjectIfNecessary();
      if ( typeof newSrc !== "undefined" ) {
        self._src = newSrc;
        self._createMediaObjectIfNecessary();
      } else {
        self._src = null;
      }
    };
    Object.defineProperty( self, "src", {
      get: self.getSrc,
      set: self.setSrc,
      configurable: true
    } );
    /**
     * Start playing the stream.
     */
    self.play = function() {
      self._createMediaObjectIfNecessary();
      if ( self.isRecording || self.isPlaying ) {
        self.stop();
      }
      self.notify( "playingStarted" );
      self._media.play();
      self._state = MediaManager.STATE_PLAYING;
    };
    /**
     * Pause playback. No effect if already paused, or if recording.
     */
    self.pause = function() {
      self._createMediaObjectIfNecessary();
      if ( self.isPlaying ) {
        self._media.pause();
        self._state = MediaManager.STATE_PAUSED;
        self.notify( "playingPaused" );
      } else if ( self.isRecording ) {
        console.log( "Media Error: can't pause during recording." )
      }
    };
    /**
     * Record. If already playing or recording, it stops first.
     */
    self.record = function() {
      self._createMediaObjectIfNecessary();
      if ( self.isPlaying || self.isRecording ) {
        self.stop();
      }
      self._media.startRecord();
      self._position = 0; // recording overwrites anything else
      self._duration = 0; // we will update this value each updateStatus
      self._state = MediaManager.STATE_RECORDING;
      self.notify( "recordingStarted" );
      self.notify( "durationUpdated" );
      self.notify( "positionUpdated" );
    };
    /**
     * Stop playback or recording (depending on which is active).
     */
    self.stop = function() {
      self._createMediaObjectIfNecessary();
      if ( self.isRecording ) {
        self._state = MediaManager.STATE_STOPPED;
        self._media.stopRecord();
        self.notify( "recordingStopped" );
        self._media.release(); // Android requires this to actually release the recording resources.
        self._duration = -1; // we no longer know the duration...
        self._media.play(); // apparently the duration is only calculated for playing, not recording
        self._media.stop(); // but there's no sense in actually /playing/ anything, so stop immediately
        self._media.release(); // and release the new resource. The duration will be updated at next update
      } else if ( self.isPlaying || self.isPaused ) {
        self._state = MediaManager.STATE_STOPPED;
        self._media.stop();
        self._position = 0;
        self.notify( "positionUpdated" );
        self.notify( "playingStopped" );
        self._media.release();
      }
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
    /**
     * Destroy the object; release the media object if necessary.
     */
    self.overrideSuper( self.class, "destroy", self.destroy );
    self.destroy = function() {
      self._destroyMediaObjectIfNecessary();
      self.super( _className, "destroy" );
    };
    return self;
  };
  /**
   *  Some useful constants for play state
   */
  MediaManager.STATE_NONE = 0;
  MediaManager.STATE_PAUSED = 1;
  MediaManager.STATE_STOPPED = 2;
  MediaManager.STATE_PLAYING = 3;
  MediaManager.STATE_RECORDING = 4;
  return MediaManager;
} );
