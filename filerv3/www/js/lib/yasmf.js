(function(global, define) {
  var globalDefine = global.define;
/**
 * almond 0.2.0 Copyright (c) 2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        aps = [].slice;

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);

                name = baseParts.concat(name.split("/"));

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (waiting.hasOwnProperty(name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!defined.hasOwnProperty(name) && !defining.hasOwnProperty(name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (typeof callback === 'function') {

            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (defined.hasOwnProperty(depName) ||
                           waiting.hasOwnProperty(depName) ||
                           defining.hasOwnProperty(depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback.apply(defined[name], args);

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 15);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        config = cfg;
        return req;
    };

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        waiting[name] = [name, deps, callback];
    };

    define.amd = {
        jQuery: true
    };
}());
define("../vendor/almond", function(){});

/*!
 * Globalize
 *
 * http://github.com/jquery/globalize
 *
 * Copyright Software Freedom Conservancy, Inc.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 */

(function( window, undefined ) {

var Globalize,
	// private variables
	regexHex,
	regexInfinity,
	regexParseFloat,
	regexTrim,
	// private JavaScript utility functions
	arrayIndexOf,
	endsWith,
	extend,
	isArray,
	isFunction,
	isObject,
	startsWith,
	trim,
	truncate,
	zeroPad,
	// private Globalization utility functions
	appendPreOrPostMatch,
	expandFormat,
	formatDate,
	formatNumber,
	getTokenRegExp,
	getEra,
	getEraYear,
	parseExact,
	parseNegativePattern;

// Global variable (Globalize) or CommonJS module (globalize)
Globalize = function( cultureSelector ) {
	return new Globalize.prototype.init( cultureSelector );
};

if ( typeof require !== "undefined" &&
	typeof exports !== "undefined" &&
	typeof module !== "undefined" ) {
	// Assume CommonJS
	module.exports = Globalize;
} else {
	// Export as global variable
	window.Globalize = Globalize;
}

Globalize.cultures = {};

Globalize.prototype = {
	constructor: Globalize,
	init: function( cultureSelector ) {
		this.cultures = Globalize.cultures;
		this.cultureSelector = cultureSelector;

		return this;
	}
};
Globalize.prototype.init.prototype = Globalize.prototype;

// 1. When defining a culture, all fields are required except the ones stated as optional.
// 2. Each culture should have a ".calendars" object with at least one calendar named "standard"
//    which serves as the default calendar in use by that culture.
// 3. Each culture should have a ".calendar" object which is the current calendar being used,
//    it may be dynamically changed at any time to one of the calendars in ".calendars".
Globalize.cultures[ "default" ] = {
	// A unique name for the culture in the form <language code>-<country/region code>
	name: "en",
	// the name of the culture in the english language
	englishName: "English",
	// the name of the culture in its own language
	nativeName: "English",
	// whether the culture uses right-to-left text
	isRTL: false,
	// "language" is used for so-called "specific" cultures.
	// For example, the culture "es-CL" means "Spanish, in Chili".
	// It represents the Spanish-speaking culture as it is in Chili,
	// which might have different formatting rules or even translations
	// than Spanish in Spain. A "neutral" culture is one that is not
	// specific to a region. For example, the culture "es" is the generic
	// Spanish culture, which may be a more generalized version of the language
	// that may or may not be what a specific culture expects.
	// For a specific culture like "es-CL", the "language" field refers to the
	// neutral, generic culture information for the language it is using.
	// This is not always a simple matter of the string before the dash.
	// For example, the "zh-Hans" culture is netural (Simplified Chinese).
	// And the "zh-SG" culture is Simplified Chinese in Singapore, whose lanugage
	// field is "zh-CHS", not "zh".
	// This field should be used to navigate from a specific culture to it's
	// more general, neutral culture. If a culture is already as general as it
	// can get, the language may refer to itself.
	language: "en",
	// numberFormat defines general number formatting rules, like the digits in
	// each grouping, the group separator, and how negative numbers are displayed.
	numberFormat: {
		// [negativePattern]
		// Note, numberFormat.pattern has no "positivePattern" unlike percent and currency,
		// but is still defined as an array for consistency with them.
		//   negativePattern: one of "(n)|-n|- n|n-|n -"
		pattern: [ "-n" ],
		// number of decimal places normally shown
		decimals: 2,
		// string that separates number groups, as in 1,000,000
		",": ",",
		// string that separates a number from the fractional portion, as in 1.99
		".": ".",
		// array of numbers indicating the size of each number group.
		// TODO: more detailed description and example
		groupSizes: [ 3 ],
		// symbol used for positive numbers
		"+": "+",
		// symbol used for negative numbers
		"-": "-",
		// symbol used for NaN (Not-A-Number)
		"NaN": "NaN",
		// symbol used for Negative Infinity
		negativeInfinity: "-Infinity",
		// symbol used for Positive Infinity
		positiveInfinity: "Infinity",
		percent: {
			// [negativePattern, positivePattern]
			//   negativePattern: one of "-n %|-n%|-%n|%-n|%n-|n-%|n%-|-% n|n %-|% n-|% -n|n- %"
			//   positivePattern: one of "n %|n%|%n|% n"
			pattern: [ "-n %", "n %" ],
			// number of decimal places normally shown
			decimals: 2,
			// array of numbers indicating the size of each number group.
			// TODO: more detailed description and example
			groupSizes: [ 3 ],
			// string that separates number groups, as in 1,000,000
			",": ",",
			// string that separates a number from the fractional portion, as in 1.99
			".": ".",
			// symbol used to represent a percentage
			symbol: "%"
		},
		currency: {
			// [negativePattern, positivePattern]
			//   negativePattern: one of "($n)|-$n|$-n|$n-|(n$)|-n$|n-$|n$-|-n $|-$ n|n $-|$ n-|$ -n|n- $|($ n)|(n $)"
			//   positivePattern: one of "$n|n$|$ n|n $"
			pattern: [ "($n)", "$n" ],
			// number of decimal places normally shown
			decimals: 2,
			// array of numbers indicating the size of each number group.
			// TODO: more detailed description and example
			groupSizes: [ 3 ],
			// string that separates number groups, as in 1,000,000
			",": ",",
			// string that separates a number from the fractional portion, as in 1.99
			".": ".",
			// symbol used to represent currency
			symbol: "$"
		}
	},
	// calendars defines all the possible calendars used by this culture.
	// There should be at least one defined with name "standard", and is the default
	// calendar used by the culture.
	// A calendar contains information about how dates are formatted, information about
	// the calendar's eras, a standard set of the date formats,
	// translations for day and month names, and if the calendar is not based on the Gregorian
	// calendar, conversion functions to and from the Gregorian calendar.
	calendars: {
		standard: {
			// name that identifies the type of calendar this is
			name: "Gregorian_USEnglish",
			// separator of parts of a date (e.g. "/" in 11/05/1955)
			"/": "/",
			// separator of parts of a time (e.g. ":" in 05:44 PM)
			":": ":",
			// the first day of the week (0 = Sunday, 1 = Monday, etc)
			firstDay: 0,
			days: {
				// full day names
				names: [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" ],
				// abbreviated day names
				namesAbbr: [ "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" ],
				// shortest day names
				namesShort: [ "Su", "Mo", "Tu", "We", "Th", "Fr", "Sa" ]
			},
			months: {
				// full month names (13 months for lunar calendards -- 13th month should be "" if not lunar)
				names: [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December", "" ],
				// abbreviated month names
				namesAbbr: [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "" ]
			},
			// AM and PM designators in one of these forms:
			// The usual view, and the upper and lower case versions
			//   [ standard, lowercase, uppercase ]
			// The culture does not use AM or PM (likely all standard date formats use 24 hour time)
			//   null
			AM: [ "AM", "am", "AM" ],
			PM: [ "PM", "pm", "PM" ],
			eras: [
				// eras in reverse chronological order.
				// name: the name of the era in this culture (e.g. A.D., C.E.)
				// start: when the era starts in ticks (gregorian, gmt), null if it is the earliest supported era.
				// offset: offset in years from gregorian calendar
				{
					"name": "A.D.",
					"start": null,
					"offset": 0
				}
			],
			// when a two digit year is given, it will never be parsed as a four digit
			// year greater than this year (in the appropriate era for the culture)
			// Set it as a full year (e.g. 2029) or use an offset format starting from
			// the current year: "+19" would correspond to 2029 if the current year 2010.
			twoDigitYearMax: 2029,
			// set of predefined date and time patterns used by the culture
			// these represent the format someone in this culture would expect
			// to see given the portions of the date that are shown.
			patterns: {
				// short date pattern
				d: "M/d/yyyy",
				// long date pattern
				D: "dddd, MMMM dd, yyyy",
				// short time pattern
				t: "h:mm tt",
				// long time pattern
				T: "h:mm:ss tt",
				// long date, short time pattern
				f: "dddd, MMMM dd, yyyy h:mm tt",
				// long date, long time pattern
				F: "dddd, MMMM dd, yyyy h:mm:ss tt",
				// month/day pattern
				M: "MMMM dd",
				// month/year pattern
				Y: "yyyy MMMM",
				// S is a sortable format that does not vary by culture
				S: "yyyy\u0027-\u0027MM\u0027-\u0027dd\u0027T\u0027HH\u0027:\u0027mm\u0027:\u0027ss"
			}
			// optional fields for each calendar:
			/*
			monthsGenitive:
				Same as months but used when the day preceeds the month.
				Omit if the culture has no genitive distinction in month names.
				For an explaination of genitive months, see http://blogs.msdn.com/michkap/archive/2004/12/25/332259.aspx
			convert:
				Allows for the support of non-gregorian based calendars. This convert object is used to
				to convert a date to and from a gregorian calendar date to handle parsing and formatting.
				The two functions:
					fromGregorian( date )
						Given the date as a parameter, return an array with parts [ year, month, day ]
						corresponding to the non-gregorian based year, month, and day for the calendar.
					toGregorian( year, month, day )
						Given the non-gregorian year, month, and day, return a new Date() object
						set to the corresponding date in the gregorian calendar.
			*/
		}
	},
	// For localized strings
	messages: {}
};

Globalize.cultures[ "default" ].calendar = Globalize.cultures[ "default" ].calendars.standard;

Globalize.cultures.en = Globalize.cultures[ "default" ];

Globalize.cultureSelector = "en";

//
// private variables
//

regexHex = /^0x[a-f0-9]+$/i;
regexInfinity = /^[+\-]?infinity$/i;
regexParseFloat = /^[+\-]?\d*\.?\d*(e[+\-]?\d+)?$/;
regexTrim = /^\s+|\s+$/g;

//
// private JavaScript utility functions
//

arrayIndexOf = function( array, item ) {
	if ( array.indexOf ) {
		return array.indexOf( item );
	}
	for ( var i = 0, length = array.length; i < length; i++ ) {
		if ( array[i] === item ) {
			return i;
		}
	}
	return -1;
};

endsWith = function( value, pattern ) {
	return value.substr( value.length - pattern.length ) === pattern;
};

extend = function() {
	var options, name, src, copy, copyIsArray, clone,
		target = arguments[0] || {},
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	if ( typeof target === "boolean" ) {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	}

	// Handle case when target is a string or something (possible in deep copy)
	if ( typeof target !== "object" && !isFunction(target) ) {
		target = {};
	}

	for ( ; i < length; i++ ) {
		// Only deal with non-null/undefined values
		if ( (options = arguments[ i ]) != null ) {
			// Extend the base object
			for ( name in options ) {
				src = target[ name ];
				copy = options[ name ];

				// Prevent never-ending loop
				if ( target === copy ) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if ( deep && copy && ( isObject(copy) || (copyIsArray = isArray(copy)) ) ) {
					if ( copyIsArray ) {
						copyIsArray = false;
						clone = src && isArray(src) ? src : [];

					} else {
						clone = src && isObject(src) ? src : {};
					}

					// Never move original objects, clone them
					target[ name ] = extend( deep, clone, copy );

				// Don't bring in undefined values
				} else if ( copy !== undefined ) {
					target[ name ] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};

isArray = Array.isArray || function( obj ) {
	return Object.prototype.toString.call( obj ) === "[object Array]";
};

isFunction = function( obj ) {
	return Object.prototype.toString.call( obj ) === "[object Function]";
};

isObject = function( obj ) {
	return Object.prototype.toString.call( obj ) === "[object Object]";
};

startsWith = function( value, pattern ) {
	return value.indexOf( pattern ) === 0;
};

trim = function( value ) {
	return ( value + "" ).replace( regexTrim, "" );
};

truncate = function( value ) {
	if ( isNaN( value ) ) {
		return NaN;
	}
	return Math[ value < 0 ? "ceil" : "floor" ]( value );
};

zeroPad = function( str, count, left ) {
	var l;
	for ( l = str.length; l < count; l += 1 ) {
		str = ( left ? ("0" + str) : (str + "0") );
	}
	return str;
};

//
// private Globalization utility functions
//

appendPreOrPostMatch = function( preMatch, strings ) {
	// appends pre- and post- token match strings while removing escaped characters.
	// Returns a single quote count which is used to determine if the token occurs
	// in a string literal.
	var quoteCount = 0,
		escaped = false;
	for ( var i = 0, il = preMatch.length; i < il; i++ ) {
		var c = preMatch.charAt( i );
		switch ( c ) {
			case "\'":
				if ( escaped ) {
					strings.push( "\'" );
				}
				else {
					quoteCount++;
				}
				escaped = false;
				break;
			case "\\":
				if ( escaped ) {
					strings.push( "\\" );
				}
				escaped = !escaped;
				break;
			default:
				strings.push( c );
				escaped = false;
				break;
		}
	}
	return quoteCount;
};

expandFormat = function( cal, format ) {
	// expands unspecified or single character date formats into the full pattern.
	format = format || "F";
	var pattern,
		patterns = cal.patterns,
		len = format.length;
	if ( len === 1 ) {
		pattern = patterns[ format ];
		if ( !pattern ) {
			throw "Invalid date format string \'" + format + "\'.";
		}
		format = pattern;
	}
	else if ( len === 2 && format.charAt(0) === "%" ) {
		// %X escape format -- intended as a custom format string that is only one character, not a built-in format.
		format = format.charAt( 1 );
	}
	return format;
};

formatDate = function( value, format, culture ) {
	var cal = culture.calendar,
		convert = cal.convert,
		ret;

	if ( !format || !format.length || format === "i" ) {
		if ( culture && culture.name.length ) {
			if ( convert ) {
				// non-gregorian calendar, so we cannot use built-in toLocaleString()
				ret = formatDate( value, cal.patterns.F, culture );
			}
			else {
				var eraDate = new Date( value.getTime() ),
					era = getEra( value, cal.eras );
				eraDate.setFullYear( getEraYear(value, cal, era) );
				ret = eraDate.toLocaleString();
			}
		}
		else {
			ret = value.toString();
		}
		return ret;
	}

	var eras = cal.eras,
		sortable = format === "s";
	format = expandFormat( cal, format );

	// Start with an empty string
	ret = [];
	var hour,
		zeros = [ "0", "00", "000" ],
		foundDay,
		checkedDay,
		dayPartRegExp = /([^d]|^)(d|dd)([^d]|$)/g,
		quoteCount = 0,
		tokenRegExp = getTokenRegExp(),
		converted;

	function padZeros( num, c ) {
		var r, s = num + "";
		if ( c > 1 && s.length < c ) {
			r = ( zeros[c - 2] + s);
			return r.substr( r.length - c, c );
		}
		else {
			r = s;
		}
		return r;
	}

	function hasDay() {
		if ( foundDay || checkedDay ) {
			return foundDay;
		}
		foundDay = dayPartRegExp.test( format );
		checkedDay = true;
		return foundDay;
	}

	function getPart( date, part ) {
		if ( converted ) {
			return converted[ part ];
		}
		switch ( part ) {
			case 0:
				return date.getFullYear();
			case 1:
				return date.getMonth();
			case 2:
				return date.getDate();
			default:
				throw "Invalid part value " + part;
		}
	}

	if ( !sortable && convert ) {
		converted = convert.fromGregorian( value );
	}

	for ( ; ; ) {
		// Save the current index
		var index = tokenRegExp.lastIndex,
			// Look for the next pattern
			ar = tokenRegExp.exec( format );

		// Append the text before the pattern (or the end of the string if not found)
		var preMatch = format.slice( index, ar ? ar.index : format.length );
		quoteCount += appendPreOrPostMatch( preMatch, ret );

		if ( !ar ) {
			break;
		}

		// do not replace any matches that occur inside a string literal.
		if ( quoteCount % 2 ) {
			ret.push( ar[0] );
			continue;
		}

		var current = ar[ 0 ],
			clength = current.length;

		switch ( current ) {
			case "ddd":
				//Day of the week, as a three-letter abbreviation
			case "dddd":
				// Day of the week, using the full name
				var names = ( clength === 3 ) ? cal.days.namesAbbr : cal.days.names;
				ret.push( names[value.getDay()] );
				break;
			case "d":
				// Day of month, without leading zero for single-digit days
			case "dd":
				// Day of month, with leading zero for single-digit days
				foundDay = true;
				ret.push(
					padZeros( getPart(value, 2), clength )
				);
				break;
			case "MMM":
				// Month, as a three-letter abbreviation
			case "MMMM":
				// Month, using the full name
				var part = getPart( value, 1 );
				ret.push(
					( cal.monthsGenitive && hasDay() ) ?
					( cal.monthsGenitive[ clength === 3 ? "namesAbbr" : "names" ][ part ] ) :
					( cal.months[ clength === 3 ? "namesAbbr" : "names" ][ part ] )
				);
				break;
			case "M":
				// Month, as digits, with no leading zero for single-digit months
			case "MM":
				// Month, as digits, with leading zero for single-digit months
				ret.push(
					padZeros( getPart(value, 1) + 1, clength )
				);
				break;
			case "y":
				// Year, as two digits, but with no leading zero for years less than 10
			case "yy":
				// Year, as two digits, with leading zero for years less than 10
			case "yyyy":
				// Year represented by four full digits
				part = converted ? converted[ 0 ] : getEraYear( value, cal, getEra(value, eras), sortable );
				if ( clength < 4 ) {
					part = part % 100;
				}
				ret.push(
					padZeros( part, clength )
				);
				break;
			case "h":
				// Hours with no leading zero for single-digit hours, using 12-hour clock
			case "hh":
				// Hours with leading zero for single-digit hours, using 12-hour clock
				hour = value.getHours() % 12;
				if ( hour === 0 ) hour = 12;
				ret.push(
					padZeros( hour, clength )
				);
				break;
			case "H":
				// Hours with no leading zero for single-digit hours, using 24-hour clock
			case "HH":
				// Hours with leading zero for single-digit hours, using 24-hour clock
				ret.push(
					padZeros( value.getHours(), clength )
				);
				break;
			case "m":
				// Minutes with no leading zero for single-digit minutes
			case "mm":
				// Minutes with leading zero for single-digit minutes
				ret.push(
					padZeros( value.getMinutes(), clength )
				);
				break;
			case "s":
				// Seconds with no leading zero for single-digit seconds
			case "ss":
				// Seconds with leading zero for single-digit seconds
				ret.push(
					padZeros( value.getSeconds(), clength )
				);
				break;
			case "t":
				// One character am/pm indicator ("a" or "p")
			case "tt":
				// Multicharacter am/pm indicator
				part = value.getHours() < 12 ? ( cal.AM ? cal.AM[0] : " " ) : ( cal.PM ? cal.PM[0] : " " );
				ret.push( clength === 1 ? part.charAt(0) : part );
				break;
			case "f":
				// Deciseconds
			case "ff":
				// Centiseconds
			case "fff":
				// Milliseconds
				ret.push(
					padZeros( value.getMilliseconds(), 3 ).substr( 0, clength )
				);
				break;
			case "z":
				// Time zone offset, no leading zero
			case "zz":
				// Time zone offset with leading zero
				hour = value.getTimezoneOffset() / 60;
				ret.push(
					( hour <= 0 ? "+" : "-" ) + padZeros( Math.floor(Math.abs(hour)), clength )
				);
				break;
			case "zzz":
				// Time zone offset with leading zero
				hour = value.getTimezoneOffset() / 60;
				ret.push(
					( hour <= 0 ? "+" : "-" ) + padZeros( Math.floor(Math.abs(hour)), 2 ) +
					// Hard coded ":" separator, rather than using cal.TimeSeparator
					// Repeated here for consistency, plus ":" was already assumed in date parsing.
					":" + padZeros( Math.abs(value.getTimezoneOffset() % 60), 2 )
				);
				break;
			case "g":
			case "gg":
				if ( cal.eras ) {
					ret.push(
						cal.eras[ getEra(value, eras) ].name
					);
				}
				break;
		case "/":
			ret.push( cal["/"] );
			break;
		default:
			throw "Invalid date format pattern \'" + current + "\'.";
		}
	}
	return ret.join( "" );
};

// formatNumber
(function() {
	var expandNumber;

	expandNumber = function( number, precision, formatInfo ) {
		var groupSizes = formatInfo.groupSizes,
			curSize = groupSizes[ 0 ],
			curGroupIndex = 1,
			factor = Math.pow( 10, precision ),
			rounded = Math.round( number * factor ) / factor;

		if ( !isFinite(rounded) ) {
			rounded = number;
		}
		number = rounded;

		var numberString = number+"",
			right = "",
			split = numberString.split( /e/i ),
			exponent = split.length > 1 ? parseInt( split[1], 10 ) : 0;
		numberString = split[ 0 ];
		split = numberString.split( "." );
		numberString = split[ 0 ];
		right = split.length > 1 ? split[ 1 ] : "";

		var l;
		if ( exponent > 0 ) {
			right = zeroPad( right, exponent, false );
			numberString += right.slice( 0, exponent );
			right = right.substr( exponent );
		}
		else if ( exponent < 0 ) {
			exponent = -exponent;
			numberString = zeroPad( numberString, exponent + 1, true );
			right = numberString.slice( -exponent, numberString.length ) + right;
			numberString = numberString.slice( 0, -exponent );
		}

		if ( precision > 0 ) {
			right = formatInfo[ "." ] +
				( (right.length > precision) ? right.slice(0, precision) : zeroPad(right, precision) );
		}
		else {
			right = "";
		}

		var stringIndex = numberString.length - 1,
			sep = formatInfo[ "," ],
			ret = "";

		while ( stringIndex >= 0 ) {
			if ( curSize === 0 || curSize > stringIndex ) {
				return numberString.slice( 0, stringIndex + 1 ) + ( ret.length ? (sep + ret + right) : right );
			}
			ret = numberString.slice( stringIndex - curSize + 1, stringIndex + 1 ) + ( ret.length ? (sep + ret) : "" );

			stringIndex -= curSize;

			if ( curGroupIndex < groupSizes.length ) {
				curSize = groupSizes[ curGroupIndex ];
				curGroupIndex++;
			}
		}

		return numberString.slice( 0, stringIndex + 1 ) + sep + ret + right;
	};

	formatNumber = function( value, format, culture ) {
		if ( !isFinite(value) ) {
			if ( value === Infinity ) {
				return culture.numberFormat.positiveInfinity;
			}
			if ( value === -Infinity ) {
				return culture.numberFormat.negativeInfinity;
			}
			return culture.numberFormat[ "NaN" ];
		}
		if ( !format || format === "i" ) {
			return culture.name.length ? value.toLocaleString() : value.toString();
		}
		format = format || "D";

		var nf = culture.numberFormat,
			number = Math.abs( value ),
			precision = -1,
			pattern;
		if ( format.length > 1 ) precision = parseInt( format.slice(1), 10 );

		var current = format.charAt( 0 ).toUpperCase(),
			formatInfo;

		switch ( current ) {
			case "D":
				pattern = "n";
				number = truncate( number );
				if ( precision !== -1 ) {
					number = zeroPad( "" + number, precision, true );
				}
				if ( value < 0 ) number = "-" + number;
				break;
			case "N":
				formatInfo = nf;
				/* falls through */
			case "C":
				formatInfo = formatInfo || nf.currency;
				/* falls through */
			case "P":
				formatInfo = formatInfo || nf.percent;
				pattern = value < 0 ? formatInfo.pattern[ 0 ] : ( formatInfo.pattern[1] || "n" );
				if ( precision === -1 ) precision = formatInfo.decimals;
				number = expandNumber( number * (current === "P" ? 100 : 1), precision, formatInfo );
				break;
			default:
				throw "Bad number format specifier: " + current;
		}

		var patternParts = /n|\$|-|%/g,
			ret = "";
		for ( ; ; ) {
			var index = patternParts.lastIndex,
				ar = patternParts.exec( pattern );

			ret += pattern.slice( index, ar ? ar.index : pattern.length );

			if ( !ar ) {
				break;
			}

			switch ( ar[0] ) {
				case "n":
					ret += number;
					break;
				case "$":
					ret += nf.currency.symbol;
					break;
				case "-":
					// don't make 0 negative
					if ( /[1-9]/.test(number) ) {
						ret += nf[ "-" ];
					}
					break;
				case "%":
					ret += nf.percent.symbol;
					break;
			}
		}

		return ret;
	};

}());

getTokenRegExp = function() {
	// regular expression for matching date and time tokens in format strings.
	return (/\/|dddd|ddd|dd|d|MMMM|MMM|MM|M|yyyy|yy|y|hh|h|HH|H|mm|m|ss|s|tt|t|fff|ff|f|zzz|zz|z|gg|g/g);
};

getEra = function( date, eras ) {
	if ( !eras ) return 0;
	var start, ticks = date.getTime();
	for ( var i = 0, l = eras.length; i < l; i++ ) {
		start = eras[ i ].start;
		if ( start === null || ticks >= start ) {
			return i;
		}
	}
	return 0;
};

getEraYear = function( date, cal, era, sortable ) {
	var year = date.getFullYear();
	if ( !sortable && cal.eras ) {
		// convert normal gregorian year to era-shifted gregorian
		// year by subtracting the era offset
		year -= cal.eras[ era ].offset;
	}
	return year;
};

// parseExact
(function() {
	var expandYear,
		getDayIndex,
		getMonthIndex,
		getParseRegExp,
		outOfRange,
		toUpper,
		toUpperArray;

	expandYear = function( cal, year ) {
		// expands 2-digit year into 4 digits.
		if ( year < 100 ) {
			var now = new Date(),
				era = getEra( now ),
				curr = getEraYear( now, cal, era ),
				twoDigitYearMax = cal.twoDigitYearMax;
			twoDigitYearMax = typeof twoDigitYearMax === "string" ? new Date().getFullYear() % 100 + parseInt( twoDigitYearMax, 10 ) : twoDigitYearMax;
			year += curr - ( curr % 100 );
			if ( year > twoDigitYearMax ) {
				year -= 100;
			}
		}
		return year;
	};

	getDayIndex = function	( cal, value, abbr ) {
		var ret,
			days = cal.days,
			upperDays = cal._upperDays;
		if ( !upperDays ) {
			cal._upperDays = upperDays = [
				toUpperArray( days.names ),
				toUpperArray( days.namesAbbr ),
				toUpperArray( days.namesShort )
			];
		}
		value = toUpper( value );
		if ( abbr ) {
			ret = arrayIndexOf( upperDays[1], value );
			if ( ret === -1 ) {
				ret = arrayIndexOf( upperDays[2], value );
			}
		}
		else {
			ret = arrayIndexOf( upperDays[0], value );
		}
		return ret;
	};

	getMonthIndex = function( cal, value, abbr ) {
		var months = cal.months,
			monthsGen = cal.monthsGenitive || cal.months,
			upperMonths = cal._upperMonths,
			upperMonthsGen = cal._upperMonthsGen;
		if ( !upperMonths ) {
			cal._upperMonths = upperMonths = [
				toUpperArray( months.names ),
				toUpperArray( months.namesAbbr )
			];
			cal._upperMonthsGen = upperMonthsGen = [
				toUpperArray( monthsGen.names ),
				toUpperArray( monthsGen.namesAbbr )
			];
		}
		value = toUpper( value );
		var i = arrayIndexOf( abbr ? upperMonths[1] : upperMonths[0], value );
		if ( i < 0 ) {
			i = arrayIndexOf( abbr ? upperMonthsGen[1] : upperMonthsGen[0], value );
		}
		return i;
	};

	getParseRegExp = function( cal, format ) {
		// converts a format string into a regular expression with groups that
		// can be used to extract date fields from a date string.
		// check for a cached parse regex.
		var re = cal._parseRegExp;
		if ( !re ) {
			cal._parseRegExp = re = {};
		}
		else {
			var reFormat = re[ format ];
			if ( reFormat ) {
				return reFormat;
			}
		}

		// expand single digit formats, then escape regular expression characters.
		var expFormat = expandFormat( cal, format ).replace( /([\^\$\.\*\+\?\|\[\]\(\)\{\}])/g, "\\\\$1" ),
			regexp = [ "^" ],
			groups = [],
			index = 0,
			quoteCount = 0,
			tokenRegExp = getTokenRegExp(),
			match;

		// iterate through each date token found.
		while ( (match = tokenRegExp.exec(expFormat)) !== null ) {
			var preMatch = expFormat.slice( index, match.index );
			index = tokenRegExp.lastIndex;

			// don't replace any matches that occur inside a string literal.
			quoteCount += appendPreOrPostMatch( preMatch, regexp );
			if ( quoteCount % 2 ) {
				regexp.push( match[0] );
				continue;
			}

			// add a regex group for the token.
			var m = match[ 0 ],
				len = m.length,
				add;
			switch ( m ) {
				case "dddd": case "ddd":
				case "MMMM": case "MMM":
				case "gg": case "g":
					add = "(\\D+)";
					break;
				case "tt": case "t":
					add = "(\\D*)";
					break;
				case "yyyy":
				case "fff":
				case "ff":
				case "f":
					add = "(\\d{" + len + "})";
					break;
				case "dd": case "d":
				case "MM": case "M":
				case "yy": case "y":
				case "HH": case "H":
				case "hh": case "h":
				case "mm": case "m":
				case "ss": case "s":
					add = "(\\d\\d?)";
					break;
				case "zzz":
					add = "([+-]?\\d\\d?:\\d{2})";
					break;
				case "zz": case "z":
					add = "([+-]?\\d\\d?)";
					break;
				case "/":
					add = "(\\/)";
					break;
				default:
					throw "Invalid date format pattern \'" + m + "\'.";
			}
			if ( add ) {
				regexp.push( add );
			}
			groups.push( match[0] );
		}
		appendPreOrPostMatch( expFormat.slice(index), regexp );
		regexp.push( "$" );

		// allow whitespace to differ when matching formats.
		var regexpStr = regexp.join( "" ).replace( /\s+/g, "\\s+" ),
			parseRegExp = { "regExp": regexpStr, "groups": groups };

		// cache the regex for this format.
		return re[ format ] = parseRegExp;
	};

	outOfRange = function( value, low, high ) {
		return value < low || value > high;
	};

	toUpper = function( value ) {
		// "he-IL" has non-breaking space in weekday names.
		return value.split( "\u00A0" ).join( " " ).toUpperCase();
	};

	toUpperArray = function( arr ) {
		var results = [];
		for ( var i = 0, l = arr.length; i < l; i++ ) {
			results[ i ] = toUpper( arr[i] );
		}
		return results;
	};

	parseExact = function( value, format, culture ) {
		// try to parse the date string by matching against the format string
		// while using the specified culture for date field names.
		value = trim( value );
		var cal = culture.calendar,
			// convert date formats into regular expressions with groupings.
			// use the regexp to determine the input format and extract the date fields.
			parseInfo = getParseRegExp( cal, format ),
			match = new RegExp( parseInfo.regExp ).exec( value );
		if ( match === null ) {
			return null;
		}
		// found a date format that matches the input.
		var groups = parseInfo.groups,
			era = null, year = null, month = null, date = null, weekDay = null,
			hour = 0, hourOffset, min = 0, sec = 0, msec = 0, tzMinOffset = null,
			pmHour = false;
		// iterate the format groups to extract and set the date fields.
		for ( var j = 0, jl = groups.length; j < jl; j++ ) {
			var matchGroup = match[ j + 1 ];
			if ( matchGroup ) {
				var current = groups[ j ],
					clength = current.length,
					matchInt = parseInt( matchGroup, 10 );
				switch ( current ) {
					case "dd": case "d":
						// Day of month.
						date = matchInt;
						// check that date is generally in valid range, also checking overflow below.
						if ( outOfRange(date, 1, 31) ) return null;
						break;
					case "MMM": case "MMMM":
						month = getMonthIndex( cal, matchGroup, clength === 3 );
						if ( outOfRange(month, 0, 11) ) return null;
						break;
					case "M": case "MM":
						// Month.
						month = matchInt - 1;
						if ( outOfRange(month, 0, 11) ) return null;
						break;
					case "y": case "yy":
					case "yyyy":
						year = clength < 4 ? expandYear( cal, matchInt ) : matchInt;
						if ( outOfRange(year, 0, 9999) ) return null;
						break;
					case "h": case "hh":
						// Hours (12-hour clock).
						hour = matchInt;
						if ( hour === 12 ) hour = 0;
						if ( outOfRange(hour, 0, 11) ) return null;
						break;
					case "H": case "HH":
						// Hours (24-hour clock).
						hour = matchInt;
						if ( outOfRange(hour, 0, 23) ) return null;
						break;
					case "m": case "mm":
						// Minutes.
						min = matchInt;
						if ( outOfRange(min, 0, 59) ) return null;
						break;
					case "s": case "ss":
						// Seconds.
						sec = matchInt;
						if ( outOfRange(sec, 0, 59) ) return null;
						break;
					case "tt": case "t":
						// AM/PM designator.
						// see if it is standard, upper, or lower case PM. If not, ensure it is at least one of
						// the AM tokens. If not, fail the parse for this format.
						pmHour = cal.PM && ( matchGroup === cal.PM[0] || matchGroup === cal.PM[1] || matchGroup === cal.PM[2] );
						if (
							!pmHour && (
								!cal.AM || ( matchGroup !== cal.AM[0] && matchGroup !== cal.AM[1] && matchGroup !== cal.AM[2] )
							)
						) return null;
						break;
					case "f":
						// Deciseconds.
					case "ff":
						// Centiseconds.
					case "fff":
						// Milliseconds.
						msec = matchInt * Math.pow( 10, 3 - clength );
						if ( outOfRange(msec, 0, 999) ) return null;
						break;
					case "ddd":
						// Day of week.
					case "dddd":
						// Day of week.
						weekDay = getDayIndex( cal, matchGroup, clength === 3 );
						if ( outOfRange(weekDay, 0, 6) ) return null;
						break;
					case "zzz":
						// Time zone offset in +/- hours:min.
						var offsets = matchGroup.split( /:/ );
						if ( offsets.length !== 2 ) return null;
						hourOffset = parseInt( offsets[0], 10 );
						if ( outOfRange(hourOffset, -12, 13) ) return null;
						var minOffset = parseInt( offsets[1], 10 );
						if ( outOfRange(minOffset, 0, 59) ) return null;
						tzMinOffset = ( hourOffset * 60 ) + ( startsWith(matchGroup, "-") ? -minOffset : minOffset );
						break;
					case "z": case "zz":
						// Time zone offset in +/- hours.
						hourOffset = matchInt;
						if ( outOfRange(hourOffset, -12, 13) ) return null;
						tzMinOffset = hourOffset * 60;
						break;
					case "g": case "gg":
						var eraName = matchGroup;
						if ( !eraName || !cal.eras ) return null;
						eraName = trim( eraName.toLowerCase() );
						for ( var i = 0, l = cal.eras.length; i < l; i++ ) {
							if ( eraName === cal.eras[i].name.toLowerCase() ) {
								era = i;
								break;
							}
						}
						// could not find an era with that name
						if ( era === null ) return null;
						break;
				}
			}
		}
		var result = new Date(), defaultYear, convert = cal.convert;
		defaultYear = convert ? convert.fromGregorian( result )[ 0 ] : result.getFullYear();
		if ( year === null ) {
			year = defaultYear;
		}
		else if ( cal.eras ) {
			// year must be shifted to normal gregorian year
			// but not if year was not specified, its already normal gregorian
			// per the main if clause above.
			year += cal.eras[( era || 0 )].offset;
		}
		// set default day and month to 1 and January, so if unspecified, these are the defaults
		// instead of the current day/month.
		if ( month === null ) {
			month = 0;
		}
		if ( date === null ) {
			date = 1;
		}
		// now have year, month, and date, but in the culture's calendar.
		// convert to gregorian if necessary
		if ( convert ) {
			result = convert.toGregorian( year, month, date );
			// conversion failed, must be an invalid match
			if ( result === null ) return null;
		}
		else {
			// have to set year, month and date together to avoid overflow based on current date.
			result.setFullYear( year, month, date );
			// check to see if date overflowed for specified month (only checked 1-31 above).
			if ( result.getDate() !== date ) return null;
			// invalid day of week.
			if ( weekDay !== null && result.getDay() !== weekDay ) {
				return null;
			}
		}
		// if pm designator token was found make sure the hours fit the 24-hour clock.
		if ( pmHour && hour < 12 ) {
			hour += 12;
		}
		result.setHours( hour, min, sec, msec );
		if ( tzMinOffset !== null ) {
			// adjust timezone to utc before applying local offset.
			var adjustedMin = result.getMinutes() - ( tzMinOffset + result.getTimezoneOffset() );
			// Safari limits hours and minutes to the range of -127 to 127.  We need to use setHours
			// to ensure both these fields will not exceed this range.	adjustedMin will range
			// somewhere between -1440 and 1500, so we only need to split this into hours.
			result.setHours( result.getHours() + parseInt(adjustedMin / 60, 10), adjustedMin % 60 );
		}
		return result;
	};
}());

parseNegativePattern = function( value, nf, negativePattern ) {
	var neg = nf[ "-" ],
		pos = nf[ "+" ],
		ret;
	switch ( negativePattern ) {
		case "n -":
			neg = " " + neg;
			pos = " " + pos;
			/* falls through */
		case "n-":
			if ( endsWith(value, neg) ) {
				ret = [ "-", value.substr(0, value.length - neg.length) ];
			}
			else if ( endsWith(value, pos) ) {
				ret = [ "+", value.substr(0, value.length - pos.length) ];
			}
			break;
		case "- n":
			neg += " ";
			pos += " ";
			/* falls through */
		case "-n":
			if ( startsWith(value, neg) ) {
				ret = [ "-", value.substr(neg.length) ];
			}
			else if ( startsWith(value, pos) ) {
				ret = [ "+", value.substr(pos.length) ];
			}
			break;
		case "(n)":
			if ( startsWith(value, "(") && endsWith(value, ")") ) {
				ret = [ "-", value.substr(1, value.length - 2) ];
			}
			break;
	}
	return ret || [ "", value ];
};

//
// public instance functions
//

Globalize.prototype.findClosestCulture = function( cultureSelector ) {
	return Globalize.findClosestCulture.call( this, cultureSelector );
};

Globalize.prototype.format = function( value, format, cultureSelector ) {
	return Globalize.format.call( this, value, format, cultureSelector );
};

Globalize.prototype.localize = function( key, cultureSelector ) {
	return Globalize.localize.call( this, key, cultureSelector );
};

Globalize.prototype.parseInt = function( value, radix, cultureSelector ) {
	return Globalize.parseInt.call( this, value, radix, cultureSelector );
};

Globalize.prototype.parseFloat = function( value, radix, cultureSelector ) {
	return Globalize.parseFloat.call( this, value, radix, cultureSelector );
};

Globalize.prototype.culture = function( cultureSelector ) {
	return Globalize.culture.call( this, cultureSelector );
};

//
// public singleton functions
//

Globalize.addCultureInfo = function( cultureName, baseCultureName, info ) {

	var base = {},
		isNew = false;

	if ( typeof cultureName !== "string" ) {
		// cultureName argument is optional string. If not specified, assume info is first
		// and only argument. Specified info deep-extends current culture.
		info = cultureName;
		cultureName = this.culture().name;
		base = this.cultures[ cultureName ];
	} else if ( typeof baseCultureName !== "string" ) {
		// baseCultureName argument is optional string. If not specified, assume info is second
		// argument. Specified info deep-extends specified culture.
		// If specified culture does not exist, create by deep-extending default
		info = baseCultureName;
		isNew = ( this.cultures[ cultureName ] == null );
		base = this.cultures[ cultureName ] || this.cultures[ "default" ];
	} else {
		// cultureName and baseCultureName specified. Assume a new culture is being created
		// by deep-extending an specified base culture
		isNew = true;
		base = this.cultures[ baseCultureName ];
	}

	this.cultures[ cultureName ] = extend(true, {},
		base,
		info
	);
	// Make the standard calendar the current culture if it's a new culture
	if ( isNew ) {
		this.cultures[ cultureName ].calendar = this.cultures[ cultureName ].calendars.standard;
	}
};

Globalize.findClosestCulture = function( name ) {
	var match;
	if ( !name ) {
		return this.findClosestCulture( this.cultureSelector ) || this.cultures[ "default" ];
	}
	if ( typeof name === "string" ) {
		name = name.split( "," );
	}
	if ( isArray(name) ) {
		var lang,
			cultures = this.cultures,
			list = name,
			i, l = list.length,
			prioritized = [];
		for ( i = 0; i < l; i++ ) {
			name = trim( list[i] );
			var pri, parts = name.split( ";" );
			lang = trim( parts[0] );
			if ( parts.length === 1 ) {
				pri = 1;
			}
			else {
				name = trim( parts[1] );
				if ( name.indexOf("q=") === 0 ) {
					name = name.substr( 2 );
					pri = parseFloat( name );
					pri = isNaN( pri ) ? 0 : pri;
				}
				else {
					pri = 1;
				}
			}
			prioritized.push({ lang: lang, pri: pri });
		}
		prioritized.sort(function( a, b ) {
			if ( a.pri < b.pri ) {
				return 1;
			} else if ( a.pri > b.pri ) {
				return -1;
			}
			return 0;
		});
		// exact match
		for ( i = 0; i < l; i++ ) {
			lang = prioritized[ i ].lang;
			match = cultures[ lang ];
			if ( match ) {
				return match;
			}
		}

		// neutral language match
		for ( i = 0; i < l; i++ ) {
			lang = prioritized[ i ].lang;
			do {
				var index = lang.lastIndexOf( "-" );
				if ( index === -1 ) {
					break;
				}
				// strip off the last part. e.g. en-US => en
				lang = lang.substr( 0, index );
				match = cultures[ lang ];
				if ( match ) {
					return match;
				}
			}
			while ( 1 );
		}

		// last resort: match first culture using that language
		for ( i = 0; i < l; i++ ) {
			lang = prioritized[ i ].lang;
			for ( var cultureKey in cultures ) {
				var culture = cultures[ cultureKey ];
				if ( culture.language == lang ) {
					return culture;
				}
			}
		}
	}
	else if ( typeof name === "object" ) {
		return name;
	}
	return match || null;
};

Globalize.format = function( value, format, cultureSelector ) {
	var culture = this.findClosestCulture( cultureSelector );
	if ( value instanceof Date ) {
		value = formatDate( value, format, culture );
	}
	else if ( typeof value === "number" ) {
		value = formatNumber( value, format, culture );
	}
	return value;
};

Globalize.localize = function( key, cultureSelector ) {
	return this.findClosestCulture( cultureSelector ).messages[ key ] ||
		this.cultures[ "default" ].messages[ key ];
};

Globalize.parseDate = function( value, formats, culture ) {
	culture = this.findClosestCulture( culture );

	var date, prop, patterns;
	if ( formats ) {
		if ( typeof formats === "string" ) {
			formats = [ formats ];
		}
		if ( formats.length ) {
			for ( var i = 0, l = formats.length; i < l; i++ ) {
				var format = formats[ i ];
				if ( format ) {
					date = parseExact( value, format, culture );
					if ( date ) {
						break;
					}
				}
			}
		}
	} else {
		patterns = culture.calendar.patterns;
		for ( prop in patterns ) {
			date = parseExact( value, patterns[prop], culture );
			if ( date ) {
				break;
			}
		}
	}

	return date || null;
};

Globalize.parseInt = function( value, radix, cultureSelector ) {
	return truncate( Globalize.parseFloat(value, radix, cultureSelector) );
};

Globalize.parseFloat = function( value, radix, cultureSelector ) {
	// radix argument is optional
	if ( typeof radix !== "number" ) {
		cultureSelector = radix;
		radix = 10;
	}

	var culture = this.findClosestCulture( cultureSelector );
	var ret = NaN,
		nf = culture.numberFormat;

	if ( value.indexOf(culture.numberFormat.currency.symbol) > -1 ) {
		// remove currency symbol
		value = value.replace( culture.numberFormat.currency.symbol, "" );
		// replace decimal seperator
		value = value.replace( culture.numberFormat.currency["."], culture.numberFormat["."] );
	}

	// trim leading and trailing whitespace
	value = trim( value );

	// allow infinity or hexidecimal
	if ( regexInfinity.test(value) ) {
		ret = parseFloat( value );
	}
	else if ( !radix && regexHex.test(value) ) {
		ret = parseInt( value, 16 );
	}
	else {

		// determine sign and number
		var signInfo = parseNegativePattern( value, nf, nf.pattern[0] ),
			sign = signInfo[ 0 ],
			num = signInfo[ 1 ];

		// #44 - try parsing as "(n)"
		if ( sign === "" && nf.pattern[0] !== "(n)" ) {
			signInfo = parseNegativePattern( value, nf, "(n)" );
			sign = signInfo[ 0 ];
			num = signInfo[ 1 ];
		}

		// try parsing as "-n"
		if ( sign === "" && nf.pattern[0] !== "-n" ) {
			signInfo = parseNegativePattern( value, nf, "-n" );
			sign = signInfo[ 0 ];
			num = signInfo[ 1 ];
		}

		sign = sign || "+";

		// determine exponent and number
		var exponent,
			intAndFraction,
			exponentPos = num.indexOf( "e" );
		if ( exponentPos < 0 ) exponentPos = num.indexOf( "E" );
		if ( exponentPos < 0 ) {
			intAndFraction = num;
			exponent = null;
		}
		else {
			intAndFraction = num.substr( 0, exponentPos );
			exponent = num.substr( exponentPos + 1 );
		}
		// determine decimal position
		var integer,
			fraction,
			decSep = nf[ "." ],
			decimalPos = intAndFraction.indexOf( decSep );
		if ( decimalPos < 0 ) {
			integer = intAndFraction;
			fraction = null;
		}
		else {
			integer = intAndFraction.substr( 0, decimalPos );
			fraction = intAndFraction.substr( decimalPos + decSep.length );
		}
		// handle groups (e.g. 1,000,000)
		var groupSep = nf[ "," ];
		integer = integer.split( groupSep ).join( "" );
		var altGroupSep = groupSep.replace( /\u00A0/g, " " );
		if ( groupSep !== altGroupSep ) {
			integer = integer.split( altGroupSep ).join( "" );
		}
		// build a natively parsable number string
		var p = sign + integer;
		if ( fraction !== null ) {
			p += "." + fraction;
		}
		if ( exponent !== null ) {
			// exponent itself may have a number patternd
			var expSignInfo = parseNegativePattern( exponent, nf, "-n" );
			p += "e" + ( expSignInfo[0] || "+" ) + expSignInfo[ 1 ];
		}
		if ( regexParseFloat.test(p) ) {
			ret = parseFloat( p );
		}
	}
	return ret;
};

Globalize.culture = function( cultureSelector ) {
	// setter
	if ( typeof cultureSelector !== "undefined" ) {
		this.cultureSelector = cultureSelector;
	}
	// getter
	return this.findClosestCulture( cultureSelector ) || this.cultures[ "default" ];
};

}( this ));

define("globalize", function(){});

/*
 * Globalize Culture en-US
 *
 * http://github.com/jquery/globalize
 *
 * Copyright Software Freedom Conservancy, Inc.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * This file was generated by the Globalize Culture Generator
 * Translation: bugs found in this file need to be fixed in the generator
 */

(function( window, undefined ) {

var Globalize;

if ( typeof require !== "undefined" &&
	typeof exports !== "undefined" &&
	typeof module !== "undefined" ) {
	// Assume CommonJS
	Globalize = require( "globalize" );
} else {
	// Global variable
	Globalize = window.Globalize;
}

Globalize.addCultureInfo( "en-US", "default", {
	name: "en-US",
	englishName: "English (United States)"
});

}( this ));

define("cultures/globalize.culture.en-US", function(){});

    /**
     *
     * Core of YASMF-UTIL; defines the version, DOM, and localization convenience methods.
     *
     * @module core.js
     * @author Kerri Shotts
     * @version 0.4
     *
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
    /*global define, Globalize, device*/
    define( 'yasmf/util/core',[ "globalize", "cultures/globalize.culture.en-US" ], function() {
      var _y = {
        VERSION: '0.4.100',
        /**
         * Returns an element from the DOM with the specified
         * ID. Similar to (but not like) jQuery's $(), except
         * that this is a pure DOM element.
         * @method ge
         * @param  {String} elementId
         * @return {Node}
         */
        ge: function( elementId ) {
          return document.getElementById( elementId );
        },
        /**
         * Returns an element from the DOM using `querySelector`.
         * @method qs
         * @param {String} selector
         * @returns {Node}
         */
        qs: function( selector ) {
          return document.querySelector( selector );
        },
        /**
         * Returns an array of all elements matching a given
         * selector. The array is processed to be a real array,
         * not a nodeList.
         * @method gac
         * @param  {String} selector
         * @return {Array} of Nodes
         */
        gac: function( selector ) {
          return Array.prototype.slice.call( document.querySelectorAll( selector ) );
        },
        /**
         * Returns an array of elements matching a given selector.
         * @method qsa
         * @param {String} selector
         * @returns {Array} of Nodes
         */
        qsa: function( selector ) {
          return Array.prototype.slice.call( document.querySelectorAll( selector ) );
        },
        /**
         * Returns a Computed CSS Style ready for interrogation if
         * `property` is not defined, or the actual property value
         * if `property` is defined.
         * @method gsc
         * @param {Node} element  A specific DOM element
         * @param {String} [property]  A CSS property to query
         * @returns {*}
         */
        gsc: function( element, property ) {
          var computedStyle = window.getComputedStyle( element );
          if ( typeof property !== "undefined" ) {
            return computedStyle.getPropertyValue( property );
          }
          return computedStyle;
        },
        /**
         * Returns a parsed template. The template can be a simple
         * string, in which case the replacement variable are replaced
         * and returned simply, or the template can be a DOM element,
         * in which case the template is assumed to be the DOM Element's
         * `innerHTML`, and then the replacement variables are parsed.
         *
         * Replacement variables are of the form `%VARIABLE%`, and
         * can occur anywhere, not just within strings in HTML.
         *
         * The replacements array is of the form
         *     { "VARIABLE": replacement, "VARIABLE2": replacement, ... }
         *
         * @method template
         * @param  {Node|String} templateElement
         * @param  {Object} replacements
         * @return {String}
         */
        template: function( templateElement, replacements ) {
          var templateHTML = templateElement.innerHTML || templateElement;
          for ( var theVar in replacements ) {
            if ( replacements.hasOwnProperty( theVar ) ) {
              var thisVar = '%' + theVar.toUpperCase() + '%';
              while ( templateHTML.indexOf( thisVar ) > -1 ) {
                templateHTML = templateHTML.replace( thisVar, replacements[ theVar ] );
              }
            }
          }
          return templateHTML;
        },
        /**
         * Indicates if the app is running in a Cordova container.
         * Only valid if `executeWhenReady` is used to start an app.
         * @property underCordova
         * @default false
         */
        underCordova: false,
        /**
         * Handles the conundrum of executing a block of code when
         * the mobile device or desktop browser is ready. If running
         * under Cordova, the `deviceready` event will fire, and
         * the `callback` will execute. Otherwise, after 1s, the
         * `callback` will execute *if it hasn't already*.
         *
         * @method executeWhenReady
         * @param {Function} callback
         */
        executeWhenReady: function( callback ) {
          var executed = false;
          document.addEventListener( "deviceready", function() {
            if ( !executed ) {
              executed = true;
              _y.underCordova = true;
              if ( typeof callback === "function" ) {
                callback();
              }
            }
          }, false );
          setTimeout( function() {
            if ( !executed ) {
              executed = true;
              _y.underCordova = false;
              if ( typeof callback === "function" ) {
                callback();
              }
            }
          }, 1000 );
        },
        /**
         * > The following functions are related to globalization and localization, which
         * > are now considered to be core functions (previously it was broken out in
         * > PKLOC)
         */
        /**
         * @typedef {String} Locale
         */
        /**
         * Indicates the user's locale. It's only valid after
         * a call to `getUserLocale`, but it can be written to
         * at any time in order to override `getUserLocale`'s
         * calculation of the user's locale.
         *
         * @property currentUserLocale
         * @default (empty string)
         * @type {Locale}
         */
        currentUserLocale: "",
        /**
         * A translation matrix. Used by `addTranslation(s)` and `T`.
         *
         * @property localizedText
         * @type {Object}
         */
        localizedText: {},
        /**
         * Given a locale string, normalize it to the form of `la-RE` or `la`, depending on the length.
         * ```
         *     "enus", "en_us", "en_---__--US", "EN-US" --> "en-US"
         *     "en", "en-", "EN!" --> "en"
         * ```
         * @method normalizeLocale
         * @param {Locale} theLocale
         */
        normalizeLocale: function( theLocale ) {
          var theNewLocale = theLocale;
          if ( theNewLocale.length < 2 ) {
            throw new Error( "Fatal: invalid locale; not of the format la-RE." );
          }
          var theLanguage = theNewLocale.substr( 0, 2 ).toLowerCase();
          var theRegion = theNewLocale.substr( -2 ).toUpperCase();
          if ( theNewLocale.length < 4 ) {
            theRegion = ""; // there can't possibly be a valid region on a 3-char string
          }
          if ( theRegion !== "" ) {
            theNewLocale = theLanguage + "-" + theRegion;
          } else {
            theNewLocale = theLanguage;
          }
          return theNewLocale;
        },
        /**
         * Sets the current locale for jQuery/Globalize
         * @method setGlobalizationLocale
         * @param {Locale} theLocale
         */
        setGlobalizationLocale: function( theLocale ) {
          var theNewLocale = _y.normalizeLocale( theLocale );
          Globalize.culture( theNewLocale );
        },
        /**
         * Add a translation to the existing translation matrix
         * @method addTranslation
         * @param {Locale} locale
         * @param {String} key
         * @param {String} value
         */
        addTranslation: function( locale, key, value ) {
          var self = _y;
          // we'll store translations with upper-case locales, so case never matters
          var theNewLocale = self.normalizeLocale( locale ).toUpperCase();
          // store the value
          if ( typeof self.localizedText[ theNewLocale ] === "undefined" ) {
            self.localizedText[ theNewLocale ] = {};
          }
          self.localizedText[ theNewLocale ][ key.toUpperCase() ] = value;
        },
        /**
         * Add translations in batch, as follows:
         * ```
         *   {
         *     "HELLO":
         *     {
         *       "en-US": "Hello",
         *       "es-US": "Hola"
         *     },
         *     "GOODBYE":
         *     {
         *       "en-US": "Bye",
         *       "es-US": "Adios"
         *     }
         *   }
         * ```
         * @method addTranslations
         * @param {Object} o
         */
        addTranslations: function( o ) {
          var self = _y;
          for ( var key in o ) {
            if ( o.hasOwnProperty( key ) ) {
              for ( var locale in o[ key ] ) {
                if ( o[ key ].hasOwnProperty( locale ) ) {
                  self.addTranslation( locale, key, o[ key ][ locale ] );
                }
              }
            }
          }
        },
        /**
         * Returns the user's locale (e.g., `en-US` or `fr-FR`). If one
         * can't be found, `en-US` is returned. If `currentUserLocale`
         * is already defined, it won't attempt to recalculate it.
         * @method getUserLocale
         * @return {Locale}
         */
        getUserLocale: function() {
          var self = _y;
          if ( self.currentUserLocale ) {
            return self.currentUserLocale;
          }
          var currentPlatform = "unknown";
          if ( typeof device != 'undefined' ) {
            currentPlatform = device.platform;
          }
          var userLocale = "en-US";
          // a suitable default
          if ( currentPlatform == "Android" ) {
            // parse the navigator.userAgent
            var userAgent = navigator.userAgent;
            // inspired by http://stackoverflow.com/a/7728507/741043
            var tempLocale = userAgent.match( /Android.*([a-zA-Z]{2}-[a-zA-Z]{2})/ );
            if ( tempLocale ) {
              userLocale = tempLocale[ 1 ];
            }
          } else {
            userLocale = navigator.language || navigator.browserLanguage || navigator
              .systemLanguage || navigator.userLanguage;
          }
          self.currentUserLocale = self.normalizeLocale( userLocale );
          return self.currentUserLocale;
        },
        /**
         * Gets the device locale, if available. It depends on the
         * Globalization plugin provided by Cordova, but if the
         * plugin is not available, it assumes the device locale
         * can't be determined rather than throw an error.
         *
         * Once the locale is determined one way or the other, `callback`
         * is called.
         *
         * @method getDeviceLocale
         * @param {Function} callback
         */
        getDeviceLocale: function( callback ) {
          var self = _y;
          if ( typeof navigator.globalization !== "undefined" ) {
            if ( typeof navigator.globalization.getLocaleName !== "undefined" ) {
              navigator.globalization.getLocaleName( function( locale ) {
                self.currentUserLocale = self.normalizeLocale( locale.value );
                if ( typeof callback === "function" ) {
                  callback();
                }
              }, function() {
                // error; go ahead and call the callback, but don't set the locale
                console.log( "WARN: Couldn't get user locale from device." );
                if ( typeof callback === "function" ) {
                  callback();
                }
              } );
              return;
            }
          }
          if ( typeof callback === "function" ) {
            callback();
          }
        },
        /**
         * Looks up a translation for a given `key` and locale. If
         * the translation does not exist, `undefined` is returned.
         *
         * The `key` is converted to uppercase, and the locale is
         * properly normalized and then converted to uppercase before
         * any lookup is attempted.
         *
         * @method lookupTranslation
         * @param {String} key
         * @param {Locale} [theLocale]
         * @returns {*}
         */
        lookupTranslation: function( key, theLocale ) {
          var self = _y;
          var upperKey = key.toUpperCase();
          var userLocale = theLocale || self.getUserLocale();
          userLocale = self.normalizeLocale( userLocale ).toUpperCase();
          // look it up by checking if userLocale exists, and then if the key (uppercased) exists
          if ( typeof self.localizedText[ userLocale ] !== "undefined" ) {
            if ( typeof self.localizedText[ userLocale ][ upperKey ] !== "undefined" ) {
              return self.localizedText[ userLocale ][ upperKey ];
            }
          }
          // if not found, we don't return anything
          return void( 0 );
        },
        /**
         * @property localeOfLastResort
         * @default "en-US"
         * @type {Locale}
         */
        localeOfLastResort: "en-US",
        /**
         * @property languageOfLastResort
         * @default "en"
         * @type {Locale}
         */
        languageOfLastResort: "en",
        /**
         * Convenience function for translating text. Key is the only
         * required value and case doesn't matter (it's uppercased). Replacement
         * variables can be specified using replacement variables of the form `{ "VAR":"VALUE" }`,
         * using `%VAR%` in the key/value returned. If `locale` is specified, it
         * takes precedence over the user's current locale.
         *
         * @method T
         * @param {String} key
         * @param {Object} [parms] replacement variables
         * @param {Locale} [locale]
         */
        T: function( key, parms, locale ) {
          var self = _y;
          var userLocale = locale || self.getUserLocale();
          var currentValue;
          if ( typeof( currentValue = self.lookupTranslation( key, userLocale ) ) ===
            "undefined" ) {
            // we haven't found it under the given locale (of form: xx-XX), try the fallback locale (xx)
            userLocale = userLocale.substr( 0, 2 );
            if ( typeof( currentValue = self.lookupTranslation( key, userLocale ) ) ===
              "undefined" ) {
              // we haven't found it under any of the given locales; try the language of last resort
              if ( typeof( currentValue = self.lookupTranslation( key, self.languageOfLastResort ) ) ===
                "undefined" ) {
                // we haven't found it under any of the given locales; try locale of last resort
                if ( typeof( currentValue = self.lookupTranslation( key, self.localeOfLastResort ) ) ===
                  "undefined" ) {
                  // we didn't find it at all... we'll use the key
                  currentValue = key;
                }
              }
            }
          }
          return self.template( currentValue, parms );
        },
        /**
         * Convenience function for localizing numbers according the format (optional) and
         * the locale (optional). theFormat is typically the number of places to use; "n" if
         * not specified.
         *
         * @method N
         * @param {Number} theNumber
         * @param {Number|String} theFormat
         * @param {Locale} [theLocale]
         */
        N: function( theNumber, theFormat, theLocale ) {
          var self = _y;
          var iFormat = "n" + ( ( typeof theFormat === "undefined" ) ? "0" :
            theFormat );
          var iLocale = theLocale || self.getUserLocale();
          self.setGlobalizationLocale( iLocale );
          return Globalize.format( theNumber, iFormat );
        },
        /**
         * Convenience function for localizing currency. theFormat is the number of decimal places
         * or "2" if not specified. If there are more places than digits, padding is added; if there
         * are fewer places, rounding is performed.
         *
         * @method C
         * @param {Number} theNumber
         * @param {String} theFormat
         * @param {Locale} [theLocale]
         */
        C: function( theNumber, theFormat, theLocale ) {
          var self = _y;
          var iFormat = "c" + ( ( typeof theFormat === "undefined" ) ? "2" :
            theFormat );
          var iLocale = theLocale || self.getUserLocale();
          self.setGlobalizationLocale( iLocale );
          return Globalize.format( theNumber, iFormat );
        },
        /**
         * Convenience function for localizing percentages. theFormat specifies the number of
         * decimal places; two if not specified.
         * @method PCT
         * @param {Number} theNumber
         * @param {Number} theFormat
         * @param {Locale} [theLocale]
         */
        PCT: function( theNumber, theFormat, theLocale ) {
          var self = _y;
          var iFormat = "p" + ( ( typeof theFormat === "undefined" ) ? "2" :
            theFormat );
          var iLocale = theLocale || self.getUserLocale();
          self.setGlobalizationLocale( iLocale );
          return Globalize.format( theNumber, iFormat );
        },
        /**
         * Convenience function for localizing dates.
         *
         * theFormat specifies the format; "d" is assumed if not provided.
         *
         * @method D
         * @param {Date} theDate
         * @param {String} theFormat
         * @param {Locale} [theLocale]
         */
        D: function( theDate, theFormat, theLocale ) {
          var self = _y;
          var iFormat = theFormat || "d";
          var iLocale = theLocale || self.getUserLocale();
          self.setGlobalizationLocale( iLocale );
          return Globalize.format( theDate, iFormat );
        },
        /**
         * Convenience function for jQuery/Globalize's `format` method
         * @method format
         * @param {*} theValue
         * @param {String} theFormat
         * @param {Locale} [theLocale]
         * @returns {*}
         */
        format: function( theValue, theFormat, theLocale ) {
          var self = _y;
          var iFormat = theFormat;
          var iLocale = theLocale || self.getUserLocale();
          self.setGlobalizationLocale( iLocale );
          return Globalize.format( theValue, iFormat );
        }
      };
      return _y;
    } );

/**
 *
 * Provides date/time convenience methods
 *
 * @module datetime.js
 * @author Kerri Shotts
 * @version 0.4
 *
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
/*global define*/
define( 'yasmf/util/datetime',[],function() {
  return {
    /**
     * Returns the current time in the Unix time format
     * @method getUnixTime
     * @return {UnixTime}
     */
    getUnixTime: function() {
      return ( new Date() ).getTime();
    },
    /**
     * # PRECISION_x Constants
     * These specify the amount of precision required for `getPartsFromSeconds`.
     * For example, if `PRECISION_DAYS` is specified, the number of parts obtained
     * consist of days, hours, minutes, and seconds.
     */
    PRECISION_SECONDS: 1,
    PRECISION_MINUTES: 2,
    PRECISION_HOURS: 3,
    PRECISION_DAYS: 4,
    PRECISION_WEEKS: 5,
    PRECISION_YEARS: 6,
    /**
     * @typedef {{fractions: number, seconds: number, minutes: number, hours: number, days: number, weeks: number, years: number}} TimeParts
     */
    /**
     * Takes a given number of seconds and returns an object consisting of the number of seconds, minutes, hours, etc.
     * The value is limited by the precision parameter -- which must be specified. Which ever value is specified will
     * be the maximum limit for the routine; that is `PRECISION_DAYS` will never return a result for weeks or years.
     * @method getPartsFromSeconds
     * @param {number} seconds
     * @param {number} precision
     * @returns {TimeParts}
     */
    getPartsFromSeconds: function( seconds, precision ) {
      var partValues = [ 0, 0, 0, 0, 0, 0, 0 ];
      var modValues = [ 1, 60, 3600, 86400, 604800, 31557600 ];
      for ( var i = precision; i > 0; i-- ) {
        if ( i == 1 ) {
          partValues[ i - 1 ] = seconds % modValues[ i - 1 ];
        } else {
          partValues[ i - 1 ] = Math.floor( seconds % modValues[ i - 1 ] );
        }
        partValues[ i ] = Math.floor( seconds / modValues[ i - 1 ] );
        seconds = seconds - partValues[ i ] * modValues[ i - 1 ];
      }
      return {
        fractions: partValues[ 0 ],
        seconds: partValues[ 1 ],
        minutes: partValues[ 2 ],
        hours: partValues[ 3 ],
        days: partValues[ 4 ],
        weeks: partValues[ 5 ],
        years: partValues[ 6 ]
      };
    }
  };
} );

/**
 *
 * Provides convenience methods for parsing unix-style path names. If the
 * path separator is changed from "/" to "\", it should parse Windows paths as well.
 *
 * @module filename.js
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
/*global define*/
define( 'yasmf/util/filename',[],function() {
  var PKFILE = {
    /**
     * @property Version
     * @type {String}
     */
    version: "00.04.100",
    /**
     * Specifies the characters that are not allowed in file names.
     * @property invalidCharacters
     * @default ["/","\",":","|","<",">","*","?",";","%"]
     * @type {Array}
     */
    invalidCharacters: "/,\\,:,|,<,>,*,?,;,%".split( "," ),
    /**
     * Indicates the character that separates a name from its extension,
     * as in "filename.ext".
     * @property extensionSeparator
     * @default "."
     * @type {String}
     */
    extensionSeparator: ".",
    /**
     * Indicates the character that separates path components.
     * @property pathSeparator
     * @default "/"
     * @type {String}
     */
    pathSeparator: "/",
    /**
     * Indicates the character used when replacing invalid characters
     * @property replacementCharacter
     * @default "-"
     * @type {String}
     */
    replacementCharacter: "-",
    /**
     * Converts a potential invalid filename to a valid filename by replacing
     * invalid characters (as specified in "invalidCharacters") with "replacementCharacter".
     *
     * @method makeValid
     * @param  {String} theFileName
     * @return {String}
     */
    makeValid: function( theFileName ) {
      var self = PKFILE;
      var theNewFileName = theFileName;
      for ( var i = 0; i < self.invalidCharacters.length; i++ ) {
        var d = 0;
        while ( theNewFileName.indexOf( self.invalidCharacters[ i ] ) > -1 && ( d++ ) <
          50 ) {
          theNewFileName = theNewFileName.replace( self.invalidCharacters[ i ], self.replacementCharacter );
        }
      }
      return theNewFileName;
    },
    /**
     * Returns the name+extension portion of a full path.
     *
     * @method getFilePart
     * @param  {String} theFileName
     * @return {String}
     */
    getFilePart: function( theFileName ) {
      var self = PKFILE;
      var theSlashPosition = theFileName.lastIndexOf( self.pathSeparator );
      if ( theSlashPosition < 0 ) {
        return theFileName;
      }
      return theFileName.substr( theSlashPosition + 1, theFileName.length -
        theSlashPosition );
    },
    /**
     * Returns the path portion of a full path.
     * @method getPathPart
     * @param  {String} theFileName
     * @return {String}
     */
    getPathPart: function( theFileName ) {
      var self = PKFILE;
      var theSlashPosition = theFileName.lastIndexOf( self.pathSeparator );
      if ( theSlashPosition < 0 ) {
        return "";
      }
      return theFileName.substr( 0, theSlashPosition + 1 );
    },
    /**
     * Returns the filename, minus the extension.
     * @method getFileNamePart
     * @param  {String} theFileName
     * @return {String}
     */
    getFileNamePart: function( theFileName ) {
      var self = PKFILE;
      var theFileNameNoPath = self.getFilePart( theFileName );
      var theDotPosition = theFileNameNoPath.lastIndexOf( self.extensionSeparator );
      if ( theDotPosition < 0 ) {
        return theFileNameNoPath;
      }
      return theFileNameNoPath.substr( 0, theDotPosition );
    },
    /**
     * Returns the extension of a filename
     * @method getFileExtensionPart
     * @param  {String} theFileName
     * @return {String}
     */
    getFileExtensionPart: function( theFileName ) {
      var self = PKFILE;
      var theFileNameNoPath = self.getFilePart( theFileName );
      var theDotPosition = theFileNameNoPath.lastIndexOf( self.extensionSeparator );
      if ( theDotPosition < 0 ) {
        return "";
      }
      return theFileNameNoPath.substr( theDotPosition + 1, theFileNameNoPath.length -
        theDotPosition - 1 );
    }
  };
  return PKFILE;
} );

/**
 *
 * Provides miscellaneous functions that had no other category.
 *
 * @module misc.js
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
/*global define*/
define( 'yasmf/util/misc',[],function() {
  return {
    /**
     * Returns a pseudo-UUID. Not guaranteed to be unique (far from it, probably), but
     * close enough for most purposes. You should handle collisions gracefully on your
     * own, of course. see http://stackoverflow.com/a/8809472
     * @method makeFauxUUID
     * @return {String}
     */
    makeFauxUUID: function() {
      var d = new Date().getTime();
      var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace( /[xy]/g, function( c ) {
        var r = ( d + Math.random() * 16 ) % 16 | 0;
        d = Math.floor( d / 16 );
        return ( c == 'x' ? r : ( r & 0x7 | 0x8 ) ).toString( 16 );
      } );
      return uuid;
    }
  };
} );

/**
 *
 * Provides basic device-handling convenience functions for determining if the device
 * is an iDevice or a Droid Device, and what the orientation is.
 *
 * @module device.js
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
/*global define, device */
define( 'yasmf/util/device',[],function() {
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
    platform: function() {
      if ( PKDEVICE.platformOverride ) {
        return PKDEVICE.platformOverride.toLowerCase();
      }
      if ( typeof device == "undefined" || !device.platform ) {
        // detect mobile devices first
        if ( navigator.platform == "iPad" || navigator.platform == "iPad Simulator" ||
          navigator.platform == "iPhone" || navigator.platform == "iPhone Simulator" ||
          navigator.platform == "iPod" ) {
          return "ios";
        }
        if ( navigator.userAgent.toLowerCase().indexOf( "android" ) > -1 ) {
          return "android";
        }
        // no reason why we can't return other information
        if ( navigator.platform.indexOf( "Mac" > -1 ) ) {
          return "mac";
        }
        if ( navigator.platform.indexOf( "Win" > -1 ) ) {
          return "windows";
        }
        if ( navigator.platform.indexOf( "Linux" > -1 ) ) {
          return "linux";
        }
        return "unknown";
      }
      var thePlatform = device.platform.toLowerCase();
      //
      // turns out that for Cordova > 2.3, deivceplatform now returns iOS, so the
      // following is really not necessary on those versions. We leave it here
      // for those using Cordova <= 2.2.
      if ( thePlatform.indexOf( "ipad" ) > -1 || thePlatform.indexOf( "iphone" ) > -1 ) {
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
    formFactor: function() {
      if ( PKDEVICE.formFactorOverride ) {
        return PKDEVICE.formFactorOverride.toLowerCase();
      }
      if ( navigator.platform == "iPad" ) {
        return "tablet";
      }
      if ( ( navigator.platform == "iPhone" ) || ( navigator.platform ==
        "iPhone Simulator" ) ) {
        return "phone";
      }
      var ua = navigator.userAgent.toLowerCase();
      if ( ua.indexOf( "android" ) > -1 ) {
        // android reports if it is a phone or tablet based on user agent
        /*if (ua.indexOf("mobile safari") > -1)
          {
            return "phone";
          }*/
        if ( ua.indexOf( "mobile safari" ) < 0 && ua.indexOf( "safari" ) > -1 ) {
          return "tablet";
        }
      }
      // the following is hacky, and not guaranteed to work all the time,
      // especially as phones get bigger screens with higher DPI.
      if ( ( Math.max( window.screen.width, window.screen.height ) / window.devicePixelRatio ) >=
        900 ) {
        return "tablet";
      }
      return "phone";
    },
    /**
     * Determines if the device is a tablet (or tablet-sized, more accurately)
     * @return {Boolean}
     */
    isTablet: function() {
      return PKDEVICE.formFactor() == "tablet";
    },
    /**
     * Determines if the device is a tablet (or tablet-sized, more accurately)
     * @return {Boolean}
     */
    isPhone: function() {
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
    isPortrait: function() {
      return window.orientation === 0 || window.orientation == 180 || window.location
        .href.indexOf( "?portrait" ) > -1;
    },
    /**
     *
     * Determines if the device is in Landscape orientation.
     *
     * @method isLandscape
     * @static
     * @returns {boolean} `true` if the device is in a landscape orientation; `false` otherwise
     */
    isLandscape: function() {
      if ( window.location.href.indexOf( "?landscape" ) > -1 ) {
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
    isRetina: function() {
      return window.devicePixelRatio > 1;
    },
    /**
     * Returns `true` if the device is an iPad.
     *
     * @method iPad
     * @static
     * @returns {boolean}
     */
    iPad: function() {
      return PKDEVICE.platform() === "ios" && PKDEVICE.formFactor() === "tablet";
    },
    /**
     * Returns `true` if the device is an iPhone (or iPod).
     *
     * @method iPhone
     * @static
     * @returns {boolean}
     */
    iPhone: function() {
      return PKDEVICE.platform() === "ios" && PKDEVICE.formFactor() === "phone";
    },
    /**
     * Returns `true` if the device is an Android Phone.
     *
     * @method droidPhone
     * @static
     * @returns {boolean}
     */
    droidPhone: function() {
      return PKDEVICE.platform() === "android" && PKDEVICE.formFactor() === "phone";
    },
    /**
     * Returns `true` if the device is an Android Tablet.
     *
     * @method droidTablet
     * @static
     * @returns {boolean}
     */
    droidTablet: function() {
      return PKDEVICE.platform() === "android" && PKDEVICE.formFactor() === "tablet";
    }
  };
  return PKDEVICE;
} );

/**
 *
 * # Base Object
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
 onevar:false,
 camelCase:false
 */
/*global define, console*/
define( 'yasmf/util/object',[],function() {
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
  var BaseObject = function() {
    var self = this;
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
    self._classHierarchy = [ _className ];
    /**
     *
     * Objects are subclassed using this method. The newClass is the
     * unique class name of the object (and should match the class'
     * actual name.
     *
     * @method subclass
     * @param {String} newClass - the new unique class of the object
     */
    self.subclass = function( newClass ) {
      self._classHierarchy.push( newClass );
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
    self.getClass = function() {
      return self._classHierarchy[ self._classHierarchy.length - 1 ];
    };
    /**
     *
     * The class of the instance. **Read-only**
     * @property class
     * @type String
     * @readOnly
     */
    Object.defineProperty( self, "class", {
      get: self.getClass,
      configurable: false
    } );
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
    self.getSuperClassOfClass = function( aClass ) {
      var theClass = aClass || self.class;
      var i = self._classHierarchy.indexOf( theClass );
      if ( i > -1 ) {
        return self._classHierarchy[ i - 1 ];
      } else {
        return null;
      }
    };
    /**
     *
     * The superclass of the instance.
     * @property superClass
     * @type String
     */
    Object.defineProperty( self, "superClass", {
      get: self.getSuperClassOfClass,
      configurable: false
    } );
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
    self.overrideSuper = function( theClass, theFunctionName, theActualFunction ) {
      var superClass = self.getSuperClassOfClass( theClass );
      if ( !self._super[ superClass ] ) {
        self._super[ superClass ] = {};
      }
      self._super[ superClass ][ theFunctionName ] = theActualFunction;
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
    self.override = function( theNewFunction ) {
      var theFunctionName = theNewFunction.name;
      if ( theFunctionName !== "" ) {
        self.overrideSuper( self.class, theFunctionName, self[ theFunctionName ] );
        self[ theFunctionName ] = theNewFunction;
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
    self.super = function( theClass, theFunctionName, args ) {
      var superClass = self.getSuperClassOfClass( theClass );
      if ( self._super[ superClass ] ) {
        if ( self._super[ superClass ][ theFunctionName ] ) {
          return self._super[ superClass ][ theFunctionName ].apply( self, args );
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
    self._constructObjectCategories = function _constructObjectCategories( pri ) {
      var priority = BaseObject.ON_CREATE_CATEGORY;
      if ( typeof pri !== "undefined" ) {
        priority = pri;
      }
      if ( typeof BaseObject._objectCategories[ priority ][ self.class ] !==
        "undefined" ) {
        BaseObject._objectCategories[ priority ][ self.class ].forEach( function(
          categoryConstructor ) {
          try {
            categoryConstructor( self );
          } catch ( e ) {
            console.log( 'Error during category construction: ' + e.message );
          }
        } );
      }
    };
    /**
     *
     * initializes the object
     *
     * @method init
     *
     */
    self.init = function() {
      self._constructObjectCategories( BaseObject.ON_INIT_CATEGORY );
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
    self.setTagForKey = function( theKey, theValue ) {
      self._tags[ theKey ] = theValue;
      var notifyListener = function( theListener, theKey, theValue ) {
        return function() {
          theListener( self, theKey, theValue );
        };
      };
      if ( self._tagListeners[ theKey ] ) {
        for ( var i = 0; i < self._tagListeners[ theKey ].length; i++ ) {
          setTimeout( notifyListener( self._tagListeners[ theKey ][ i ], theKey,
            theValue ), 0 );
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
    self.getTagForKey = function( theKey ) {
      return self._tags[ theKey ];
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
    self.addTagListenerForKey = function( theKey, theListener ) {
      if ( !self._tagListeners[ theKey ] ) {
        self._tagListeners[ theKey ] = [];
      }
      self._tagListeners[ theKey ].push( theListener );
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
    self.removeTagListenerForKey = function( theKey, theListener ) {
      if ( !self._tagListeners[ theKey ] ) {
        self._tagListeners[ theKey ] = [];
      }
      var i = self._tagListeners[ theKey ].indexOf( theListener );
      if ( i > -1 ) {
        self._tagListeners[ theKey ].splice( i, 1 );
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
    self.setTag = function( theValue ) {
      self.setTagForKey( "__default", theValue );
    };
    /**
     *
     * Returns the value for the given tag (`__default`). If the tag has never been
     * set, the result is undefined.
     *
     * @method getTag
     * @returns {*} the value of the tag.
     */
    self.getTag = function() {
      return self.getTagForKey( "__default" );
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
    Object.defineProperty( self, "tag", {
      get: self.getTag,
      set: self.setTag,
      configurable: true
    } );
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
    self.addListenerForNotification = function( theNotification, theListener ) {
      if ( !self._notificationListeners[ theNotification ] ) {
        console.log( theNotification + " has not been registered." );
        return;
      }
      self._notificationListeners[ theNotification ].push( theListener );
      if ( self._traceNotifications ) {
        console.log( "Adding listener " + theListener + " for notification " +
          theNotification );
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
    self.removeListenerForNotification = function( theNotification, theListener ) {
      if ( !self._notificationListeners[ theNotification ] ) {
        console.log( theNotification + " has not been registered." );
        return;
      }
      var i = self._notificationListeners[ theNotification ].indexOf( theListener );
      if ( self._traceNotifications ) {
        console.log( "Removing listener " + theListener + " (index: " + i +
          ") from  notification " + theNotification );
      }
      if ( i > -1 ) {
        self._notificationListeners[ theNotification ].splice( i, 1 );
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
    self.registerNotification = function( theNotification, async ) {
      if ( typeof self._notificationListeners[ theNotification ] === "undefined" ) {
        self._notificationListeners[ theNotification ] = [];
        self._notificationListeners[ theNotification ]._useAsyncNotifications = (
          typeof async !== "undefined" ? async : true );
      }
      if ( self._traceNotifications ) {
        console.log( "Registering notification " + theNotification );
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
    self.notify = function( theNotification, args ) {
      if ( !self._notificationListeners[ theNotification ] ) {
        console.log( theNotification + " has not been registered." );
        return;
      }
      if ( self._traceNotifications ) {
        console.log( "Notifying " + self._notificationListeners[ theNotification ].length +
          " listeners for " + theNotification + " ( " + args + " ) " );
      }
      var async = self._notificationListeners[ theNotification ]._useAsyncNotifications;
      var notifyListener = function( theListener, theNotification, args ) {
        return function() {
          theListener( self, theNotification, args );
        };
      };
      for ( var i = 0; i < self._notificationListeners[ theNotification ].length; i++ ) {
        if ( async ) {
          setTimeout( notifyListener( self._notificationListeners[ theNotification ][
            i
          ], theNotification, args ), 0 );
        } else {
          ( notifyListener( self._notificationListeners[ theNotification ][ i ],
            theNotification, args ) )();
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
    self.notifyMostRecent = function( theNotification, args ) {
      if ( !self._notificationListeners[ theNotification ] ) {
        console.log( theNotification + " has not been registered." );
        return;
      }
      if ( self._traceNotifications ) {
        console.log( "Notifying " + self._notificationListeners[ theNotification ].length +
          " listeners for " + theNotification + " ( " + args + " ) " );
      }
      var async = self._notificationListeners[ theNotification ]._useAsyncNotifications;
      var i = self._notificationListeners[ theNotification ].length - 1;
      if ( i >= 0 ) {
        if ( async ) {
          setTimeout( function() {
            self._notificationListeners[ theNotification ][ i ]( self,
              theNotification, args );
          }, 0 );
        } else {
          self._notificationListeners[ theNotification ][ i ]( self, theNotification,
            args );
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
    self.defineProperty = function( propertyName, propertyOptions ) {
      var options = {
        default: undefined,
        read: true,
        write: true,
        get: null,
        set: null,
        selfDiscover: true,
        prefix: "",
        configurable: true,
        backingVariable: true
      };
      // private properties are handled differently -- we want to be able to search for
      // _getPrivateProperty, not get_privateProperty
      if ( propertyName.substr( 0, 1 ) === "_" ) {
        options.prefix = "_";
      }
      // allow other potential prefixes
      if ( options.prefix !== "" ) {
        if ( propertyName.substr( 0, 1 ) === options.prefix ) {
          propertyName = propertyName.substr( 1 );
        }
      }
      // merge our default options with the user options
      for ( var property in propertyOptions ) {
        if ( propertyOptions.hasOwnProperty( property ) ) {
          options[ property ] = propertyOptions[ property ];
        }
      }
      // Capital Camel Case our function names
      var fnName = propertyName.substr( 0, 1 ).toUpperCase() + propertyName.substr( 1 );
      var getFnName = options.prefix + "get" + fnName,
        setFnName = options.prefix + "set" + fnName,
        _propertyName = options.prefix + "_" + propertyName,
        _y_getFnName = options.prefix + "_y_get" + fnName,
        _y_setFnName = options.prefix + "_y_set" + fnName,
        _y__getFnName = options.prefix + "_y__get" + fnName,
        _y__setFnName = options.prefix + "_y__set" + fnName;
      // if get/set are not specified, we'll attempt to self-discover them
      if ( options.get === null && options.selfDiscover ) {
        if ( typeof self[ getFnName ] === 'function' ) {
          options.get = self[ getFnName ];
        }
      }
      if ( options.set === null && options.selfDiscover ) {
        if ( typeof self[ setFnName ] === 'function' ) {
          options.set = self[ setFnName ];
        }
      }
      // create the private variable
      if ( options.backingVariable ) {
        self[ _propertyName ] = options.default;
      }
      if ( !options.read && !options.write ) {
        return; // not read/write, so nothing more.
      }
      var defPropOptions = {
        configurable: options.configurable
      };
      if ( options.read ) {
        self[ _y__getFnName ] = options.get;
        self[ _y_getFnName ] = function() {
          // if there is a getter, use it
          if ( typeof self[ _y__getFnName ] === 'function' ) {
            return self[ _y__getFnName ]( self[ _propertyName ] );
          }
          // otherwise return the private variable
          else {
            return self[ _propertyName ];
          }
        };
        if ( typeof self[ getFnName ] === 'undefined' ) {
          self[ getFnName ] = self[ _y_getFnName ];
        }
        defPropOptions.get = self[ _y_getFnName ];
      }
      if ( options.write ) {
        self[ _y__setFnName ] = options.set;
        self[ _y_setFnName ] = function( v ) {
          var oldV = self[ _propertyName ];
          if ( typeof self[ _y__setFnName ] === 'function' ) {
            self[ _y__setFnName ]( v, oldV );
          } else {
            self[ _propertyName ] = v;
          }
        };
        if ( typeof self[ setFnName ] === 'undefined' ) {
          self[ setFnName ] = self[ _y_setFnName ];
        }
        defPropOptions.set = self[ _y_setFnName ];
      }
      Object.defineProperty( self, propertyName, defPropOptions );
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
    self.defineObservableProperty = function( propertyName, propertyOptions ) {
      // set the default options and copy the specified options
      var options = {
        observable: true,
        notification: propertyName + "Changed",
        default: undefined,
        read: true,
        write: true,
        get: null,
        validate: null,
        set: null,
        selfDiscover: true,
        notifyAlways: false,
        prefix: "",
        configurable: true
      };
      // private properties are handled differently -- we want to be able to search for
      // _getPrivateProperty, not get_privateProperty
      if ( propertyName.substr( 0, 1 ) === "_" ) {
        options.prefix = "_";
      }
      // allow other potential prefixes
      if ( options.prefix !== "" ) {
        if ( propertyName.substr( 0, 1 ) === options.prefix ) {
          propertyName = propertyName.substr( 1 );
        }
      }
      var fnName = propertyName.substr( 0, 1 ).toUpperCase() + propertyName.substr( 1 );
      var getObservableFnName = options.prefix + "getObservable" + fnName,
        setObservableFnName = options.prefix + "setObservable" + fnName,
        validateObservableFnName = options.prefix + "validateObservable" + fnName,
        _y_propertyName = options.prefix + "_y_" + propertyName,
        _y_getFnName = options.prefix + "_y_get" + fnName,
        _y_setFnName = options.prefix + "_y_set" + fnName,
        _y_validateFnName = options.prefix + "_y_validate" + fnName,
        _y__getFnName = options.prefix + "_y__get" + fnName,
        _y__setFnName = options.prefix + "_y__set" + fnName,
        _y__validateFnName = options.prefix + "_y__validate" + fnName;
      for ( var property in propertyOptions ) {
        if ( propertyOptions.hasOwnProperty( property ) ) {
          options[ property ] = propertyOptions[ property ];
        }
      }
      // if get/set are not specified, we'll attempt to self-discover them
      if ( options.get === null && options.selfDiscover ) {
        if ( typeof self[ getObservableFnName ] === 'function' ) {
          options.get = self[ getObservableFnName ];
        }
      }
      if ( options.set === null && options.selfDiscover ) {
        if ( typeof self[ setObservableFnName ] === 'function' ) {
          options.set = self[ setObservableFnName ];
        }
      }
      if ( options.validate === null && options.selfDiscover ) {
        if ( typeof self[ validateObservableFnName ] === 'function' ) {
          options.validate = self[ validateObservableFnName ];
        }
      }
      // if the property is observable, register its notification
      if ( options.observable ) {
        self.registerNotification( options.notification );
      }
      // create the private variable; __ here to avoid self-defined _
      self[ _y_propertyName ] = options.default;
      if ( !options.read && !options.write ) {
        return; // not read/write, so nothing more.
      }
      var defPropOptions = {
        configurable: true
      };
      if ( options.read ) {
        self[ _y__getFnName ] = options.get;
        self[ _y_getFnName ] = function() {
          // if there is a getter, use it
          if ( typeof self[ _y__getFnName ] === 'function' ) {
            return self[ _y__getFnName ]( self[ _y_propertyName ] );
          }
          // otherwise return the private variable
          else {
            return self[ _y_propertyName ];
          }
        };
        defPropOptions.get = self[ _y_getFnName ];
      }
      if ( options.write ) {
        self[ _y__validateFnName ] = options.validate;
        self[ _y__setFnName ] = options.set;
        self[ _y_setFnName ] = function( v ) {
          var oldV = self[ _y_propertyName ];
          var valid = true;
          if ( typeof self[ _y__validateFnName ] === 'function' ) {
            valid = self[ _y__validateFnName ]( v );
          }
          if ( valid ) {
            if ( typeof self[ _y__setFnName ] === 'function' ) {
              self[ _y_propertyName ] = self[ _y__setFnName ]( v, oldV );
            } else {
              self[ _y_propertyName ] = v;
            }
            if ( v !== oldV || options.notifyAlways ) {
              if ( options.observable ) {
                self.notify( options.notification, {
                  "new": v,
                  "old": oldV
                } );
              }
            }
          }
        };
        defPropOptions.set = self[ _y_setFnName ];
      }
      Object.defineProperty( self, propertyName, defPropOptions );
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
    self._autoInit = function() {
      if ( arguments.length > 0 ) {
        if ( arguments.length == 1 ) {
          // chances are this is an initWithOptions, but make sure the incoming parameter is an object
          if ( typeof arguments[ 0 ] === "object" ) {
            if ( typeof self.initWithOptions !== "undefined" ) {
              return self.initWithOptions.apply( self, arguments );
            } else {
              return self.init.apply( self, arguments );
            }
          } else {
            return self.init.apply( self, arguments );
          }
        } else {
          return self.init.apply( self, arguments );
        }
      }
    };
    /**
     *
     * Readies an object to be destroyed. The base object only clears the notifications and
     * the attached listeners.
     * @method destroy
     */
    self.destroy = function() {
      // clear any listeners.
      self._notificationListeners = {};
      self._tagListeners = {};
      self._constructObjectCategories( BaseObject.ON_DESTROY_CATEGORY );
      // ready to be destroyed
    };
    // self-categorize
    self._constructObjectCategories();
    // call auto init
    self._autoInit.apply( self, arguments );
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
  BaseObject._objectCategories = [ {}, {}, {} ];
  BaseObject.ON_CREATE_CATEGORY = 0;
  BaseObject.ON_INIT_CATEGORY = 1;
  BaseObject.ON_DESTROY_CATEGORY = 2;
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
  BaseObject.registerCategoryConstructor = function registerCategoryConstructor(
    options ) {
    if ( typeof options === "undefined" ) {
      throw new Error(
        "registerCategoryConstructor requires a class name and a constructor method." );
    }
    if ( typeof options.class !== "undefined" ) {
      throw new Error( "registerCategoryConstructor requires options.class" );
    }
    if ( typeof options.method !== "undefined" ) {
      throw new Error( "registerCategoryConstructor requires options.method" );
    }
    var className = options.class;
    var method = options.method;
    var priority = BaseObject.ON_CREATE_CATEGORY;
    if ( typeof options.priority !== "undefined" ) {
      priority = options.priority;
    }
    if ( typeof BaseObject._objectCategories[ priority ][ className ] === "undefined" ) {
      BaseObject._objectCategories[ priority ][ className ] = [];
    }
    BaseObject._objectCategories[ priority ][ className ].push( method );
  };
  BaseObject.meta = {
    version: '00.04.900',
    class: _className,
    autoInitializable: true,
    categorizable: true
  };
  return BaseObject;
} );

define( 'Q',[],function() {
  return window.Q;
} );

/**
 *
 * FileManager implements methods that interact with the HTML5 API
 *
 * @module fileManager.js
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
         onevar:false,
         loopfunc:true
 */
/*global define, Q, LocalFileSystem, console*/
define( 'yasmf/util/fileManager',[ "Q", "yasmf/util/object" ], function( Q, BaseObject ) {
  var IN_YASMF = true;
  return ( function( Q, BaseObject, globalContext ) {
    /**
     * Defined by Q, actually, but defined here to make type handling nicer
     * @typedef {{}} Promise
     */
    var DEBUG = false;
    /**
     * Requests a quota from the file system
     * @method _requestQuota
     * @private
     * @param  {*} fileSystemType    PERSISTENT or TEMPORARY
     * @param  {Number} requestedDataSize The quota we're asking for
     * @return {Promise}                   The promise
     */
    function _requestQuota( fileSystemType, requestedDataSize ) {
      var deferred = Q.defer();
      if ( DEBUG ) {
        console.log( [ "_requestQuota: ", fileSystemType, requestedDataSize ].join(
          " " ) )
      }
      try {
        // attempt to ask for a quota
        var PERSISTENT = ( typeof LocalFileSystem !== "undefined" ) ?
          LocalFileSystem.PERSISTENT : window.PERSISTENT;
        // Chrome has `webkitPersistentStorage` and `navigator.webkitTemporaryStorage`
        var storageInfo = fileSystemType == PERSISTENT ? navigator.webkitPersistentStorage :
          navigator.webkitTemporaryStorage;
        if ( storageInfo ) {
          // now make sure we can request a quota
          if ( storageInfo.requestQuota ) {
            // request the quota
            storageInfo.requestQuota( requestedDataSize, function success(
              grantedBytes ) {
              if ( DEBUG ) {
                console.log( [ "_requestQuota: quota granted: ", fileSystemType,
                  grantedBytes
                ].join( " " ) )
              }
              deferred.resolve( grantedBytes );
            }, function failure( anError ) {
              if ( DEBUG ) {
                console.log( [ "_requestQuota: quota rejected: ", fileSystemType,
                  requestedDataSize, anError
                ].join( " " ) )
              }
              deferred.reject( anError );
            } );
          } else {
            // not everything supports asking for a quota -- like Cordova.
            // Instead, let's assume we get permission
            if ( DEBUG ) {
              console.log( [
                "_requestQuota: couldn't request quota -- no requestQuota: ",
                fileSystemType, requestedDataSize
              ].join( " " ) )
            }
            deferred.resolve( requestedDataSize );
          }
        } else {
          if ( DEBUG ) {
            console.log( [
              "_requestQuota: couldn't request quota -- no storageInfo: ",
              fileSystemType, requestedDataSize
            ].join( " " ) )
          }
          deferred.resolve( requestedDataSize );
        }
      } catch ( anError ) {
        deferred.reject( anError );
      }
      return deferred.promise;
    }
    /**
     * Request a file system with the requested size (obtained first by getting a quota)
     * @method _requestFileSystem
     * @private
     * @param  {*} fileSystemType    TEMPORARY or PERSISTENT
     * @param  {Number} requestedDataSize The quota
     * @return {Promise}                   The promise
     */
    function _requestFileSystem( fileSystemType, requestedDataSize ) {
      var deferred = Q.defer();
      if ( DEBUG ) {
        console.log( [ "_requestFileSystem: ", fileSystemType, requestedDataSize ].join(
          " " ) )
      }
      try {
        // fix issue #2 by chasen where using `webkitRequestFileSystem` was having problems
        // on Android 4.2.2
        var requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
        requestFileSystem( fileSystemType, requestedDataSize, function success(
          theFileSystem ) {
          if ( DEBUG ) {
            console.log( [ "_requestFileSystem: got a file system", theFileSystem ]
              .join( " " ) )
          }
          deferred.resolve( theFileSystem );
        }, function failure( anError ) {
          if ( DEBUG ) {
            console.log( [ "_requestFileSystem: couldn't get a file system",
              fileSystemType
            ].join( " " ) )
          }
          deferred.reject( anError );
        } );
      } catch ( anError ) {
        deferred.reject( anError );
      }
      return deferred.promise;
    }
    /**
     * Resolves theURI to a fileEntry or directoryEntry, if possible.
     * If `theURL` contains `private` or `localhost` as its first element, it will be removed. If
     * `theURL` does not have a URL scheme, `file://` will be assumed.
     * @method _resolveLocalFileSystemURL
     * @private
     * @param  {String} theURL the path, should start with file://, but if it doesn't we'll add it.
     */
    function _resolveLocalFileSystemURL( theURL ) {
      var deferred = Q.defer();
      if ( DEBUG ) {
        console.log( [ "_resolveLocalFileSystemURL: ", theURL ].join( " " ) )
      }
      try {
        // split the parts of the URL
        var parts = theURL.split( ":" );
        var protocol, path;
        // can only have two parts
        if ( parts.length > 2 ) {
          throw new Error( "The URI is not well-formed; missing protocol: " +
            theURL );
        }
        // if only one part, we assume `file` as the protocol
        if ( parts.length < 2 ) {
          protocol = "file";
          path = parts[ 0 ];
        } else {
          protocol = parts[ 0 ];
          path = parts[ 1 ];
        }
        // split the path components
        var pathComponents = path.split( "/" );
        var newPathComponents = [];
        // iterate over each component and trim as we go
        pathComponents.forEach( function( part ) {
          part = part.trim();
          if ( part !== "" ) { // remove /private if it is the first item in the new array, for iOS sake
            if ( !( ( part === "private" || part === "localhost" ) &&
              newPathComponents.length === 0 ) ) {
              newPathComponents.push( part );
            }
          }
        } );
        // rejoin the path components
        var theNewURI = newPathComponents.join( "/" );
        // add the protocol
        theNewURI = protocol + ":///" + theNewURI;
        // and resolve the URL.
        window.resolveLocalFileSystemURL( theNewURI, function( theEntry ) {
          deferred.resolve( theEntry );
        }, function( anError ) {
          deferred.reject( anError );
        } );
      } catch ( anError ) {
        deferred.reject( anError );
      }
      return deferred.promise;
    }
    /**
     * @typedef {{}} DirectoryEntry
     * HTML5 File API Directory Type
     */
    /**
     * Returns a directory entry based on the path from the parent using
     * the specified options, if specified. `options` takes the form:
     * ` {create: true/false, exclusive true/false }`
     * @method _getDirectoryEntry
     * @private
     * @param  {DirectoryEntry} parent  The parent that path is relative from (or absolute)
     * @param  {String} path    The relative or absolute path or a {DirectoryEntry}
     * @param  {Object} options The options (that is, create the directory if it doesn't exist, etc.)
     * @return {Promise}         The promise
     */
    function _getDirectoryEntry( parent, path, options ) {
      if ( DEBUG ) {
        console.log( [ "_getDirectoryEntry:", parent, path, options ].join( " " ) )
      }
      var deferred = Q.defer();
      try {
        if ( typeof path === "object" ) {
          deferred.resolve( path );
        } else {
          parent.getDirectory( path, options || {}, function success(
            theDirectoryEntry ) {
            deferred.resolve( theDirectoryEntry );
          }, function failure( anError ) {
            deferred.reject( anError );
          } );
        }
      } catch ( anError ) {
        deferred.reject( anError );
      }
      return deferred.promise;
    }
    /**
     * Returns a file entry based on the path from the parent using
     * the specified options. `options` takes the form of `{ create: true/false, exclusive: true/false}`
     * @method getFileEntry
     * @private
     * @param  {DirectoryEntry} parent  The parent that path is relative from (or absolute)
     * @param  {String} path    The relative or absolute path
     * @param  {Object} options The options (that is, create the file if it doesn't exist, etc.)
     * @return {Promise}         The promise
     */
    function _getFileEntry( parent, path, options ) {
      if ( DEBUG ) {
        console.log( [ "_getFileEntry:", parent, path, options ].join( " " ) )
      }
      var deferred = Q.defer();
      try {
        if ( typeof path === "object" ) {
          deferred.resolve( path );
        } else {
          parent.getFile( path, options || {}, function success( theFileEntry ) {
            deferred.resolve( theFileEntry );
          }, function failure( anError ) {
            deferred.reject( anError );
          } );
        }
      } catch ( anError ) {
        deferred.reject( anError );
      }
      return deferred.promise;
    }
    /**
     * @typedef {{}} FileEntry
     * HTML5 File API File Entry
     */
    /**
     * Returns a file object based on the file entry.
     * @method _getFileObject
     * @private
     * @param  {FileEntry} fileEntry The file Entry
     * @return {Promise}           The Promise
     */
    function _getFileObject( fileEntry ) {
      if ( DEBUG ) {
        console.log( [ "_getFileObject:", fileEntry ].join( " " ) )
      }
      var deferred = Q.defer();
      try {
        fileEntry.file( function success( theFile ) {
          deferred.resolve( theFile );
        }, function failure( anError ) {
          deferred.reject( anError );
        } );
      } catch ( anError ) {
        deferred.reject( anError );
      }
      return deferred.promise;
    }
    /**
     * Reads the file contents from a file object. readAsKind indicates how
     * to read the file ("Text", "DataURL", "BinaryString", "ArrayBuffer").
     * @method _readFileContents
     * @private
     * @param  {File} fileObject File to read
     * @param  {String} readAsKind "Text", "DataURL", "BinaryString", "ArrayBuffer"
     * @return {Promise}            The Promise
     */
    function _readFileContents( fileObject, readAsKind ) {
      if ( DEBUG ) {
        console.log( [ "_readFileContents:", fileObject, readAsKind ].join( " " ) )
      }
      var deferred = Q.defer();
      try {
        var fileReader = new FileReader();
        fileReader.onloadend = function( e ) {
          deferred.resolve( e.target.result );
        };
        fileReader.onerror = function( anError ) {
          deferred.reject( anError );
        };
        fileReader[ "readAs" + readAsKind ]( fileObject );
      } catch ( anError ) {
        deferred.reject( anError );
      }
      return deferred.promise;
    }
    /**
     * Creates a file writer for the file entry; `fileEntry` must exist
     * @method _createFileWriter
     * @private
     * @param  {FileEntry} fileEntry The file entry to write to
     * @return {Promise}           the Promise
     */
    function _createFileWriter( fileEntry ) {
      if ( DEBUG ) {
        console.log( [ "_createFileWriter:", fileEntry ].join( " " ) )
      }
      var deferred = Q.defer();
      try {
        var fileWriter = fileEntry.createWriter( function success( theFileWriter ) {
          deferred.resolve( theFileWriter );
        }, function failure( anError ) {
          deferred.reject( anError );
        } );
      } catch ( anError ) {
        deferred.reject( anError );
      }
      return deferred.promise;
    }
    /**
     * @typedef {{}} FileWriter
     * HTML5 File API File Writer Type
     */
    /**
     * Write the contents to the fileWriter; `contents` should be a Blob.
     * @method _writeFileContents
     * @private
     * @param  {FileWriter} fileWriter Obtained from _createFileWriter
     * @param  {*} contents   The contents to write
     * @return {Promise}            the Promise
     */
    function _writeFileContents( fileWriter, contents ) {
      if ( DEBUG ) {
        console.log( [ "_writeFileContents:", fileWriter, contents ].join( " " ) )
      }
      var deferred = Q.defer();
      try {
        fileWriter.onwrite = function( e ) {
          fileWriter.onwrite = function( e ) {
            deferred.resolve( e );
          };
          fileWriter.write( contents );
        };
        fileWriter.onError = function( anError ) {
          deferred.reject( anError );
        };
        fileWriter.truncate( 0 ); // clear out the contents, first
      } catch ( anError ) {
        deferred.reject( anError );
      }
      return deferred.promise;
    }
    /**
     * Copy the file to the specified parent directory, with an optional new name
     * @method _copyFile
     * @private
     * @param  {FileEntry} theFileEntry            The file to copy
     * @param  {DirectoryEntry} theParentDirectoryEntry The parent directory to copy the file to
     * @param  {String} theNewName              The new name of the file ( or undefined simply to copy )
     * @return {Promise}                         The Promise
     */
    function _copyFile( theFileEntry, theParentDirectoryEntry, theNewName ) {
      if ( DEBUG ) {
        console.log( [ "_copyFile:", theFileEntry, theParentDirectoryEntry,
          theNewName
        ].join( " " ) )
      }
      var deferred = Q.defer();
      try {
        theFileEntry.copyTo( theParentDirectoryEntry, theNewName, function success(
          theNewFileEntry ) {
          deferred.resolve( theNewFileEntry );
        }, function failure( anError ) {
          deferred.reject( anError );
        } );
      } catch ( anError ) {
        deferred.reject( anError );
      }
      return deferred.promise;
    }
    /**
     * Move the file to the specified parent directory, with an optional new name
     * @method _moveFile
     * @private
     * @param  {FileEntry} theFileEntry            The file to move or rename
     * @param  {DirectoryEntry} theParentDirectoryEntry The parent directory to move the file to (or the same as the file in order to rename)
     * @param  {String} theNewName              The new name of the file ( or undefined simply to move )
     * @return {Promise}                         The Promise
     */
    function _moveFile( theFileEntry, theParentDirectoryEntry, theNewName ) {
      if ( DEBUG ) {
        console.log( [ "_moveFile:", theFileEntry, theParentDirectoryEntry,
          theNewName
        ].join( " " ) )
      }
      var deferred = Q.defer();
      try {
        theFileEntry.moveTo( theParentDirectoryEntry, theNewName, function success(
          theNewFileEntry ) {
          deferred.resolve( theNewFileEntry );
        }, function failure( anError ) {
          deferred.reject( anError );
        } );
      } catch ( anError ) {
        deferred.reject( anError );
      }
      return deferred.promise;
    }
    /**
     * Remove the file from the file system
     * @method _removeFile
     * @private
     * @param  {FileEntry} theFileEntry The file to remove
     * @return {Promise}              The Promise
     */
    function _removeFile( theFileEntry ) {
      if ( DEBUG ) {
        console.log( [ "_removeFile:", theFileEntry ].join( " " ) )
      }
      var deferred = Q.defer();
      try {
        theFileEntry.remove( function success() {
          deferred.resolve();
        }, function failure( anError ) {
          deferred.reject( anError );
        } );
      } catch ( anError ) {
        deferred.reject( anError );
      }
      return deferred.promise;
    }
    /**
     * Copies a directory to the specified directory, with an optional new name. The directory
     * is copied recursively.
     * @method _copyDirectory
     * @private
     * @param  {DirectoryEntry} theDirectoryEntry       The directory to copy
     * @param  {DirectoryEntry} theParentDirectoryEntry The parent directory to copy the first directory to
     * @param  {String} theNewName              The optional new name for the directory
     * @return {Promise}                         A promise
     */
    function _copyDirectory( theDirectoryEntry, theParentDirectoryEntry, theNewName ) {
      if ( DEBUG ) {
        console.log( [ "_copyDirectory:", theDirectoryEntry,
          theParentDirectoryEntry,
          theNewName
        ].join( " " ) )
      }
      var deferred = Q.defer();
      try {
        theDirectoryEntry.copyTo( theParentDirectoryEntry, theNewName, function success(
          theNewDirectoryEntry ) {
          deferred.resolve( theNewDirectoryEntry );
        }, function failure( anError ) {
          deferred.reject( anError );
        } );
      } catch ( anError ) {
        deferred.reject( anError );
      }
      return deferred.promise;
    }
    /**
     * Moves a directory to the specified directory, with an optional new name. The directory
     * is moved recursively.
     * @method _moveDirectory
     * @private
     * @param  {DirectoryEntry} theDirectoryEntry       The directory to move
     * @param  {DirectoryEntry} theParentDirectoryEntry The parent directory to move the first directory to
     * @param  {String} theNewName              The optional new name for the directory
     * @return {Promise}                         A promise
     */
    function _moveDirectory( theDirectoryEntry, theParentDirectoryEntry, theNewName ) {
      if ( DEBUG ) {
        console.log( [ "_moveDirectory:", theDirectoryEntry,
          theParentDirectoryEntry,
          theNewName
        ].join( " " ) )
      }
      var deferred = Q.defer();
      try {
        theDirectoryEntry.moveTo( theParentDirectoryEntry, theNewName, function success(
          theNewDirectoryEntry ) {
          deferred.resolve( theNewDirectoryEntry );
        }, function failure( anError ) {
          deferred.reject( anError );
        } );
      } catch ( anError ) {
        deferred.reject( anError );
      }
      return deferred.promise;
    }
    /**
     * Removes a directory from the file system. If recursively is true, the directory is removed
     * recursively.
     * @method _removeDirectory
     * @private
     * @param  {DirectoryEntry} theDirectoryEntry The directory to remove
     * @param  {Boolean} recursively       If true, remove recursively
     * @return {Promise}                   The Promise
     */
    function _removeDirectory( theDirectoryEntry, recursively ) {
      if ( DEBUG ) {
        console.log( [ "_removeDirectory:", theDirectoryEntry, "recursively",
          recursively
        ].join( " " ) )
      }
      var deferred = Q.defer();
      try {
        if ( !recursively ) {
          theDirectoryEntry.remove( function success() {
            deferred.resolve();
          }, function failure( anError ) {
            deferred.reject( anError );
          } );
        } else {
          theDirectoryEntry.removeRecursively( function success() {
            deferred.resolve();
          }, function failure( anError ) {
            deferred.reject( anError );
          } );
        }
      } catch ( anError ) {
        deferred.reject( anError );
      }
      return deferred.promise;
    }
    /**
     * Reads the contents of a directory
     * @method _readDirectoryContents
     * @private
     * @param  {DirectoryEntry} theDirectoryEntry The directory to list
     * @return {Promise}                   The promise
     */
    function _readDirectoryContents( theDirectoryEntry ) {
      if ( DEBUG ) {
        console.log( [ "_readDirectoryContents:", theDirectoryEntry ].join( " " ) )
      }

      function readEntries() {
        directoryReader.readEntries( function success( theEntries ) {
          if ( !theEntries.length ) {
            deferred.resolve( entries );
          } else {
            entries = entries.concat( Array.prototype.slice.call( theEntries || [],
              0 ) );
            readEntries();
          }
        }, function failure( anError ) {
          deferred.reject( anError );
        } );
      }
      var deferred = Q.defer();
      try {
        var directoryReader = theDirectoryEntry.createReader();
        var entries = [];
        readEntries();
      } catch ( anError ) {
        deferred.reject( anError );
      }
      return deferred.promise;
    }
    /**
     * @class FileManager
     */
    var _className = "UTIL.FileManager";
    var FileManager = function() {
      var self;
      // determine if we have a `BaseObject` available or not
      var hasBaseObject = ( typeof BaseObject !== "undefined" );
      if ( hasBaseObject ) {
        // if we do, subclass it
        self = new BaseObject();
        self.subclass( _className );
        self.registerNotification( "changedCurrentWorkingDirectory" );
      } else {
        // otherwise, base off {}
        self = {};
      }
      // get the persistent and temporary filesystem constants
      self.PERSISTENT = ( typeof LocalFileSystem !== "undefined" ) ?
        LocalFileSystem.PERSISTENT : window.PERSISTENT;
      self.TEMPORARY = ( typeof LocalFileSystem !== "undefined" ) ?
        LocalFileSystem.TEMPORARY : window.TEMPORARY;
      // determine the various file types we support
      self.FILETYPE = {
        TEXT: "Text",
        DATA_URL: "DataURL",
        BINARY: "BinaryString",
        ARRAY_BUFFER: "ArrayBuffer"
      };
      /**
       * Returns the value of the global `DEBUG` variable.
       * @method getGlobalDebug
       * @returns {Boolean}
       */
      self.getGlobalDebug = function() {
        return DEBUG;
      };
      /**
       * Sets the global DEBUG variable. If `true`, debug messages are logged to the console.
       * @method setGlobalDebug
       * @param {Boolean} debug
       */
      self.setGlobalDebug = function( debug ) {
        DEBUG = debug;
      };
      /**
       * @property globalDebug
       * @type {Boolean} If `true`, logs messages to console as operations occur.
       */
      Object.defineProperty( self, "globalDebug", {
        get: self.getGlobalDebug,
        set: self.setGlobalDebug,
        configurable: true
      } );
      /**
       * the fileSystemType can either be `self.PERSISTENT` or `self.TEMPORARY`, and is only
       * set during an `init` operation. It cannot be set at any other time.
       * @property fileSystemType
       * @type {FileSystem}
       */
      self._fileSystemType = null; // can only be changed during INIT
      self.getFileSystemType = function() {
        return self._fileSystemType;
      };
      Object.defineProperty( self, "fileSystemType", {
        get: self.getFileSystemType,
        configurable: true
      } );
      /**
       * The requested quota -- stored for future reference, since we ask for it
       * specifically during an `init` operation. It cannot be changed.
       * @property requestedQuota
       * @type {Number}
       */
      self._requestedQuota = 0; // can only be changed during INIT
      self.getRequestedQuota = function() {
        return self._requestedQuota;
      };
      Object.defineProperty( self, "requestedQuota", {
        get: self.getRequestedQuota,
        configurable: true
      } );
      /**
       * The actual quota obtained from the system. It cannot be changed, and is
       * only obtained during `init`. The result does not have to match the
       * `requestedQuota`. If it doesn't match, it may be representative of the
       * actual space available, depending on the platform
       * @property actualQuota
       * @type {Number}
       */
      self._actualQuota = 0;
      self.getActualQuota = function() {
        return self._actualQuota;
      };
      Object.defineProperty( self, "actualQuota", {
        get: self.getActualQuota,
        configurable: true
      } );
      /**
       * @typedef {{}} FileSystem
       * HTML5 File API File System
       */
      /**
       * The current filesystem -- either the temporary or persistent one; it can't be changed
       * @property fileSystem
       * @type {FileSystem}
       */
      self._fileSystem = null;
      self.getFileSystem = function() {
        return self._fileSystem;
      };
      Object.defineProperty( self, "fileSystem", {
        get: self.getFileSystem,
        configurable: true
      } );
      /**
       * Current Working Directory Entry
       * @property cwd
       * @type {DirectoryEntry}
       */
      self._root = null;
      self._cwd = null;
      self.getCurrentWorkingDirectory = function() {
        return self._cwd;
      };
      self.setCurrentWorkingDirectory = function( theCWD ) {
        self._cwd = theCWD;
        if ( hasBaseObject ) {
          self.notify( "changedCurrentWorkingDirectory" );
        }
      };
      Object.defineProperty( self, "cwd", {
        get: self.getCurrentWorkingDirectory,
        set: self.setCurrentWorkingDirectory,
        configurable: true
      } );
      Object.defineProperty( self, "currentWorkingDirectory", {
        get: self.getCurrentWorkingDirectory,
        set: self.setCurrentWorkingDirectory,
        configurable: true
      } );
      /**
       * Current Working Directory stack
       * @property _cwds
       * @private
       * @type {Array}
       */
      self._cwds = [];
      /**
       * Push the current working directory on to the stack
       * @method pushCurrentWorkingDirectory
       */
      self.pushCurrentWorkingDirectory = function() {
        self._cwds.push( self._cwd );
      };
      /**
       * Pop the topmost directory on the stack and change to it
       * @method popCurrentWorkingDirectory
       */
      self.popCurrentWorkingDirectory = function() {
        self.setCurrentWorkingDirectory( self._cwds.pop() );
      };
      /**
       * Resolves a URL to a local file system. If the URL scheme is not present, `file`
       * is assumed.
       * @param {String} theURI The URI to resolve
       */
      self.resolveLocalFileSystemURL = function( theURI ) {
        var deferred = Q.defer();
        _resolveLocalFileSystemURL( theURI ).then( function gotEntry( theEntry ) {
          deferred.resolve( theEntry );
        } ).catch( function( anError ) {
          deferred.reject( anError );
        } ).done();
        return deferred.promise;
      };
      /**
       * Returns the file entry for the given path (useful for
       * getting the full path of a file). `options` is of the
       * form `{create: true/false, exclusive: true/false}`
       * @method getFileEntry
       * @param {String} theFilePath The file path or FileEntry object
       * @param {*} options creation options
       */
      self.getFileEntry = function( theFilePath, options ) {
        var deferred = Q.defer();
        _getFileEntry( self._cwd, theFilePath, options ).then( function gotFileEntry(
          theFileEntry ) {
          deferred.resolve( theFileEntry );
        } ).catch( function( anError ) {
          deferred.reject( anError );
        } ).done();
        return deferred.promise;
      };
      /**
       * Returns the file object for a given file (useful for getting
       * the size of a file); `option` is of the form `{create: true/false, exclusive: true/false}`
       * @method getFile
       * @param {String} theFilePath
       * @param {*} option
       */
      self.getFile = function( theFilePath, options ) {
        return self.getFileEntry( theFilePath, options ).then( _getFileObject );
      };
      /**
       * Returns the directory entry for a given path
       * @method getDirectoryEntry
       * @param {String} theDirectoryPath
       * @param {*} options
       */
      self.getDirectoryEntry = function( theDirectoryPath, options ) {
        var deferred = Q.defer();
        _getDirectoryEntry( self._cwd, theDirectoryPath, options ).then( function gotDirectoryEntry(
          theDirectoryEntry ) {
          deferred.resolve( theDirectoryEntry );
        } ).catch( function( anError ) {
          deferred.reject( anError );
        } ).done();
        return deferred.promise;
      };
      /**
       * returns the URL for a given file
       * @method getFileURL
       * @param {String} theFilePath
       * @param {*} options
       */
      self.getFileURL = function( theFilePath, options ) {
        var deferred = Q.defer();
        _getFileEntry( self._cwd, theFilePath, options ).then( function gotFileEntry(
          theFileEntry ) {
          deferred.resolve( theFileEntry.toURL() );
        } ).catch( function( anError ) {
          deferred.reject( anError );
        } ).done();
        return deferred.promise;
      };
      /**
       * Returns a URL for the given directory
       * @method getDirectoryURL
       * @param {String} thePath
       * @param {*} options
       */
      self.getDirectoryURL = function( thePath, options ) {
        var deferred = Q.defer();
        _getDirectoryEntry( self._cwd, thePath || ".", options ).then( function gotDirectoryEntry(
          theDirectoryEntry ) {
          deferred.resolve( theDirectoryEntry.toURL() );
        } ).catch( function( anError ) {
          deferred.reject( anError );
        } ).done();
        return deferred.promise;
      };
      /**
       * Returns the native URL for an entry by combining the `fullPath` of the entry
       * with the `nativeURL` of the `root` directory if absolute or of the `current`
       * directory if not absolute.
       * @method getNativeURL
       * @param {String} theEntry Path of the file or directory; can also be a File/DirectoryEntry
       */
      self.getNativeURL = function( theEntry ) {
        var thePath = theEntry;
        if ( typeof theEntry !== "string" ) {
          thePath = theEntry.fullPath();
        }
        var isAbsolute = ( thePath.substr( 0, 1 ) === "/" );
        var theRootPath = isAbsolute ? self._root.nativeURL : self.cwd.nativeURL;
        return theRootPath + ( isAbsolute ? "" : "/" ) + thePath;
      };
      /**
       * returns the native file path for a given file
       * @method getNativeFileURL
       * @param {String} theFilePath
       * @param {*} options
       */
      self.getNativeFileURL = function( theFilePath, options ) {
        var deferred = Q.defer();
        _getFileEntry( self._cwd, theFilePath, options ).then( function gotFileEntry(
          theFileEntry ) {
          deferred.resolve( theFileEntry.nativeURL );
        } ).catch( function( anError ) {
          deferred.reject( anError );
        } ).done();
        return deferred.promise;
      };
      /**
       * Returns a URL for the given directory
       * @method getNativeDirectoryURL
       * @param {String} thePath
       * @param {*} options
       */
      self.getNativeDirectoryURL = function( thePath, options ) {
        var deferred = Q.defer();
        _getDirectoryEntry( self._cwd, thePath || ".", options ).then( function gotDirectoryEntry(
          theDirectoryEntry ) {
          deferred.resolve( theDirectoryEntry.nativeURL );
        } ).catch( function( anError ) {
          deferred.reject( anError );
        } ).done();
        return deferred.promise;
      };
      /**
       * Change to an arbitrary directory
       * @method changeDirectory
       * @param  {String} theNewPath The path to the directory, relative to cwd
       * @return {Promise}            The Promise
       */
      self.changeDirectory = function( theNewPath ) {
        var deferred = Q.defer();
        _getDirectoryEntry( self._cwd, theNewPath, {} ).then( function gotDirectory(
          theNewDirectory ) {
          self.cwd = theNewDirectory;
        } ).then( function allDone() {
          deferred.resolve( self );
        } ).catch( function( anError ) {
          deferred.reject( anError );
        } ).done();
        return deferred.promise;
      };
      /**
       * Read an arbitrary file's contents.
       * @method readFileContents
       * @param  {String} theFilePath The path to the file, relative to cwd
       * @param  {Object} options     The options to use when opening the file (such as creating it)
       * @param  {String} readAsKind  How to read the file -- best to use self.FILETYPE.TEXT, etc.
       * @return {Promise}             The Promise
       */
      self.readFileContents = function( theFilePath, options, readAsKind ) {
        var deferred = Q.defer();
        _getFileEntry( self._cwd, theFilePath, options || {} ).then( function gotTheFileEntry(
          theFileEntry ) {
          return _getFileObject( theFileEntry );
        } ).then( function gotTheFileObject( theFileObject ) {
          return _readFileContents( theFileObject, readAsKind || "Text" );
        } ).then( function getTheFileContents( theFileContents ) {
          deferred.resolve( theFileContents );
        } ).catch( function( anError ) {
          deferred.reject( anError );
        } ).done();
        return deferred.promise;
      };
      /**
       * Read an arbitrary directory's entries.
       * @method readDirectoryContents
       * @param  {String} theDirectoryPath The path to the directory, relative to cwd; "." if not specified
       * @param  {Object} options          The options to use when opening the directory (such as creating it)
       * @return {Promise}             The Promise
       */
      self.readDirectoryContents = function( theDirectoryPath, options ) {
        var deferred = Q.defer();
        _getDirectoryEntry( self._cwd, theDirectoryPath || ".", options || {} ).then(
          function gotTheDirectoryEntry( theDirectoryEntry ) {
            return _readDirectoryContents( theDirectoryEntry );
          } ).then( function gotTheDirectoryEntries( theEntries ) {
          deferred.resolve( theEntries );
        } ).catch( function( anError ) {
          deferred.reject( anError );
        } ).done();
        return deferred.promise;
      };
      /**
       * Write data to an arbitrary file
       * @method writeFileContents
       * @param  {String} theFilePath The file name to write to, relative to cwd
       * @param  {Object} options     The options to use when opening the file
       * @param  {*} theData     The data to write
       * @return {Promise}             The Promise
       */
      self.writeFileContents = function( theFilePath, options, theData ) {
        var deferred = Q.defer();
        _getFileEntry( self._cwd, theFilePath, options || {
          create: true,
          exclusive: false
        } ).then( function gotTheFileEntry( theFileEntry ) {
          return _createFileWriter( theFileEntry );
        } ).then( function gotTheFileWriter( theFileWriter ) {
          return _writeFileContents( theFileWriter, theData );
        } ).then( function allDone() {
          deferred.resolve( self );
        } ).catch( function( anError ) {
          deferred.reject( anError );
        } ).done();
        return deferred.promise;
      };
      /**
       * Creates an arbitrary directory
       * @method createDirectory
       * @param  {String} theDirectoryPath The path, relative to cwd
       * @return {Promise}                  The Promise
       */
      self.createDirectory = function( theDirectoryPath ) {
        var deferred = Q.defer();
        _getDirectoryEntry( self._cwd, theDirectoryPath, {
          create: true,
          exclusive: false
        } ).then( function gotDirectory( theNewDirectory ) {
          deferred.resolve( theNewDirectory );
        } ).catch( function( anError ) {
          deferred.reject( anError );
        } ).done();
        return deferred.promise;
      };
      /**
       * Copies a file to a new directory, with an optional new name
       * @method copyFile
       * @param  {String} sourceFilePath      Path to file, relative to cwd
       * @param  {String} targetDirectoryPath Path to new directory, relative to cwd
       * @param  {String} withNewName         New name, if desired
       * @return {Promise}                     The Promise
       */
      self.copyFile = function( sourceFilePath, targetDirectoryPath, withNewName ) {
        var deferred = Q.defer();
        var theFileToCopy;
        _getFileEntry( self._cwd, sourceFilePath, {} ).then( function gotFileEntry(
          aFileToCopy ) {
          theFileToCopy = aFileToCopy;
          return _getDirectoryEntry( self._cwd, targetDirectoryPath, {} );
        } ).then( function gotDirectoryEntry( theTargetDirectory ) {
          return _copyFile( theFileToCopy, theTargetDirectory, withNewName );
        } ).then( function allDone( theNewFileEntry ) {
          deferred.resolve( theNewFileEntry );
        } ).catch( function( anError ) {
          deferred.reject( anError );
        } ).done();
        return deferred.promise;
      };
      /**
       * Copies a directory to a new directory, with an optional new name
       * @method copyDirectory
       * @param  {String} sourceDirectoryPath Path to directory, relative to cwd
       * @param  {String} targetDirectoryPath Path to new directory, relative to cwd
       * @param  {String} withNewName         New name, if desired
       * @return {Promise}                     The Promise
       */
      self.copyDirectory = function( sourceDirectoryPath, targetDirectoryPath,
        withNewName ) {
        var deferred = Q.defer();
        var theDirectoryToCopy;
        _getDirectoryEntry( self._cwd, sourceDirectoryPath, {} ).then( function gotSourceDirectoryEntry(
          sourceDirectoryEntry ) {
          theDirectoryToCopy = sourceDirectoryEntry;
          return _getDirectoryEntry( self._cwd, targetDirectoryPath, {} );
        } ).then( function gotTargetDirectoryEntry( theTargetDirectory ) {
          return _copyDirectory( theDirectoryToCopy, theTargetDirectory,
            withNewName );
        } ).then( function allDone( theNewDirectoryEntry ) {
          deferred.resolve( theNewDirectoryEntry );
        } ).catch( function( anError ) {
          deferred.reject( anError );
        } ).done();
        return deferred.promise;
      };
      /**
       * @method moveFile
       * Moves a file to a new directory, with an optional new name
       * @param  {String} sourceFilePath      Path to file, relative to cwd
       * @param  {String} targetDirectoryPath Path to new directory, relative to cwd
       * @param  {String} withNewName         New name, if desired
       * @return {Promise}                     The Promise
       */
      self.moveFile = function( sourceFilePath, targetDirectoryPath, withNewName ) {
        var deferred = Q.defer();
        var theFileToMove;
        _getFileEntry( self._cwd, sourceFilePath, {} ).then( function gotFileEntry(
          aFileToMove ) {
          theFileToMove = aFileToMove;
          return _getDirectoryEntry( self._cwd, targetDirectoryPath, {} );
        } ).then( function gotDirectoryEntry( theTargetDirectory ) {
          return _moveFile( theFileToMove, theTargetDirectory, withNewName );
        } ).then( function allDone( theNewFileEntry ) {
          deferred.resolve( theNewFileEntry );
        } ).catch( function( anError ) {
          deferred.reject( anError );
        } ).done();
        return deferred.promise;
      };
      /**
       * Moves a directory to a new directory, with an optional new name
       * @method moveDirectory
       * @param  {String} sourceDirectoryPath Path to directory, relative to cwd
       * @param  {String} targetDirectoryPath Path to new directory, relative to cwd
       * @param  {String} withNewName         New name, if desired
       * @return {Promise}                     The Promise
       */
      self.moveDirectory = function( sourceDirectoryPath, targetDirectoryPath,
        withNewName ) {
        var deferred = Q.defer();
        var theDirectoryToMove;
        _getDirectoryEntry( self._cwd, sourceDirectoryPath, {} ).then( function gotSourceDirectoryEntry(
          sourceDirectoryEntry ) {
          theDirectoryToMove = sourceDirectoryEntry;
          return _getDirectoryEntry( self._cwd, targetDirectoryPath, {} );
        } ).then( function gotTargetDirectoryEntry( theTargetDirectory ) {
          return _moveDirectory( theDirectoryToMove, theTargetDirectory,
            withNewName );
        } ).then( function allDone( theNewDirectoryEntry ) {
          deferred.resolve( theNewDirectoryEntry );
        } ).catch( function( anError ) {
          deferred.reject( anError );
        } ).done();
        return deferred.promise;
      };
      /**
       * Renames a file to a new name, in the cwd
       * @method renameFile
       * @param  {String} sourceFilePath      Path to file, relative to cwd
       * @param  {String} withNewName         New name
       * @return {Promise}                     The Promise
       */
      self.renameFile = function( sourceFilePath, withNewName ) {
        return self.moveFile( sourceFilePath, ".", withNewName );
      };
      /**
       * Renames a directory to a new name, in the cwd
       * @method renameDirectory
       * @param  {String} sourceDirectoryPath Path to directory, relative to cwd
       * @param  {String} withNewName         New name
       * @return {Promise}                     The Promise
       */
      self.renameDirectory = function( sourceDirectoryPath, withNewName ) {
        return self.moveDirectory( sourceDirectoryPath, ".", withNewName );
      };
      /**
       * Deletes a file
       * @method deleteFile
       * @param  {String} theFilePath Path to file, relative to cwd
       * @return {Promise}             The Promise
       */
      self.deleteFile = function( theFilePath ) {
        var deferred = Q.defer();
        _getFileEntry( self._cwd, theFilePath, {} ).then( function gotTheFileToDelete(
          theFileEntry ) {
          return _removeFile( theFileEntry );
        } ).then( function allDone() {
          deferred.resolve( self );
        } ).catch( function( anError ) {
          deferred.reject( anError );
        } ).done();
        return deferred.promise;
      };
      /**
       * Removes a directory, possibly recursively
       * @method removeDirectory
       * @param  {String} theDirectoryPath path to directory, relative to cwd
       * @param  {Boolean} recursively      If true, recursive remove
       * @return {Promise}                  The promise
       */
      self.removeDirectory = function( theDirectoryPath, recursively ) {
        var deferred = Q.defer();
        _getDirectoryEntry( self._cwd, theDirectoryPath, {} ).then( function gotTheDirectoryToDelete(
          theDirectoryEntry ) {
          return _removeDirectory( theDirectoryEntry, recursively );
        } ).then( function allDone() {
          deferred.resolve( self );
        } ).catch( function( anError ) {
          deferred.reject( anError );
        } ).done();
        return deferred.promise;
      };
      /**
       * Asks the browser for the requested quota, and then requests the file system
       * and sets the cwd to the root directory.
       * @method _initializeFileSystem
       * @private
       * @return {Promise} The promise
       */
      self._initializeFileSystem = function() {
        var deferred = Q.defer();
        _requestQuota( self.fileSystemType, self.requestedQuota ).then( function gotQuota(
          theQuota ) {
          self._actualQuota = theQuota;
          return _requestFileSystem( self.fileSystemType, self.actualQuota );
        } ).then( function gotFS( theFS ) {
          self._fileSystem = theFS;
          //self._cwd = theFS.root;
          return _getDirectoryEntry( theFS.root, "", {} );
        } ).then( function gotRootDirectory( theRootDirectory ) {
          self._root = theRootDirectory;
          self._cwd = theRootDirectory;
        } ).then( function allDone() {
          deferred.resolve( self );
        } ).catch( function( anError ) {
          deferred.reject( anError );
        } ).done();
        return deferred.promise;
      };
      if ( self.overrideSuper ) {
        self.overrideSuper( self.class, "init", self.init );
      }
      /**
       * Initializes the file manager with the requested file system type (self.PERSISTENT or self.TEMPORARY)
       * and requested quota size. Both must be specified.
       * @method init
       * @param {FileSystem} fileSystemType
       * @param {Number} requestedQuota
       */
      self.init = function( fileSystemType, requestedQuota ) {
        if ( self.super ) {
          self.super( _className, "init" );
        }
        if ( typeof fileSystemType === "undefined" ) {
          throw new Error(
            "No file system type specified; specify PERSISTENT or TEMPORARY." );
        }
        if ( typeof requestedQuota === "undefined" ) {
          throw new Error( "No quota requested. If you don't know, specify ZERO." );
        }
        self._requestedQuota = requestedQuota;
        self._fileSystemType = fileSystemType;
        return self._initializeFileSystem(); // this returns a promise, so we can .then after.
      };
      /**
       * Initializes the file manager with the requested file system type (self.PERSISTENT or self.TEMPORARY)
       * and requested quota size. Both must be specified.
       * @method initWithOptions
       * @param {*} options
       */
      self.initWithOptions = function( options ) {
        if ( typeof options === "undefined" ) {
          throw new Error( "No options specified. Need type and quota." );
        }
        if ( typeof options.fileSystemType === "undefined" ) {
          throw new Error(
            "No file system type specified; specify PERSISTENT or TEMPORARY." );
        }
        if ( typeof options.requestedQuota === "undefined" ) {
          throw new Error( "No quota requested. If you don't know, specify ZERO." );
        }
        return self.init( options.fileSystemType, options.requestedQuota );
      };
      return self;
    };
    // meta information
    FileManager.meta = {
      version: '00.04.450',
      class: _className,
      autoInitializable: false,
      categorizable: false
    };
    // assign to `window` if stand-alone
    if ( globalContext ) {
      globalContext.FileManager = FileManager
    }
    // return factory
    return FileManager;
  } )( Q, BaseObject, ( typeof IN_YASMF !== "undefined" ) ? undefined : window );
} );

/**
 *
 * Core of YASMF-UI; defines the version and basic UI  convenience methods.
 *
 * @module core.js
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
/*global define*/
define( 'yasmf/ui/core',[ "yasmf/util/device", "yasmf/util/object" ], function( theDevice, BaseObject ) {
  var UI = {};
  /**
   * Version of the UI Namespace
   * @property version
   * @type Object
   **/
  UI.version = "0.4.100";
  /**
   * Styles the element with the given style and value. Adds in the browser
   * prefixes to make it easier.
   * @param  {Node} theElement
   * @param  {CssStyle} theStyle   Don't camelCase these, use dashes as in regular styles
   * @param  {value} theValue
   * @returns {void}
   */
  UI.styleElement = function( theElement, theStyle, theValue ) {
    var prefixes = [ "-webkit-", "-moz-", "-ms-", "-o-", "" ];
    for ( var i = 0; i < prefixes.length; i++ ) {
      var thePrefix = prefixes[ i ];
      var theNewStyle = thePrefix + theStyle;
      //noinspection JSUnresolvedVariable
      var theNewValue = theValue.replace( "%PREFIX%", thePrefix );
      //noinspection JSUnresolvedVariable
      theElement.style.setProperty( theNewStyle, theNewValue );
    }
  };
  UI.styleElements = function( theElements, theStyle, theValue ) {
    var i;
    for ( i = 0; i < theElements.length; i++ ) {
      UI.styleElement( theElements[ i ], theStyle, theValue );
    }
  };
  /**
   *
   * Converts a color object to an rgba(r,g,b,a) string, suitable for applying to
   * any number of CSS styles. If the color's alpha is zero, the return value is
   * "transparent". If the color is null, the return value is "inherit".
   *
   * @method colorToRGBA
   * @static
   * @param {color} theColor - theColor to convert.
   * @returns {string} a CSS value suitable for color properties
   */
  UI.colorToRGBA = function( theColor ) {
    if ( !theColor ) {
      return "inherit";
    }
    //noinspection JSUnresolvedVariable
    if ( theColor.alpha !== 0 ) {
      //noinspection JSUnresolvedVariable
      return "rgba(" + theColor.red + "," + theColor.green + "," + theColor.blue + "," +
        theColor.alpha + ")";
    } else {
      return "transparent";
    }
  };
  /**
   * @typedef {{red: Number, green: Number, blue: Number, alpha: Number}} color
   */
  /**
   *
   * Creates a color object of the form `{red:r, green:g, blue:b, alpha:a}`.
   *
   * @method makeColor
   * @static
   * @param {Number} r - red component (0-255)
   * @param {Number} g - green component (0-255)
   * @param {Number} b - blue component (0-255)
   * @param {Number} a - alpha component (0.0-1.0)
   * @returns {color}
   *
   */
  UI.makeColor = function( r, g, b, a ) {
    return {
      red: r,
      green: g,
      blue: b,
      alpha: a
    };
  };
  /**
   *
   * Copies a color and returns it suitable for modification. You should copy
   * colors prior to modification, otherwise you risk modifying the original.
   *
   * @method copyColor
   * @static
   * @param {color} theColor - the color to be duplicated
   * @returns {color} a color ready for changes
   *
   */
  UI.copyColor = function( theColor ) {
    //noinspection JSUnresolvedVariable
    return UI.makeColor( theColor.red, theColor.green, theColor.blue, theColor.alpha );
  };
  /**
   * UI.COLOR
   * @namespace UI
   * @class COLOR
   */
  UI.COLOR = UI.COLOR || {};
  /** @static
   * @method blackColor
   * @returns {color} a black color.
   */
  UI.COLOR.blackColor = function() {
    return UI.makeColor( 0, 0, 0, 1.0 );
  };
  /** @static
   * @method darkGrayColor
   * @returns {color} a dark gray color.
   */
  UI.COLOR.darkGrayColor = function() {
    return UI.makeColor( 85, 85, 85, 1.0 );
  };
  /** @static
   * @method GrayColor
   * @returns {color} a gray color.
   */
  UI.COLOR.GrayColor = function() {
    return UI.makeColor( 127, 127, 127, 1.0 );
  };
  /** @static
   * @method lightGrayColor
   * @returns {color} a light gray color.
   */
  UI.COLOR.lightGrayColor = function() {
    return UI.makeColor( 170, 170, 170, 1.0 );
  };
  /** @static
   * @method whiteColor
   * @returns {color} a white color.
   */
  UI.COLOR.whiteColor = function() {
    return UI.makeColor( 255, 255, 255, 1.0 );
  };
  /** @static
   * @method blueColor
   * @returns {color} a blue color.
   */
  UI.COLOR.blueColor = function() {
    return UI.makeColor( 0, 0, 255, 1.0 );
  };
  /** @static
   * @method greenColor
   * @returns {color} a green color.
   */
  UI.COLOR.greenColor = function() {
    return UI.makeColor( 0, 255, 0, 1.0 );
  };
  /** @static
   * @method redColor
   * @returns {color} a red color.
   */
  UI.COLOR.redColor = function() {
    return UI.makeColor( 255, 0, 0, 1.0 );
  };
  /** @static
   * @method cyanColor
   * @returns {color} a cyan color.
   */
  UI.COLOR.cyanColor = function() {
    return UI.makeColor( 0, 255, 255, 1.0 );
  };
  /** @static
   * @method yellowColor
   * @returns {color} a yellow color.
   */
  UI.COLOR.yellowColor = function() {
    return UI.makeColor( 255, 255, 0, 1.0 );
  };
  /** @static
   * @method magentaColor
   * @returns {color} a magenta color.
   */
  UI.COLOR.magentaColor = function() {
    return UI.makeColor( 255, 0, 255, 1.0 );
  };
  /** @static
   * @method orangeColor
   * @returns {color} a orange color.
   */
  UI.COLOR.orangeColor = function() {
    return UI.makeColor( 255, 127, 0, 1.0 );
  };
  /** @static
   * @method purpleColor
   * @returns {color} a purple color.
   */
  UI.COLOR.purpleColor = function() {
    return UI.makeColor( 127, 0, 127, 1.0 );
  };
  /** @static
   * @method brownColor
   * @returns {color} a brown color.
   */
  UI.COLOR.brownColor = function() {
    return UI.makeColor( 153, 102, 51, 1.0 );
  };
  /** @static
   * @method lightTextColor
   * @returns {color} a light text color suitable for display on dark backgrounds.
   */
  UI.COLOR.lightTextColor = function() {
    return UI.makeColor( 240, 240, 240, 1.0 );
  };
  /** @static
   * @method darkTextColor
   * @returns {color} a dark text color suitable for display on light backgrounds.
   */
  UI.COLOR.darkTextColor = function() {
    return UI.makeColor( 15, 15, 15, 1.0 );
  };
  /** @static
   * @method clearColor
   * @returns {color} a transparent color.
   */
  UI.COLOR.clearColor = function() {
    return UI.makeColor( 0, 0, 0, 0.0 );
  };
  /**
   * Manages the root element
   *
   * @property _rootContainer
   * @private
   * @static
   * @type Node
   */
  UI._rootContainer = null;
  /**
   * Creates the root element that contains the view hierarchy
   *
   * @method _createRootContainer
   * @static
   * @protected
   */
  UI._createRootContainer = function() {
    UI._rootContainer = document.createElement( "div" );
    UI._rootContainer.className = "ui-container";
    UI._rootContainer.id = "rootContainer";
    document.body.appendChild( UI._rootContainer );
  };
  /**
   * Manages the root view (topmost)
   *
   * @property _rootView
   * @private
   * @static
   * @type ViewContainer
   * @default null
   */
  UI._rootView = null;
  /**
   * Assigns a view to be the top view in the hierarchy
   *
   * @method setRootView
   * @static
   * @param {ViewContainer} theView
   */
  UI.setRootView = function( theView ) {
    if ( UI._rootContainer === null ) {
      UI._createRootContainer();
    }
    if ( UI._rootView !== null ) {
      UI.removeRootView();
    }
    UI._rootView = theView;
    UI._rootView.parentElement = UI._rootContainer;
  };
  /**
   * Removes a view from the root view
   *
   * @method removeRootView
   * @static
   */
  UI.removeRootView = function() {
    if ( UI._rootView !== null ) {
      UI._rootView.parentElement = null;
    }
    UI._rootView = null;
  };
  /**
   *
   * Returns the root view
   *
   * @method getRootView
   * @static
   * @returns {ViewContainer}
   */
  UI.getRootView = function() {
    return UI._rootView;
  };
  Object.defineProperty( UI, "rootView", {
    get: UI.getRootView,
    set: UI.setRootView
  } );
  UI._BackButtonHandler = function() {
    var self = new BaseObject();
    self.subclass( "BackButtonHandler" );
    self.registerNotification( "backButtonPressed" );
    self._lastBackButtonTime = -1;
    self.handleBackButton = function() {
      var currentTime = ( new Date() ).getTime();
      if ( self._lastBackButtonTime < currentTime - 1000 ) {
        self._lastBackButtonTime = ( new Date() ).getTime();
        self.notifyMostRecent( "backButtonPressed" );
      }
    };
    document.addEventListener( 'backbutton', self.handleBackButton, false );
    return self;
  };
  /**
   *
   * Global Back Button Handler Object
   *
   * Register a listener for the backButtonPressed notification in order
   * to be notified when the back button is pressed.
   *
   * Applies only to a physical back button, not one on the screen.
   *
   * @property backButton
   * @static
   * @final
   * @type _BackButtonHandler
   */
  UI.backButton = new UI._BackButtonHandler();
  UI._OrientationHandler = function() {
    var self = new BaseObject();
    self.subclass( "OrientationHandler" );
    self.registerNotification( "orientationChanged" );
    self.handleOrientationChange = function() {
      var curDevice;
      var curOrientation;
      var curFormFactor;
      var curScale;
      var curConvenience;
      curDevice = theDevice.platform();
      if ( curDevice == "ios" ) {
        if ( navigator.userAgent.indexOf( "OS 7" ) > -1 ) {
          curDevice += " ios7";
        }
        if ( navigator.userAgent.indexOf( "OS 6" ) > -1 ) {
          curDevice += " ios6";
        }
        if ( navigator.userAgent.indexOf( "OS 5" ) > -1 ) {
          curDevice += " ios5";
        }
      }
      curFormFactor = theDevice.formFactor();
      curOrientation = theDevice.isPortrait() ? "portrait" : "landscape";
      curScale = theDevice.isRetina() ? "hiDPI" : "loDPI";
      curConvenience = "";
      if ( theDevice.iPad() ) {
        curConvenience = "ipad";
      }
      if ( theDevice.iPhone() ) {
        curConvenience = "iphone";
      }
      if ( theDevice.droidTablet() ) {
        curConvenience = "droid-tablet";
      }
      if ( theDevice.droidPhone() ) {
        curConvenience = "droid-phone";
      }
      if ( typeof document.body !== "undefined" && document.body !== null ) {
        document.body.setAttribute( "class", curDevice + " " + curFormFactor + " " +
          curOrientation + " " + curScale + " " + curConvenience );
      }
      self.notify( "orientationChanged" );
    };
    window.addEventListener( 'orientationchange', self.handleOrientationChange, false );
    if ( typeof document.body !== "undefined" && document.body !== null ) {
      self.handleOrientationChange();
    } else {
      setTimeout( self.handleOrientationChange, 0 );
    }
    return self;
  };
  /**
   *
   * Global Orientation Handler Object
   *
   * Register a listener for the orientationChanged notification in order
   * to be notified when the orientation changes.
   *
   * @property orientationHandler
   * @static
   * @final
   * @type _OrientationHandler
   */
  UI.orientationHandler = new UI._OrientationHandler();
  /**
   * Global Notification Object
   */
  UI.globalNotifications = new BaseObject();
  /**
   * Create the root container
   */
  if ( typeof document.body !== "undefined" && document.body !== null ) {
    UI._createRootContainer();
  } else {
    setTimeout( UI._createRootContainer, 0 );
  }
  return UI;
} );

/**
 *
 * Basic cross-platform mobile Event Handling for YASMF
 *
 * @module events.js
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
/*global define*/
define( 'yasmf/ui/event',[ "yasmf/util/device" ], function( theDevice ) {
  /**
   * Translates touch events to mouse events if the platform doesn't support
   * touch events. Leaves other events unaffected.
   *
   * @method _translateEvent
   * @static
   * @private
   * @param {String} theEvent - the event name to translate
   */
  var _translateEvent = function( theEvent ) {
    var theTranslatedEvent = theEvent;
    if ( !theTranslatedEvent ) {
      return theTranslatedEvent;
    }
    var platform = theDevice.platform();
    var nonTouchPlatform = ( platform == "wince" || platform == "unknown" || platform ==
      "mac" || platform == "windows" || platform == "linux" );
    if ( nonTouchPlatform && theTranslatedEvent.toLowerCase().indexOf( "touch" ) > -1 ) {
      theTranslatedEvent = theTranslatedEvent.replace( "touch", "mouse" );
      theTranslatedEvent = theTranslatedEvent.replace( "start", "down" );
      theTranslatedEvent = theTranslatedEvent.replace( "end", "up" );
    }
    return theTranslatedEvent;
  };
  var event = {};
  /**
   * @typedef {{_originalEvent: Event, touches: Array, x: number, y: number, avgX: number, avgY: number, element: (EventTarget|Object), target: Node}} NormalizedEvent
   */
  /**
   *
   * Creates an event object from a DOM event.
   *
   * The event returned contains all the touches from the DOM event in an array of {x,y} objects.
   * The event also contains the first touch as x,y properties and the average of all touches
   * as avgX,avgY. If no touches are in the event, these values will be -1.
   *
   * @method makeEvent
   * @static
   * @param {Node} that - `this`; what fires the event
   * @param {Event} e - the DOM event
   * @returns {NormalizedEvent}
   *
   */
  event.convert = function( that, e ) {
    if ( typeof e === "undefined" ) {
      e = window.event;
    }
    var newEvent = {
      _originalEvent: e,
      touches: [],
      x: -1,
      y: -1,
      avgX: -1,
      avgY: -1,
      element: e.target || e.srcElement,
      target: that
    };
    if ( e.touches ) {
      var avgXTotal = 0;
      var avgYTotal = 0;
      for ( var i = 0; i < e.touches.length; i++ ) {
        newEvent.touches.push( {
          x: e.touches[ i ].clientX,
          y: e.touches[ i ].clientY
        } );
        avgXTotal += e.touches[ i ].clientX;
        avgYTotal += e.touches[ i ].clientY;
        if ( i === 0 ) {
          newEvent.x = e.touches[ i ].clientX;
          newEvent.y = e.touches[ i ].clientY;
        }
      }
      if ( e.touches.length > 0 ) {
        newEvent.avgX = avgXTotal / e.touches.length;
        newEvent.avgY = avgYTotal / e.touches.length;
      }
    } else {
      if ( event.pageX ) {
        newEvent.touches.push( {
          x: e.pageX,
          y: e.pageY
        } );
        newEvent.x = e.pageX;
        newEvent.y = e.pageY;
        newEvent.avgX = e.pageX;
        newEvent.avgY = e.pageY;
      }
    }
    return newEvent;
  };
  /**
   *
   * Cancels an event that's been created using {@link event.convert}.
   *
   * @method cancelEvent
   * @static
   * @param {NormalizedEvent} e - the event to cancel
   *
   */
  event.cancel = function( e ) {
    if ( e._originalEvent.cancelBubble ) {
      e._originalEvent.cancelBubble();
    }
    if ( e._originalEvent.stopPropagation ) {
      e._originalEvent.stopPropagation();
    }
    if ( e._originalEvent.preventDefault ) {
      e._originalEvent.preventDefault();
    } else {
      e._originalEvent.returnValue = false;
    }
  };
  /**
   * Adds a touch listener to theElement, converting touch events for WP7.
   *
   * @method addEventListener
   * @param {Node} theElement  the element to attach the event to
   * @param {String} theEvent  the event to handle
   * @param {Function} theFunction  the function to call when the event is fired
   *
   */
  event.addListener = function( theElement, theEvent, theFunction ) {
    var theTranslatedEvent = _translateEvent( theEvent.toLowerCase() );
    theElement.addEventListener( theTranslatedEvent, theFunction, false );
  };
  /**
   * Removes a touch listener added by addTouchListener
   *
   * @method removeEventListener
   * @param {Node} theElement  the element to remove an event from
   * @param {String} theEvent  the event to remove
   * @param {Function} theFunction  the function to remove
   *
   */
  event.removeListener = function( theElement, theEvent, theFunction ) {
    var theTranslatedEvent = _translateEvent( theEvent.toLowerCase() );
    theElement.removeEventListener( theTranslatedEvent, theFunction );
  };
  return event;
} );

/**
 *
 * View Containers are simple objects that provide very basic view management with
 * a thin layer over the corresponding DOM element.
 *
 * @module viewContainer.js
 * @author Kerri Shotts
 * @version 0.4
 *
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
/*global define*/
define( 'yasmf/ui/viewContainer',[ "yasmf/util/object" ], function( BaseObject ) {
  var _className = "ViewContainer";
  var ViewContainer = function() {
      var self = new BaseObject();
      self.subclass( _className );
      // # Notifications
      // * `viewWasPushed` is fired by a containing `ViewController` when the view is added
      //   to the view stack
      // * `viewWasPopped` is fired by a container when the view is removed from the view stack
      // * `viewWillAppear` is fired by a container when the view is about to appear (one should avoid
      //   any significant DOM changes or calculations during this time, or animations may stutter)
      // * `viewWillDisappear` is fired by a container when the view is about to disappear
      // * `viewDidAppear` is fired by a container when the view is on screen.
      // * `viewDidDisappear` is fired by a container when the view is off screen.
      self.registerNotification( "viewWasPushed" );
      self.registerNotification( "viewWasPopped" );
      self.registerNotification( "viewWillAppear" );
      self.registerNotification( "viewWillDisappear" );
      self.registerNotification( "viewDidAppear" );
      self.registerNotification( "viewDidDisappear" );
      // private properties used to manage the corresponding DOM element
      self._element = null;
      self._elementClass = "ui-container"; // default; can be changed to any class for styling purposes
      self._elementId = null; // bad design decision -- probably going to mark this as deprecated soon
      self._elementTag = "div"; // some elements might need to be something other than a DIV
      self._parentElement = null; // owning element
      /**
       * The title isn't displayed anywhere (unless you use it yourself in `renderToElement`, but
       * is useful for containers that want to know the title of their views.
       * @property title
       * @type {String}
       * @observable
       */
      self.defineObservableProperty( "title" );
      /**
       * Creates the internal elements.
       * @method createElement
       */
      self.createElement = function() {
        self._element = document.createElement( self._elementTag );
        if ( self.elementClass !== null ) {
          self._element.className = self.elementClass;
        }
        if ( self.elementId !== null ) {
          self._element.id = self.elementId;
        }
      }
      /**
       * Creates the internal elements if necessary (that is, if they aren't already in existence)
       * @method createElementIfNotCreated
       */
      self.createElementIfNotCreated = function() {
        if ( self._element === null ) {
          self.createElement();
        }
      }
      /**
       * The `element` property allow direct access to the DOM element backing the view
       * @property element
       * @type {DOMElement}
       */
      self.getElement = function() {
        self.createElementIfNotCreated();
        return self._element;
      }
      self.defineProperty( "element", {
        read: true,
        write: true,
        default: null
      } );
      /**
       * The `elementClass` property indicates the class of the DOM element. Changing
       * the class will alter the backing DOM element if created.
       * @property elementClass
       * @type {String}
       * @default "ui-container"
       */
      self.setElementClass = function( theClassName ) {
        self._elementClass = theClassName;
        if ( self._element !== null ) {
          self._element.className = theClassName;
        }
      }
      self.defineProperty( "elementClass", {
        read: true,
        write: true,
        default: "ui-container"
      } );
      /**
       * Determines the `id` for the backing DOM element. Not the best choice to
       * use, since this must be unique within the DOM. Probably going to become
       * deprecated eventually
       */
      self.setElementId = function( theElementId ) {
        self._elementId = theElementId;
        if ( self._element !== null ) {
          self._element.id = theElementId;
        }
      }
      self.defineProperty( "elementId", {
        read: true,
        write: true,
        default: null
      } );
      /**
       * Determines the type of DOM Element; by default this is a DIV.
       * @property elementTag
       * @type {String}
       * @default "div"
       */
      self.defineProperty( "elementTag", {
        read: true,
        write: true,
        default: "div"
      } );
      /**
       * Indicates the parent element, if it exists. This is a DOM element
       * that owns this view (parent -> child). Changing the parent removes
       * this element from the parent and reparents to another element.
       * @property parentElement
       * @type {DOMElement}
       */
      self.setParentElement = function( theParentElement ) {
        if ( self._parentElement !== null && self._element !== null ) {
          // remove ourselves from the existing parent element first
          self._parentElement.removeChild( self._element );
          self._parentElement = null;
        }
        self._parentElement = theParentElement;
        if ( self._parentElement !== null && self._element !== null ) {
          self._parentElement.appendChild( self._element );
        }
      }
      self.defineProperty( "parentElement", {
        read: true,
        write: true,
        default: null
      } );
      /**
       * @method render
       * @return {String|DOMElement|DocumentFragment}
       * `render` is called by `renderToElement`. The idea behind this is to generate
       * a return value consisting of the DOM tree necessary to create the view's
       * contents.
       **/
      self.render = function() {
        // right now, this doesn't do anything, but it's here for inheritance purposes
        return "Error: Abstract Method";
      }
      /**
       * Renders the content of the view. Can be called more than once, but more
       * often is called once during `init`. Calls `render` immediately and
       * assigns it to `element`'s `innerHTML` -- this implicitly creates the
       * DOM elements backing the view if they weren't already created.
       * @method renderToElement
       */
      self.renderToElement = function() {
        var renderOutput = self.render();
        if ( typeof renderOutput === "string" ) {
          self.element.innerHTML = self.render();
        } else if ( typeof renderOutput === "object" ) {
          self.element.innerHTML = "";
          self.element.appendChild( renderOutput );
        }
      }
      /**
       * Initializes the view container; returns `self`
       * @method init
       * @param {String} [theElementId]
       * @param {String} [theElementTag]
       * @param {String} [theElementClass]
       * @param {DOMElement} [theParentElement]
       * @returns {Object}
       */
      self.override( function init( theElementId, theElementTag, theElementClass,
        theParentElement ) {
        self.super( _className, "init" ); // super has no parameters
        // set our Id, Tag, and Class
        if ( typeof theElementId !== "undefined" ) {
          self.elementId = theElementId;
        }
        if ( typeof theElementTag !== "undefined" ) {
          self.elementTag = theElementTag;
        }
        if ( typeof theElementClass !== "undefined" ) {
          self.elementClass = theElementClass;
        }
        // render ourselves to the element (via render); this implicitly creates the element
        // with the above properties.
        self.renderToElement();
        // add ourselves to our parent.
        if ( typeof theParentElement !== "undefined" ) {
          self.parentElement = theParentElement;
        }
        return self;
      } );
      /**
       * Initializes the view container. `options` can specify any of the following properties:
       *
       *  * `id` - the `id` of the element
       *  * `tag` - the element tag to use (`div` is the default)
       *  * `class` - the class name to use (`ui-container` is the default)
       *  * `parent` - the parent DOMElement
       *
       * @method initWithOptions
       * @param {Object} options
       * @return {Object}
       */
      self.initWithOptions = function( options ) {
        var theElementId, theElementTag, theElementClass, theParentElement;
        if ( typeof options !== "undefined" ) {
          if ( typeof options.id !== "undefined" ) {
            theElementId = options.id;
          }
          if ( typeof options.tag !== "undefined" ) {
            theElementTag = options.tag;
          }
          if ( typeof options.class !== "undefined" ) {
            theElementClass = options.class;
          }
          if ( typeof options.parent !== "undefined" ) {
            theParentElement = options.parent;
          }
        }
        self.init( theElementId, theElementTag, theElementClass, theParentElement );
        if ( typeof options !== "undefined" ) {
          if ( typeof options.title !== "undefined" ) {
            self.title = options.title;
          }
        }
        return self;
      };
      /**
       * Clean up
       * @method destroy
       */
      self.override( function destroy() {
        // remove ourselves from the parent view, if attached
        if ( self._parentElement !== null && self._element !== null ) {
          // remove ourselves from the existing parent element first
          self._parentElement.removeChild( self._element );
          self._parentElement = null;
        }
        // and let our super know that it can clean p
        self.super( _className, "destroy" );
      } );
      // handle auto-initialization
      self._autoInit.apply( self, arguments );
      // return the new object
      return self;
    }
    // return the new factory
  return ViewContainer;
} );

/**
 *
 * Navigation Controllers provide basic support for view stack management (as in push, pop)
 *
 * @module navigationController.js
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
/*global define*/
define( 'yasmf/ui/navigationController',[ "yasmf/ui/core", "yasmf/ui/viewContainer" ], function( UI, ViewContainer ) {
  var _className = "NavigationController";
  var NavigationController = function() {
    var self = new ViewContainer();
    self.subclass( _className );
    // # Notifications
    //
    // * `viewPushed` is fired when a view is pushed onto the view stack. The view pushed is passed as a parameter.
    // * `viewPopped` is fired when a view is popped off the view stack. The view popped is passed as a parameter.
    //
    self.registerNotification( "viewPushed" );
    self.registerNotification( "viewPopped" );
    /**
     * The array of views that this navigation controller manages.
     * @property subviews
     * @type {Array}
     */
    self.defineProperty( "subviews", {
      read: true,
      write: false,
      default: []
    } );
    /**
     * Indicates the current top view
     * @property topView
     * @type {Object}
     */
    self.getTopView = function() {
      if ( self._subviews.length > 0 ) {
        return self._subviews[ self._subviews.length - 1 ];
      } else {
        return null;
      }
    }
    self.defineProperty( "topView", {
      read: true,
      write: false,
      backingVariable: false
    } );
    /**
     * Returns the initial view in the view stack
     * @property rootView
     * @type {Object}
     */
    self.getRootView = function() {
      if ( self._subviews.length > 0 ) {
        return self._subviews[ 0 ];
      } else {
        return null;
      }
    }
    self.setRootView = function( theNewRoot ) {
      if ( self._subviews.length > 0 ) {
        // must remove all the subviews from the DOM
        for ( var i = 0; i < self._subviews.length; i++ ) {
          var thePoppingView = self._subviews[ i ];
          thePoppingView.notify( "viewWillDisappear" );
          if ( i === 0 ) {
            thePoppingView.element.classList.remove( "ui-root-view" );
          }
          thePoppingView.parentElement = null;
          thePoppingView.notify( "viewDidDisappear" );
          thePoppingView.notify( "viewWasPopped" );
          delete thePoppingView.navigationController;
        }
        self._subviews = [];
      }
      self._subviews.push( theNewRoot ); // add it to our views
      theNewRoot.navigationController = self;
      theNewRoot.notify( "viewWasPushed" );
      theNewRoot.notify( "viewWillAppear" ); // notify the view
      theNewRoot.parentElement = self.element; // and make us the parent
      theNewRoot.element.classList.add( "ui-root-view" );
      theNewRoot.notify( "viewDidAppear" ); // and notify it that it's actually there.
    }
    self.defineProperty( "rootView", {
      read: true,
      write: true,
      backingVariable: false
    } );
    self._preventClicks = null;
    /**
     * Creates a click-prevention element -- essentially a transparent DIV that
     * fills the screen.
     * @method _createClickPreventionElement
     * @private
     */
    self._createClickPreventionElement = function() {
      self.createElementIfNotCreated();
      self._preventClicks = document.createElement( "div" );
      self._preventClicks.className = "ui-prevent-clicks";
      self.element.appendChild( self._preventClicks );
    }
    /**
     * Create a click-prevention element if necessary
     * @method _createClickPreventionElementIfNotCreated
     * @private
     */
    self._createClickPreventionElementIfNotCreated = function() {
      if ( self._preventClicks === null ) {
        self._createClickPreventionElement();
      }
    }
    /**
     * push a view onto the view stack.
     *
     * @method pushView
     * @param {ViewContainer} aView
     * @param {Boolean} [withAnimation] Determine if the view should be pushed with an animation, default is `true`
     * @param {Number} [withDelay] Number of seconds for the animation, default is `0.3`
     * @param {String} [withType] CSS Animation, default is `ease-in-out`
     */
    self.pushView = function( aView, withAnimation, withDelay, withType ) {
      var theHidingView = self.topView;
      var theShowingView = aView;
      var usingAnimation = true;
      var animationDelay = 0.3;
      var animationType = "ease-in-out";
      if ( typeof withAnimation !== "undefined" ) {
        usingAnimation = withAnimation;
      }
      if ( typeof withDelay !== "undefined" ) {
        animationDelay = withDelay;
      }
      if ( typeof withType !== "undefined" ) {
        animationType = withType;
      }
      if ( !usingAnimation ) {
        animationDelay = 0;
      }
      // add the view to our array, at the end
      self._subviews.push( theShowingView );
      theShowingView.navigationController = self;
      theShowingView.notify( "viewWasPushed" );
      // get each element's z-index, if specified
      var theHidingViewZ = parseInt( getComputedStyle( theHidingView.element ).getPropertyValue(
          "z-index" ) || "0", 10 ),
        theShowingViewZ = parseInt( getComputedStyle( theShowingView.element ).getPropertyValue(
          "z-index" ) || "0", 10 );
      if ( theHidingViewZ >= theShowingViewZ ) {
        theShowingViewZ = theHidingViewZ + 10;
      }
      // then position the view so as to be off-screen, with the current view on screen
      UI.styleElement( theHidingView.element, "transform", "translate3d(0,0," +
        theHidingViewZ + "px)" );
      UI.styleElement( theShowingView.element, "transform", "translate3d(100%,0," +
        theShowingViewZ + "px)" );
      // set up an animation
      if ( usingAnimation ) {
        UI.styleElements( [ theShowingView.element, theHidingView.element ],
          "transition", "-webkit-transform " + animationDelay + "s " + animationType );
        UI.styleElements( [ theShowingView.element, theHidingView.element ],
          "transition", "-moz-transform " + animationDelay + "s " + animationType );
        UI.styleElements( [ theShowingView.element, theHidingView.element ],
          "transition", "-ms-transform " + animationDelay + "s " + animationType );
        UI.styleElements( [ theShowingView.element, theHidingView.element ],
          "transition", "transform " + animationDelay + "s " + animationType );
        UI.styleElements( theHidingView.element.querySelectorAll(
            ".ui-navigation-bar *" ), "transition", "opacity " + animationDelay +
          "s " + animationType );
        UI.styleElements( theShowingView.element.querySelectorAll(
            ".ui-navigation-bar *" ), "transition", "opacity " + animationDelay +
          "s " + animationType );
        UI.styleElements( theHidingView.element.querySelectorAll(
          ".ui-navigation-bar *" ), "opacity", "1" );
        UI.styleElements( theShowingView.element.querySelectorAll(
          ".ui-navigation-bar *" ), "opacity", "0" );
      } else {
        UI.styleElements( [ theShowingView.element, theHidingView.element ],
          "transition", "inherit" );
        UI.styleElements( theHidingView.element.querySelectorAll(
          ".ui-navigation-bar *" ), "transition", "inherit" );
        UI.styleElements( theShowingView.element.querySelectorAll(
          ".ui-navigation-bar *" ), "transition", "inherit" );
      }
      // and add the element with us as the parent
      theShowingView.parentElement = self.element;
      // display the click prevention element
      self._preventClicks.style.display = "block";
      setTimeout( function() {
        // tell the topView to move over to the left
        UI.styleElement( theHidingView.element, "transform", "translate3d(-50%,0," +
          theHidingViewZ + "px)" );
        // and tell our new view to move as well
        UI.styleElement( theShowingView.element, "transform", "translate3d(0,0," +
          theShowingViewZ + "px)" );
        if ( usingAnimation ) {
          UI.styleElements( theHidingView.element.querySelectorAll(
            ".ui-navigation-bar *" ), "opacity", "0" );
          UI.styleElements( theShowingView.element.querySelectorAll(
            ".ui-navigation-bar *" ), "opacity", "1" );
        }
        // the the view it's about to show...
        theHidingView.notify( "viewWillDisappear" );
        theShowingView.notify( "viewWillAppear" );
        // tell anyone who is listening who got pushed
        self.notify( "viewPushed", [ theShowingView ] );
        // tell the view it's visible after the delay has passed
        setTimeout( function() {
          theHidingView.element.style.display = "none";
          theHidingView.notify( "viewDidDisappear" );
          theShowingView.notify( "viewDidAppear" );
          // hide click preventer
          self._preventClicks.style.display = "none";
        }, animationDelay * 1000 );
      }, 50 );
    }
    /**
     * pops the top view from the view stack
     *
     * @method popView
     * @param {Boolean} withAnimation Use animation when popping, default `true`
     * @param {String} withDelay Duration of animation in seconds, Default `0.3`
     * @param {String} withType CSS Animation, default is `ease-in-out`
     */
    self.popView = function( withAnimation, withDelay, withType ) {
      var usingAnimation = true;
      var animationDelay = 0.3;
      var animationType = "ease-in-out";
      if ( typeof withAnimation !== "undefined" ) {
        usingAnimation = withAnimation;
      }
      if ( typeof withDelay !== "undefined" ) {
        animationDelay = withDelay;
      }
      if ( typeof withType !== "undefined" ) {
        animationType = withType;
      }
      if ( !usingAnimation ) {
        animationDelay = 0;
      }
      // only pop if we have views to pop (Can't pop the first!)
      if ( self._subviews.length <= 1 ) {
        return;
      }
      // pop the top view off the stack
      var thePoppingView = self._subviews.pop();
      var theShowingView = self.topView;
      var thePoppingViewZ = parseInt( getComputedStyle( thePoppingView.element ).getPropertyValue(
          "z-index" ) || "0", 10 ),
        theShowingViewZ = parseInt( getComputedStyle( theShowingView.element ).getPropertyValue(
          "z-index" ) || "0", 10 );
      if ( theShowingViewZ >= thePoppingViewZ ) {
        thePoppingViewZ = theShowingViewZ + 10;
      }
      theShowingView.element.style.display = "inherit";
      // make sure that theShowingView is off screen to the left, and the popping
      // view is at 0
      UI.styleElements( [ thePoppingView.element, theShowingView.element ],
        "transition", "inherit" );
      UI.styleElements( thePoppingView.element.querySelectorAll(
        ".ui-navigation-bar *" ), "transition", "inherit" );
      UI.styleElements( theShowingView.element.querySelectorAll(
        ".ui-navigation-bar *" ), "transition", "inherit" );
      UI.styleElement( theShowingView.element, "transform", "translate3d(-50%,0," +
        theShowingViewZ + "px)" );
      UI.styleElement( thePoppingView.element, "transform", "translate3d(0,0," +
        thePoppingViewZ + "px" );
      if ( usingAnimation ) {
        UI.styleElements( theShowingView.element.querySelectorAll(
          ".ui-navigation-bar *" ), "opacity", "0" );
        UI.styleElements( thePoppingView.element.querySelectorAll(
          ".ui-navigation-bar *" ), "opacity", "1" );
      } else {
        UI.styleElements( theShowingView.element.querySelectorAll(
          ".ui-navigation-bar *" ), "opacity", "1" );
        UI.styleElements( thePoppingView.element.querySelectorAll(
          ".ui-navigation-bar *" ), "opacity", "1" );
      }
      // set up an animation
      if ( usingAnimation ) {
        UI.styleElements( [ thePoppingView.element, theShowingView.element ],
          "transition", "-webkit-transform " + animationDelay + "s " + animationType );
        UI.styleElements( [ thePoppingView.element, theShowingView.element ],
          "transition", "-moz-transform " + animationDelay + "s " + animationType );
        UI.styleElements( [ thePoppingView.element, theShowingView.element ],
          "transition", "-ms-transform " + animationDelay + "s " + animationType );
        UI.styleElements( [ thePoppingView.element, theShowingView.element ],
          "transition", "transform " + animationDelay + "s " + animationType );
        UI.styleElements( thePoppingView.element.querySelectorAll(
            ".ui-navigation-bar *" ), "transition", "opacity " + animationDelay +
          "s " + animationType );
        UI.styleElements( theShowingView.element.querySelectorAll(
            ".ui-navigation-bar *" ), "transition", "opacity " + animationDelay +
          "s " + animationType );
      }
      // display the click prevention element
      self._preventClicks.style.display = "block";
      setTimeout( function() {
        // and move everyone
        UI.styleElement( theShowingView.element, "transform", "translate3d(0,0," +
          theShowingViewZ + "px)" );
        UI.styleElement( thePoppingView.element, "transform", "translate3d(100%,0," +
          thePoppingViewZ + "px)" );
        if ( usingAnimation ) {
          UI.styleElements( thePoppingView.element.querySelectorAll(
            ".ui-navigation-bar *" ), "opacity", "0" );
          UI.styleElements( theShowingView.element.querySelectorAll(
            ".ui-navigation-bar *" ), "opacity", "1" );
        }
        // the the view it's about to show...
        thePoppingView.notify( "viewWillDisappear" );
        theShowingView.notify( "viewWillAppear" );
        // tell the view it's visible after the delay has passed
        setTimeout( function() {
          thePoppingView.notify( "viewDidDisappear" );
          thePoppingView.notify( "viewWasPopped" );
          theShowingView.notify( "viewDidAppear" );
          // tell anyone who is listening who got popped
          self.notify( "viewPopped", [ thePoppingView ] );
          // hide click preventer
          self._preventClicks.style.display = "none";
          // and remove the popping view from the hierarchy
          thePoppingView.parentElement = null;
          delete thePoppingView.navigationController;
        }, ( animationDelay * 1000 ) );
      }, 50 );
    }
    /**
     * @method render
     * @abstract
     */
    self.override( function render() {
      return ""; // nothing to render!
    } );
    /**
     * Create elements and click prevention elements if necessary; otherwise there's nothing to do
     * @method renderToElement
     */
    self.override( function renderToElement() {
      self.createElementIfNotCreated();
      self._createClickPreventionElementIfNotCreated();
      return; // nothing to do.
    } );
    /**
     * Initialize the navigation controller
     * @method init
     * @return {Object}
     */
    self.override( function init( theRootView, theElementId, theElementTag,
      theElementClass, theParentElement ) {
      if ( typeof theRootView === "undefined" ) {
        throw new Error(
          "Can't initialize a navigation controller without a root view." );
      }
      // do what a normal view container does
      self.super( _className, "init", [ theElementId, theElementTag,
        theElementClass,
        theParentElement
      ] );
      // now add the root view
      self.rootView = theRootView;
      return self;
    } );
    /**
     * Initialize the navigation controller
     * @method initWithOptions
     * @return {Object}
     */
    self.override( function initWithOptions( options ) {
      var theRootView, theElementId, theElementTag, theElementClass,
        theParentElement;
      if ( typeof options !== "undefined" ) {
        if ( typeof options.id !== "undefined" ) {
          theElementId = options.id;
        }
        if ( typeof options.tag !== "undefined" ) {
          theElementTag = options.tag;
        }
        if ( typeof options.class !== "undefined" ) {
          theElementClass = options.class;
        }
        if ( typeof options.parent !== "undefined" ) {
          theParentElement = options.parent;
        }
        if ( typeof options.rootView !== "undefined" ) {
          theRootView = options.rootView;
        }
      }
      return self.init( theRootView, theElementId, theElementTag, theElementClass,
        theParentElement );
    } );
    // handle auto initialization
    self._autoInit.apply( self, arguments );
    return self;
  }
  return NavigationController;
} );

/**
 *
 * Split View Controllers provide basic support for side-by-side views
 *
 * @module splitViewController.js
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
/*global define*/
define( 'yasmf/ui/splitViewController',[ "yasmf/ui/core", "yasmf/ui/viewContainer" ], function( UI, ViewContainer ) {
  var _className = "SplitViewController";
  var SplitViewController = function() {
    var self = new ViewContainer();
    self.subclass( _className );
    // # Notifications
    //
    // * `viewsChanged` - fired when the left or right side view changes
    //
    self.registerNotification( "viewsChanged" );
    /**
     * Indicates the type of split canvas:
     *
     * * `split`: typical split-view - left and right side shares space on screen
     * * `off-canvas`: off-canvas view AKA Facebook split view. Left side is off screen and can slide in
     * * `split-overlay`: left side slides over the right side when visible
     *
     * @property viewType
     * @type {String}
     */
    self.setViewType = function( theViewType ) {
      self.element.classList.remove( "ui-" + self._viewType + "-view" );
      self._viewType = theViewType;
      self.element.classList.add( "ui-" + theViewType + "-view" );
      self.leftViewStatus = "invisible";
    }
    self.defineProperty( "viewType", {
      read: true,
      write: true,
      default: "split"
    } );
    /**
     * Indicates whether or not the left view is `visible` or `invisible`.
     *
     * @property leftViewStatus
     * @type {String}
     */
    self.setLeftViewStatus = function( viewStatus ) {
      self.element.classList.remove( "ui-left-side-" + self._leftViewStatus );
      self._leftViewStatus = viewStatus;
      self.element.classList.add( "ui-left-side-" + viewStatus );
    }
    self.defineProperty( "leftViewStatus", {
      read: true,
      write: true,
      default: "invisible"
    } );
    /**
     * Toggle the visibility of the left side view
     * @method toggleLeftView
     */
    self.toggleLeftView = function() {
      if ( self.leftViewStatus === "visible" ) {
        self.leftViewStatus = "invisible";
      } else {
        self.leftViewStatus = "visible";
      }
    }
    /**
     * The array of views that this split view controller manages.
     * @property subviews
     * @type {Array}
     */
    self.defineProperty( "subviews", {
      read: true,
      write: false,
      default: [ null, null ]
    } );
    // internal elements
    self._leftElement = null;
    self._rightElement = null;
    /**
     * Create the left and right elements
     * @method _createElements
     * @private
     */
    self._createElements = function() {
      if ( self._leftElement !== null ) {
        self.element.removeChild( self._leftElement );
      }
      if ( self._rightElement !== null ) {
        self.element.removeChild( self._rightElement );
      }
      self._leftElement = document.createElement( "div" );
      self._rightElement = document.createElement( "div" );
      self._leftElement.className = "ui-container left-side";
      self._rightElement.className = "ui-container right-side";
      self.element.appendChild( self._leftElement );
      self.element.appendChild( self._rightElement );
    }
    /**
     * Create the left and right elements if necessary
     * @method _createElementsIfNecessary
     * @private
     */
    self._createElementsIfNecessary = function() {
      if ( self._leftElement !== null && self._rightElement !== null ) {
        return;
      }
      self._createElements();
    }
    /**
     * Assigns a view to a given side
     * @method _assignViewToSide
     * @param {DOMElement} whichElement
     * @param {ViewContainer} aView
     * @private
     */
    self._assignViewToSide = function( whichElement, aView ) {
      self._createElementsIfNecessary();
      aView.splitViewController = self;
      aView.notify( "viewWasPushed" ); // notify the view it was "pushed"
      aView.notify( "viewWillAppear" ); // notify the view it will appear
      aView.parentElement = whichElement; // and make us the parent
      aView.notify( "viewDidAppear" ); // and notify it that it's actually there.
    };
    /**
     * Unparents a view on a given side, sending all the requisite notifications
     *
     * @method _unparentSide
     * @param {Number} sideIndex
     * @private
     */
    self._unparentSide = function( sideIndex ) {
      if ( self._subviews.length >= sideIndex ) {
        var aView = self._subviews[ sideIndex ];
        if ( aView !== null ) {
          aView.notify( "viewWillDisappear" ); // notify the view that it is going to disappear
          aView.parentElement = null; // remove the view
          aView.notify( "viewDidDisappear" ); // notify the view that it did disappear
          aView.notify( "viewWasPopped" ); // notify the view that it was "popped"
          delete aView.splitViewController;
        }
      }
    };
    /**
     * Allows access to the left view
     * @property leftView
     * @type {ViewContainer}
     */
    self.getLeftView = function() {
      if ( self._subviews.length > 0 ) {
        return self._subviews[ 0 ];
      } else {
        return null;
      }
    }
    self.setLeftView = function( aView ) {
      self._unparentSide( 0 ); // send disappear notices
      if ( self._subviews.length > 0 ) {
        self._subviews[ 0 ] = aView;
      } else {
        self._subviews.push( aView );
      }
      self._assignViewToSide( self._leftElement, aView );
      self.notify( "viewsChanged" );
    }
    self.defineProperty( "leftView", {
      read: true,
      write: true,
      backingVariable: false
    } );
    /**
     * Allows access to the right view
     * @property rightView
     * @type {ViewContainer}
     */
    self.getRightView = function() {
      if ( self._subviews.length > 1 ) {
        return self._subviews[ 1 ];
      } else {
        return null;
      }
    }
    self.setRightView = function( aView ) {
      self._unparentSide( 1 ); // send disappear notices for right side
      if ( self._subviews.length > 1 ) {
        self._subviews[ 1 ] = aView;
      } else {
        self._subviews.push( aView );
      }
      self._assignViewToSide( self._rightElement, aView );
      self.notify( "viewsChanged" );
    }
    self.defineProperty( "rightView", {
      read: true,
      write: true,
      backingVariable: false
    } );
    /**
     * @method render
     * @abstract
     */
    self.override( function render() {
      return ""; // nothing to render!
    } );
    /**
     * Creates the left and right elements if necessary
     * @method renderToElement
     */
    self.override( function renderToElement() {
      self._createElementsIfNecessary();
      return; // nothing to do.
    } );
    /**
     * Initialize the split view controller
     * @method init
     * @param {ViewContainer} theLeftView
     * @param {ViewContainer} theRightView
     * @param {String} [theElementId]
     * @param {String} [theElementClass]
     * @param {String} [theElementTag]
     * @param {DOMElement} [theParentElement]
     */
    self.override( function init( theLeftView, theRightView, theElementId,
      theElementTag, theElementClass, theParentElement ) {
      if ( typeof theLeftView === "undefined" ) {
        throw new Error(
          "Can't initialize a navigation controller without a left view." );
      }
      if ( typeof theRightView === "undefined" ) {
        throw new Error(
          "Can't initialize a navigation controller without a right view." );
      }
      // do what a normal view container does
      self.super( _className, "init", [ theElementId, theElementTag,
        theElementClass,
        theParentElement
      ] );
      // now add the left and right views
      self.leftView = theLeftView;
      self.rightView = theRightView;
      return self;
    } );
    /**
     * Initialize the split view controller
     * @method initWithOptions
     */
    self.override( function initWithOptions( options ) {
      var theLeftView, theRightView, theElementId, theElementTag, theElementClass,
        theParentElement;
      if ( typeof options !== "undefined" ) {
        if ( typeof options.id !== "undefined" ) {
          theElementId = options.id;
        }
        if ( typeof options.tag !== "undefined" ) {
          theElementTag = options.tag;
        }
        if ( typeof options.class !== "undefined" ) {
          theElementClass = options.class;
        }
        if ( typeof options.parent !== "undefined" ) {
          theParentElement = options.parent;
        }
        if ( typeof options.leftView !== "undefined" ) {
          theLeftView = options.leftView;
        }
        if ( typeof options.rightView !== "undefined" ) {
          theRightView = options.rightView;
        }
      }
      self.init( theLeftView, theRightView, theElementId, theElementTag,
        theElementClass, theParentElement );
      if ( typeof options !== "undefined" ) {
        if ( typeof options.viewType !== "undefined" ) {
          self.viewType = options.viewType;
        }
        if ( typeof options.leftViewStatus !== "undefined" ) {
          self.leftViewStatus = options.leftViewStatus;
        }
      }
      return self;
    } );
    /**
     * Destroy our elements and clean up
     *
     * @method destroy
     */
    self.override( function destroy() {
      self._unparentSide( 0 );
      self._unparentSide( 1 );
      if ( self._leftElement !== null ) {
        self.element.removeChild( self._leftElement );
      }
      if ( self._rightElement !== null ) {
        self.element.removeChild( self._rightElement );
      }
      self._leftElement = null;
      self._rightElement = null;
      self.super( _className, "destroy" );
    } );
    // auto initialize
    self._autoInit.apply( self, arguments );
    return self;
  }
  return SplitViewController;
} );

/**
 *
 * Tab View Controllers provide basic support for tabbed views
 *
 * @module tabViewController.js
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
/*global define*/
define( 'yasmf/ui/tabViewController',[ "yasmf/ui/core", "yasmf/ui/viewContainer", "yasmf/ui/event" ], function( UI,
  ViewContainer, Event ) {
  var _className = "TabViewController";
  var TabViewController = function() {
    var self = new ViewContainer();
    self.subclass( _className );
    // # Notifications
    //
    // * `viewsChanged` - Fired when the views change
    self.registerNotification( "viewsChanged" );
    // internal elements
    self._tabElements = []; // each tab on the tab bar
    self._tabBarElement = null; // contains our bar button group
    self._barButtonGroup = null; // contains all our tabs
    self._viewContainer = null; // contains all our subviews
    /**
     * Create the tab bar element
     * @method _createTabBarElement
     * @private
     */
    self._createTabBarElement = function() {
      self._tabBarElement = document.createElement( "div" );
      self._tabBarElement.className = "ui-tab-bar ui-tab-default-position";
      self._barButtonGroup = document.createElement( "div" );
      self._barButtonGroup.className = "ui-bar-button-group ui-align-center";
      self._tabBarElement.appendChild( self._barButtonGroup );
    }
    /**
     * Create the tab bar element if necessary
     * @method _createTabBarElementIfNecessary
     * @private
     */
    self._createTabBarElementIfNecessary = function() {
      if ( self._tabBarElement === null ) {
        self._createTabBarElement();
      }
    }
    /**
     * create the view container that will hold all the views this tab bar owns
     * @method _createViewContainer
     * @private
     */
    self._createViewContainer = function() {
      self._viewContainer = document.createElement( "div" );
      self._viewContainer.className =
        "ui-container ui-avoid-tab-bar ui-tab-default-position";
    }
    /**
     * @method _createViewContainerIfNecessary
     * @private
     */
    self._createViewContainerIfNecessary = function() {
      if ( self._viewContainer === null ) {
        self._createViewContainer();
      }
    }
    /**
     * Create all the elements and the DOM structure
     * @method _createElements
     * @private
     */
    self._createElements = function() {
      self._createTabBarElementIfNecessary();
      self._createViewContainerIfNecessary();
      self.element.appendChild( self._tabBarElement );
      self.element.appendChild( self._viewContainer );
    }
    /**
     * @method _createElementsIfNecessary
     * @private
     */
    self._createElementsIfNecessary = function() {
      if ( self._tabBarElement !== null || self._viewContainer !== null ) {
        return;
      }
      self._createElements();
    }
    /**
     * Create a tab element and attach the appropriate event listener
     * @method _createTabElement
     * @private
     */
    self._createTabElement = function( aView, idx ) {
      var e = document.createElement( "div" );
      e.className = "ui-bar-button ui-tint-color";
      e.innerHTML = aView.title;
      e.setAttribute( "data-tag", idx )
      Event.addListener( e, "touchstart", function() {
        self.selectedTab = parseInt( this.getAttribute( "data-tag" ), 10 );
      } );
      return e;
    }
    /**
     * The position of the the tab bar
     * Valid options include: `default`, `top`, and `bottom`
     * @property barPosition
     * @type {TabViewController.BAR\_POSITION}
     */
    self.setObservableBarPosition = function( newPosition, oldPosition ) {
      self._createElementsIfNecessary();
      self._tabBarElement.classList.remove( "ui-tab-" + oldPosition + "-position" );
      self._tabBarElement.classList.add( "ui-tab-" + newPosition + "-position" );
      self._viewContainer.classList.remove( "ui-tab-" + oldPosition + "-position" );
      self._viewContainer.classList.add( "ui-tab-" + newPosition + "-position" );
      return newPosition;
    }
    self.defineObservableProperty( "barPosition", {
      default: "default"
    } );
    /**
     * The alignment of the bar items
     * Valid options are: `left`, `center`, `right`
     * @property barAlignment
     * @type {TabViewController.BAR\_ALIGNMENT}
     */
    self.setObservableBarAlignment = function( newAlignment, oldAlignment ) {
      self._createElementsIfNecessary();
      self._barButtonGroup.classList.remove( "ui-align-" + oldAlignment );
      self._barButtonGroup.classList.add( "ui-align-" + newAlignment );
      return newAlignment;
    }
    self.defineObservableProperty( "barAlignment", {
      default: "center"
    } );
    /**
     * The array of views that this tab view controller manages.
     * @property subviews
     * @type {Array}
     */
    self.defineProperty( "subviews", {
      read: true,
      write: false,
      default: []
    } );
    /**
     * Add a subview to the tab bar.
     * @method addSubview
     * @property {ViewContainer} view
     */
    self.addSubview = function( view ) {
      self._createElementsIfNecessary();
      var e = self._createTabElement( view, self._tabElements.length );
      self._barButtonGroup.appendChild( e );
      self._tabElements.push( e );
      self._subviews.push( view );
      view.tabViewController = self;
      view.notify( "viewWasPushed" );
    }
    /**
     * Remove a specific view from the tab bar.
     * @method removeSubview
     * @property {ViewContainer} view
     */
    self.removeSubview = function( view ) {
      self._createElementsIfNecessary();
      var i = self._subviews.indexOf( view );
      if ( i > -1 ) {
        var hidingView = self._subviews[ i ];
        var hidingViewParent = hidingView.parentElement;
        if ( hidingViewParent !== null ) {
          hidingView.notify( "viewWillDisappear" );
        }
        hidingView.parentElement = null;
        if ( hidingViewParent !== null ) {
          hidingView.notify( "viewDidDisappear" );
        }
        self._subviews.splice( i, 1 );
        self._barButtonGroup.removeChild( self._tabElements[ i ] );
        self._tabElements.splice( i, 1 );
        var curSelectedTab = self.selectedTab;
        if ( curSelectedTab > i ) {
          curSelectedTab--;
        }
        if ( curSelectedTab > self._tabElements.length ) {
          curSelectedTab = self._tabElements.length;
        }
        self.selectedTab = curSelectedTab;
      }
      view.notify( "viewWasPopped" );
      delete view.tabViewController;
    }
    /**
     * Determines which tab is selected; changing will display the appropriate
     * tab.
     *
     * @property selectedTab
     * @type {Number}
     */
    self.setObservableSelectedTab = function( newIndex, oldIndex ) {
      var oldView, newView;
      self._createElementsIfNecessary();
      if ( oldIndex > -1 ) {
        oldView = self._subviews[ oldIndex ];
        if ( newIndex > -1 ) {
          newView = self._subviews[ newIndex ];
        }
        oldView.notify( "viewWillDisappear" );
        if ( newIndex > -1 ) {
          newView.notify( "viewWillAppear" );
        }
        oldView.parentElement = null;
        if ( newIndex > -1 ) {
          self._subviews[ newIndex ].parentElement = self._viewContainer;
        }
        oldView.notify( "viewDidDisappear" );
        if ( newIndex > -1 ) {
          newView.notify( "viewDidAppear" );
        }
      } else {
        newView = self._subviews[ newIndex ];
        newView.notify( "viewWillAppear" );
        self._subviews[ newIndex ].parentElement = self._viewContainer;
        newView.notify( "viewDidAppear" );
      }
      return newIndex;
    };
    self.defineObservableProperty( "selectedTab", {
      default: -1,
      notifyAlways: true
    } );
    /**
     * @method render
     */
    self.override( function render() {
      return ""; // nothing to render!
    } );
    /**
     * @method renderToElement
     */
    self.override( function renderToElement() {
      self._createElementsIfNecessary();
      return; // nothing to do.
    } );
    /**
     * Initialize the tab controller
     * @method init
     * @param {String} [theElementId]
     * @param {String} [theElementTag]
     * @param {String} [theElementClass]
     * @param {DOMElement} [theParentElement]
     * @return {Object}
     */
    self.override( function init( theElementId, theElementTag, theElementClass,
      theParentElement ) {
      // do what a normal view container does
      self.super( _className, "init", [ theElementId, theElementTag,
        theElementClass,
        theParentElement
      ] );
      return self;
    } );
    /**
     * Initialize the tab controller
     * @method initWithOptions
     * @param {Object} options
     * @return {Object}
     */
    self.override( function initWithOptions( options ) {
      var theElementId, theElementTag, theElementClass, theParentElement;
      if ( typeof options !== "undefined" ) {
        if ( typeof options.id !== "undefined" ) {
          theElementId = options.id;
        }
        if ( typeof options.tag !== "undefined" ) {
          theElementTag = options.tag;
        }
        if ( typeof options.class !== "undefined" ) {
          theElementClass = options.class;
        }
        if ( typeof options.parent !== "undefined" ) {
          theParentElement = options.parent;
        }
      }
      self.init( theElementId, theElementTag, theElementClass, theParentElement );
      if ( typeof options !== "undefined" ) {
        if ( typeof options.barPosition !== "undefined" ) {
          self.barPosition = options.barPosition;
        }
        if ( typeof options.barAlignment !== "undefined" ) {
          self.barAlignment = options.barAlignment;
        }
      }
      return self;
    } );
    // auto init
    self._autoInit.apply( self, arguments );
    return self;
  }
  TabViewController.BAR_POSITION = {
    default: "default",
    top: "top",
    bottom: "bottom"
  };
  TabViewController.BAR_ALIGNMENT = {
    center: "center",
    left: "left",
    right: "right"
  }
  return TabViewController;
} );

/**
 *
 * Provides native-like alert methods, including prompts and messages.
 *
 * @module alert.js
 * @author Kerri Shotts
 * @version 0.4
 *
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
/*global define*/
define( 'yasmf/ui/alert',[ "yasmf/util/core", "yasmf/util/device", "yasmf/util/object", "yasmf/ui/core",
  "Q", "yasmf/ui/event"
], function( _y, theDevice, BaseObject, UI, Q, event ) {
  var _className = "Alert";
  var Alert = function() {
      var self = new BaseObject();
      self.subclass( _className );
      /*
       * # Notifications
       *
       * * `buttonTapped` indicates which button was tapped when the view is dismissing
       * * `dismissed` indicates that the alert was dismissed (by user or code)
       */
      self.registerNotification( "buttonTapped" );
      self.registerNotification( "dismissed" );
      /**
       * The title to show in the alert.
       * @property title
       * @type {String}
       */
      self._titleElement = null; // the corresponding DOM element
      self.setTitle = function( theTitle ) {
        self._title = theTitle;
        if ( self._titleElement !== null ) {
          self._titleElement.innerHTML = theTitle;
        }
      }
      self.defineProperty( "title", {
        read: true,
        write: true,
        default: _y.T( "ALERT" )
      } );
      /**
       * The body of the alert. Leave blank if you don't need to show
       * anything more than the title.
       * @property text
       * @type {String}
       */
      self._textElement = null;
      self.setText = function( theText ) {
        self._text = theText;
        if ( self._textElement !== null ) {
          self._textElement.innerHTML = theText;
        }
      }
      self.defineProperty( "text", {
        read: true,
        write: true
      } );
      /**
       * The alert's buttons are specified in this property. The layout
       * is expected to be: `[ { title: title [, type: type] [, tag: tag] } [, {} ...] ]`
       *
       * Each button's type can be "normal", "bold", "destructive". The tag may be
       * null; if it is, it is assigned the button index. If a tag is specifed (common
       * for cancel buttons), that is the return value.
       * @property buttons
       * @type {Array}
       */
      self._buttons = [];
      self._buttonContainer = null;
      self.setButtons = function( theButtons ) {
        function dismissWithIndex( idx ) {
          return function() {
            self.dismiss( idx );
          };
        }
        var i;
        // clear out any previous buttons in the DOM
        if ( self._buttonContainer !== null ) {
          for ( i = 0; i < self._buttons.length; i++ ) {
            self._buttonContainer.removeChild( self._buttons[ i ].element );
          }
        }
        self._buttons = theButtons;
        // determine if we need wide buttons or not
        var wideButtons = !( ( self._buttons.length >= 2 ) && ( self._buttons.length <=
          3 ) );
        // add the buttons back to the DOM if we can
        if ( self._buttonContainer !== null ) {
          for ( i = 0; i < self._buttons.length; i++ ) {
            var e = document.createElement( "div" );
            var b = self._buttons[ i ];
            // if the tag is null, give it (i)
            if ( b.tag === null ) {
              b.tag = i;
            }
            // class is ui-alert-button normal|bold|destructive [wide]
            // wide buttons are for 1 button or 4+ buttons.
            e.className = "ui-alert-button " + b.type + " " + ( wideButtons ? "wide" :
              "" );
            // title
            e.innerHTML = b.title;
            if ( !wideButtons ) {
              // set the width of each button to fill out the alert equally
              // 3 buttons gets 33.333%; 2 gets 50%.
              e.style.width = "" + ( 100 / self._buttons.length ) + "%";
            }
            // listen for a touch
            event.addListener( e, "touchend", dismissWithIndex( i ) );
            b.element = e;
            // add the button to the DOM
            self._buttonContainer.appendChild( b.element );
          }
        }
      }
      self.defineProperty( "buttons", {
        read: true,
        write: true,
        default: []
      } );
      // other DOM elements we need to construct the alert
      self._rootElement = null; // root element contains the container
      self._alertElement = null; // points to the alert itself
      self._vaElement = null; // points to the DIV used to vertically align us
      self._deferred = null; // stores a promise
      /**
       * If true, show() returns a promise.
       * @property usePromise
       * @type {boolean}
       */
      self.defineProperty( "usePromise", {
        read: true,
        write: false,
        default: false
      } );
      /**
       * Indicates if the alert is veisible.
       * @property visible
       * @type {Boolean}
       */
      self.defineProperty( "visible", {
        read: true,
        write: false,
        default: false
      } );
      /**
       * Creates the DOM elements for an Alert. Assumes the styles are
       * already in the style sheet.
       * @method _createElements
       * @private
       */
      self._createElements = function() {
        self._rootElement = document.createElement( "div" );
        self._rootElement.className = "ui-alert-container";
        self._vaElement = document.createElement( "div" );
        self._vaElement.className = "ui-alert-vertical-align";
        self._alertElement = document.createElement( "div" );
        self._alertElement.className = "ui-alert";
        self._titleElement = document.createElement( "div" );
        self._titleElement.className = "ui-alert-title";
        self._textElement = document.createElement( "div" );
        self._textElement.className = "ui-alert-text";
        self._buttonContainer = document.createElement( "div" );
        self._buttonContainer.className = "ui-alert-button-container";
        self._alertElement.appendChild( self._titleElement );
        self._alertElement.appendChild( self._textElement );
        self._alertElement.appendChild( self._buttonContainer );
        self._vaElement.appendChild( self._alertElement );
        self._rootElement.appendChild( self._vaElement );
      }
      /**
       * Called when the back button is pressed. Dismisses with a -1 index. Effectively a Cancel.
       * @method backButtonPressed
       */
      self.backButtonPressed = function() {
        self.dismiss( -1 );
      }
      /**
       * Hide dismisses the alert and dismisses it with -1. Effectively a Cancel.
       * @method hide
       * @return {[type]} [description]
       */
      self.hide = function() {
        self.dismiss( -1 );
      }
      /**
       * Shows an alert.
       * @method show
       * @return {Promise} a promise if usePromise = true
       */
      self.show = function() {
        if ( self.visible ) {
          if ( self.usePromise && self._deferred !== null ) {
            return self._deferred;
          }
          return; // can't do anything more.
        }
        // listen for the back button
        UI.backButton.addListenerForNotification( "backButtonPressed", self.backButtonPressed );
        // add to the body
        document.body.appendChild( self._rootElement );
        // animate in
        setTimeout( function() {
          self._rootElement.style.opacity = "1";
        }, 50 );
        setTimeout( function() {
          self._alertElement.style.opacity = "1";
          UI.styleElement( self._alertElement, "transform", "scale3d(1.05, 1.05,1)" )
        }, 125 );
        setTimeout( function() {
          UI.styleElement( self._alertElement, "transform", "scale3d(0.95, 0.95,1)" )
        }, 250 );
        setTimeout( function() {
          UI.styleElement( self._alertElement, "transform", "scale3d(1.00, 1.00,1)" )
        }, 375 );
        self._visible = true;
        if ( self.usePromise ) {
          self._deferred = Q.defer();
          return self._deferred.promise;
        }
      }
      /**
       * Dismisses the alert with the sepcified button index
       *
       * @method dismiss
       * @param {Number} idx
       */
      self.dismiss = function( idx ) {
        if ( !self.visible ) {
          return;
        }
        // drop the listener for the back button
        UI.backButton.removeListenerForNotification( "backButtonPressed", self.backButtonPressed );
        // remove from the body
        setTimeout( function() {
          self._alertElement.style.opacity = "0";
        }, 10 );
        setTimeout( function() {
          self._rootElement.style.opacity = "0";
        }, 250 );
        setTimeout( function() {
          document.body.removeChild( self._rootElement );
        }, 500 );
        // get notification tag
        var tag = -1;
        if ( ( idx > -1 ) && ( idx < self._buttons.length ) ) {
          tag = self._buttons[ idx ].tag;
        }
        // send our notifications as appropriate
        self.notify( "dismissed" );
        self.notify( "buttonTapped", [ tag ] );
        self._visible = false;
        // and resolve/reject the promise
        if ( self.usePromise ) {
          if ( tag > -1 ) {
            self._deferred.resolve( tag );
          } else {
            self._deferred.reject( new Error( tag ) );
          }
        }
      }
      /**
       * Initializes the Alert and calls _createElements.
       * @method init
       * @return {Object}
       */
      self.override( function init() {
        self.super( _className, "init" );
        self._createElements();
        return self;
      } );
      /**
       * Initializes the Alert. Options includes title, text, buttons, and promise.
       * @method overrideSuper
       * @return {Object}
       */
      self.override( function initWithOptions( options ) {
        self.init();
        if ( typeof options !== "undefined" ) {
          if ( typeof options.title !== "undefined" ) {
            self.title = options.title;
          }
          if ( typeof options.text !== "undefined" ) {
            self.text = options.text;
          }
          if ( typeof options.buttons !== "undefined" ) {
            self.buttons = options.buttons;
          }
          if ( typeof options.promise !== "undefined" ) {
            self._usePromise = options.promise;
          }
        }
        return self;
      } );
      /**
       * Clean up after ourselves.
       * @method destroy
       */
      self.overrideSuper( self.class, "destroy", self.destroy );
      self.destroy = function destroy() {
        if ( self.visible ) {
          self.hide();
          setTimeout( destroy, 600 ); // we won't destroy immediately.
          return;
        }
        self._rootElement = null;
        self._vaElement = null;
        self._alertElement = null;
        self._titleElement = null;
        self._textElement = null;
        self._buttonContainer = null;
        self.super( _className, "destroy" );
      };
      // handle auto-init
      self._autoInit.apply( self, arguments );
      return self;
    }
    /**
     * Creates a button suitable for an Alert
     * @method button
     * @param  {String} title   The title of the button
     * @param  {Object} options The additional options: type and tag
     * @return {Object}         A button
     */
  Alert.button = function( title, options ) {
    var button = {};
    button.title = title;
    button.type = "normal"; // normal, bold, destructive
    button.tag = null; // assign for a specific tag
    button.enabled = true; // false = disabled.
    button.element = null; // attached DOM element
    if ( typeof options !== "undefined" ) {
      if ( typeof options.type !== "undefined" ) {
        button.type = options.type;
      }
      if ( typeof options.tag !== "undefined" ) {
        button.tag = options.tag;
      }
      if ( typeof options.enabled !== "undefined" ) {
        button.enabled = options.enabled;
      }
    }
    return button;
  }
  /**
   * Creates an OK-style Alert. It only has an OK button.
   * @method OK
   * @param {Object} options Specify the title, text, and promise options if desired.
   */
  Alert.OK = function( options ) {
    var anOK = new Alert();
    var anOKOptions = {
      title: _y.T( "OK" ),
      text: "",
      buttons: [ Alert.button( _y.T( "OK" ), {
        type: "bold"
      } ) ]
    };
    if ( typeof options !== "undefined" ) {
      if ( typeof options.title !== "undefined" ) {
        anOKOptions.title = options.title;
      }
      if ( typeof options.text !== "undefined" ) {
        anOKOptions.text = options.text;
      }
      if ( typeof options.promise !== "undefined" ) {
        anOKOptions.promise = options.promise
      }
    }
    anOK.initWithOptions( anOKOptions );
    return anOK;
  }
  /**
   * Creates an OK/Cancel-style Alert. It only has an OK and CANCEL button.
   * @method Confirm
   * @param {Object} options Specify the title, text, and promise options if desired.
   */
  Alert.Confirm = function( options ) {
    var aConfirmation = new Alert();
    var confirmationOptions = {
      title: _y.T( "Confirm" ),
      text: "",
      buttons: [ Alert.button( _y.T( "OK" ) ),
        Alert.button( _y.T( "Cancel" ), {
          type: "bold",
          tag: -1
        } )
      ]
    };
    if ( typeof options !== "undefined" ) {
      if ( typeof options.title !== "undefined" ) {
        confirmationOptions.title = options.title;
      }
      if ( typeof options.text !== "undefined" ) {
        confirmationOptions.text = options.text;
      }
      if ( typeof options.promise !== "undefined" ) {
        confirmationOptions.promise = options.promise
      }
    }
    aConfirmation.initWithOptions( confirmationOptions );
    return aConfirmation;
  }
  return Alert;
} );

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
define( 'yasmf',['require','yasmf/util/core','yasmf/util/datetime','yasmf/util/filename','yasmf/util/misc','yasmf/util/device','yasmf/util/object','yasmf/util/fileManager','yasmf/ui/core','yasmf/ui/event','yasmf/ui/viewContainer','yasmf/ui/navigationController','yasmf/ui/splitViewController','yasmf/ui/tabViewController','yasmf/ui/alert'],function( require ) {
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

  var library = require('yasmf');
  if(typeof module !== 'undefined' && module.exports) {
    module.exports = library;
  } else if(globalDefine) {
    (function (define) {
      define(function () { return library; });
    }(globalDefine));
  } else {
    global['_y'] = library;
  }
}(this));
