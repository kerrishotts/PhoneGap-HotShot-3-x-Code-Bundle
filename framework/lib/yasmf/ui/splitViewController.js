/**
 *
 * Split View Controllers provide basic support for side-by-side views
 *
 * splitViewController.js
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
         onevar:false
 */
/*global define*/

define ( ["yasmf/ui/core", "yasmf/ui/viewContainer"], function ( UI, ViewContainer )
{
   var _className = "SplitViewController";
   var SplitViewController = function ()
   {
      var self = new ViewContainer();
      self.subclass ( _className );

      self.registerNotification ( "viewsChanged" );

      self._viewType = "split"; // other valid: off-canvas, split-overlay
      self.getViewType = function ()
      {
         return self._viewType;
      }
      self.setViewType = function (theViewType)
      {
         self.element.classList.remove ( "ui-" + self._viewType + "-view");
         self._viewType = theViewType;
         self.element.classList.add ( "ui-" + theViewType + "-view" );
         self.leftViewStatus = "invisible";
      }
      Object.defineProperty ( self, "viewType",
                              { get: self.getViewType, set: self.setViewType,
                                configurable: true } );

      self._leftViewStatus = "invisible"; // options: visible, invisible
      self.getLeftViewStatus = function ()
      {
         return self._leftViewStatus;
      }
      self.setLeftViewStatus = function ( viewStatus )
      {
         self.element.classList.remove ( "ui-left-side-" + self._leftViewStatus );
         self._leftViewStatus = viewStatus;
         self.element.classList.add ( "ui-left-side-" + viewStatus );
      }
      Object.defineProperty ( self, "leftViewStatus",
                              { get: self.getLeftViewStatus, set: self.setLeftViewStatus,
                                configurable: true } );

      self.toggleLeftView = function ()
      {
        if (self.leftViewStatus === "visible")
        {
          self.leftViewStatus = "invisible";
        }
        else
        {
          self.leftViewStatus = "visible";
        }
      }
      /**
       * The array of views that this split view controller manages.
       * @type {Array}
       */
      self._subviews = [null, null];
      self.getSubviews = function ()
      {
         return self._subviews;
      }
      Object.defineProperty ( self, "subviews",
                              { get: self.getSubviews,
                                configurable: true } );

      self._leftElement = null;
      self._rightElement = null;
      self._createElements = function ()
      {
         if (self._leftElement !== null)
         {
            self.element.removeChild ( self._leftElement );
         }
         if (self._rightElement !== null)
         {
            self.element.removeChild ( self._rightElement );
         }
         self._leftElement = document.createElement ( "div" );
         self._rightElement = document.createElement ( "div" );
         self._leftElement.className = "ui-container left-side";
         self._rightElement.className = "ui-container right-side";
         self.element.appendChild (self._leftElement);
         self.element.appendChild (self._rightElement);
      }
      self._createElementsIfNecessary = function ()
      {
         if (self._leftElement !== null && self._rightElement !== null)
         {
            return;
         }
         self._createElements();
      }

      self._assignViewToSide = function ( whichElement, aView )
      {
         self._createElementsIfNecessary();
         aView.splitViewController = self;
         aView.notify ( "viewWillAppear" ); // notify the view
         aView.parentElement = whichElement; // and make us the parent
         aView.notify ( "viewDidAppear" ); // and notify it that it's actually there.
      }

      self.getLeftView = function ()
      {
         if (self._subviews.length>0)
         {
           return self._subviews[0];
         }
         else
         {
            return null;
         }
      }
      self.setLeftView = function ( aView )
      {
         if (self._subviews.length>0)
         {
            self._subviews[0] = aView;
         }
         else
         {
            self._subviews.push (aView);
         }
         self._assignViewToSide ( self._leftElement, aView);
         self.notify ( "viewsChanged" );
      }
      Object.defineProperty ( self, "leftView",
                              { get: self.getLeftView, set: self.setLeftView,
                                configurable: true } );

      self.getRightView = function ()
      {
         if (self._subviews.length>1)
         {
           return self._subviews[1];
         }
         else
         {
            return null;
         }
      }
      self.setRightView = function ( aView )
      {
         if (self._subviews.length>1)
         {
            self._subviews[1] = aView;
         }
         else
         {
            self._subviews.push (aView);
         }
         self._assignViewToSide ( self._rightElement, aView);
         self.notify ( "viewsChanged" );
      }
      Object.defineProperty ( self, "rightView",
                              { get: self.getRightView, set: self.setRightView,
                                configurable: true } );

      self.overrideSuper ( self.class, "render", self.render );
      self.render = function ()
      {
         return ""; // nothing to render!
      }

      self.overrideSuper ( self.class, "renderToElement", self.renderToElement );
      self.renderToElement = function ()
      {
         self._createElementsIfNecessary();
         return; // nothing to do.
      }

      self.overrideSuper ( self.class, "init", self.init );
      self.init = function ( theLeftView, theRightView, theElementId, theElementTag, theElementClass, theParentElement )
      {
         if (typeof theLeftView === "undefined") { throw new Error ( "Can't initialize a navigation controller without a left view." ); }
         if (typeof theRightView === "undefined") { throw new Error ( "Can't initialize a navigation controller without a right view." ); }

         // do what a normal view container does
         self.super ( _className, "init", [ theElementId, theElementTag, theElementClass, theParentElement ] );

         // now add the left and right views
         self.leftView = theLeftView;
         self.rightView = theRightView;

        return self;
      }

      self.overrideSuper ( self.class, "initWithOptions", self.initWithOptions );
      self.initWithOptions = function ( options )
      {
         var theLeftView, theRightView, theElementId, theElementTag, theElementClass, theParentElement;
         if (typeof options !== "undefined")
         {
            if ( typeof options.id !== "undefined" ) { theElementId = options.id; }
            if ( typeof options.tag !== "undefined" ) { theElementTag = options.tag; }
            if ( typeof options.class !== "undefined") { theElementClass = options.class; }
            if ( typeof options.parent !== "undefined") { theParentElement = options.parent; }
            if ( typeof options.leftView !== "undefined") { theLeftView = options.leftView; }
            if ( typeof options.rightView !== "undefined") { theRightView = options.rightView; }
         }
         self.init ( theLeftView, theRightView, theElementId, theElementTag, theElementClass, theParentElement );
         if (typeof options !== "undefined")
         {
            if ( typeof options.viewType !== "undefined" ) { self.viewType = options.viewType; }
            if ( typeof options.leftViewStatus !== "undefined" ) { self.leftViewStatus = options.leftViewStatus; }
         }

        return self;
      };

     self.override ( function destroy()
                     {
                       if (self._leftElement !== null)
                       {
                         self.element.removeChild ( self._leftElement );
                       }
                       if (self._rightElement !== null)
                       {
                         self.element.removeChild ( self._rightElement );
                       }
                       self._leftElement = null;
                       self._rightElement = null;

                       self.super ( _className, "destroy" );
                     });

     self._autoInit.apply (self, arguments);
      return self;
   }
   return SplitViewController;
});