/**
 *
 * Video Note Edit View
 *
 * videoNoteEditView.js
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
  "text!html/videoNoteEditView.html!strip", "app/views/textNoteEditView", "hammer"
], function( _y, noteStorageSingleton, videoNoteViewHTML, TextNoteEditView, Hammer ) {
  var _className = "VideoNoteEditView";
  var VideoNoteEditView = function() {
    var self = new TextNoteEditView();
    self.subclass( _className );
    /*
     * buttons in this view
     */
    self._recordButton = null;
    /*
     * we also need to keep track of the area that will hold the video element
     */
    self._videoElementContainer = null;
    /**
     * override the text editor's template with our own
     */
    self.overrideSuper( self.class, "render", self.render );
    self.render = function() {
      return _y.template( videoNoteViewHTML, {
        "NOTE_NAME": self._note.name,
        "NOTE_CONTENTS": self._note.textContents,
        "BACK": _y.T( "BACK" ),
        "DELETE_NOTE": _y.T( "app.nev.DELETE_NOTE" )
      } );
    };
    /**
     * Update the video element (after loading or a video is recorded)
     */
    self.updateVideo = function() {
      var html = "<video controls src='%URL%?%CACHE%'></video>";
      var fm = noteStorageSingleton.fileManager;
      var nativePath = fm.getNativeURL( self._note.mediaContents );
      var cacheBust = Math.floor( Math.random() * 100000 );
      self._videoElementContainer.innerHTML = _y.template( html, {
        "URL": nativePath,
        "CACHE": cacheBust
      } );
    };
    /**
     * After video is captured, remove the listener and update the video on-screen
     */
    self.onVideoCaptured = function() {
      self._note.video.removeListenerForNotification( "videoCaptured", self.onVideoCaptured );
      self.updateVideo();
    };
    /**
     * Called when the user wants to record video
     */
    self.captureVideo = function() {
      self._note.video.addListenerForNotification( "videoCaptured", self.onVideoCaptured );
      self._note.video.captureVideo().catch( function( anError ) {
        // if an error, remove the listener
        self._note.video.removeListenerForNotification( "videoCaptured", self.onVideoCaptured );
        console.log( anError );
      } ).done();
    };
    /**
     * we get to use some of the text editor's renderToElement to load
     * in some of our elements and hook them up, though.
     */
    self.overrideSuper( self.class, "renderToElement", self.renderToElement );
    self.renderToElement = function() {
      self.super( _className, "renderToElement" );
      self._recordButton = self.element.querySelector(
        ".video-container .video-actions .ui-glyph" );
      self._videoElementContainer = self.element.querySelector(
        ".video-container .video-element" );
      Hammer( self._recordButton ).on( "tap", self.captureVideo );
      // update the photo
      self.updateVideo();
    };
    /**
     * Clean up after ourselves and stop listening to notifications
     */
    self.overrideSuper( self.class, "destroy", self.destroy );
    self.destroy = function() {
      self._recordButton = null;
      self._videoElementContainer = null;
      self._note.video.removeListenerForNotification( "videoCaptured", self.onVideoCaptured );
      self.super( _className, "destroy" );
    };
    return self;
  };
  return VideoNoteEditView;
} );
