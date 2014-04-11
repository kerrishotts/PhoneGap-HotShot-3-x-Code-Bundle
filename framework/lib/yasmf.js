/**
 *
 * YASMF-UTIL (Yet Another Simple Mobile Framework Utilities) provides basic utilities
 * for working on mobile devices.
 *
 * It provides several convenience functions (such as _y.ge) and various modules (such
 * as device, filename, etc).
 *
 * yasmf-util.js
 * @module yasmf-util.js
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

define ( function ( require ) {
  var _y = require('yasmf/util/core');
  _y.datetime = require ('yasmf/util/datetime');
  _y.filename = require ('yasmf/util/filename');
  _y.misc = require ('yasmf/util/misc');
  _y.device = require ('yasmf/util/device');
  _y.BaseObject = require ('yasmf/util/object');
  _y.FileManager = require ('yasmf/util/fileManager');

  _y.UI = require ('yasmf/ui/core');
  _y.UI.event = require ('yasmf/ui/event');
  _y.UI.ViewContainer = require ('yasmf/ui/viewContainer');
  _y.UI.NavigationController = require ('yasmf/ui/navigationController');
  _y.UI.SplitViewController = require ('yasmf/ui/splitViewController');
  _y.UI.TabViewController = require ('yasmf/ui/tabViewController');
  _y.UI.Alert = require ('yasmf/ui/alert');

  return _y;
});

