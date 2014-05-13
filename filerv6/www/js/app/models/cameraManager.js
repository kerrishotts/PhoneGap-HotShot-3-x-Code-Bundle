/**
 *
 * camera manager
 *
 * cameraManager.js
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
/*global define, Camera*/
define( [ "yasmf", "Q" ], function( _y, Q ) {
  var _className = "CameraManager";
  var CameraManager = function() {
    var self = new _y.BaseObject();
    self.subclass( _className );
    self.registerNotification( "photoCaptured" );
    /**
     * The quality of the image to capture
     */
    self._quality = 75;
    self.getQuality = function() {
      return self._quality;
    };
    self.setQuality = function( theQuality ) {
      self._quality = theQuality;
    };
    Object.defineProperty( self, "quality", {
      get: self.getQuality,
      set: self.setQuality,
      configurable: true
    } );
    /**
     * Where to pull the image from -- available options:
     * Camera.PictureSourceType.CAMERA
     * Camera.PictureSourceType.PHOTOLIBRARY
     * Camera.PictureSourceType.SAVEDPHOTOALBUM
     */
    self._cameraSource = Camera.PictureSourceType.CAMERA;
    self.getCameraSource = function() {
      return self._cameraSource;
    };
    self.setCameraSource = function( theSource ) {
      self._cameraSource = theSource;
    };
    Object.defineProperty( self, "cameraSource", {
      get: self.getCameraSource,
      set: self.setCameraSource,
      configurable: true
    } );
    /**
     * Determines if editing is allowed after the image is captured
     */
    self._editingAllowed = false;
    self.getEditingAllowed = function() {
      return self._editingAllowed;
    };
    self.setEditingAllowed = function( isEditingAllowed ) {
      self._editingAllowed = isEditingAllowed;
    };
    Object.defineProperty( self, "editingAllowed", {
      get: self.getEditingAllowed,
      set: self.setEditingAllowed,
      configurable: true
    } );
    /**
     * Sets the encoding for the captured image. Valid options:
     * Camera.EncodingType.JPEG
     * Camera.EncodingType.PNG
     */
    self._encodingType = Camera.EncodingType.JPEG;
    self.getEncodingType = function() {
      return self._encodingType;
    };
    self.setEncodingType = function( theEncodingType ) {
      self._encodingType = theEncodingType;
    };
    Object.defineProperty( self, "encodingType", {
      get: self.getEncodingType,
      set: self.setEncodingType,
      configurable: true
    } );
    /**
     * The target size is a {width: #, height: #} object
     * that defines the target size of the captured image.
     * Aspect ratio is maintained.
     */
    self._targetSize = null;
    self.getTargetSize = function() {
      return self._targetSize;
    };
    self.setTargetSize = function( targetWidth, targetHeight ) {
      if ( typeof targetWidth === "object" ) {
        self._targetSize = targetWidth;
      } else {
        self._targetSize = {
          width: targetWidth,
          height: targetHeight
        };
      }
    };
    Object.defineProperty( self, "targetSize", {
      get: self.getTargetSize,
      set: self.setTargetSize,
      configurable: true
    } );
    /**
     * Media filter is used when the cameraSource is the photo
     * library or the saved photo album. Valid options are
     * Camera.MediaType.PICTURE
     * Camera.MediaType.VIDEO
     * Camera.MediaType.ALLMEDIA
     */
    self._mediaFilter = Camera.MediaType.PICTURE;
    self.getMediaFilter = function() {
      return self._mediaFilter;
    };
    self.setMediaFilter = function( filter ) {
      self._mediaFilter = filter;
    };
    Object.defineProperty( self, "mediaFilter", {
      get: self.getMediaFilter,
      set: self.setMediaFilter,
      configurable: true
    } );
    /**
     * If true, use the correct orientation as obtained from
     * the device orientation while the image was taken. If false,
     * use the captured orientation.
     */
    self._useCorrectOrientation = true;
    self.getUseCorrectOrientation = function() {
      return self._useCorrectOrientation;
    };
    self.setUseCorrectOrientation = function( useCorrectOrientation ) {
      self._useCorrectOrientation = useCorrectOrientation;
    };
    Object.defineProperty( self, "useCorrectOrientation", {
      get: self.getUseCorrectOrientation,
      set: self.setUseCorrectOrientation,
      configurable: true
    } );
    /**
     * If true, saves the captured image ot the photo album
     * in addition to the app's file system
     */
    self._alsoSaveToPhotoAlbum = false;
    self.getAlsoSaveToPhotoAlbum = function() {
      return self._alsoSaveToPhotoAlbum;
    };
    self.setAlsoSaveToPhotoAlbum = function( alsoSaveToPhotoAlbum ) {
      self._alsoSaveToPhotoAlbum = alsoSaveToPhotoAlbum;
    };
    Object.defineProperty( self, "alsoSaveToPhotoAlbum", {
      get: self.getAlsoSaveToPhotoAlbum,
      set: self.setAlsoSaveToPhotoAlbum,
      configurable: true
    } );
    /**
     * Determine which camera to use (front camera, or back camera)
     * Valid options: Camera.Direction.BACK, Camera.Direction.FRONT
     */
    self._cameraDirection = Camera.Direction.BACK;
    self.getCameraDirection = function() {
      return self._cameraDirection;
    };
    self.setCameraDirection = function( theCameraDirection ) {
      self._cameraDirection = theCameraDirection;
    };
    Object.defineProperty( self, "cameraDirection", {
      get: self.getCameraDirection,
      set: self.setCameraDirection,
      configurable: true
    } );
    /**
     * src indicates where we want to either
     *  1) save the photo
     *  2) check if the photo exists
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
     * Build the captureOptions object for taking a picture
     */
    self._buildCaptureOptions = function() {
      var captureOptions = {};
      if ( typeof self.quality !== "undefined" && self.quality !== null ) {
        captureOptions.quality = self.quality;
      }
      if ( typeof self.cameraSource !== "undefined" && self.cameraSource !== null ) {
        captureOptions.sourceType = self.cameraSource;
      }
      if ( typeof self.editingAllowed !== "undefined" && self.editingAllowed !== null ) {
        captureOptions.allowEdit = self.editingAllowed;
      }
      if ( typeof self.encodingType !== "undefined" && self.encodingType !== null ) {
        captureOptions.encodingType = self.encodingType;
      }
      if ( typeof self.targetSize !== "undefined" && self.targetSize !== null ) {
        if ( typeof self.targetSize.width !== "undefined" && self.targetSize.width !==
          null ) {
          captureOptions.targetWidth = self.targetSize.width;
        }
        if ( typeof self.targetSize.height !== "undefined" && self.targetSize.height !==
          null ) {
          captureOptions.targetHeight = self.targetSize.height;
        }
      }
      if ( typeof self.mediaFilter !== "undefined" && self.mediaFilter !== null ) {
        captureOptions.mediaType = self.mediaFilter;
      }
      if ( typeof self.alsoSaveToPhotoAlbum !== "undefined" && self.alsoSaveToPhotoAlbum !==
        null ) {
        captureOptions.saveToPhotoAlbum = self.alsoSaveToPhotoAlbum;
      }
      if ( typeof self.cameraDirection !== "undefined" && self.cameraDirection !==
        null ) {
        captureOptions.cameraDirection = self.cameraDirection;
      }
      if ( typeof self.useCorrectOrientation !== "undefined" && self.useCorrectOrientation !==
        null ) {
        captureOptions.correctOrientation = self.useCorrectOrientation;
      }
      captureOptions.destinationType = Camera.DestinationType.FILE_URI;
      return captureOptions;
    };
    /**
     * Captures an image and returns a promise resolving to the URI if successful or an error if not.
     */
    self._captureImage = function() {
      var deferred = Q.defer();
      try {
        navigator.camera.getPicture( function( imageURI ) {
          deferred.resolve( imageURI );
        }, function( anError ) {
          deferred.reject( anError );
        }, self._buildCaptureOptions() );
      } catch ( anError ) {
        deferred.reject( anError.message );
      }
      return deferred.promise;
    };
    /**
     * Takes a picture, and then moves it to the specified src position when complete.
     * Sends a photoCaptured notification.
     */
    self.takePicture = function() {
      var fm = new _y.FileManager();
      var targetPath = _y.filename.getPathPart( self.src ).substr( 1 );
      var targetName = _y.filename.getFilePart( self.src );
      return fm.init( fm.PERSISTENT, 0 ).then( function() {
        return self._captureImage();
      } ).then( function( theURI ) {
        return fm.resolveLocalFileSystemURL( theURI );
      } ).then( function( fileEntry ) {
        fm.moveFile( fileEntry, targetPath, targetName );
      } ).then( function() {
        self.notify( "photoCaptured" );
        return;
      } );
    };
    /** 
     * returns a promise which resolves to the file entry if the photo exists
     * or null if the photo doesn't exist.
     */
    self.doesPhotoExist = function() {
      var fm = new _y.FileManager();
      var deferred = Q.defer();
      var img = self.src;
      if ( _y.device.platform() === "android" ) {
        img = img.substr( 1, img.length );
      }
      fm.init( fm.PERSISTENT, 0 ).then( function() {
        return fm.getFile( img, {} );
      } ).then( function( theFile ) {
        deferred.resolve( theFile );
      } ).catch( function( anError ) {
        deferred.resolve( null );
      } ).done();
      return deferred.promise;
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
  return CameraManager;
} );
