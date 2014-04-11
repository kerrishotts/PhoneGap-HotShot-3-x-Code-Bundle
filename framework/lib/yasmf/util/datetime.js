/**
 *
 * Provides date/time convenience methods
 *
 * datetime.js
 * @module datetime.js
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
define (
   function () {
      return {
         /**
          * Returns the current time in the Unix time format
          * @return {UnixTime}
          */
         getUnixTime: function ()
         {
            return (new Date()).getTime();
         },
        /**
         * PRECISION_x Constants
         * These specify the amount of precision required for getPartsFromSeconds.
         * For example, if PRECISION_DAYS is specified, the number of parts obtained
         * consist of days, hours, minutes, and seconds.
         */
         PRECISION_SECONDS: 1,
         PRECISION_MINUTES: 2,
         PRECISION_HOURS: 3,
         PRECISION_DAYS: 4,
         PRECISION_WEEKS: 5,
         PRECISION_YEARS: 6,
        /**
         * @typedef {{fractions: number, seconds: number, minutes: number, hours: number, days: number, weeks: number, years: number}} TimeParts
         */
        /**
         * Takes a given number of seconds and returns an object consisting of the number of seconds, minutes, hours, etc.
         * The value is limited by the precision parameter -- which must be specified. Which ever value is specified will
         * be the maximum limit for the routine; that is PRECISION_DAYS will never return a result for weeks or years.
         *
         * @param {number} seconds
         * @param {number} precision
         * @returns {TimeParts}
         */
         getPartsFromSeconds: function ( seconds, precision )
         {
           var partValues = [ 0, 0, 0, 0, 0, 0, 0 ];
           var modValues = [ 1, 60, 3600, 86400, 604800, 31557600];

           for (var i = precision; i>0; i--)
           {
             if (i==1)
             {
               partValues[i-1] = seconds % modValues[i-1];
             }
             else
             {
               partValues[i-1] = Math.floor(seconds % modValues[i-1]);
             }
             partValues[i] = Math.floor(seconds / modValues[i-1]);
             seconds = seconds - partValues[i] * modValues[i-1];
           }
           return { fractions: partValues[0],
                    seconds:   partValues[1],
                    minutes:   partValues[2],
                    hours:     partValues[3],
                    days:      partValues[4],
                    weeks:     partValues[5],
                    years:     partValues[6] };
         }
      };
   });
