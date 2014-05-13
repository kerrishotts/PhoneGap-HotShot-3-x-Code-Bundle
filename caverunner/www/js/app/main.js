/**
 *
 * main
 *
 * main.js
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
/*global define, console*/
define( [ "yasmf", "app/views/startView" ], function( _y, StartView ) {
  // define our app object
  var APP = {};
  APP.onPause = function() {
    console.log( "Application paused" );
  }
  APP.onResume = function() {
    console.log( "Application resumed" );
  }
  APP.start = function() {
    // update the iOS 7 status bar
    if ( _y.device.platform() == "ios" ) {
      StatusBar.hide();
      //StatusBar.styleLightContent();
    }
    // start listening for resume/pause events
    var gN = _y.UI.globalNotifications;
    gN.registerNotification( "onApplicationPause" );
    gN.registerNotification( "onApplicationResume" );
    gN.addListenerForNotification( "onApplicationPause", APP.onPause );
    gN.addListenerForNotification( "onApplicationResume", APP.onResume );
    window.addEventListener( "pause", function() {
      gN.notify( "onApplicationPause" );
    }, false );
    window.addEventListener( "resume", function() {
      gN.notify( "onApplicationResume" );
    }, false );
    // find the rootContainer DOM element
    var rootContainer = _y.ge( "rootContainer" );
    var startView = new StartView();
    APP.startView = startView;
    startView.init();
    var navigationController = new _y.UI.NavigationController();
    navigationController.initWithOptions( {
      rootView: startView,
      parent: rootContainer
    } );
    APP.navigationController = navigationController;
  }
  return APP;
} );
