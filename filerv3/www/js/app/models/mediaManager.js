/**
 *
 * media manager
 * 
 * mediaManager.js
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
/*global define, Media*/
define ( ["yasmf"], function ( _y )
{
   var _className = "MediaManager";
   var MediaManager = function ()
   {
      /*
       * Create a new object and subclass it
       */
      var self = new _y.BaseObject();
      self.subclass ( _className );

      self.registerNotification ( "playingStarted" );
      self.registerNotification ( "playingPaused" );
      self.registerNotification ( "playingStopped" );
      self.registerNotification ( "recordingStarted" );
      self.registerNotification ( "recordingStopped" );
      self.registerNotification ( "positionUpdated" );
      self.registerNotification ( "durationUpdated" );
      self.registerNotification ( "error" );
      self.registerNotification ( "statusUpdated" );
      self.registerNotification ( "mediaAllocated" );
      self.registerNotification ( "mediaDestroyed" );

      /**
       * _media stores a reference to the object returned by the Media API
       */
      self._media = null;

      /**
       * Returns / sets the position in the stream. Position is in milliseconds.
       * If < 0, the position has yet to be determined.
       * @type {Number}
       */
      self._position = -1; // in milliseconds
      self.getPosition = function ()
      {
         // assumes _position is being updated by an interval calling _media.getCurrentPosition
         return self._position;
      }
      self.setPosition = function ( thePosition )
      {
         if (self._media !== null)
         {
            self._media.seekTo ( thePosition );
            self.notify ( "positionUpdated" );
         }
         else
         {
            throw new Error ( "Can't seek to a position without initialized Media." );
         }
      }
      Object.defineProperty ( self, "position", { get: self.getPosition, set: self.setPosition, configurable: true } );

      /**
       * Returns the duration of the stream. In milliseconds.
       * If < 0, the duration has yet to be determined. Gives up after 20 seconds.
       * @type {Number}
       */
      self._duration = -1; // in milliseconds
      self.getDuration = function ()
      {
         // assumes the duration has been updated by _media.getDuration()
         return self._duration;
      }
      Object.defineProperty ( self, "duration", { get: self.getDuration, configurable: true} );

      /**
       * Determines if media is playing (true), or not (false)
       * @type {Boolean}
       */
      self._playing = false;
      self.getIsPlaying = function ()
      {
         return self._playing;
      }
      Object.defineProperty ( self, "isPlaying", { get: self.getIsPlaying, configurable: true } );

      /**
       * Determines if media is recording (true), or not (false)
       * @type {Boolean}
       */
      self._recording = false;
      self.getIsRecording = function ()
      {
         return self._recording;
      }
      Object.defineProperty ( self, "isRecording", { get: self.getIsRecording, configurable: true } );
      
      /**
       * Determines if media is paused (true), or not (false)
       * @type {Boolean}
       */
      self._paused = false;
      self.getIsPaused = function ()
      {
         return self._paused;
      }
      Object.defineProperty ( self, "isPaused", { get: self.getIsPaused, configurable: true } );

      /**
       * The position and duration are updated very frequently (1 time a second).
       */
      self._intervalId = null;
      self._updateStatus = function ()
      {
         if (self._media !== null)
         {
            // only update the position automatically while playing or recording,
            // and we aren't paused (as then there is no need)
            if ( (self.isPlaying || self.isRecording) && !self.isPaused )
            {
               self._media.getCurrentPosition ( function ( position )
                                                {
                                                   self._position = position * 1000; // milliseconds
                                                   self.notify ( "positionUpdated" );
                                                } );
            }
            // only update the duration if we're recording, or have yet to
            // give up calculating it (20 seconds)
            if ( ( self._duration > -20 && self._duration < 0 ) || self.isRecording )
            {
               var d = self._media.getDuration();
               if (d > -1)
               {
                  self._duration = d * 1000; // milliseconds
                  self.notify ( "durationUpdated");
               }
               else
               {
                  if (self._duration > -1 ) 
                  { 
                     self._duration--; // this will eventually give up
                  }
               }
            }
         }
      }


      /**
       * Called when anything completes successfully
       */
      self._mediaSuccess = function ()
      {
         // since everything is done, we need to set these properly.
         if (self.isPlaying) { self.notify ( "playingStopped" ); }
         if (self.isRecording) { self.notify ( "recordingStopped" ); }
         self._playing = false;
         self._recording = false;
         self._paused = false;
      }

      /**
       * Allows access to the last error intercepted. Use .code to get the error code,
       * and .message to get the message.
       */
      self._lastError = null;
      self.getLastError = function ()
      {
         return self._lastError;
      }
      Object.defineProperty ( self, "lastError", { get: self.getLastError, configurable: true});

      /**
       * Called whenever an error occurs on the _media object
       */
      self._mediaError = function ( anError )
      {
         self._lastError = anError;
         console.log ( "Media Error: encountered " + anError.code + ". Current status is " + self.status);
         self.notify ( "error" );
      }

      /**
       * The status of the media object; as described in the cordova docs.
       * @type {Number}
       */
      self._status = -1;
      self.getStatus = function ()
      {
         return self._status;
      }
      Object.defineProperty ( self, "status", {get: self.getStatus, configurable: true});

      /**
       * Called when the status of the media object changes.
       */
      self._mediaStatus = function ( aStatus )
      {
         self._status = aStatus;
         self.notify ( "statusUpdated" );
      }

      /**
       * Creates the underlying _media object and sets up the recurring
       * status updates.
       */
      self._createMediaObjectIfNecessary = function ()
      {
         if (self._media === null)
         {
            self._media = new Media ( self.src, self._mediaSuccess, self._mediaError, self._mediaStatus );
            self._intervalId = setInterval ( self._updateStatus, 1000 );
            self.notify ( "mediaAllocated");
         }
      }
      /**
       * Releases the underlying media object and destroys the recurring status updates.
       */
      self._releaseMediaObjectIfNecessary = function ()
      {
         if (self._media !== null)
         {
            self._media.release();
         }
         if (self._intervalId !== null )
         {
            clearInterval ( self._intervalId );
            self._intervalId = null;
         }
         self._media = null;
         self.notify ("mediaDestroyed");
      }

      /*
       * src stores the URL to the media file. This can be a file, URL, etc., and doesn't need
       * to exist.
       */
      self._src = null;
      self.getSrc = function ()
      {
         return self._src;
      }
      self.setSrc = function ( newSrc )
      {
         self._releaseMediaObjectIfNecessary();
         if (typeof newSrc !=="undefined")
         {
          self._src = newSrc.replace("file://localhost", ""); 
          self._createMediaObjectIfNecessary();
         }
         else
         {
          self._src = null;
         }
      }
      Object.defineProperty ( self, "src", { get: self.getSrc, set: self.setSrc, configurable: true } );

      /**
       * Start playing the stream.
       */
      self.play = function ()
      {
         self._createMediaObjectIfNecessary();
         if (self.isRecording || self.isPlaying )
         {
            self.stop();
         }
         self._media.play(); self.notify ( "playingStarted" );
         self._paused = false;
         self._playing = true;
         self._recording = false;
      }

      /**
       * Pause playback. No effect if already paused, or if recording.
       */
      self.pause = function ()
      {
         self._createMediaObjectIfNecessary();
         if (self.isPlaying)
         {
            self._media.pause(); self.notify ( "playingPaused" );
            self._paused = true;
            self._playing = false;
         }
      }

      /**
       * Record. If already playing or recording, it stops first.
       */
      self.record = function ()
      {
        self._createMediaObjectIfNecessary();
        if (self.isPlaying || self.isRecording )
        {
          self.stop();
        }
        self._media.startRecord(); self.notify ( "recordingStarted" );
        self._playing = false;
        self._recording = true;
        self._paused = false;
      }

      /**
       * Stop playback or recording (depending on which is active).
       */
      self.stop = function ()
      {
         self._createMediaObjectIfNecessary();
         if (self.isRecording)
         {
            self._media.stopRecord(); self.notify ( "recordingStopped" );
         }
         if (self.isPlaying)
         {
            self._media.stop(); self.notify ( "playingStopped" );
         }
         self._playing = false;
         self._recording = false;
         self._paused = false;
      }

      /**
       * Initialize the object; we also set up the source if it is passed
       */
      self.overrideSuper ( self.class, "init", self.init );
      self.init = function ( theSource )
      {
         self.super ( _className, "init" );
         if (typeof theSource !== "undefined") { self.src = theSource; }
      }

      /**
       * Destroy the object; release the media object if necessary.
       */
      self.overrideSuper ( self.class, "destroy", self.destroy );
      self.destroy = function ()
      {
         self._releaseMediaObjectIfNecessary();
         self.super ( _className, "destroy" );
      }

      return self;
   };
   return MediaManager;
});