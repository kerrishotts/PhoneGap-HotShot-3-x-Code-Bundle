/**
 *
 * Note List View
 * 
 * noteListView.js
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

define ( ["yasmf", 
          "app/models/noteStorageSingleton",
          "text!html/noteListView.html!strip",
          "text!html/noteListItem.html!strip", 
          "app/factories/noteFactory",
          "app/factories/noteViewFactory",
          "app/views/staticView",
          "hammer"], 
function ( _y, noteStorageSingleton, noteListViewHTML, 
           noteListItemHTML,
           noteFactory, noteViewFactory, StaticView, Hammer )
{
   var _generateUID = function ()
   {
      return _y.datetime.getUnixTime();
   };
   var _className = "NoteListView";
   var NoteListView = function ()
   {
      // we descend from a simple ViewContainer
      var self = new _y.UI.ViewContainer ();
      // always subclass
      self.subclass ( _className );

      // our pointers into the DOM
      self._navigationBar = null;
      self._scrollContainer = null;
      self._listOfNotes = null;
      self._newTextNoteButton = null;
      self._newAudioNoteButton = null;
      self._newImageNoteButton = null;
      self._newVideoNoteButton = null;

      self._displayEditView = function ( theView )
      {
         if (typeof self.navigationController.splitViewController !== "undefined")
         {
           var rightView = self.navigationController.splitViewController.rightView;
           if (rightView.topView.class !== "StaticView" )
           {
            // we have an edit in-progress. Save it first.
            rightView.topView.saveNote();
           }
           // change the root view of the right-side of the split view
           self.navigationController.splitViewController.rightView.rootView = theView;
         }
         else
         {
           self.navigationController.pushView ( theView );
         }

      }
      
      /**
       * Creates a new note; called when "New" is tapped
       */
      self.createNewTextNote = function ()
      {
         // ask storage for a new note
         var aNewNote = noteStorageSingleton.createNote( noteFactory.TEXTNOTE );
         // create a new editor view
         var aNoteEditView = noteViewFactory.createNoteEditView ( noteFactory.TEXTNOTE );
         // and tell it about the new note
         aNoteEditView.initWithOptions ( {note: aNewNote} );
         self._displayEditView ( aNoteEditView );
      }

      self.createNewAudioNote = function ()
      {
        var aNewNote = noteStorageSingleton.createNote ( noteFactory.AUDIONOTE );
        var aNoteEditView = noteViewFactory.createNoteEditView ( noteFactory.AUDIONOTE );

        // now we need to get a unique filename for the audio, and get a URL for it
        var extension = ".wav"; // iOS records to WAV
        if (_y.device.platform() == "android") { extension = ".amr"} // Android records to AMR
        var fm = noteStorageSingleton.fileManager;
        fm.getFileEntry ( "audio" + _generateUID() + extension, {create: true, exclusive: false} )
          .then ( function gotFile ( theFile ) 
            { aNewNote.mediaContents = theFile.fullPath; // this initializes the media object
              aNoteEditView.initWithOptions ( {note: aNewNote} );
              self._displayEditView ( aNoteEditView );
            })
          .catch ( function ( anError ) { console.log ( anError ); } )
          .done ();
      }

      self.createNewImageNote = function ()
      {
        var aNewNote = noteStorageSingleton.createNote ( noteFactory.IMAGENOTE );
        var aNoteEditView = noteViewFactory.createNoteEditView ( noteFactory.IMAGENOTE );

        // now we need to get a unique filename for the image
        var extension = ".jpg";
        var fm = noteStorageSingleton.fileManager;
        fm.getFileEntry ( "image" + _generateUID() + extension, {create: true, exclusive: false} )
          .then ( function gotFile ( theFile ) 
            { aNewNote.mediaContents = theFile.fullPath; // this initializes the media object
              aNoteEditView.initWithOptions ( {note: aNewNote} );
              self._displayEditView ( aNoteEditView );
            })
          .catch ( function ( anError ) { console.log ( anError ); } )
          .done ();
      }

      self.createNewVideoNote = function ()
      {
        var aNewNote = noteStorageSingleton.createNote ( noteFactory.VIDEONOTE );
        var aNoteEditView = noteViewFactory.createNoteEditView ( noteFactory.VIDEONOTE );

        // now we need to get a unique filename for the image
        var extension = ".mov";
        if (_y.device.platform() == "android") { extension = ".3gp"} // Android records to 3gp
        var fm = noteStorageSingleton.fileManager;
        fm.getFileEntry ( "movie" + _generateUID() + extension, {create: true, exclusive: false} )
          .then ( function gotFile ( theFile ) 
            { aNewNote.mediaContents = theFile.fullPath; // this initializes the media object
              aNoteEditView.initWithOptions ( {note: aNewNote} );
              self._displayEditView ( aNoteEditView );
            })
          .catch ( function ( anError ) { console.log ( anError ); } )
          .done ();
      }


      /**
       * Edit an existing note. Called when a note item is tapped in the list.
       */
      self.editExistingNote = function ( e )
      {
         var theEvent = e;
         // get the UID
         var theUID = this.getAttribute("data-uid");
         // create a new editor view
         var aNote = noteStorageSingleton.getNote ( theUID );
         var aNoteEditView = noteViewFactory.createNoteEditView ( aNote.class );
         // and tell it about the note
         aNoteEditView.initWithOptions ( {note: aNote } );
         self._displayEditView ( aNoteEditView );
      }

      self.deleteExistingNote = function ( e )
      {
         var theEvent = e;
         // get the UID
         var theUID = this.getAttribute("data-uid");

         noteStorageSingleton.removeNote ( theUID );  

         // display a static view if we have a splitview, but only if we're deleting
         // the currently visible note
         if (typeof self.navigationController.splitViewController !== "undefined")
         {
           var topView = self.navigationController.splitViewController.rightView.topView;
           if (topView.class !== "StaticView")
           {
             if (topView.getNoteUID() == theUID)
             {
               var staticView = new StaticView();
               staticView.initWithOptions ();
               self.navigationController.splitViewController.rightView.rootView = staticView;
             }
           }
         }
      }

      self.popupActionsForNote = function ( e )
      {
        e.gesture.preventDefault();
        var theUID = this.getAttribute("data-uid");

        var anAlert = new _y.UI.Alert();
        anAlert.initWithOptions (
          { title:   _y.T("NOTE_ACTIONS"),
            text:    _y.T("SELECT_AN_ACTION_OR_CANCEL"),
            promise: true,
            buttons: [ _y.UI.Alert.button ( _y.T("DELETE" ), { type: "destructive" } ),
                       _y.UI.Alert.button ( _y.T("CANCEL" ), { type: "bold", tag: -1 } )
                     ] } );
        anAlert.show()
                 .then ( function (idx) 
                         {
                           if (idx == 0) { noteStorageSingleton.removeNote ( theUID );  
                                         }
                         } )
                 .catch ( function ( e ) { console.log ( "Promise rejected: " + e); } )
                 .done();
      }

      self.exposeActionForNote = function ( e )
      {
        e.gesture.preventDefault();
        _y.UI.styleElement ( this, "transition", "-webkit-transform 0.3s ease-in-out" );
        _y.UI.styleElement ( this, "transition", "-moz-transform 0.3s ease-in-out" );
        _y.UI.styleElement ( this, "transition", "-ms-transform 0.3s ease-in-out" );
        _y.UI.styleElement ( this, "transition", "transform 0.3s ease-in-out" );
        // how far do we have to go?
        var amountToTranslate = getComputedStyle ( self._listOfNotes.querySelector ( ".ui-list-action" ) ).getPropertyValue ( "width" );
        _y.UI.styleElement ( this, "transform", "translateX(-"+ amountToTranslate +")" );
      }

      self.hideActionForNote = function ( e )
      {
        e.gesture.preventDefault();
        _y.UI.styleElement ( this, "transition", "-webkit-transform 0.3s ease-in-out" );
        _y.UI.styleElement ( this, "transition", "-moz-transform 0.3s ease-in-out" );
        _y.UI.styleElement ( this, "transition", "-ms-transform 0.3s ease-in-out" );
        _y.UI.styleElement ( this, "transition", "transform 0.3s ease-in-out" );
        _y.UI.styleElement ( this, "transform", "translateX(0px)" );
      }
      /**
       * Quit the app, in response to a back button event.
       */
      self.quitApp = function ()
      {
         // only called on platforms that support going back on the first page
         // on iOS we don't have a back button to call it.
         // 
         // note: not guaranteed to always work
         navigator.app.exitApp();
      }

      /**
       * Render the template, passing the app title and translated text
       */
      self.overrideSuper ( self.class, "render", self.render );
      self.render = function ()
      {
         // no need to call super; it's abstract
         return _y.template ( noteListViewHTML, 
                              {
                                 "APP_TITLE": _y.T("APP_TITLE"),
                                 "NEW_NOTE": _y.T("NEW_NOTE")
                              });
      }

      /**
       * RenderToElement renders the HTML, finds all the elements we want to 
       * have references to and attaches handlers if necessary, 
       * and attaches a listener to the backButton handler.
       */
      self.overrideSuper ( self.class, "renderToElement", self.renderToElement );
      self.renderToElement = function ()
      {
         // call super, which will also get our HTML into the element
         self.super ( _className, "renderToElement" );

         // and now find and link up any elements we want to keep track of
         self._navigationBar = self.element.querySelector ( ".ui-navigation-bar" );
         self._scrollContainer = self.element.querySelector ( ".ui-scroll-container" );
         self._listOfNotes = self.element.querySelector ( ".ui-list" );

         // all our "new" buttons:
         var newButtons = self.element.querySelectorAll ( ".ui-tool-bar .ui-bar-button" );
         self._newTextNoteButton = newButtons[0];
         self._newAudioNoteButton = newButtons[1];
         self._newImageNoteButton = newButtons[2];
         self._newVideoNoteButton = newButtons[3];
         

         // the new Button should have an event listener
         //_y.UI.event.addListener ( self._newButton, "click", self.createNewNote );
         Hammer ( self._newTextNoteButton ).on ("tap", self.createNewTextNote );
         Hammer ( self._newAudioNoteButton ).on ("tap", self.createNewAudioNote );
         Hammer ( self._newImageNoteButton ).on ("tap", self.createNewImageNote );
         Hammer ( self._newVideoNoteButton ).on ("tap", self.createNewVideoNote );

         // and make sure we know about the physical back button
         _y.UI.backButton.addListenerForNotification ( "backButtonPressed", self.quitApp );
      }

      /**
       * Render the note list; called whenever the storage collection changes
       */
      self.renderList = function ()
      {
        if (_y.device.isTablet() &&
            parseInt(window.getComputedStyle ( self.element ).getPropertyValue ( "width" ),10) >= 320)
        {
          self.element.classList.add ("wide");
        }
         var notes = noteStorageSingleton.collection;

         var fragment = document.createDocumentFragment();

         // loop over each note
         for (var note in notes)
         {
            // and avoid prototype entries
            if ( notes.hasOwnProperty ( note ) )
            {
               // null notes have been deleted -- don't show them
               if (notes[note] !== null)
               {
                  // each entry is a li.ui-list-item with data-uid attribute and note_item_% as the id.
                  var e = document.createElement ( "li" );
                  e.className = "ui-list-item";
                  e.setAttribute ( "data-uid", notes[note].uid );
                  e.id = "note_item_" + notes[note].uid;

                  // render the note item template
                  e.innerHTML = _y.template ( noteListItemHTML,
                                       {
                                          "UID": notes[note].uid,
                                          "TRASH": _y.T("TRASH"),
                                          "NAME": notes[note].name,
                                          "REPRESENTATION": notes[note].representation,
                                          "MODIFIED": _y.D(notes[note].modifiedDate,"D"),
                                          "INFO": "" + _y.N(notes[note].formattedUnitValue)
                                       } );
                  // attach any event handlers
                  var contentsElement = e.querySelector ( ".ui-list-item-contents"),
                      actionElement  = e.querySelector ( ".ui-list-action" );

                  Hammer ( contentsElement ).on ("tap", self.editExistingNote );

                  if (!self.element.classList.contains("wide"))
                  {
                    // the following is applicable only when we're rendering a list view
                    // (not a thumbnail view)
                    Hammer ( contentsElement, {swipe_velocity:0.1} ).on ("swipeleft", self.exposeActionForNote );
                    Hammer ( contentsElement, {swipe_velocity:0.1 } ).on ("swiperight", self.hideActionForNote );
                    Hammer ( actionElement   ).on ("tap", self.deleteExistingNote );
                  }
                  else
                  {
                    // but we'll allow a long-press on the item instead
                    Hammer ( contentsElement ).on ("hold", self.popupActionsForNote );
                  }

                  // append the element to our list
                  fragment.appendChild ( e );
               }
            }            
         }
         self._listOfNotes.innerHTML = "";
         self._listOfNotes.appendChild ( fragment );
      }

      self.onOrientationChanged = function ()
      {
         // fix a iOS bug where rotation may prevent the list from scrolling after rotation
         if ( _y.device.platform() == "ios" )
         {
           // this forces the scroll container to be recalc'd. It also flickers a bit.
           // no way to avoid it, unfortunately. 
           self._scrollContainer.style.display = "none";
           setTimeout (function () { self._scrollContainer.style.display = ""; } );
         }        
      }

      /**
       * Initialize the view and add listeners for the storage
       * collection so that when it changes, we can update appropriately
       */
      self.overrideSuper ( self.class, "init", self.init );
      self.init = function ( theParentElement )
      {
         // call super
         self.super ( _className, "init", [undefined, "div", "noteListView ui-container", theParentElement] );

         // register for changes in the note collection
         noteStorageSingleton.addListenerForNotification ( "collectionChanged", self.renderList );
         noteStorageSingleton.addListenerForNotification ( "collectionLoaded", self.renderList );

         // and ask noteStorage to load itself
         noteStorageSingleton.loadCollection();

         // we need to register for orientation changes
         _y.UI.orientationHandler.addListenerForNotification ( "orientationChanged", self.onOrientationChanged );
      }

      self.overrideSuper ( self.class, "initWithOptions", self.init );
      self.initWithOptions = function ( options )
      {
         var theParentElement;
         if ( typeof options !== "undefined" )
         {
            if ( typeof options.parent !== "undefined" ) { theParentElement = options.parent; }
         }

         self.init ( theParentElement );
      }

      /**
       * Be a good citizen. Clean up after ourselves when asked.
       */
      self.overrideSuper ( self.class, "destroy", self.destroy );
      self.destroy = function ()
      {
         // stop listening for orientation changes
         _y.UI.orientationHandler.removeListenerForNotification ( "orientationChanged", self.onOrientationChanged );

         // release our objects
         self._navigationBar = null;
         self._newTextNoteButton = null;
         self._newAudioNoteButton = null;
         self._newVideoNoteButton = null;
         self._newImageNoteButton = null;
         self._scrollContainer = null;
         self._listOfNotes = null;

         self.super ( _className, "destroy" );
      }

      return self;
   };

   /**
    * Add the necessary translations
    */
   _y.addTranslations (
   {
      "APP_TITLE": 
      {
         "EN": "Filer"
      },
      "NEW_NOTE":
      {
         "EN": "New",
         "ES": "Nueva"
      },
      "BACK": 
      {
         "EN": "Back",
         "ES": "Volver"
      },
      "TRASH":
      {
        "EN": "Trash",
        "ES": "Basura"
      },
      "CANCEL":
      {
        "EN": "Cancel",
        "ES": "Cancelar"
      },
      "DELETE":
      {
        "EN": "Delete",
        "ES": "Eliminar"
      },
      "NOTE_ACTIONS":
      {
        "EN": "Note Actions",
        "ES": "Acciónes para la nota"
      },
      "SELECT_AN_ACTION_OR_CANCEL":
      {
        "EN": "Select an action for this note, or cancel.",
        "ES": "Seleccione un acción para esta nota, o cancelar."
      }
   });

   return NoteListView;

});