/**
 *
 * Basic cross-platform mobile Event Handling for YASMF
 *
 * events.js
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

define ( ["yasmf/util/device"], function ( theDevice )
{

   /**
    * Translates touch events to mouse events if the platform doesn't support
    * touch events. Leaves other events unaffected.
    *
    * @method _translateEvent
    * @static
    * @private
    * @param {String} theEvent - the event name to translate
    */
   var _translateEvent = function (theEvent)
   {
     var theTranslatedEvent = theEvent;
     if (!theTranslatedEvent)
     {
       return theTranslatedEvent;
     }
     var platform = theDevice.platform();
     var nonTouchPlatform = ( platform == "wince" || platform == "unknown" || platform == "mac" || platform == "windows" || platform == "linux" );
     if (nonTouchPlatform && theTranslatedEvent.toLowerCase().indexOf("touch") > -1)
     {
       theTranslatedEvent = theTranslatedEvent.replace("touch", "mouse");
       theTranslatedEvent = theTranslatedEvent.replace("start", "down");
       theTranslatedEvent = theTranslatedEvent.replace("end", "up");
     }
     return theTranslatedEvent;
   };

   var event = {};

  /**
   * @typedef {{_originalEvent: Event, touches: Array, x: number, y: number, avgX: number, avgY: number, element: (EventTarget|Object), target: Node}} NormalizedEvent
   */
  /**
   *
   * Creates an event object from a DOM event.
   *
   * The event returned contains all the touches from the DOM event in an array of {x,y} objects.
   * The event also contains the first touch as x,y properties and the average of all touches
   * as avgX,avgY. If no touches are in the event, these values will be -1.
   *
   * @method makeEvent
   * @static
   * @param {Node} that - `this`; what fires the event
   * @param {Event} e - the DOM event
   * @returns {NormalizedEvent}
   *
   */
  event.convert = function (that, e)
  {
    if (typeof e === "undefined")
    {
      e = window.event;
    }
    var newEvent = { _originalEvent: e, touches: [], x: -1, y: -1, avgX: -1, avgY: -1, element: e.target || e.srcElement, target: that };
    if (e.touches)
    {
      var avgXTotal = 0;
      var avgYTotal = 0;
      for (var i = 0; i < e.touches.length; i++)
      {
        newEvent.touches.push({ x: e.touches[i].clientX, y: e.touches[i].clientY });
        avgXTotal += e.touches[i].clientX;
        avgYTotal += e.touches[i].clientY;
        if (i === 0)
        {
          newEvent.x = e.touches[i].clientX;
          newEvent.y = e.touches[i].clientY;
        }
      }
      if (e.touches.length > 0)
      {
        newEvent.avgX = avgXTotal / e.touches.length;
        newEvent.avgY = avgYTotal / e.touches.length;
      }
    }
    else
    {
      if (event.pageX)
      {
        newEvent.touches.push({ x: e.pageX, y: e.pageY });
        newEvent.x = e.pageX;
        newEvent.y = e.pageY;
        newEvent.avgX = e.pageX;
        newEvent.avgY = e.pageY;
      }
    }
    return newEvent;
  };

   /**
    *
    * Cancels an event that's been created using {@link event.convert}.
    *
    * @method cancelEvent
    * @static
    * @param {NormalizedEvent} e - the event to cancel
    *
    */
   event.cancel = function (e)
   {
     if (e._originalEvent.cancelBubble)
     {
       e._originalEvent.cancelBubble();
     }
     if (e._originalEvent.stopPropagation)
     {
       e._originalEvent.stopPropagation();
     }
     if (e._originalEvent.preventDefault)
     {
       e._originalEvent.preventDefault();
     } else
     {
       e._originalEvent.returnValue = false;
     }
   };


   /**
    * Adds a touch listener to theElement, converting touch events for WP7.
    *
    * @method addEventListener
    * @param {Node} theElement  the element to attach the event to
    * @param {String} theEvent  the event to handle
    * @param {Function} theFunction  the function to call when the event is fired
    *
    */
   event.addListener = function (theElement, theEvent, theFunction)
   {
     var theTranslatedEvent = _translateEvent(theEvent.toLowerCase());
     theElement.addEventListener(theTranslatedEvent, theFunction, false);
   };

   /**
    * Removes a touch listener added by addTouchListener
    *
    * @method removeEventListener
    * @param {Node} theElement  the element to remove an event from
    * @param {String} theEvent  the event to remove
    * @param {Function} theFunction  the function to remove
    *
    */
   event.removeListener = function (theElement, theEvent, theFunction)
   {
     var theTranslatedEvent = _translateEvent(theEvent.toLowerCase());
     theElement.removeEventListener(theTranslatedEvent, theFunction);
   };

   return event;
});
