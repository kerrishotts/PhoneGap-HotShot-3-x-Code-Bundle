/**
 *
 * Note Factory
 * 
 * noteFactory.js
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
define ( ["app/models/baseNote", "app/models/audioNote", "app/models/imageNote"], 
function ( BaseNote, AudioNote, ImageNote )
{
   var noteFactory = {};

   /*
    * Constants
    */
   noteFactory.BASENOTE = "BASENOTE";
   noteFactory.TEXTNOTE = "BASENOTE";
   noteFactory.AUDIONOTE = "AUDIONOTE";
   noteFactory.VIDEONOTE = "VIDEONOTE";
   noteFactory.IMAGENOTE = "IMAGENOTE";

   /**
    * Creates a new note object, given the type (one of the above constants).
    */
   noteFactory.createNote = function ( noteType )
   {
      switch ( noteType.toUpperCase().trim() )
      {
         case noteFactory.BASENOTE:
            return new BaseNote();
         case noteFactory.AUDIONOTE:
            return new AudioNote();
         case noteFactory.IMAGENOTE:
            return new ImageNote();
         case noteFactory.VIDEONOTE:
            //return new VideoNote();
         default:
            throw new Error ( "Note Factory doesn't understand a " + noteType );
      }
   }
   return noteFactory;
});