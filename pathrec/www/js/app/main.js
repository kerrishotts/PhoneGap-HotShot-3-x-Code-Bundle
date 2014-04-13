/**
 *
 * main
 * 
 * main.js
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
/*global define, console*/
define ( ["yasmf", "app/views/pathListView", "app/views/staticView"], function ( _y, PathListView, StaticView )
{
   // define our app object
   var APP = {};

   APP.onPause = function ()
   {
      console.log ( "Application paused" );
      // on iOS, this isn't processed until a resume event,
      // since calls to the native layer are delayed
   }

   APP.onResume = function ()
   {
      console.log ( "Application resumed" );
   }

   APP._lastConnectionStatus = "unknown";
   APP._lastConnectionAlert = null;
   APP.onConnectionStatusChanged = function (sender, notification)
   {
      var friendlyMessage = "";
      if (APP._lastConnectionStatus == "onApplicationOffline" &&
          notification == "onApplicationOnline")
      {
         friendlyMessage = _y.T("Your Internet Connection has been restored.");
      }
      if (APP._lastConnectionStatus !== "onApplicationOffline" &&
          notification == "onApplicationOffline")
      {
         friendlyMessage = _y.T("Your Internet Connection is offline.");
      }
      APP._lastConnectionStatus = notification;

      if (friendlyMessage !== "")
      {
        if (APP._lastConnectionAlert === null)
        {
           APP._lastConnectionAlert = new _y.UI.Alert.OK(
           {
             title: _y.T("Notice"),
             text: _y.T(friendlyMessage)
           });
           APP._lastConnectionAlert.show();
        }
        else
        {
           APP._lastConnectionAlert.text = _y.T(friendlyMessage);
           if (!APP._lastConnectionAlert.visible)
           {
              APP._lastConnectionAlert.show();            
           }
        }
     }
   }

   APP.onBatteryStatusChanged = function (sender, notification, data)
   {
      console.log ( "Battery status: " + data[0] + "; is plugged in? " + data[1] );
   }

   APP.onMenuButton = function ()
   {
      if (typeof APP.navigationController !== "undefined")
      {
         if (typeof APP.navigationController.topView.onMenuButton !== "undefined")
         {
            APP.navigationController.topView.onMenuButton();
         }
      }
   }

   APP.onSearchButton = function ()
   {
      if (typeof APP.navigationController !== "undefined")
      {
         if (typeof APP.navigationController.topView.onSearchButton !== "undefined")
         {
            APP.navigationController.topView.onSearchButton();
         }
      }
   }
   // APP.start will load the first view and kick us off
   APP.start = function ()
   {
     // update the iOS 7 status bar
     if (_y.device.platform() == "ios")
     {
       StatusBar.styleLightContent();
     }
      // start listening for resume/pause events
      var gN = _y.UI.globalNotifications;
      gN.registerNotification ( "onApplicationPause" );
      gN.registerNotification ( "onApplicationResume" );
      gN.registerNotification ( "onApplicationOnline" );
      gN.registerNotification ( "onApplicationOffline" );
      gN.registerNotification ( "onApplicationBatteryCritical" );
      gN.registerNotification ( "onApplicationBatteryLow" );
      gN.registerNotification ( "onApplicationBatteryStatus" );
      gN.registerNotification ( "onApplicationMenuButton" );
      gN.registerNotification ( "onApplicationSearchButton" );

      gN.addListenerForNotification ( "onApplicationPause", APP.onPause );
      gN.addListenerForNotification ( "onApplicationResume", APP.onResume );
      gN.addListenerForNotification ( "onApplicationOnline", APP.onConnectionStatusChanged );
      gN.addListenerForNotification ( "onApplicationOffline", APP.onConnectionStatusChanged );
      gN.addListenerForNotification ( "onApplicationBatteryCritical", APP.onBatteryStatusChanged );
      gN.addListenerForNotification ( "onApplicationBatteryLow", APP.onBatteryStatusChanged );
      gN.addListenerForNotification ( "onApplicationBatteryStatus", APP.onBatteryStatusChanged );
      gN.addListenerForNotification ( "onApplicationMenuButton", APP.onMenuButton );
      gN.addListenerForNotification ( "onApplicationSearchButton", APP.onSearchButton );

      window.addEventListener ( "pause", function () { gN.notify ("onApplicationPause"); }, false );
      window.addEventListener ( "resume", function () { gN.notify ("onApplicationResume"); }, false );
      window.addEventListener ( "online", function () { gN.notify ("onApplicationOnline"); }, false );
      window.addEventListener ( "offline", function () { gN.notify ("onApplicationOffline"); }, false );
      window.addEventListener ( "batterycritical", function ( level, isPlugged ) { gN.notify ("onApplicationBatteryCritical", [level, isPlugged]); }, false );
      window.addEventListener ( "batterylow", function ( level, isPlugged ) { gN.notify ("onApplicationBatteryLow", [level, isPlugged]); }, false );
      window.addEventListener ( "batterystatus", function ( level, isPlugged ) { gN.notify ("onApplicationBatteryStatus", [level, isPlugged]); }, false );
      window.addEventListener ( "menubutton", function () { gN.notify ("onApplicationMenuButton"); }, false );
      window.addEventListener ( "searchbutton", function () { gN.notify ("onApplicationSearchButton"); }, false );


      // find the rootContainer DOM element
      var rootContainer = _y.ge("rootContainer");

      // create a new note list
      var pathListView = new PathListView ();

      // store this for future reference
      APP.pathListView = pathListView;

      // initialize it
      pathListView.init( );

      // determine how we want to create the initial views.
      var whichAppStyle = "split";
      if ( _y.device.isPhone() )
      {
        whichAppStyle = "normal"; // no matter what the previous value is set to, phones get the normal view
      }

      switch (whichAppStyle)
      {
        case "split":
          var leftNavigationController, rightNavigationController, splitViewController, staticView;
          staticView = new StaticView();
          staticView.initWithOptions ();

          leftNavigationController = new _y.UI.NavigationController();
          leftNavigationController.initWithOptions ( { rootView: pathListView } );

          rightNavigationController = new _y.UI.NavigationController();
          rightNavigationController.initWithOptions ( { rootView: staticView } );

          splitViewController = new _y.UI.SplitViewController();
          splitViewController.initWithOptions ( { leftView: leftNavigationController, 
                                                  rightView: rightNavigationController,
                                                  parent: rootContainer,
                                                  viewType: whichAppStyle,
                                                  leftViewStatus: "visible" } );

          APP.splitViewController = splitViewController;
          break;
        default:
          // create a new navigation controller
          var navigationController = new _y.UI.NavigationController();
          navigationController.initWithOptions ( { rootView: pathListView, parent: rootContainer } );
          APP.navigationController = navigationController;
      }

   }

   return APP;
});