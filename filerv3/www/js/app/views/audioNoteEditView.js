/**
 *
 * Audio Note Edit View
 *
 * audioNoteEditView.js
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
  "text!html/audioNoteEditView.html!strip", "app/views/textNoteEditView", "hammer"
], function( _y, noteStorageSingleton, audioNoteViewHTML, TextNoteEditView, Hammer ) {
  var _className = "AudioNoteEditView";
  var AudioNoteEditView = function() {
    var self = new TextNoteEditView();
    self.subclass( _className );
    /*
     * Audio buttons in this view
     */
    self._recordAudioButton = null;
    self._playAudioButton = null;
    self._audioInformation = null;
    /**
     * override the text editor's template with our own
     */
    self.overrideSuper( self.class, "render", self.render );
    self.render = function() {
      // no need to call super; it'd be wrong, anyway.
      return _y.template( audioNoteViewHTML, {
        "NOTE_NAME": self._note.name,
        "NOTE_CONTENTS": self._note.textContents,
        "BACK": _y.T( "BACK" ),
        "DELETE_NOTE": _y.T( "app.nev.DELETE_NOTE" )
      } );
    };
    /**
     * Called when any audio stops (recording or playing); Reset our icons and
     * remove the listeners
     */
    self.onAudioStopped = function() {
      // either recording or playing stopped -- it doesn't really matter.
      self._playAudioButton.classList.remove( "ui-glyph-square-filled" );
      self._playAudioButton.classList.add( "ui-glyph-play-filled" );
      self._recordAudioButton.classList.remove( "ui-glyph-square-filled" );
      self._recordAudioButton.classList.add( "ui-glyph-circle-filled" );
      self._note.media.removeListenerForNotification( "recordingStopped", self.onAudioStopped );
      self._note.media.removeListenerForNotification( "playingStopped", self.onAudioStopped );
      self._note.media.removeListenerForNotification( "positionUpdated", self.updateAudioInformation );
    };
    /**
     * Called when the Record button is tapped. If not recording, start, and if currently recording,
     * stop. The underlying Media Manager takes care of halting playback if something is playing.
     */
    self.onRecordAudio = function() {
      if ( !self._note.media.isRecording ) {
        self._note.media.record();
        self._recordAudioButton.classList.remove( "ui-glyph-circle-filled" );
        self._recordAudioButton.classList.add( "ui-glyph-square-filled" );
        self._note.media.addListenerForNotification( "recordingStopped", self.onAudioStopped );
      } else {
        self._note.media.stop();
        self._note.media.removeListenerForNotification( "recordingStopped", self.onAudioStopped );
        self._recordAudioButton.classList.remove( "ui-glyph-square-filled" );
        self._recordAudioButton.classList.add( "ui-glyph-circle-filled" );
      }
      // and just in case we were playing ('cause we aren't anymore)
      self._playAudioButton.classList.remove( "ui-glyph-square-filled" );
      self._playAudioButton.classList.add( "ui-glyph-play-filled" );
    };
    /**
     * Called when the play button is tapped.
     */
    self.onPlayAudio = function() {
      if ( !self._note.media.isPlaying ) {
        self._note.media.play();
        self._playAudioButton.classList.remove( "ui-glyph-play-filled" );
        self._playAudioButton.classList.add( "ui-glyph-square-filled" );
        self._note.media.addListenerForNotification( "playingStopped", self.onAudioStopped );
        self._note.media.addListenerForNotification( "positionUpdated", self.updateAudioInformation );
      } else {
        self._note.media.stop();
        self._note.media.removeListenerForNotification( "playingStopped", self.onAudioStopped );
        self._note.media.removeListenerForNotification( "positionUpdated", self.updateAudioInformation );
        self._playAudioButton.classList.remove( "ui-glyph-square-filled" );
        self._playAudioButton.classList.add( "ui-glyph-play-filled" );
      }
      // and just in case we were recording ('cause we aren't anymore)
      self._recordAudioButton.classList.remove( "ui-glyph-square-filled" );
      self._recordAudioButton.classList.add( "ui-glyph-circle-filled" );
    };
    /**
     * Update audio information while playing or recording
     */
    self.updateAudioInformation = function() {
      var durationParts = _y.datetime.getPartsFromSeconds( self._note.media.duration ==
          0 ? self._note.unitValue : self._note.media.duration / 1000, _y.datetime.PRECISION_MINUTES
        ),
        positionParts = _y.datetime.getPartsFromSeconds( self._note.media.position /
          1000, _y.datetime.PRECISION_MINUTES );
      self._audioInformation.innerHTML = _y.template( "%MM1%:%SS1% / %MM2%:%SS2%", {
        "SS1": _y.format( positionParts.seconds, "d2" ),
        "MM1": _y.format( positionParts.minutes, "d2" ),
        "SS2": _y.format( durationParts.seconds, "d2" ),
        "MM2": _y.format( durationParts.minutes, "d2" )
      } );
    };
    /**
     * we get to use some of the text editor's renderToElement to load
     * in some of our elements and hook them up, though.
     */
    self.overrideSuper( self.class, "renderToElement", self.renderToElement );
    self.renderToElement = function() {
      // call super, which will also get our HTML into the element,
      // and hook up the elements it knows are there
      self.super( _className, "renderToElement" );
      //look for the audio buttons
      self._recordAudioButton = self.element.querySelector(
        ".audio-container .ui-glyph-circle-filled" );
      self._playAudioButton = self.element.querySelector(
        ".audio-container .ui-glyph-play-filled" );
      self._audioInformation = self.element.querySelector( ".audio-information" );
      // these should also have listeners
      Hammer( self._recordAudioButton ).on( "tap", self.onRecordAudio );
      Hammer( self._playAudioButton ).on( "tap", self.onPlayAudio );
    };
    self.overrideSuper( self.class, "init", self.init );
    self.init = function( theParentElement, theNote ) {
      self.super( _className, "init", [ theParentElement, theNote ] );
      self.addListenerForNotification( "viewWasPushed", function() {
        self._note.media.addListenerForNotification( "durationUpdated", self.updateAudioInformation );
        self.updateAudioInformation();
      } );
      self.addListenerForNotification( "viewWasPopped", function() {
        self._note.media.removeListenerForNotification( "durationUpdated", self.updateAudioInformation );
      } );
    };
    /**
     * Clean up after ourselves and stop listening to notifications
     */
    self.overrideSuper( self.class, "destroy", self.destroy );
    self.destroy = function() {
      self._recordAudioButton = null;
      self._playAudioButton = null;
      self._audioInformation = null;
      self._note.media.removeListenerForNotification( "recordingStopped", self.onAudioStopped );
      self._note.media.removeListenerForNotification( "playingStopped", self.onAudioStopped );
      self._note.media.removeListenerForNotification( "positionUpdated", self.updateAudioInformation );
      self._note.media.removeListenerForNotification( "durationUpdated", self.updateAudioInformation );
      self._note.media.stop(); // no need to continue doing something.
      self.super( _className, "destroy" );
    };
    return self;
  };
  return AudioNoteEditView;
} );
