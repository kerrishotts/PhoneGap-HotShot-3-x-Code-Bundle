/**
 *
 * Game View
 *
 * gameView.js
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
define( [ "yasmf", "text!html/gameView.html!strip", "hammer" ], function( _y,
  gameViewHTML, Hammer ) {
  var _className = "GameView";
  var GameView = function() {
    var self = new _y.UI.ViewContainer();
    self.subclass( _className );
    // DOM elements
    self._overlay = null; // overlay for detecting swipes
    self._backButton = null; // back button (quitter!)
    self._message = null; // important messages
    self._leftButton = null; // left button for tapping
    self._rightButton = null; // right button for tapping
    self._actionButton = null; // action button (next level, start)
    self._actionGroup = null;
    // game variables, arrays, etc.
    /////////////////////////////////////////////////////////
    // calculate how large our canvas needs to be
    self._canvasWidth = parseInt( window.getComputedStyle( document.body ).width, 10 );
    self._canvasHeight = parseInt( window.getComputedStyle( document.body ).height,
      10 );
    self._canvasMiddle = self._canvasWidth / 2;
    self._pixelRatio = window.devicePixelRatio;
    // this is used to generate the cavern, so that it is the same difficulty everywhere
    self._generateWidth = 320;
    self._scale = self._canvasWidth / self._generateWidth;
    // contains all the coordinates for the current level, including
    // the cavern walls and any obstacles
    self._caveSegments = [];
    // indicates the current position within the cave
    self._currentTop = null;
    // the current level
    self._currentLevel = 0;
    // internal timer
    self._timer = undefined;
    // length of each individual cave segment
    self._segmentLength = 20;
    // ship information
    self._ship = {
      x: ( self._canvasWidth / 2 ) - 10,
      y: 30,
      acceleration: 0
    };
    // collision detection
    self._collidingLines = [
      [],
      []
    ];
    // button/control scheme information
    self._controlSchemes = {
      "slide": 0,
      "tilt": 1,
      "buttons": 2
    }
    self._controlScheme = 0; // 0=slide; 1=tilt; 2=buttons
    self._desiredDirection = 0; // direction user wants ship to go
    // slide control scheme
    self._lastTouch = {
      x: -1,
      y: -1
    }; // no previous screen touch
    self._amTouching = false; // no touch detected
    self._touchTimer = undefined; // no current touch timer
    // tilt control scheme
    self._amCalibrated = false;
    self._tiltWatch = undefined;
    self._previousAccelerometer = {
      x: 0,
      y: 0,
      z: 0
    };
    self._calibratedAccelerometer = {
      x: 0,
      y: 0,
      z: 0
    };
    // this determines the "speed" and "feel" of the game controls
    // increase or decrease as you like.
    self._deviceFactor = 1.25;
    if ( _y.device.platform() == "ios" ) {
      self._deviceFactor = 1.75;
    }
    // our score
    self._score = 0;
    // used for determining difference of time since
    // last repaint
    self._startTime = undefined;
    // log array (for displaying useful information)
    self._logArray = [];
    // cache for the canvas and context
    self._canvas = null;
    self._context = null;
    self.goBack = function() {
      self.navigationController.popView();
    }
    self.overrideSuper( self.class, "render", self.render );
    self.render = function() {
      return _y.template( gameViewHTML, {
        "TAPTOSTART": _y.T( "TAPTOSTART" ),
        "START": _y.T( "START" ),
        "NEXT": _y.T( "NEXT" ),
        "BACK": _y.T( "BACK" )
      } );
    }
    self.overrideSuper( self.class, "renderToElement", self.renderToElement );
    self.renderToElement = function() {
      self.super( _className, "renderToElement" );
      // get the canvas and configure it
      self._canvas = self.element.querySelector( ".game-canvas" );
      self._context = self._canvas.getContext( "2d" );
      self._canvas.setAttribute( "width", self._canvasWidth * self._pixelRatio );
      self._canvas.setAttribute( "height", self._canvasHeight * self._pixelRatio );
      self._canvas.style.width = "" + self._canvasWidth + "px";
      self._canvas.style.height = "" + self._canvasHeight + "px";
      // find and attach event handlers to all our DOM elevents
      self._overlay = self.element.querySelector( ".game-overlay" );
      self._message = self.element.querySelector( ".game-message" );
      self._actionButton = self.element.querySelector( ".game-action" );
      self._leftButton = self.element.querySelector( ".game-left" );
      self._rightButton = self.element.querySelector( ".game-right" );
      self._backButton = self.element.querySelector( ".game-back" );
      self._actionGroup = self.element.querySelector( ".action-group" );
      Hammer( self._message ).on( "tap", self.startLevel );
      Hammer( self._actionButton ).on( "tap", self.startLevel );
      Hammer( self._backButton ).on( "tap", self.goBack );
      _y.UI.backButton.addListenerForNotification( "backButtonPressed", self.goBack );
      if ( self._controlScheme == self._controlSchemes[ "buttons" ] ) {
        self._leftButton.style.display = "block";
        self._rightButton.style.display = "block";
        self._leftButton.addEventListener( "touchstart", self._leftButtonDown );
        self._leftButton.addEventListener( "touchend", self._leftButtonUp );
        self._rightButton.addEventListener( "touchstart", self._rightButtonDown );
        self._rightButton.addEventListener( "touchend", self._rightButtonUp );
        self._leftButton.addEventListener( "mousedown", self._leftButtonDown );
        self._leftButton.addEventListener( "mouseup", self._leftButtonUp );
        self._rightButton.addEventListener( "mousedown", self._rightButtonDown );
        self._rightButton.addEventListener( "mouseup", self._rightButtonUp );
      } else {
        self._leftButton.style.display = "none";
        self._rightButton.style.display = "none";
        if ( self._controlScheme == self._controlSchemes[ "slide" ] ) {
          self._overlay.addEventListener( "touchstart", self._canvasTouchStarted );
          self._overlay.addEventListener( "touchmove", self._canvasTouchMoved );
          self._overlay.addEventListener( "touchend", self._canvasTouchEnded );
          self._overlay.addEventListener( "mousedown", self._canvasTouchStarted );
          self._overlay.addEventListener( "mousemove", self._canvasTouchMoved );
          self._overlay.addEventListener( "mouseup", self._canvasTouchEnded );
        } else {
          self._tiltWatch = navigator.accelerometer.watchAcceleration( self._updateAccelerometer,
            self._accelerometerError, {
              frequency: 40
            } );
        }
      }
    }
    // event handling for buttons
    self._leftButtonDown = function() {
      self._leftButton.classList.add( "pressed" );
      self._desiredDirection = -1;
    }
    self._leftButtonUp = function() {
      self._leftButton.classList.remove( "pressed" );
      self._desiredDirection = 0;
    }
    self._rightButtonDown = function() {
      self._rightButton.classList.add( "pressed" );
      self._desiredDirection = 1;
    }
    self._rightButtonUp = function() {
      self._rightButton.classList.remove( "pressed" );
      self._desiredDirection = 0;
    }
    // event handling for canvas touches
    self._canvasTouchStarted = function( evt ) {
      if ( typeof evt.touches !== "undefined" ) {
        self._lastTouch.x = evt.touches[ 0 ].pageX;
        self._lastTouch.y = evt.touches[ 0 ].pageY;
      } else {
        self._lastTouch.x = evt.pageX;
        self._lastTouch.y = evt.pageY;
      }
      self._amTouching = true;
    }
    self._canvasTouchMoved = function( evt ) {
      if ( !self._amTouching ) {
        return;
      }
      if ( typeof self._touchTimer !== "undefined" ) {
        clearTimeout( self._touchTimer );
        self._touchTimer = undefined;
      }
      var curTouchX;
      if ( typeof evt.touches !== "undefined" ) {
        curTouchX = evt.touches[ 0 ].pageX;
      } else {
        curTouchX = evt.pageX;
      }
      var deltaX = curTouchX - self._lastTouch.x;
      if ( Math.abs( deltaX ) > 1 ) {
        self._desiredDirection = ( ( deltaX ) / Math.abs( deltaX ) ) / ( 8 / Math.min(
          Math.abs( deltaX ), 8 ) );
        self._lastTouch.x = curTouchX;
      } else {
        self._desiredDirection = 0;
      }
      // if player stays in same spot, clear the button...
      self._touchTimer = setTimeout( function() {
        self._desiredDirection = 0;
      }, 25 );
    }
    self._canvasTouchEnded = function( evt ) {
      self._desiredDirection = 0;
      self._amTouching = false;
    }
    // accelerometer handling
    self._updateAccelerometer = function( a ) {
      if ( self._amCalibrated ) {
        var p = self._previousAccelerometer;
        var avgX = ( p.x * 0.7 ) + ( a.x * 0.3 );
        self._previousAccelerometer = a;
        self._previousAccelerometer.x = avgX;
      } else {
        self._calibratedAccelerometer = a;
        self._previousAccelerometer = a;
        self._amCalibrated = true;
      }
    }
    self._accelerometerError = function() {
      console.log( "Error handling accelerometer..." );
    }
    // use this to show messages over the game
    self._showMessage = function( m ) {
      var newStyle = "block";
      if ( m === "" ) {
        newStyle = "none";
      }
      self._message.style.display = newStyle;
      self._actionGroup.style.display = newStyle;
      self._message.innerHTML = m;
    }
    // use this for debugging
    self._log = function( s ) {
      if ( self._logArray.length > 10 ) {
        self._logArray.shift();
      }
      var ctx = self._context;
      self._logArray.push( s );
      ctx.save();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "12pt Helvetica";
      for ( var i = 0; i < self._logArray.length; i++ ) {
        ctx.fillText( self._logArray[ i ], 10, 100 + ( i * 20 ) );
      }
      ctx.restore();
    }
    self._generateLevel = function( lvl ) {
      // reset the existing level segments
      self._segments = [
        [],
        [],
        [],
        []
      ];
      var generateWidth = self._generateWidth;
      // start the cavern out reasonably wide
      var lastLeft = ( generateWidth / 5 );
      var lastRight = ( generateWidth / 5 );
      var bias = 0;
      // rndWidth determines how much the cavern walls can vary
      // by any step
      var rndWidth = Math.floor( generateWidth / 10 ) + ( lvl * 10 );
      if ( rndWidth > 150 ) {
        rndWidth = 150;
      }
      // channelWidth keeps the cave channel from getting so thin
      // the ship can't navigate
      var channelWidth = Math.floor( generateWidth / 1.85 ) - ( lvl * 16 );
      if ( channelWidth < 30 ) {
        channelWidth = 30; // minimum channel width
      }
      // how often can a wall happen?
      var wallChance = 0.5 - ( lvl / 12 );
      if ( wallChance < 0.15 ) {
        wallChance = 0.15;
      }
      var wallEvery = Math.floor( 30 - ( lvl / 2 ) );
      if ( wallEvery < 5 ) {
        wallEvery = 5;
      }
      // we do need an initial "safe" portion
      var i;
      for ( i = 0; i < 30; i++ ) {
        self._segments[ 0 ].push( lastLeft * self._scale ); // left of corridor
        self._segments[ 1 ].push( lastRight * self._scale ); // right of corridor
        self._segments[ 2 ].push( -1 ); // no wall
        self._segments[ 3 ].push( -1 ); // no wall
      }
      for ( i = 0; i < Math.floor( 600 + ( 125 * lvl ) ); i++ ) {
        var newLeft = lastLeft + ( bias ) + ( ( rndWidth / 2 ) - Math.floor( Math.random() *
          ( rndWidth + 1 ) ) );
        var newRight = lastRight + ( bias ) + ( ( rndWidth / 2 ) - Math.floor( Math.random() *
          ( rndWidth + 1 ) ) );
        if ( newLeft < 10 ) {
          newLeft = 10;
          bias = Math.floor( Math.random() * ( self._segmentLength / 2 ) );
        }
        if ( newLeft > ( generateWidth - channelWidth - 10 ) ) {
          newLeft = generateWidth - channelWidth - 10;
          bias = -Math.floor( Math.random() * ( self._segmentLength / 2 ) );
        }
        if ( generateWidth - newRight < newLeft + ( channelWidth / 1.25 ) ) {
          newRight = generateWidth - ( newLeft + ( channelWidth / 1.25 ) );
        }
        if ( generateWidth - newRight > newLeft + ( channelWidth * 1.25 ) ) {
          newRight = generateWidth - ( newLeft + ( channelWidth * 1.25 ) );
        }
        if ( newRight < 10 ) {
          newRight = 10;
          bias = -Math.floor( Math.random() * ( self._segmentLength / 2 ) );
        }
        if ( newRight > ( generateWidth - 10 ) ) {
          newRight = generateWidth - 10;
          bias = Math.floor( Math.random() * ( self._segmentLength / 2 ) );
        }
        self._segments[ 0 ].push( newLeft * self._scale );
        self._segments[ 1 ].push( newRight * self._scale );
        lastLeft = newLeft;
        lastRight = newRight;
        if ( ( i % wallEvery ) === 0 && ( i > 30 ) ) {
          // decide if we want to create a wall
          if ( Math.random() > wallChance ) {
            var openingWidth = channelWidth / 1.35;
            var caveWidth = ( ( generateWidth - newRight ) - newLeft ) - openingWidth;
            var wallOpening = Math.floor( Math.random() * caveWidth );
            self._segments[ 2 ].push( ( newLeft + wallOpening ) * self._scale );
            self._segments[ 3 ].push( ( newLeft + wallOpening + openingWidth ) * self
              ._scale );
          } else { // no wall
            self._segments[ 2 ].push( -1 );
            self._segments[ 3 ].push( -1 );
          }
        } else { // no wall
          self._segments[ 2 ].push( -1 );
          self._segments[ 3 ].push( -1 );
        }
      }
    }
    self._doUpdate = function( f ) {
      function doSegmentsIntersect( segment1, segment2 ) {
        // from: http://stackoverflow.com/a/16725715
        function CCW( p1, p2, p3 ) {
          var a = p1.x,
            b = p1.y,
            c = p2.x,
            d = p2.y,
            e = p3.x,
            f = p3.y;
          return ( f - b ) * ( c - a ) > ( d - b ) * ( e - a );
        }
        var p1 = {
            x: segment1.x1,
            y: segment1.y1
          },
          p2 = {
            x: segment1.x2,
            y: segment1.y2
          },
          p3 = {
            x: segment2.x1,
            y: segment2.y1
          },
          p4 = {
            x: segment2.x2,
            y: segment2.y2
          };
        return ( CCW( p1, p3, p4 ) != CCW( p2, p3, p4 ) ) && ( CCW( p1, p2, p3 ) !=
          CCW( p1, p2, p4 ) );
      }
      var gameOver = false;
      var levelOver = false;
      /*
             // check to see if the ship has impacted something
             // pixel-based collision
             var ctx = self._context;
             var pixels = ctx.getImageData(Math.floor((self._ship.x * self._scale) * self._pixelRatio),
                                           Math.floor((self._ship.y) * self._pixelRatio),
                                           1,1).data;
             // crash!
             if ( pixels[3] === 255 )
             {
               self._actionButton.innerHTML = _y.T("TRY_AGAIN");
               self._showMessage (_y.T('CRASHED'));
               gameOver = true;
               self._currentLevel = 0;
             }
*/
      var oldShip = {
        x: self._ship.x,
        y: self._ship.y
      }; // we need this to get the origin for the line the ship makes while moving
      if ( f > 0 && f != Infinity ) {
        // move the ship
        if ( self._controlScheme != self._controlSchemes[ "tilt" ] ) {
          if ( self._desiredDirection !== 0 ) {
            if ( Math.abs( self._ship.acceleration ) < 1 ) {
              self._ship.acceleration = self._desiredDirection;
            }
            self._ship.acceleration = self._ship.acceleration + ( self._desiredDirection *
              self._deviceFactor );
            if ( self._ship.acceleration < -10 ) {
              self._ship.acceleration = -10;
            }
            if ( self._ship.acceleration > 10 ) {
              self._ship.acceleration = 10;
            }
          } else {
            self._ship.acceleration = self._ship.acceleration / 1.5;
            if ( Math.abs( self._ship.acceleration ) < 0.25 ) {
              self._ship.acceleration = 0;
            }
          }
          self._ship.x += ( self._ship.acceleration * f );
          self._score -= Math.floor( self._ship.acceleration * f );
        } else {
          // calculate the position based on the acceleromter data
          if ( self._amCalibrated ) {
            var previousX = self._ship.x;
            self._ship.x = ( self._canvasMiddle - ( self._previousAccelerometer.x *
              32 ) ) / self._scale;
            var deltaX = Math.abs( previousX - self._ship.x );
            if ( deltaX < 3 ) {
              self._ship.x = previousX;
              deltaX = 0;
            }
            if ( self._ship.x < 0 ) {
              self._ship.x = 0;
            }
            if ( self._ship.x > self._generateWidth ) {
              self._ship.x = self._generateWidth;
            }
            self._score -= Math.floor( deltaX );
          }
        }
        var speed = ( ( 4 + self._currentLevel ) * ( f ) );
        self._currentTop += speed;
        oldShip.y -= speed; // our line extends in the opposite direction
        if ( !gameOver && !levelOver ) {
          self._score += ( self._currentLevel * f );
        }
      }
      if ( Math.floor( self._currentTop / self._segmentLength ) > self._segments[ 0 ]
        .length ) {
        self._actionButton.innerHTML = _y.T( "CONTINUE" );
        self._showMessage( _y.T( 'NEXT_LEVEL' ) );
        levelOver = true;
      }
      // calculate if our ship has collided with the cavern or walls
      // mathematical-based collision (not pixel-based)
      var shipCollided = false;
      var segment1 = {
          x1: oldShip.x * self._scale,
          y1: oldShip.y,
          x2: self._ship.x * self._scale,
          y2: self._ship.y
        },
        segment2;
      for ( var i = 0; i < 2; i++ ) {
        for ( var j = 0; j < self._collidingLines[ i ].length - 1; j++ ) {
          segment2 = {
            x1: self._collidingLines[ i ][ j ].x,
            y1: self._collidingLines[ i ][ j ].y,
            x2: self._collidingLines[ i ][ j + 1 ].x,
            y2: self._collidingLines[ i ][ j + 1 ].y
          };
          if ( doSegmentsIntersect( segment1, segment2 ) ) {
            shipCollided = true;
            break;
          }
        }
        if ( shipCollided ) {
          break;
        }
      }
      if ( shipCollided ) {
        self._actionButton.innerHTML = _y.T( "TRY_AGAIN" );
        self._showMessage( _y.T( 'CRASHED' ) );
        gameOver = true;
        self._currentLevel = 0;
      }
      if ( !gameOver && !levelOver ) {
        var requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame;
        if ( typeof requestAnimationFrame !== "undefined" ) {
          self._timer = requestAnimationFrame( self._doAnim )
        } else {
          self._timer = setTimeout( self._doAnim, 17 );
        }
      }
    }
    self._doAnim = function( timestamp ) {
      //calculate difference since last repaint
      if ( typeof timestamp == "undefined" ) {
        timestamp = ( new Date() ).getTime();
      }
      var diff = timestamp - self._startTime;
      var ctx = self._context;
      ctx.save();
      ctx.scale( window.devicePixelRatio, window.devicePixelRatio );
      ctx.clearRect( 0, 0, self._canvasWidth, self._canvasHeight );
      self._collidingLines = [
        [],
        []
      ];
      for ( var i = 0; i < 2; i++ ) {
        var seg, x, y, j;
        var offX = -10;
        if ( i === 0 ) {
          seg = self._segments[ 0 ];
        }
        if ( i === 1 ) {
          seg = self._segments[ 1 ];
          offX = self._canvasWidth + 10;
        }
        ctx.fillStyle = "#402010";
        ctx.strokeStyle = "#804020";
        ctx.beginPath();
        ctx.moveTo( offX, -self._segmentLength );
        self._collidingLines.push( {
          x: offX,
          y: -self._segmentLength
        } );
        for ( j = Math.floor( self._currentTop / self._segmentLength ) - 1; j < Math.floor(
          self._currentTop / self._segmentLength ) + ( ( self._canvasHeight + ( 2 *
          self._segmentLength ) ) / self._segmentLength ); j++ ) {
          x = seg[ j ];
          y = ( j * self._segmentLength ) - self._currentTop;
          if ( i == 1 ) {
            x = self._canvasWidth - x;
          }
          ctx.lineTo( x, y );
          self._collidingLines[ i ].push( {
            x: x,
            y: y
          } );
          // do we need to draw a wall?
          if ( self._segments[ 2 ][ j ] > -1 ) {
            ctx.lineTo( self._segments[ i + 2 ][ j ], y );
            self._collidingLines[ i ].push( {
              x: self._segments[ i + 2 ][ j ],
              y: y
            } );
            ctx.lineTo( self._segments[ i + 2 ][ j ], y + self._segmentLength );
            self._collidingLines[ i ].push( {
              x: self._segments[ i + 2 ][ j ],
              y: y + self._segmentLength
            } );
          }
        }
        ctx.lineTo( offX, ( ( self._canvasWidth + 2 ) * self._segmentLength ) );
        self._collidingLines[ i ].push( {
          x: offX,
          y: ( ( self._canvasWidth + 2 ) * self._segmentLength )
        } );
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // fill in the walls with a different color, so as to make them stand out
        for ( j = Math.floor( self._currentTop / self._segmentLength ) - 1; j < Math.floor(
          self._currentTop / self._segmentLength ) + ( ( self._canvasHeight + ( 2 *
          self._segmentLength ) ) / self._segmentLength ); j++ ) {
          y = ( j * self._segmentLength ) - self._currentTop;
          if ( self._segments[ 2 ][ j ] > -1 ) {
            x = self._segments[ i + 2 ][ j ];
            ctx.fillStyle = "#804020";
            ctx.strokeStyle = "#C06030";
            ctx.beginPath();
            ctx.moveTo( offX, y );
            ctx.lineTo( x, y );
            ctx.lineTo( x, y + self._segmentLength );
            ctx.lineTo( offX, y + self._segmentLength );
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }
        }
      }
      // draw ship
      ctx.strokeStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.moveTo( ( self._ship.x - 10 ) * self._scale, self._ship.y - ( 5 * self._scale ) );
      ctx.lineTo( ( self._ship.x + 10 ) * self._scale, self._ship.y - ( 5 * self._scale ) );
      ctx.lineTo( ( self._ship.x ) * self._scale, self._ship.y + ( 25 * self._scale ) );
      ctx.lineTo( ( self._ship.x - 10 ) * self._scale, self._ship.y - ( 5 * self._scale ) );
      ctx.closePath();
      ctx.stroke();
      // text it up!
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "50px 'Courier New',Arial,sans-serif";
      var aString = "" + self._currentLevel + "/" + Math.floor( Math.max( 0, self._score ) );
      ctx.fillText( aString, 25, 75 );
      // if we have any touch events, show the indication
      if ( self._amTouching ) {
        ctx.fillStyle = "rgba(255,255,255,0.25)";
        ctx.beginPath();
        ctx.arc( self._lastTouch.x, self._lastTouch.y, 50, 0, 2 * Math.PI, false );
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      self._doUpdate( 60 / ( 1000 / diff ) );
      self._startTime = timestamp;
    }
    self.startLevel = function() {
      self._showMessage( "" );
      self._currentLevel++;
      if ( self._currentLevel == 1 ) {
        self._score = 0;
      }
      // reset the top and ship position too
      self._currentTop = 0; //-( self._canvasHeight );
      self._ship = {
        x: ( self._generateWidth / 2 ) - 10,
        y: 100,
        acceleration: 0
      }
      self._desiredDirection = 0;
      self._touchTimer = -1;
      self._lastTouch.x = -1;
      self._lastTouch.y = -1;
      self._amTouching = false;
      self._previousAccelerometer = {
        x: 0,
        y: 0,
        z: 0
      };
      self._amCalibrated = false;
      self._generateLevel( self._currentLevel );
      self._startTime = ( new Date() ).getTime();
      self._doAnim( self._startTime + 0 );
    }
    self.stopGame = function() {
      if ( typeof self._timer !== "undefined" ) {
        var cancelAnimationFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame;
        if ( typeof cancelAnimationFrame !== "undefined" ) {
          cancelAnimationFrame( self._timer )
        } else {
          clearTimeout( self._timer );
        }
      }
      self._timer = undefined;
    }
    self.overrideSuper( self.class, "init", self.init );
    self.init = function( theParentElement ) {
      // load our control scheme option
      self._controlScheme = self._controlSchemes[ "slide" ];
      if ( typeof localStorage.controlScheme !== "undefined" ) {
        self._controlScheme = self._controlSchemes[ localStorage.controlScheme ];
      }
      self.super( _className, "init", [ undefined, "div", self.class +
        " gameView ui-container", theParentElement
      ] );
      self.addListenerForNotification( "viewWasPopped", self.stopGame );
      self.addListenerForNotification( "viewWasPopped", self.releaseBackButton );
      self.addListenerForNotification( "viewWasPopped", self.destroy );
    }
    self.overrideSuper( self.class, "initWithOptions", self.init );
    self.initWithOptions = function( options ) {
      var theParentElement;
      if ( typeof options !== "undefined" ) {
        if ( typeof options.parent !== "undefined" ) {
          theParentElement = options.parent;
        }
      }
      self.init( theParentElement );
    }
    self.releaseBackButton = function() {
      _y.UI.backButton.removeListenerForNotification( "backButtonPressed", self.goBack );
    }
    self.overrideSuper( self.class, "destroy", self.destroy );
    self.destroy = function() {
      self.releaseBackButton();
      self.removeListenerForNotification( "viewWasPopped", self.stopGame );
      self.removeListenerForNotification( "viewWasPopped", self.releaseBackButton );
      self.removeListenerForNotification( "viewWasPopped", self.destroy );
      if ( typeof self._tiltWatch !== "undefined" ) {
        navigator.accelerometer.clearWatch( self._tiltWatch );
        self._tiltWatch = undefined;
      }
      self._overlay = null;
      self._backButton = null;
      self._message = null;
      self._leftButton = null;
      self._rightButton = null;
      self._actionButton = null;
      self._actionGroup = null;
      self._canvas = null;
      self._context = null;
      self.super( _className, "destroy" );
    }
    return self;
  };
  /**
   * add translations we need
   */
  _y.addTranslations( {
    "TAPTOSTART": {
      "EN": "Tap to start!"
    },
    "CONTINUE": {
      "EN": "Continue"
    },
    "START": {
      "EN": "Start"
    },
    "TRY_AGAIN": {
      "EN": "Try Again"
    },
    "CRASHED": {
      "EN": "*Crash*"
    },
    "NEXT_LEVEL": {
      "EN": "Level Up!"
    }
  } );
  return GameView;
} );
