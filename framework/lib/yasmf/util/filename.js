/**
 *
 * Provides convenience methods for parsing unix-style path names. If the
 * path separator is changed from "/" to "\", it should parse Windows paths as well.
 *
 * filename.js
 * @module filename.js
 * @author Kerri Shotts
 * @version 0.4
 * ```
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
 * ```
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
define(
  function ()
  {

    var PKFILE = {
      /**
       * Version
       * @type {String}
       */
      version: "00.04.100",
      /**
       * Specifies the characters that are not allowed in file names.
       * @property invalidCharacters
       * @default ["/","\",":","|","<",">","*","?",";","%"]
       * @type {Array}
       */
      invalidCharacters: "/,\\,:,|,<,>,*,?,;,%".split(","),
      /**
       * Indicates the character that separates a name from its extension,
       * as in "filename.ext".
       * @property extensionSeparator
       * @default "."
       * @type {String}
       */
      extensionSeparator: ".",
      /**
       * Indicates the character that separates path components.
       * @property pathSeparator
       * @default "/"
       * @type {String}
       */
      pathSeparator: "/",
      /**
       * Indicates the character used when replacing invalid characters
       * @property replacementCharacter
       * @default "-"
       * @type {String}
       */
      replacementCharacter: "-",
      /**
       * Converts a potential invalid filename to a valid filename by replacing
       * invalid characters (as specified in "invalidCharacters") with "replacementCharacter".
       *
       * @method makeValid
       * @param  {String} theFileName
       * @return {String}
       */
      makeValid: function (theFileName)
      {
        var self=PKFILE;
        var theNewFileName = theFileName;
        for (var i = 0; i < self.invalidCharacters.length; i++)
        {
          var d = 0;
          while (theNewFileName.indexOf(self.invalidCharacters[i]) > -1 && (d++) < 50)
          {
            theNewFileName = theNewFileName.replace(self.invalidCharacters[i], self.replacementCharacter);
          }
        }
        return theNewFileName;
      },
      /**
       * Returns the name+extension portion of a full path.
       *
       * @method getFilePart
       * @param  {String} theFileName
       * @return {String}
       */
      getFilePart: function (theFileName)
      {
        var self=PKFILE;
        var theSlashPosition = theFileName.lastIndexOf(self.pathSeparator);
        if (theSlashPosition < 0)
        {
          return theFileName;
        }
        return theFileName.substr(theSlashPosition + 1, theFileName.length - theSlashPosition);
      },
      /**
       * Returns the path portion of a full path.
       * @method getPathPart
       * @param  {String} theFileName
       * @return {String}
       */
      getPathPart: function (theFileName)
      {
        var self=PKFILE;
        var theSlashPosition = theFileName.lastIndexOf(self.pathSeparator);
        if (theSlashPosition < 0)
        {
          return "";
        }
        return theFileName.substr(0, theSlashPosition + 1);
      },
      /**
       * Returns the filename, minus the extension.
       * @method getFileNamePart
       * @param  {String} theFileName
       * @return {String}
       */
      getFileNamePart: function (theFileName)
      {
        var self=PKFILE;
        var theFileNameNoPath = self.getFilePart(theFileName);
        var theDotPosition = theFileNameNoPath.lastIndexOf(self.extensionSeparator);
        if (theDotPosition < 0)
        {
          return theFileNameNoPath;
        }
        return theFileNameNoPath.substr(0, theDotPosition);
      },
      /**
       * Returns the extension of a filename
       * @method getFileExtensionPart
       * @param  {String} theFileName
       * @return {String}
       */
      getFileExtensionPart: function (theFileName)
      {
        var self=PKFILE;
        var theFileNameNoPath = self.getFilePart(theFileName);
        var theDotPosition = theFileNameNoPath.lastIndexOf(self.extensionSeparator);
        if (theDotPosition < 0)
        {
          return "";
        }
        return theFileNameNoPath.substr(theDotPosition + 1, theFileNameNoPath.length - theDotPosition - 1);
      }
    };

    return PKFILE;
  }
);
