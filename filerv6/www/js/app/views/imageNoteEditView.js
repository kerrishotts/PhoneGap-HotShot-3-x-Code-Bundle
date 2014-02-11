/**
 *
 * Image Note Edit View
 * 
 * imageNoteEditView.js
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

define ( ["yasmf", "app/models/noteStorageSingleton",
          "text!html/imageNoteEditView.html!strip", 
          "app/views/textNoteEditView", "hammer"], 
function ( _y, noteStorageSingleton, imageNoteViewHTML, 
            TextNoteEditView, Hammer )
{
   var _className = "ImageNoteEditView";
   var ImageNoteEditView = function ()
   {
      var self = new TextNoteEditView();
      self.subclass ( _className );

      /*
       * buttons in this view
       */
      self._takePictureButton = null;

      /*
       * we also need to keep track of the image area
       */
      self._imageContainer = null;

      /**
       * Override our "shareNote" so that we can share images.
       */
      self.overrideSuper ( self.class, "shareNote", self.shareNote );
      self.shareNote = function ()
      {
        self.saveNote();
        var message = {
          subject: self._note.name,
          text: self._note.textContents
        };
        if (self._note.unitValue > 0)
        {
          message.image = "file://" + self._note.mediaContents;
        }
        window.socialmessage.send ( message );
      }

      /**
       * override the text editor's template with our own
       */
      self.overrideSuper ( self.class, "render", self.render );
      self.render = function ()
      {
         // no need to call super; it'd be wrong, anyway.
         return _y.template ( imageNoteViewHTML, 
                              {
                                 "NOTE_NAME": self._note.name,
                                 "NOTE_CONTENTS": self._note.textContents,
                                 "BACK": _y.T("BACK"),
                                 "DELETE_NOTE": _y.T("app.nev.DELETE_NOTE")
                              });
      }

      self.updatePhoto = function ()
      {
        _y.UI.styleElement ( self._imageContainer, "background-image", "inherit" );
        setTimeout ( function () {
          _y.UI.styleElement ( self._imageContainer, "background-image", "url(" + self._note.camera.src + ")" );
        }, 100 );
      }

      self.onPhotoCaptured = function ()
      {
        self._note.camera.removeListenerForNotification ( "photoCaptured", self.onPhotoCaptured );

        // update our photo visually
        self.updatePhoto();
      }

      self.takePicture = function ()
      {
        self._note.camera.addListenerForNotification ( "photoCaptured", self.onPhotoCaptured );
        self._note.camera.takePicture()
            .catch ( function ( anError ) {
                       console.log (anError );
                     })
            .done();
      }

      /**
       * we get to use some of the text editor's renderToElement to load
       * in some of our elements and hook them up, though.
       */
      self.overrideSuper ( self.class, "renderToElement", self.renderToElement );
      self.renderToElement = function ()
      {
         // call super, which will also get our HTML into the element,
         // and hook up the elements it knows are there
         self.super ( _className, "renderToElement" );

         // and now find and link up any elements we want to keep track of
         self._takePictureButton = self.element.querySelector ( ".image-container .ui-glyph.non-outline");
         self._imageContainer = self.element.querySelector (".image-container" );

         // these should also have listeners
         Hammer ( self._takePictureButton ).on("tap", self.takePicture);

          // update the photo
         self.updatePhoto ();

      }

      /**
       * Clean up after ourselves and stop listening to notifications
       */
      self.overrideSuper ( self.class, "destroy", self.destroy );
      self.destroy = function ()
      {
         self._takePictureButton = null;
         self._imageContainer = null;
         self._note.camera.removeListenerForNotification ( "photoCaptured", self.onPhotoCaptured );
         self.super ( _className, "destroy" );
      }

      return self;
   }

   return ImageNoteEditView;
});