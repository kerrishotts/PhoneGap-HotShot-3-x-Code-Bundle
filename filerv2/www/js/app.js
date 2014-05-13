/**
 *
 * Kickstarter for the Filer App.
 *
 * app.js
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
/*global require, requirejs*/
/**
 * requirejs configuration -- by default our libraries are in js/lib
 * but the app code is in /app, and the app's view are in /html.
 *
 * The urlArgs is there to bust the cache -- can disable in a production
 * environment
 *
 * The ship ensures that the cultures below rely on the globalize script
 * so they don't load out-of-order
 */
requirejs.config( {
  baseUrl: './js/lib',
  paths: {
    'app': '../app',
    'html': '../../html',
    'Q': 'q'
  },
  urlArgs: "bust=" + ( new Date() ).getTime(),
  shim: {
    "cultures/globalize.culture.en-US": [ "globalize" ],
    "cultures/globalize.culture.es-US": [ "globalize" ],
    "Q": {
      exports: "Q"
    },
    "yasmf": [ "Q" ]
  }
} );
/**
 * Start the app once all the dependencies are met
 */
require( [ 'yasmf', 'app/main', 'Q', 'cultures/globalize.culture.en-US',
  'cultures/globalize.culture.es-US'
], function( _y, APP, Q ) {
  // for future reference, add _y to the global object
  window._y = _y;
  // and the app as well
  window.APP = APP;
  // and GO!
  _y.executeWhenReady( function() {
    _y.getDeviceLocale( APP.start )
  } );
} );
