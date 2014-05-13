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
         onevar:false 
 */
/*global define*/
define( [ "yasmf", "app/views/noteListView" ], function( _y, NoteListView ) {
  // define our app object
  var APP = {};
  APP.onPause = function() {
    console.log( "Application paused" );
    // on iOS, this isn't processed until a resume event,
    // since calls to the native layer are delayed
  };
  APP.onResume = function() {
    console.log( "Application resumed" );
  };
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
        APP._lastConnectionAlert = new _y.UI.Alert.OK( {
          title: _y.T( "Notice" ),
          text: _y.T( friendlyMessage )
        } );
        APP._lastConnectionAlert.show();
      } else {
        APP._lastConnectionAlert.text = _y.T( friendlyMessage );
        if ( !APP._lastConnectionAlert.visible ) {
          APP._lastConnectionAlert.show();
        }
      }
    }
  };
  APP.onBatteryStatusChanged = function( sender, notification, data ) {
    console.log( "Battery status: " + data[ 0 ].level + "; is plugged in? " + data[ 0 ]
      .isPlugged );
  };
  APP.onMenuButtonPressed = function() {
    if ( typeof APP.navigationController !== "undefined" ) {
      if ( typeof APP.navigationController.topView.onMenuButton !== "undefined" ) {
        APP.navigationController.topView.onMenuButton();
      }
    }
  };
  APP.onSearchButtonPressed = function() {
    if ( typeof APP.navigationController !== "undefined" ) {
      if ( typeof APP.navigationController.topView.onSearchButton !== "undefined" ) {
        APP.navigationController.topView.onSearchButton();
      }
    }
  };
  // APP.start will load the first view and kick us off
  APP.start = function() {
    // start listening for resume/pause events
    var gN = _y.UI.globalNotifications;
    var notifications = {
      "pause": {
        notification: "applicationPause",
        handler: APP.onPause
      },
      "resume": {
        notification: "applicationResume",
        handler: APP.onResume
      },
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
    // find the rootContainer DOM element
    var rootContainer = _y.ge( "rootContainer" );
    // create a new note list
    var noteListView = new NoteListView();
    // store this for future reference
    APP.noteListView = noteListView;
    // initialize it
    noteListView.init();
    // create a new navigation controller
    var navigationController = new _y.UI.NavigationController();
    navigationController.initWithOptions( {
      rootView: noteListView,
      parent: rootContainer
    } );
    APP.navigationController = navigationController;
  };
  return APP;
} );
