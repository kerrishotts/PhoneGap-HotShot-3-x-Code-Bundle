/**
 *
 * Provides basic device-handling convenience functions for determining if the device
 * is an iDevice or a Droid Device, and what the orientation is.
 * 
 * device.js
 * @module device.js
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
/*global define, device */
define
(
  function ()
  {
    /**
     *
     * PKDEVICE provides simple methods for getting device information, such as platform,
     * form factor, and orientation.
     *
     * @class PKDEVICE
     */
    var PKDEVICE = {

      /**
       * The version of the class with major, minor, and rev properties.
       *
       * @property version
       * @type Object
       *
       */
      version: "0.4.100",

      /**
       * Permits overriding the platform for testing. Leave set to `false` for
       * production applications.
       *
       * @property platformOverride
       * @type boolean
       * @default false
       */
      platformOverride: false,
      /**
       * Permits overriding the form factor. Usually used for testing.
       *
       * @property formFactorOverride
       * @type boolean
       * @default false
       */
      formFactorOverride: false,

      /**
       *
       * Returns the device platform, lowercased. If PKDEVICE.platformOverride is
       * other than "false", it is returned instead.
       *
       * See PhoneGap's documentation on the full range of platforms that can be
       * returned; without PG available, the method will attemt to determine the
       * platform from `navigator.platform` and the `userAgent`, but only supports
       * iOS and Android in that capacity.
       *
       * @method platform
       * @static
       * @returns {String} the device platform, lowercase.
       */
      platform: function()
      {
        if (PKDEVICE.platformOverride)
        {
          return PKDEVICE.platformOverride.toLowerCase();
        }
        if (typeof device == "undefined" || !device.platform)
        {
          // detect mobile devices first
          if (navigator.platform == "iPad" ||
              navigator.platform == "iPad Simulator" ||
              navigator.platform == "iPhone" || 
              navigator.platform == "iPhone Simulator" ||
              navigator.platform == "iPod" )
          {
            return "ios";
          }
          if ( navigator.userAgent.toLowerCase().indexOf ("android") > -1 )
          {
            return "android";
          }

          // no reason why we can't return other information
          if (navigator.platform.indexOf("Mac" > -1 ))
          {
            return "mac";
          }

          if (navigator.platform.indexOf("Win" > -1 ))
          {
            return "windows";
          }

          if (navigator.platform.indexOf("Linux" > -1 ))
          {
            return "linux";
          }

          return "unknown";
        }
        var thePlatform = device.platform.toLowerCase();
        //
        // turns out that for Cordova > 2.3, deivceplatform now returns iOS, so the
        // following is really not necessary on those versions. We leave it here
        // for those using Cordova <= 2.2.
        if (thePlatform.indexOf("ipad") > -1 || thePlatform.indexOf("iphone") > -1)
        {
          thePlatform = "ios";
        }
        return thePlatform;
      },

      /**
       *
       * Returns the device's form factor. Possible values are "tablet" and
       * "phone". If PKDEVICE.formFactorOverride is not false, it is returned
       * instead.
       *
       * @method formFactor
       * @static
       * @returns {String} `tablet` or `phone`, as appropriate
       */
      formFactor: function()
      {
        if (PKDEVICE.formFactorOverride)
        {
          return PKDEVICE.formFactorOverride.toLowerCase();
        }
        if (navigator.platform == "iPad")
        {
          return "tablet";
        }
        if ((navigator.platform == "iPhone") || (navigator.platform == "iPhone Simulator"))
        {
          return "phone";
        }

        var ua = navigator.userAgent.toLowerCase();
        if (ua.indexOf("android") > -1)
        {
          // android reports if it is a phone or tablet based on user agent
          /*if (ua.indexOf("mobile safari") > -1)
          {
            return "phone";
          }*/
          if (ua.indexOf("mobile safari") < 0 && ua.indexOf("safari") > -1)
          {
            return "tablet";
          }
        }

        // the following is hacky, and not guaranteed to work all the time,
        // especially as phones get bigger screens with higher DPI.

        if ((Math.max(window.screen.width, window.screen.height)/window.devicePixelRatio) >= 900)
        {
          return "tablet";
        }
        return "phone";
      },
      /**
       * Determines if the device is a tablet (or tablet-sized, more accurately)
       * @return {Boolean}
       */
      isTablet: function ()
      {
        return PKDEVICE.formFactor() == "tablet";
      },
      /**
       * Determines if the device is a tablet (or tablet-sized, more accurately)
       * @return {Boolean}
       */
      isPhone: function ()
      {
        return PKDEVICE.formFactor() == "phone";
      },
      /**
       *
       * Determines if the device is in Portrait orientation.
       *
       * @method isPortrait
       * @static
       * @returns {boolean} `true` if the device is in a Portrait orientation; `false` otherwise
       */
      isPortrait: function()
      {
        return window.orientation === 0 || window.orientation == 180 || window.location.href.indexOf("?portrait") > -1;
      },
      /**
       *
       * Determines if the device is in Landscape orientation.
       *
       * @method isLandscape
       * @static
       * @returns {boolean} `true` if the device is in a landscape orientation; `false` otherwise
       */
      isLandscape: function()
      {
        if (window.location.href.indexOf("?landscape") > -1)
        {
          return true;
        }
        return !PKDEVICE.isPortrait();
      },
      /**
       *
       * Determines if the device is a hiDPI device (aka retina)
       *
       * @method isRetina
       * @static
       * @returns {boolean} `true` if the device has a `window.devicePixelRatio` greater than `1.0`; `false` otherwise
       */
      isRetina: function()
      {
        return window.devicePixelRatio > 1;
      },

      /**
       * Returns `true` if the device is an iPad.
       *
       * @method iPad
       * @static
       * @returns {boolean}
       */
      iPad: function ()
      {
        return PKDEVICE.platform()==="ios" && PKDEVICE.formFactor()==="tablet";
      },

      /**
       * Returns `true` if the device is an iPhone (or iPod).
       *
       * @method iPhone
       * @static
       * @returns {boolean}
       */
      iPhone: function ()
      {
        return PKDEVICE.platform()==="ios" && PKDEVICE.formFactor()==="phone";
      },

      /**
       * Returns `true` if the device is an Android Phone.
       *
       * @method droidPhone
       * @static
       * @returns {boolean}
       */
      droidPhone: function ()
      {
        return PKDEVICE.platform()==="android" && PKDEVICE.formFactor()==="phone";
      },

      /**
       * Returns `true` if the device is an Android Tablet.
       *
       * @method droidTablet
       * @static
       * @returns {boolean}
       */
      droidTablet: function ()
      {
        return PKDEVICE.platform()==="android" && PKDEVICE.formFactor()==="tablet";
      }
    };
    return PKDEVICE;
  }
);
