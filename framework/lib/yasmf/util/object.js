/**
 *
 * # Base Object
 *
 * ## object.js
 *
 * @module object.js
 * @author Kerri Shotts
 * @version 0.4
 * ```
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
 * ```
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
/*global define, console*/

define (
  function () {

    var _className = "BaseObject";
    /**
     * BaseObject is the base object for all complex objects used by YASMF;
     * simpler objects that are properties-only do not inherit from this
     * class.
     *
     * BaseObject provides simple inheritance, but not by using the typical
     * prototypal method. Rather inheritance is formed by object composition
     * where all objects are instances of BaseObject with methods overridden
     * instead. As such, you can *not* use any Javascript type checking to
     * differentiate PKObjects; you should instead use the `class`
     * property.
     *
     * BaseObject provides inheritance to more than just a constructor: any
     * method can be overridden, but it is critical that the super-chain
     * be properly initialized. See the `super` and `overrideSuper`
     * methods for more information.
     *
     * @class BaseObject
     */
    var BaseObject = function ()
    {
      var self=this;

      /**
       *
       * We need a way to provide inheritance. Most methods only provide
       * inheritance across the constructor chain, not across any possible
       * method. But for our purposes, we need to be able to provide for
       * overriding any method (such as drawing, touch responses, etc.),
       * and so we implement inheritance in a different way.
       *
       * First, the _classHierarchy, a private property, provides the
       * inheritance tree. All objects inherit from "BaseObject".
       *
       * @private
       * @property _classHierarchy
       * @type Array
       * @default ["BaseObject"]
       */
      self._classHierarchy = [_className];

      /**
       *
       * Objects are subclassed using this method. The newClass is the
       * unique class name of the object (and should match the class'
       * actual name.
       *
       * @method subclass
       * @param {String} newClass - the new unique class of the object
       */
      self.subclass = function ( newClass )
      {
        self._classHierarchy.push (newClass);
      };

      /**
       *
       * getClass returns the current class of the object. The
       * `class` property can be used as well. Note that there
       * is no `setter` for this property; an object's class
       * can *not* be changed.
       *
       * @method getClass
       * @returns {String} the class of the instance
       *
       */
      self.getClass = function()
      {
        return self._classHierarchy[self._classHierarchy.length-1];
      };
      /**
       *
       * The class of the instance. **Read-only**
       * @property class
       * @type String
       * @readOnly
       */
      Object.defineProperty ( self, "class", { get: self.getClass,
        configurable: false });

      /**
       *
       * Returns the super class for the given class. If the
       * class is not supplied, the class is assumed to be the
       * object's own class.
       *
       * The property "superClass" uses this to return the
       * object's direct superclass, but getSuperClassOfClass
       * can be used to determine superclasses higher up
       * the hierarchy.
       *
       * @method getSuperClassOfClass
       * @param {String} [aClass=currentClass] the class for which you want the super class. If not specified,
       *                                        the instance's class is used.
       * @returns {String} the super-class of the specified class.
       */
      self.getSuperClassOfClass = function(aClass)
      {
        var theClass = aClass || self.class;
        var i = self._classHierarchy.indexOf ( theClass );
        if (i>-1)
        {
          return self._classHierarchy[i-1];
        }
        else
        {
          return null;
        }
      };
      /**
       *
       * The superclass of the instance.
       * @property superClass
       * @type String
       */
      Object.defineProperty ( self, "superClass", { get: self.getSuperClassOfClass,
        configurable: false });

      /**
       *
       * _super is an object that stores overridden functions by class and method
       * name. This is how we get the ability to arbitrarily override any method
       * already present in the superclass.
       *
       * @private
       * @property _super
       * @type Object
       */
      self._super = {};

      /**
       *
       * Must be called prior to defining the overridden function as this moves
       * the original function into the _super object. The functionName must
       * match the name of the method exactly, since there may be a long tree
       * of code that depends on it.
       *
       * @method overrideSuper
       * @param {String} theClass  the class for which the function override is desired
       * @param {String} theFunctionName  the name of the function to override
       * @param {Function} theActualFunction  the actual function (or pointer to function)
       *
       */
      self.overrideSuper = function ( theClass, theFunctionName, theActualFunction )
      {
        var superClass = self.getSuperClassOfClass (theClass);
        if (!self._super[superClass])
        {
          self._super[superClass] = {};
        }
        self._super[superClass][theFunctionName] = theActualFunction;
      };
      /**
       * @method override
       *
       * Overrides an existing function with the same name as `theNewFunction`. Essentially
       * a call to `overrideSuper (self.class, theNewFunction.name, self[theNewFunction.name])`
       * followed by the redefinition of the function.
       *
       * @example
       * ```
       * obj.override ( function initWithOptions ( options )
       *                { ... } );
       * ```
       *
       * @param {Function} theNewFunction - The function to override. Must have the name of the overriding function.
       */
      self.override = function (theNewFunction)
      {
        var theFunctionName = theNewFunction.name;
        if (theFunctionName !== "")
        {
          self.overrideSuper(self.class, theFunctionName, self[theFunctionName]);
          self[theFunctionName] = theNewFunction;
        }
      };

      /**
       *
       * Calls a super function with any number of arguments.
       *
       * @method super
       * @param {String} theClass  the current class instance
       * @param {String} theFunctionName the name of the function to execute
       * @param {Array} [args]  Any number of parameters to pass to the super method
       *
       */
      self.super = function ( theClass, theFunctionName, args )
      {
        var superClass = self.getSuperClassOfClass (theClass);
        if (self._super[superClass])
        {
          if (self._super[superClass][theFunctionName])
          {

            return self._super[superClass][theFunctionName].apply(self, args);
          }
          return null;
        }
        return null;
      };

      /**
       * Category support; for an object to get category support for their class,
       * they must call this method prior to any auto initialization
       *
       * @method _constructObjectCategories
       *
       */
      self._constructObjectCategories = function _constructObjectCategories( pri )
      {
        var priority = BaseObject.ON_CREATE_CATEGORY;
        if (typeof pri !== "undefined")
        {
          priority = pri;
        }
        if (typeof BaseObject._objectCategories[priority][self.class] !== "undefined")
        {
          BaseObject._objectCategories[priority][self.class].forEach(
            function (categoryConstructor)
            {
              try
              {
                categoryConstructor(self);
              }
              catch (e)
              {
                console.log ('Error during category construction: ' + e.message);
              }
            });
        }
      };

      /**
       *
       * initializes the object
       *
       * @method init
       *
       */
      self.init = function ()
      {
        self._constructObjectCategories(BaseObject.ON_INIT_CATEGORY);
        return self;
      };


      /*
       *
       * Objects have some properties that we want all objects to have...
       *
       */

      /**
       * Stores the values of all the tags associated with the instance.
       *
       * @private
       * @property _tag
       * @type Object
       */
      self._tags = {};
      /**
       *
       * Stores the *listeners* for all the tags associated with the instance.
       *
       * @private
       * @property _tagListeners
       * @type Object
       */
      self._tagListeners = {};
      /**
       *
       * Sets the value for a specific tag associated with the instance. If the
       * tag does not exist, it is created.
       *
       * Any listeners attached to the tag via `addTagListenerForKey` will be
       * notified of the change. Listeners are passed three parameters:
       * `self` (the originating instance),
       * `theKey` (the tag being changed),
       * and `theValue` (the value of the tag); the tag is *already* changed
       *
       * @method setTagForKey
       * @param {*} theKey  the name of the tag; "__default" is special and
       *                     refers to the default tag visible via the `tag`
       *                     property.
       * @param {*} theValue  the value to assign to the tag.
       *
       */
      self.setTagForKey = function ( theKey, theValue )
      {
        self._tags[theKey] = theValue;
        var notifyListener = function (theListener, theKey, theValue)
        {
          return function ()
          {
            theListener(self, theKey, theValue);
          };
        };
        if (self._tagListeners[theKey])
        {
          for (var i=0; i< self._tagListeners[theKey].length; i++)
          {
            setTimeout (  notifyListener( self._tagListeners[theKey][i], theKey, theValue ), 0 );
          }
        }
      };
      /**
       *
       * Returns the value for a given key. If the key does not exist, the
       * result is undefined.
       *
       * @method getTagForKey
       * @param {*} theKey  the tag; "__default" is special and refers to
       *                     the default tag visible via the `tag` property.
       * @returns {*} the value of the key
       *
       */
      self.getTagForKey = function ( theKey )
      {
        return self._tags[theKey];
      };
      /**
       *
       * Add a listener to a specific tag. The listener will receive three
       * parameters whenever the tag changes (though they are optional). The tag
       * itself doesn't need to exist in order to assign a listener to it.
       *
       * The first parameter is the object for which the tag has been changed.
       * The second parameter is the tag being changed, and the third parameter
       * is the value of the tag. **Note:** the value has already changed by
       * the time the listener is called.
       *
       * @method addListenerForKey
       * @param {*} theKey The tag for which to add a listener; `__default`
       *                     is special and refers the default tag visible via
       *                     the `tag` property.
       * @param {Function} theListener  the function (or reference) to call
       *                    when the value changes.
       */
      self.addTagListenerForKey = function ( theKey, theListener )
      {
        if (!self._tagListeners[theKey])
        {
          self._tagListeners[theKey] = [];
        }
        self._tagListeners[theKey].push (theListener);
      };
      /**
       *
       * Removes a listener from being notified when a tag changes.
       *
       * @method removeTagListenerForKey
       * @param {*} theKey  the tag from which to remove the listener; `__default`
       *                     is special and refers to the default tag visible via
       *                     the `tag` property.
       * @param {Function} theListener  the function (or reference) to remove.
       *
       */
      self.removeTagListenerForKey = function ( theKey, theListener )
      {
        if (!self._tagListeners[theKey])
        {
          self._tagListeners[theKey] = [];
        }
        var i = self._tagListeners[theKey].indexOf (theListener);
        if (i>-1)
        {
          self._tagListeners[theKey].splice ( i, 1 );
        }
      };
      /**
       *
       * Sets the value for the simple tag (`__default`). Any listeners attached
       * to `__default` will be notified.
       *
       * @method setTag
       * @param {*} theValue  the value for the tag
       *
       */
      self.setTag = function ( theValue )
      {
        self.setTagForKey ( "__default", theValue );
      };
      /**
       *
       * Returns the value for the given tag (`__default`). If the tag has never been
       * set, the result is undefined.
       *
       * @method getTag
       * @returns {*} the value of the tag.
       */
      self.getTag = function ()
      {
        return self.getTagForKey ( "__default" );
      };
      /**
       *
       * The default tag for the instance. Changing the tag itself (not any sub-properties of an object)
       * will notify any listeners attached to `__default`.
       *
       * @property tag
       * @type *
       *
       */
      Object.defineProperty ( self, "tag",
                              { get: self.getTag,
                                set: self.setTag,
                                configurable: true } );
      /**
       *
       * All objects subject notifications for events
       *
       */

      /**
       * Supports notification listeners.
       * @private
       * @property _notificationListeners
       * @type Object
       */
      self._notificationListeners = {};
      /**
       * Adds a listener for a notification. If a notification has not been
       * registered (via `registerNotification`), an error is logged on the console
       * and the function returns without attaching the listener. This means if
       * you aren't watching the console, the function fails nearly silently.
       *
       * > By default, no notifications are registered.
       *
       * @method addListenerForNotification
       * @param {String} theNotification  the name of the notification
       * @param {Function} theListener  the function (or reference) to be called when the
       *                                notification is triggered.
       *
       */
      self.addListenerForNotification = function ( theNotification, theListener )
      {
        if (!self._notificationListeners[theNotification])
        {
          console.log ( theNotification + " has not been registered.");
          return;
        }
        self._notificationListeners[ theNotification ].push (theListener);
        if (self._traceNotifications)
        {
          console.log("Adding listener " + theListener + " for notification " + theNotification);
        }
      };
      /**
       * Removes a listener from a notification. If a notification has not been
       * registered (via `registerNotification`), an error is logged on the console
       * and the function returns without attaching the listener. This means if
       * you aren't watching the console, the function fails nearly silently.
       *
       * > By default, no notifications are registered.
       *
       * @method removeListenerForNotification
       * @param {String} theNotification  the notification
       * @param {Function} theListener  The function or reference to remove
       */

      self.removeListenerForNotification = function (theNotification, theListener)
      {
        if (!self._notificationListeners[theNotification])
        {
          console.log(theNotification + " has not been registered.");
          return;
        }
        var i = self._notificationListeners[theNotification].indexOf(theListener);
        if (self._traceNotifications)
        {
          console.log("Removing listener " + theListener + " (index: " + i + ") from  notification " + theNotification);
        }
        if (i>-1)
        {
          self._notificationListeners[theNotification].splice ( i, 1);
        }
      };
      /**
       * Registers a notification so that listeners can then be attached. Notifications
       * should be registered as soon as possible, otherwise listeners may attempt to
       * attach to a notification that isn't registered.
       *
       * @method registerNotification
       * @param {String} theNotification  the name of the notification.
       * @param {Boolean} async  if true, notifications are sent wrapped in setTimeout
       */
      self.registerNotification = function (theNotification, async)
      {
        if ( typeof self._notificationListeners[ theNotification ] === "undefined")
        {
          self._notificationListeners [ theNotification ] = [];
          self._notificationListeners [ theNotification ]._useAsyncNotifications = (typeof async !== "undefined" ? async : true);
        }
        if (self._traceNotifications)
        {
          console.log("Registering notification " + theNotification);
        }
      };

      self._traceNotifications = false;
      /**
       * Notifies all listeners of a particular notification that the notification
       * has been triggered. If the notification hasn't been registered via
       * `registerNotification`, an error is logged to the console, but the function
       * itself returns silently, so be sure to watch the console for errors.
       *
       * @method notify
       * @param {String} theNotification  the notification to trigger
       * @param {*} [args]  Arguments to pass to the listener; usually an array
       */
      self.notify = function (theNotification, args)
      {
        if (!self._notificationListeners[theNotification])
        {
          console.log(theNotification + " has not been registered.");
          return;
        }
        if (self._traceNotifications)
        {
          console.log("Notifying " + self._notificationListeners[theNotification].length + " listeners for " + theNotification + " ( " + args + " ) ");
        }
        var async = self._notificationListeners[theNotification]._useAsyncNotifications;
        var notifyListener = function (theListener, theNotification, args)
        {
          return function ()
          {
            theListener(self, theNotification, args);
          };
        };
        for (var i = 0; i < self._notificationListeners[theNotification].length; i++)
        {
          if (async)
          {
            setTimeout(notifyListener(self._notificationListeners[theNotification][i], theNotification, args), 0);
          }
          else
          {
            (notifyListener(self._notificationListeners[theNotification][i], theNotification, args))();
          }
        }
      };

      /**
       * @method notifyMostRecent
       *
       * Notifies only the most recent listener of a particular notification that
       * the notification has been triggered. If the notification hasn't been registered
       * via `registerNotification`, an error is logged to the console, but the function
       * itself returns silently.
       *
       * @param {String} theNotification  the specific notification to trigger
       * @param {*} [args]  Arguments to pass to the listener; usually an array
       */
      self.notifyMostRecent = function (theNotification, args)
      {
        if (!self._notificationListeners[theNotification])
        {
          console.log(theNotification + " has not been registered.");
          return;
        }
        if (self._traceNotifications)
        {
          console.log("Notifying " + self._notificationListeners[theNotification].length + " listeners for " + theNotification + " ( " + args + " ) ");
        }
        var async = self._notificationListeners[theNotification]._useAsyncNotifications;
        var i = self._notificationListeners[theNotification].length - 1;
        if (i >= 0)
        {
          if (async) {
            setTimeout(function () {self._notificationListeners[theNotification][i](self, theNotification, args);}, 0);
          }
          else
          {
            self._notificationListeners[theNotification][i](self, theNotification, args);
          }
        }
      };

      /**
       *
       * Defines a property on the object. Essentially shorthand for `Object.defineProperty`. An
       * internal `_propertyName` variable is declared which getters and setters can access.
       *
       * The property can be read-write, read-only, or write-only depending on the values in
       * `propertyOptions.read` and `propertyOptions.write`. The default is read-write.
       *
       * Getters and setters can be provided in one of two ways: they can be automatically
       * discovered by following a specific naming pattern (`getPropertyName`) if
       * `propertyOptions.selfDiscover` is `true` (the default). They can also be explicitly
       * defined by setting `propertyOptions.get` and `propertyOptions.set`.
       *
       * A property does not necessarily need a getter or setter in order to be readable or
       * writable. A basic pattern of setting or returning the private variable is implemented
       * for any property without specific getters and setters but who have indicate that the
       * property is readable or writable.
       *
       * @example
       * ```
       * self.defineProperty ( "someProperty" );        // someProperty, read-write
       * self.defineProperty ( "anotherProperty", { default: 2 } );
       * self.setWidth = function ( newWidth, oldWidth )
       * {
       *    self._width = newWidth;
       *    self.element.style.width = newWidth + "px";
       * }
       * self.defineProperty ( "width" );   // automatically discovers setWidth as the setter.
       * ```
       *
       * @method defineProperty
       * @param {String} propertyName  the name of the property; use camelCase
       * @param {Object} propertyOptions  the various options as described above.
       */
      self.defineProperty = function (propertyName, propertyOptions)
      {
        var fnName = propertyName.substr(0, 1).toUpperCase() + propertyName.substr(1);
        // set the default options and copy the specified options
        var options = {       default: undefined,
          read:                        true,
          write:                       true,
          get:                         null,
          set:                         null,
          selfDiscover:                true};
        for (var property in propertyOptions)
        {
          if (propertyOptions.hasOwnProperty(property))
          {
            options[property] = propertyOptions[property];
          }
        }

        // if get/set are not specified, we'll attempt to self-discover them
        if (options.get === null && options.selfDiscover)
        {
          if (typeof self[ "get" + fnName ] === 'function')
          {
            options.get = self[ "get" + fnName ];
          }
        }

        if (options.set === null && options.selfDiscover)
        {
          if (typeof self[ "set" + fnName ] === 'function')
          {
            options.set = self[ "set" + fnName ];
          }
        }

        // create the private variable
        self["_" + propertyName] = options.default;

        if (!options.read && !options.write)
        {
          return; // not read/write, so nothing more.
        }

        var defPropOptions = { configurable: true };

        if (options.read)
        {
          self["___get" + fnName] = options.get;
          self["__get" + fnName] = function ()
          {
            // if there is a getter, use it
            if (typeof self["___get" + fnName] === 'function')
            {
              return self["___get" + fnName](self["_" + propertyName]);
            }
            // otherwise return the private variable
            else
            {
              return self["_" + propertyName];
            }
          };
          if (typeof self["get" + fnName] === 'undefined')
          {
            self["get" + fnName] = self["__get" + fnName];
          }
          defPropOptions.get = self["__get" + fnName];
        }

        if (options.write)
        {
          self["___set" + fnName] = options.set;
          self["__set" + fnName] = function (v)
          {
            var oldV = self["_" + propertyName];
            if (typeof self["___set" + fnName] === 'function')
            {
              self["___set" + fnName](v, oldV);
            }
            else
            {
              self["_" + propertyName] = v;
            }
          };
          if (typeof self["set" + fnName] === 'undefined')
          {
            self["set" + fnName] = self["__set" + fnName];
          }
          defPropOptions.set = self["__set" + fnName];
        }
        Object.defineProperty(self, propertyName,
                              defPropOptions);
      };

      /**
       * Defines a custom property, which also implements a form of KVO.
       *
       * Any options not specified are defaulted in. The default is for a property
       * to be observable (which fires the default propertyNameChanged notice),
       * read/write with no custom get/set/validate routines, and no default.
       *
       * Observable Properties can have getters, setters, and validators. They can be
       * automatically discovered, assuming they follow the pattern `getObservablePropertyName`,
       * `setObservablePropertyName`, and `validateObservablePropertyName`. They can also be
       * specified explicitly by setting `propertyOptions.get`, `set`, and `validate`.
       *
       * Properties can be read-write, read-only, or write-only. This is controlled by
       * `propertyOptions.read` and `write`. The default is read-write.
       *
       * Properties can have a default value provided as well, specified by setting
       * `propertyOptions.default`.
       *
       * Finally, a notification of the form `propertyNameChanged` is fired if
       * the value changes. If the value does *not* change, the notification is not fired.
       * The name of the notification is controlled by setting `propertyOptions.notification`.
       * If you need a notification to fire when a property is simply set (regardless of the
       * change in value), set `propertyOptions.notifyAlways` to `true`.
       *
       * KVO getters, setters, and validators follow very different patterns than normal
       * property getters and setters.
       *
       * ```
       * self.getObservableWidth = function ( returnValue ) { return returnValue; };
       * self.setObservableWidth = function ( newValue, oldValue ) { return newValue; };
       * self.validateObservableWidth = function ( testValue ) { return testValue!==10; };
       * self.defineObservableProperty ( "width" );
       * ```
       *
       * @method defineObservableProperty
       * @param {String} propertyName The specific property to define
       * @param {Object} propertyOptions the options for this property.
       *
       */
      self.defineObservableProperty = function (propertyName, propertyOptions)
      {
        var fnName = propertyName.substr(0, 1).toUpperCase() + propertyName.substr(1);
        // set the default options and copy the specified options
        var options = {observable: true,
          notification: propertyName + "Changed",
          default:                 undefined,
          read:                    true,
          write:                   true,
          get:                     null,
          validate:                null,
          set:                     null,
          selfDiscover:            true,
          notifyAlways:            false};
        for (var property in propertyOptions)
        {
          if (propertyOptions.hasOwnProperty(property))
          {
            options[property] = propertyOptions[property];
          }
        }

        // if get/set are not specified, we'll attempt to self-discover them
        if (options.get === null && options.selfDiscover)
        {
          if (typeof self[ "getObservable" + fnName ] === 'function')
          {
            options.get = self[ "getObservable" + fnName ];
          }
        }

        if (options.set === null && options.selfDiscover)
        {
          if (typeof self[ "setObservable" + fnName ] === 'function')
          {
            options.set = self[ "setObservable" + fnName ];
          }
        }

        if (options.validate === null && options.selfDiscover)
        {
          if (typeof self[ "validateObservable" + fnName ] === 'function')
          {
            options.validate = self[ "validateObservable" + fnName ];
          }
        }

        // if the property is observable, register its notification
        if (options.observable)
        {
          self.registerNotification(options.notification);
        }

        // create the private variable; __ here to avoid self-defined _
        self["__" + propertyName] = options.default;

        if (!options.read && !options.write)
        {
          return; // not read/write, so nothing more.
        }

        var defPropOptions = { configurable: true };

        if (options.read)
        {
          self["___get" + fnName] = options.get;
          self["__get" + fnName] = function ()
          {
            // if there is a getter, use it
            if (typeof self["___get" + fnName] === 'function')
            {
              return self["___get" + fnName](self["__" + propertyName]);
            }
            // otherwise return the private variable
            else
            {
              return self["__" + propertyName];
            }
          };
          defPropOptions.get = self["__get" + fnName];
        }

        if (options.write)
        {
          self["___validate" + fnName] = options.validate;
          self["___set" + fnName] = options.set;
          self["__set" + fnName] = function (v)
          {
            var oldV = self["__" + propertyName];
            var valid = true;
            if (typeof self["___validate" + fnName] === 'function')
            {
              valid = self["___validate" + fnName](v);
            }
            if (valid)
            {
              if (typeof self["___set" + fnName] === 'function')
              {
                self["__" + propertyName] = self["___set" + fnName](v, oldV);
              }
              else
              {
                self["__" + propertyName] = v;
              }

              if (v !== oldV || options.notifyAlways)
              {
                if (options.observable)
                {
                  self.notify(options.notification,
                              {"new": v, "old": oldV});
                }
              }
            }
          };
          defPropOptions.set = self["__set" + fnName];
        }
        Object.defineProperty(self, propertyName,
                              defPropOptions);
      };

      /**
       * Auto initializes the object based on the arguments passed to the object constructor. Any object
       * that desires to be auto-initializable must perform the following prior to returning themselves:
       *
       * ```
       * self._autoInit.apply (self, arguments);
       * ```
       *
       * Each init must call the super of init, and each init must return self.
       *
       * If the first parameter to _autoInit (and thus to the object constructor) is an object,
       * initWithOptions is called if it exists. Otherwise init is called with all the arguments.
       *
       * If NO arguments are passed to the constructor (and thus to this method), then no
       * auto initialization is performed. If one desires an auto-init on an object that requires
       * no parameters, pass a dummy parameter to ensure init will be called
       *
       * @returns {*}
       * @private
       */
      self._autoInit = function ( )
      {
        if (arguments.length > 0)
        {
          if (arguments.length == 1)
          {
            // chances are this is an initWithOptions, but make sure the incoming parameter is an object
            if (typeof arguments[0] === "object") {
              if (typeof self.initWithOptions !== "undefined" )
              {
                return self.initWithOptions.apply(self, arguments);
              }
              else
              {
                return self.init.apply (self, arguments);
              }
            }
            else {
              return self.init.apply (self,arguments);
            }
          }
          else {
            return self.init.apply (self,arguments);
          }
        }
      };

      /**
       *
       * Readies an object to be destroyed. The base object only clears the notifications and
       * the attached listeners.
       * @method destroy
       */
      self.destroy = function ()
      {
        // clear any listeners.
        self._notificationListeners = {};
        self._tagListeners = {};

        // ready to be destroyed
      };

      // self-categorize
      self._constructObjectCategories();

      // call auto init
      self._autoInit.apply (self, arguments);

      // done
      return self;
    };

    /**
     * Object categories. Of the form:
     *
     * ```
     * { className: [ constructor1, constructor2, ... ], ... }
     * ```
     *
     * Global to the app and library. BaseObject's init() method will call each category in the class hierarchy.
     *
     * @property _objectCategories
     * @type {{}}
     * @private
     */
    BaseObject._objectCategories = [{},{}];
    BaseObject.ON_CREATE_CATEGORY = 0;
    BaseObject.ON_INIT_CATEGORY = 1;
    /**
     * Register a category constructor for a specific class. The function must take `self` as a parameter, and must
     * not assume the presence of any other category
     *
     * The options parameter takes the form:
     *
     * ```
     * { class: class name to register for
     *   method: constructor method
     *   priority: ON_CREATE_CATEGORY or ON_INIT_CATEGORY
     * }
     * ```
     *
     * @method registerCategoryConstructor
     * @param {Object} options
     */
    BaseObject.registerCategoryConstructor = function registerCategoryConstructor( options)
    {
      if (typeof options === "undefined")
      {
        throw new Error( "registerCategoryConstructor requires a class name and a constructor method." );
      }
      if (typeof options.class !== "undefined")
      {
        throw new Error( "registerCategoryConstructor requires options.class" );
      }
      if (typeof options.method !== "undefined")
      {
        throw new Error( "registerCategoryConstructor requires options.method" );
      }
      var className = options.class;
      var method = options.method;
      var priority = BaseObject.ON_CREATE_CATEGORY;
      if (typeof options.priority !== "undefined")
      {
        priority = options.priority;
      }
      if ( typeof BaseObject._objectCategories[priority][className] === "undefined" )
      {
        BaseObject._objectCategories[priority][className] = [];
      }
      BaseObject._objectCategories[priority][className].push (categoryConstructor);
    };

    BaseObject.meta = { version: '00.04.900',
                        class: _className,
                        autoInitializable: true,
                        categorizable: true
                      };

    return BaseObject;

  });