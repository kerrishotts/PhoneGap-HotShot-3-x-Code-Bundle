/**
 *
 * Image Note Model
 *
 * imageNote.js
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
define( [ "yasmf", "app/models/baseNote", "app/models/cameraManager" ], function( _y,
  BaseNote, CameraManager ) {
  var _className = "ImageNote";
  var ImageNote = function() {
    var self = new BaseNote();
    self.subclass( _className );
    /**
     * The camera property gives easy access to the camera
     */
    self._camera = null;
    self.getCamera = function() {
      return self._camera;
    };
    Object.defineProperty( self, "camera", {
      get: self.getCamera,
      configurable: true
    } );
    /**
     * We've a different representation - a photo (not a camera, though; that implies taking a picture)
     */
    self._representation = "photo";
    /**
     * New unit labels -- in bytes, kilobytes, megabytes
     */
    self.unitLabels = [ "bytes", "byte", "bytes", "KB", "MB" ];
    /**
     * Called when we need to update the unit (after a picture has been taken)
     */
    self._updateUnit = function() {
      self._camera.doesPhotoExist().then( function( theFile ) {
        self.unitValue = theFile.size;
        return;
      } ).catch( function( anError ) {
        console.log( anError );
        return;
      } ).done();
    };
    /**
     * Override getFormattedUnitValue so that we can report a human-readable file size
     */
    self.overrideSuper( self.class, "getFormattedUnitValue", self.getFormattedUnitValue );
    self.getFormattedUnitValue = function() {
      if ( self.unitValue < 1024 ) {
        return _y.N( self.unitValue ) + " " + _y.T( self.unitLabels[ Math.min( 2,
          self.unitValue ) ] );
      } else {
        if ( self.unitValue < ( 1024 * 1024 ) ) {
          return _y.N( self.unitValue / 1024 ) + _y.T( self.unitLabels[ 3 ] )
        } else {
          return _y.N( self.unitValue / ( 1024 * 1024 ) ) + _y.T( self.unitLabels[ 4 ] )
        }
      }
    };
    Object.defineProperty( self, "formattedUnitValue", {
      get: self.getFormattedUnitValue,
      configurable: true
    } );
    /**
     * Called to update the modified date (after capture)
     */
    self._updateModificationDate = function() {
      self._modifiedDate = new Date();
    };
    /**
     * Override setting the media contents so that we can create a new camera notification
     */
    self.overrideSuper( self.class, "setMediaContents", self.setMediaContents );
    self.setMediaContents = function( theMediaContents ) {
      self.super( _className, "setMediaContents", [ theMediaContents ] );
      if ( self._camera !== null ) {
        self._camera.destroy();
        self._camera = null;
      }
      self._camera = new CameraManager();
      self._camera.init( theMediaContents );
      self.notify( "mediaContentsChanged" );
      self._camera.addListenerForNotification( "photoCaptured", self._updateUnit );
      self._camera.addListenerForNotification( "photoCaptured", self._updateModificationDate );
    };
    Object.defineProperty( self, "mediaContents", {
      get: self.getMediaContents,
      set: self.setMediaContents,
      configurable: true
    } );
    /**
     * Override destroy so we can release the Media Manager
     */
    self.overrideSuper( self.class, "destroy", self.destroy );
    self.destroy = function() {
      self._camera.destroy();
      self._camera = null;
      self.super( _className, "destroy" );
    };
    return self;
  };
  return ImageNote;
} );
