/**
 *
 * main
 *
 * main.js
 * @author Kerri Shotts
 * @version 2.0.0
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
         onevar:false,
         loopfunc:true
 */
/*global define, console, StatusBar*/
define( [ "yasmf", "app/views/pathListView", "app/views/staticView" ], function( _y,
  PathListView, StaticView ) {
  // define our app object
  var APP = {};
  APP.navigationBars = [];
  APP.onPause = function() {
    _y.UI.globalNotifications.notify( "applicationPausing" );
    console.log( "Application paused" );
  }
  APP.onResume = function() {
    _y.UI.globalNotifications.notify( "applicationResuming" );
    console.log( "Application resumed" );
  }
  APP._lastConnectionStatus = "unknown";
  APP._lastConnectionAlert = null;
  APP.onConnectionStatusChanged = function( sender, notification ) {
    var friendlyMessage = "";
    if ( APP._lastConnectionStatus == "applicationOffline" && notification ==
      "applicationOnline" ) {
      friendlyMessage = _y.T( "Your Internet Connection has been restored." );
    }
    if ( APP._lastConnectionStatus !== "applicationOffline" && notification ==
      "applicationOffline" ) {
      friendlyMessage = _y.T( "Your Internet Connection is offline." );
    }
    APP._lastConnectionStatus = notification;
    if ( friendlyMessage !== "" ) {
      if ( APP._lastConnectionAlert === null ) {
        var mb = window.nativeControls.MessageBox();
        APP._lastConnectionAlert = mb;
        mb.title = _y.T( "Notice" );
        mb.text = _y.T( friendlyMessage );
        mb.show();
      } else {
        APP._lastConnectionAlert.text = _y.T( friendlyMessage );
        APP._lastConnectionAlert.show();
      }
    }
  }
  APP.onBatteryStatusChanged = function( sender, notification, data ) {
    console.log( "Battery status: " + data[ 0 ].level + "; is plugged in? " + data[ 0 ]
      .isPlugged );
  }
  APP.onMenuButtonPressed = function() {
    if ( typeof APP.navigationController !== "undefined" ) {
      if ( typeof APP.navigationController.topView.onMenuButton !== "undefined" ) {
        APP.navigationController.topView.onMenuButton();
      }
    }
  }
  APP.onSearchButtonPressed = function() {
    if ( typeof APP.navigationController !== "undefined" ) {
      if ( typeof APP.navigationController.topView.onSearchButton !== "undefined" ) {
        APP.navigationController.topView.onSearchButton();
      }
    }
  }
  APP.updateNavigationBars = function() {
    if ( APP.navigationBars.length == 1 ) {
      APP.navigationBars[ 0 ].frame = window.nativeControls.Rect( 0, 20, document.body.clientWidth,
        44 );
    } else {
      APP.navigationBars[ 0 ].frame = window.nativeControls.Rect( 0, 20, 320, 44 );
      APP.navigationBars[ 1 ].frame = window.nativeControls.Rect( 320, 20, document.body
        .clientWidth - 320, 44 );
    }
  }
  // APP.start will load the first view and kick us off
  APP.start = function() {
    // update the iOS 7 status bar
    if ( _y.device.platform() == "ios" ) {
      if (typeof StatusBar !== "undefined") {
        StatusBar.styleLightContent();
      }
    }
    // start listening for resume/pause events
    var gN = _y.UI.globalNotifications;
    var notifications = {
      "online": {
        notification: "applicationOnline",
        handler: APP.onConnectionStatusChanged
      },
      "offline": {
        notification: "applicationOffline",
        handler: APP.onConnectionStatusChanged
      },
      "batterycritical": {
        notification: "batteryCritical",
        handler: APP.onBatteryStatusChanged
      },
      "batterylow": {
        notification: "batteryLow",
        handler: APP.onBatteryStatusChanged
      },
      "batterystatus": {
        notification: "batteryStatus",
        handler: APP.onBatteryStatusChanged
      },
      "menubutton": {
        notification: "menuButtonPressed",
        handler: APP.onMenuButtonPressed
      },
      "searchbutton": {
        notification: "searchButtonPressed",
        handler: APP.onSearchButtonPressed
      }
    };
    if ( _y.device.platform() === "ios" ) {
      // if we want to persist localStorage, we need to use PKLocalStorage plugin
      window.PKLocalStorage.addPauseHandler( APP.onPause );
      window.PKLocalStorage.addResumeHandler( APP.onResume );
    } else {
      // add the proper pause/resume handlers
      notifications.pause = {
        notification: "pause",
        handler: APP.onPause
      };
      notifications.resume = {
        notification: "resume",
        handler: APP.onResume
      };
    }
    for ( var DOMEvent in notifications ) {
      if ( notifications.hasOwnProperty( DOMEvent ) ) {
        var notification = notifications[ DOMEvent ];
        gN.registerNotification( notification.notification );
        gN.addListenerForNotification( notification.notification, notification.handler );
        ( function( notification ) {
          window.addEventListener( DOMEvent, function() {
            var args = Array.prototype.slice.call( arguments );
            gN.notify( notification, args );
          }, false );
        } )( notification.notification );
      }
    }
    gN.registerNotification( "applicationPausing", false ); // synchronous notifications
    gN.registerNotification( "applicationResuming", false ); // synchronous
    // find the rootContainer DOM element
    var rootContainer = _y.ge( "rootContainer" );
    // create a new note list
    var pathListView = new PathListView();
    // store this for future reference
    APP.pathListView = pathListView;
    // initialize it
    pathListView.init();
    // determine how we want to create the initial views.
    var whichAppStyle = "split";
    if ( _y.device.isPhone() ) {
      whichAppStyle = "normal"; // no matter what the previous value is set to, phones get the normal view
    }
    switch ( whichAppStyle ) {
      case "split":
        var leftNavigationController, rightNavigationController, splitViewController,
          staticView;
        staticView = new StaticView();
        staticView.initWithOptions();
        leftNavigationController = new _y.UI.NavigationController();
        leftNavigationController.initWithOptions( {
          rootView: pathListView
        } );
        rightNavigationController = new _y.UI.NavigationController();
        rightNavigationController.initWithOptions( {
          rootView: staticView
        } );
        splitViewController = new _y.UI.SplitViewController();
        splitViewController.initWithOptions( {
          leftView: leftNavigationController,
          rightView: rightNavigationController,
          parent: rootContainer,
          viewType: whichAppStyle,
          leftViewStatus: "visible"
        } );
        APP.splitViewController = splitViewController;
        var leftNavBar = window.nativeControls.NavigationBar();
        var rightNavBar = window.nativeControls.NavigationBar();
        APP.navigationBars = [ leftNavBar, rightNavBar ];
        break;
      default:
        // create a new navigation controller
        var navigationController = new _y.UI.NavigationController();
        navigationController.initWithOptions( {
          rootView: pathListView,
          parent: rootContainer
        } );
        APP.navigationController = navigationController;
        var mainNavBar = window.nativeControls.NavigationBar();
        APP.navigationBars = [ mainNavBar ];
    }
    APP.navigationBars.forEach( function( navBar ) {
      navBar.barTintColor = window.nativeControls.Color( 96, 224, 32, 1 );
      navBar.tintColor = window.nativeControls.Color( "white" );
      navBar.textColor = window.nativeControls.Color( "white" );
      navBar.translucent = true;
    } );
    _y.UI.orientationHandler.addListenerForNotification( "orientationChanged", APP.updateNavigationBars );
    APP.updateNavigationBars();
    APP.navigationBars.forEach( function( navBar ) {
      navBar.addToView();
    } );
  }
  return APP;
} );
