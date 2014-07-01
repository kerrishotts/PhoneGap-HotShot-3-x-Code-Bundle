/**
 *
 * # YASMF-Next (Yet Another Simple Mobile Framework Next Gen)
 *
 * YASMF-Next is the successor to the YASMF framework. While that framework was useful
 * and usable even in a production environment, as my experience has grown, it became
 * necessary to re-architect the entire framework in order to provide a modern
 * mobile framework.
 *
 * YASMF-Next is the result. It's young, under active development, and not at all
 * compatible with YASMF v0.2. It uses all sorts of more modern technologies such as
 * SASS for CSS styling, AMD, etc.
 *
 * YASMF-Next is intended to be a simple and fast framework for mobile and desktop
 * devices. It provides several utility functions and also provides a UI framework.
 *
 * @module _y
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
define( function( require ) {
  var _y = require( 'yasmf/util/core' );
  _y.datetime = require( 'yasmf/util/datetime' );
  _y.filename = require( 'yasmf/util/filename' );
  _y.misc = require( 'yasmf/util/misc' );
  _y.device = require( 'yasmf/util/device' );
  _y.BaseObject = require( 'yasmf/util/object' );
  _y.FileManager = require( 'yasmf/util/fileManager' );
  _y.UI = require( 'yasmf/ui/core' );
  _y.UI.event = require( 'yasmf/ui/event' );
  _y.UI.ViewContainer = require( 'yasmf/ui/viewContainer' );
  _y.UI.NavigationController = require( 'yasmf/ui/navigationController' );
  _y.UI.SplitViewController = require( 'yasmf/ui/splitViewController' );
  _y.UI.TabViewController = require( 'yasmf/ui/tabViewController' );
  _y.UI.Alert = require( 'yasmf/ui/alert' );
  return _y;
} );
