/**
 * Simpli.js
 * A small library consists of some useful and shorthand function
 *
 * Copyright (c) 2016 Yu H.
 * 
 * @author Yu H.
 * @version 1.2.3
 * @license The MIT License (MIT)
 * https://opensource.org/licenses/MIT
 **/

if (typeof Object.create === "undefined") {
    Object.create = function(prototype) {
        function C() {}
        C.prototype = prototype;
        return new C();
    };
}

/*
 * String.nthIndexOf
 * @version 1.0.2
 */
if (typeof String.prototype.nthIndexOf === "undefined") {
    /**
     * The function returns the position of the nth occurrence of a search 
     * value in a string.
     *
     * @param {string} searchValue  The value to search for
     * @param {number} nthIndex     Which occurence to search for. If index 
     *                              is a negative number, it will perform
     *                              a backward search. All index starts at
     *                              1
     * @param {number} [start]      (Optional) At which position to start
     * @return {number}             Position where the search value of nth 
     *                              occurrence appears, -1 if it does not 
     *                              appears
     */
    String.prototype.nthIndexOf = function(searchValue, nthIndex, start) {
        var i, l, 
            tmp, position=[], posIndex=0, targetIndex;
        
        if (nthIndex === 0) {
            throw new TypeError("nthIndex cannot be 0 in "+
                "String.nthIndexOf(searchValue, nthIndex, start)");
        }
        // initialize the loop
        i=(typeof start === "undefined")? -1: start-1;
        l=this.length;
        /* 
         * loop throught the string using the string length as iteration 
         * condition
         */
        while(i<l) {
            /*
             * use indexOf with progressively increment i to search for 
             * substring occurence 
             */
            i = this.indexOf(searchValue, i+1);
            // position nthIndex reached
            if (posIndex+1 === nthIndex) {
                return i;
            }
            // no more occurence of the string found
            if (i === -1) {
                break;
            }
            // keep an array of position for negative nth index
            position[posIndex++] = i;
        }
        if (nthIndex < 0) {
            // calcuate the correct index for negative nth index
            targetIndex = posIndex + nthIndex;
            if (targetIndex >= 0) {
                return position[targetIndex];
            }
        }
        return -1;
    }
}

/*
 * JS StackTrace
 * @version 1.0.3
 * Generate a stack trace
 * @return {array|null}     Returns an array of stack trace, or null if the 
 *                          Stack Trace is in unrecognized format. 
 */
var getStackTrace = (function() {
    /**
     * This function wrap and return the console object according to the 
     * current environment support
     * 
     * @return {object}     The console object
     */
    var _console = function() {
        /*
         * console in Internet Explorer prior to 10 is undefined if the 
         * developer console is not opened
         */
        if (typeof console !== "undefined") {
            /*
             * console in Internet Explorer prior to 10 does not have 
             * console.debug
             */
            if (typeof console.debug === "undefined") {
                console.debug = console.log;
            }
            return console;
        } else {
            return {
                log: function(message) {}, 
                info: function(message) {}, 
                warn: function(message) {}, 
                error: function(message) {}, 
                debug: function(message) {}
            }
        }
    }
    // old IE browsers does not support String.trim()
    var _trimRegEx = new RegExp("^\\s+|\\s+$", "g");
    var getFNameFromFString = function(str) {
        var tmp = Object.toString.call(str), 
            calllerName;
        // remove anything before the function name
        tmp = tmp.slice(tmp.indexOf("function")+8);

        // get the function name without any space
        callerName = tmp.slice(0, tmp.indexOf("(")).replace(_trimRegEx, '');
        return (callerName.length === 0)? "anonymous": callerName;
    }
    /*
     * Possible stack format in Chrome, Opera, Internet Explorer:
     * "TypeError: Cannot set property 'baz' of undefined"
     * "   at getStackTrace (simpli.js:125:13)"
     * "   at basic.js:329:1"
     *
     * Possible stack format in Firefox:
     * "getStackTrace@simpli.js:125:13"
     * "@basic.js:329:1"
     */
    var _traceRegEx = new RegExp(
        "^(?:\\s*at\\s?(.*)\\s|(.*)@)" +
        "\\(?(.*):([1-9][0-9]*):([1-9][0-9]*)\\)?$");
    var getInfoFromStack = function(trace) {
        var groups = trace.match(_traceRegEx), 
            name;
        /*
         * Returns null if nothing matches
         */
        if (groups === null) {
            return null;
        }
        name = (typeof groups[1]==="undefined")? groups[2]: groups[1];
        return {
            invokedBy: (name==="")? "anonymous": name, 
            file: groups[3], 
            line: groups[4], 
            column: groups[5]
        };
    }
    return (function() {
        var stack, caller, traceInfo, 
            i, l, 
            stackTrace = [], 
            compatibility = true;
        try{
            var foo;
            foo.bar.baz = 1;
        }catch(e){
            if (typeof e.stack !== "undefined") {
                compatibility = false;
                stack = e.stack.split("\n");
                /*
                 * In non-Firefox browsers, the first stacktrace is the 
                 * TypeError message and does not match with the trace
                 * Regular Expression
                 */
                i = (stack[0].match(_traceRegEx) === null)? 2: 1;
                for(l=stack.length; i<l; i++) {
                    // In Firefox, the last stack is sometimes an empty string
                    if (stack[i].length === 0) {
                        break;
                    }
                    traceInfo = getInfoFromStack(stack[i]);
                    /*
                     * Stack Trace format is not a standard and there are 
                     * always inconsistency between browsers and unpredictable 
                     * future updates. In case the regular expression does not 
                     * match with the trace, fallback to compatibility mode
                     */
                    if (traceInfo === null) {
                        compatibility = true;
                        break;
                    }
                    /*
                     * In non-Firefox browsers, the first stacktrace is the 
                     * TypeError message
                     */
                    if (traceInfo.invokedBy === "getStackTrace") {
                        continue;
                    }
                    stackTrace.push(traceInfo);
                }
            } 
            if (compatibility) {
                // compatibility mode for old IE and Safari
                _console().error("[Warning] getStackTrace() running in "+
                    "compatibility mode");
                try {
                    caller = arguments.callee;
                } catch(e) {
                    // callee and caller are not allowed in strict mode
                    _console().error("[Warning] getStackTrace() "+
                        "compatibility mode cannot be run in strict mode");
                    return null;
                }
                // loop throught until caller is no longer defined
                while (caller.caller) {
                    caller = caller.caller;
                    stackTrace.push({
                        invokedBy: getFNameFromFString(caller), 
                        file: undefined, 
                        line: undefined, 
                        column: undefined
                    });
                }
            }
        }
        return stackTrace;
    });
})();

/**
 * @namespace simpli
 */
var simpli;
(function(global) {
    "use strict";
    /*
     * Object.toString function is changable. Keep a copy of the function
     * for future usage
     * Object.prototype.toString is a standard way to get the [object {Class}]
     * from a variable
     */
    var toString = Object.prototype.toString;
    /*
     * Object.hasOwnProperty function is changable. Keep a copy of the 
     * function for future usage
     */
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    /*
     * In Internet Explorer 11, "use strict" will create a different Window
     * object from the non-strict environment. The Window under non-strict
     * environment can be referred by variable window
     */
    var _IE11Window = (typeof window !== "undefined")? window: global;

    /**
     * simpli
     * simpli function will be implemented in future version and is now
     * only a dummy function
     */
    simpli = function() {
        // TODO: 
    };
    simpli.version = "1.2.3";
    
    /**
     * This function wrap and return the console object according to the 
     * current environment support
     * @return {object}     The console object
     * @memberof simpli
     */
    simpli.console = function() {
        /*
         * console in Internet Explorer prior to 10 is undefined if the 
         * developer console is not opened
         */
        if (simpli.isDefined(console)) {
            /*
             * console in Internet Explorer prior to 10 does not have 
             * console.debug
             */
            if (!simpli.isDefined(console.debug)) {
                console.debug = console.log;
            }
            return console;
        } else {
            return {
                log: function(message) {}, 
                info: function(message) {}, 
                warn: function(message) {}, 
                error: function(message) {}, 
                debug: function(message) {}
            }
        }
    }

    /**
     * Iterate all the own properties of an object and pass the property
     * name and value to the callback function provided
     * @param {object} obj          The object to be iterated
     * @param {function} callback   The callback function to call on each 
     *                              propert iterated
     * @memberof simpli
     */
    simpli.forEachProperty = function(obj, callback) {
        simpli.argc(arguments, ['object', 'function']);

        for (var property in obj) {
            if (hasOwnProperty.call(obj, property)) {
                callback.call(obj, property, obj[property]);
            }
        }
    }
    
    /**
     * Gives a more detail type of a variable
     * @param {mixed} arg   The variable
     * @return {string}     The detail type of the variable
     * @memberof simpli
     */
    simpli.detailTypeOf = function(arg) {
        var result, 
            i, l, lastElType = "array";

        // check if the array is a typed-array
        if (simpli.isArray(arg)) {
            for (i=0,l=arg.length; i<l; i++) {
                if (lastElType === "array") {
                    lastElType = simpli.getClass(arg[i]);
                } else {
                    if (lastElType !== simpli.getClass(arg[i])) {
                        // the array is mixed type
                        lastElType = "mixed";
                    }
                }
            }
            result = lastElType+"["+arg.length+"]";
        } else {
            result = simpli.getClass(arg);
        }
        return result.toLowerCase();
    }
    
    /**
     * Get the class name of an varaible
     * @param {mixed} arg   The variable
     * @return {string}     The class name of the variable
     * @memberof simpli
     */
    simpli.getClass = function(arg) {
        // identify the global object
        var argString = toString.call(arg);
        // compare to both global and IE11 window under non-strict mode
        if (arg === global || arg === _IE11Window) {
            return "Global";
        }
        // get the class name from the Object.prototype.toString
        return argString.slice(8, -1);
    };
    
    /**
     * Determine if a variable is an object of specified class
     * @param {object} arg                  the variable being evaluated
     * @param {string|function} classID     The class name or constructor
     * @return {boolean}                    Returns true if the variable is 
     *                                      the specified class, false 
     *                                      otherwise
     * @memberof simpli
     */
    simpli.isA = function(arg, classID) {
        // an class constructor is the same as a function
        if (!simpli.isString(classID) && !simpli.isFunction(classID)) {
            throw new TypeError("Expected argument 2 to be 'string' or "+
                "constructor, '"+simpli.detailTypeOf(className) + "' given");
        }
        return (simpli.isString(classID)? (simpli.getClass(arg) === classID): 
            (arg instanceof classID));
    };
    
    /**
     * Determine if a variable is an Arguments object
     * @param {object} arg          the variable being evaluated
     * @param {string} className    The class of the variable
     * @return {boolean}            Returns true if the variable is an 
     *                              Arguments , false otherwise
     * @memberof simpli
     */
    simpli.isArguments = function(arg) {
        return simpli.isA(arg, "Arguments") || 
            /*
             * In old Internet Explorere, Object.prototype.toString.call 
             * cannot give the name of the object. Instaed check for the 
             * existence of property "callee" because it is a unique 
             * property of Arguments
             */
            (!simpli.isA(arguments, "Arguments") && 
                simpli.isDefined(arg) && hasOwnProperty.call(arg, "callee"));
    };

    /**
     * Convert Arguments to array
     * @param {Arguments} args  The arguments object
     * @return {array}          The resulting array
     * @memberof simpli
     */
    simpli.argumentsToArray = function(args) {
        var i, l, result=[];
        for (i=0,l=args.length; i<l; i++) {
            result.push(args[i]);
        }
        return result;
    }
    
    /**
     * Determine if a variable is a mixed type
     * Practically every variable is a mixed type as long as it is not 
     * underfined.
     * @param {mixed} arg   The variable being evaluated
     * @return {boolean}    Returns true if the variable is a mixed type, 
     *                      false otherwise
     * @memberof simpli
     */
    simpli.isMixed = function(arg) {
        return (typeof arg !== "undefined");
    };
    
    /**
     * Determine if a variable is null
     * @param {mixed} arg   The variable being evaluated
     * @return {boolean}    Returns true if the variable is null, false 
     *                      otherwise
     * @memberof simpli
     */
    simpli.isNull = function(arg) {
        return (arg === null);
    };
    
    /**
     * Deterine if a variable is defined
     * If a variable has not been defined, it will return undefined when 
     * passed to typeof
     * simpli.isDefined() can only determine variable that is defined but not
     * yet initialized with a value. This is the restriction of JavaScript and
     * you cannot pass a undefined varaible as an argument to a function
     * @param {mixed} arg   The variable being evaluated
     * @return {boolean}    Returns true if arg has been defined, false 
     *                      otherwise
     * @memberof simpli
     */
    simpli.isDefined = function(arg) {
        return (typeof arg !== "undefined");
    };
    
    /**
     * Determine if a chain of propterties of a variable is all defined
     * In JavaScript a variable maybe a chain of properties, an simple example
     * would be foo.bar.baz. This funtion determine if all the properties in 
     * this chain are all well defined
     * @param {mixed} root              The root variable being evaluated
     * @param {...integer|string} prop  The remaining properties in the chain
     * @return {boolean}                Returns true if the whole chain of 
     *                                  object of variable has been defined, 
     *                                  false otherwise
     * @memberof simpli
     */
    simpli.isDeepDefined = function() {
        var len = arguments.length;
        var root, prop, i;
        if (len < 1) {
            throw new TypeError("Expected argument 1 to have at least  " + 
                "1 object, 0 given");
        }

        root = arguments[0];
        for (i=1; i<len; i++) {
            prop = arguments[i];
            if (!simpli.isInteger(prop) && !simpli.isString(prop)) {
                throw new TypeError("Expected argument "+i+" to be "+
                    "'integer' or 'string', "+(typeof prop)+" given");
            }

            root = root[prop];

            if (!simpli.isDefined(root)) {
                return false;
            }
        }
        return true;
    };
    
    /**
     * Determine if a variable is set
     * A variable is set if it is deinfed and is not null
     * @param {mixed} arg   The variable being evaluated
     * @param {boolean}     Returns true if the variable is set, false 
     *                      otherwise
     * @memberof simpli
     */
    simpli.isSet = function(arg) {
        return (simpli.isDefined(arg) && !simpli.isNull(arg));
    }
    
    /**
     * Determine if a variable is NaN
     * @param {mixed} arg   The variable being evaluated
     * @param {boolean}     Returns true if the variable is Nan, false 
     *                      otherwise
     * @memberof simpli
     */
    simpli.isNaN = function(arg) {
        /*
         * a special property of NaN is that the NaN variable is not equal to
         * itself
         */
        return arg !== arg;
    };
    
    /**
     * Determine if a variable is an object
     * @param {mixed} arg           The variable being evaluated
     * @return {boolean}            Returns true if the variable is an object
     *                              of the class(if specified), false otherwise
     * @memberof simpli
     */
    simpli.isObject = function(arg) {
        // exclude null which gives object when applying typeof
        return (typeof arg === "object") && 
            !(simpli.isArray(arg)) && (arg !== null);
    };
    
    /**
     * Determinf if a variable is a number
     * @param {mixed} arg   The variable being evaluated
     * @return {boolean}    Returns true if the variable is a number, false 
     *                      otherwise
     * @memberof simpli
     */
    simpli.isNumber = function(arg) {
        return (typeof arg === "number");
    };
    
    /**
     * Determine if a variable is a function
     * @param {mixed} arg   The variable being evaluated
     * @return {boolean}    Returns true if the variable is a function, false
     *                      otherwise
     * @memberof simpli
     */
    simpli.isFunction = function(arg) {
        return (typeof arg === "function");
    };

    /**
     * Determine if a variable is a boolean
     * @param {mixed} arg   The variable being evaluated
     * @return {boolean}    Returns true if the variable is a boolean, false
     *                      otherwise
     * @memberof simpli
     */
    simpli.isBoolean = function(arg) {
        return (typeof arg === "boolean");
    };

    /**
     * Determine if a variable ia an array
     * @param {mixed} arg   The variable being evaluated
     * @return {boolean}    Returns true if the variable is an array, false
     *                      otherwise
     * @memberof simpli
     */
    simpli.isArray = function(arg) {
        // find the class of the object using ECMAScript standard
        // Object.prototype is not editable, so it is reliable
        var className = simpli.getClass(arg);
        if (className === "Array") {
            return true;
        // some old IE browsers will return [object Object] for Array
        } else if(simpli.getClass([]) !== "Array" && className === "Object") {
            // Fix for those old IE browsers
            /*
             * It is hard to have a robust array check for these browsers, 
             * instead an array-like check is performed
             */
            return simpli.isObject(arg) && simpli.isNumber(arg.length);
        } else {
            return false;
        }
    };

    /**
     * Determine if a variable is a string
     * @param {mixed} arg   The variable being evaluated
     * @return {boolean}    Returns true if the variable is a string, false
     *                      otherwise
     * @memberof simpli
     */
    simpli.isString = function(arg) {
        return (typeof arg === "string");
    };

    /**
     * Determine if a variable is an integer
     * @param {mixed} arg   The variable being evaluated
     * @return {boolean}    Returns true if the variable is an integer, false
     *                      otherwise
     * @memberof simpli
     */
    simpli.isInteger = function(arg) {
        /* 
         * false(boolean) and ""(string) will return as integer and returns 
         * true when applying % operator with argument 1
         */
        return simpli.isNumber(arg) && (arg%1 === 0);
    };
    
    /**
     * Determine if a variable is a decimal
     * If the two optional arguments are provided, the function can futher
     * checks the length of the whole number and decimal number part
     * @param {mixed} arg           The varaible being evaluated
     * @param {integer} [whole]     (Optional)The length of the whole number
     * @param {integer} [decimal]   (Optional)The length of the decimal number
     * @return {boolean}            Returns true if the variable is an decimal
     *                              number that satisfies the whole number and
     *                              decimal number requirement (if specifies), 
     *                              false otherwise
     * @memberof simpli
     */
    simpli.isDecimal = function(arg, whole, decimal) {
        var hasWhole = false,
            hasDecimal = false, 
            parts;
        if (!simpli.isNumber(arg)) {
            return false;
        }
        // convert arg to string by appending it to an empty string
        parts = (arg+'').split(".");
        if (simpli.isDefined(whole)) {
            hasWhole = true;
            if (!simpli.isInteger(whole)) {
                throw new TypeError("Expected argument 2 to be 'integer', '" +
                    simpli.detailTypeOf(whole)+"' given");
            }
        }
        /*
         * In JavaScript, numbers are always 64bit floating point. If the 
         * argument given is an integer, it is considered to be a decimal 
         * number and it always satisfies the decimal requirement because you
         * can append any number of 0s to the decimal part of an integer
         */
        if (simpli.isDefined(decimal) && parts.length === 2) {
            hasDecimal = true;
            if (!simpli.isInteger(decimal)) {
                throw new TypeError("Expected argument 3 to be 'integer', '" +
                    simpli.detailTypeOf(decimal)+"' given");
            }
        }
        if (hasWhole || hasDecimal) {
            return (hasWhole? (parts[0].length===whole): true) && 
                (hasDecimal? ((parts.length===2)?
                    parts[1].length<=decimal: false): true);
        } else {
            /* 
             * if whole and decimal is not specified, any number is 
             * essentially a decimal
             */
            return true;
        }
    };
    
    /**
     * Determine if a variable is a character
     * @param {mixed} arg       The varaible being evulated
     * @param {integer} [size]  (Optional)The size of the array
     * @return {boolean}        Returns true if the variable is a character, 
     *                          false otherwise
     * @memberof simpli
     */
    simpli.isChar = function(arg) {
        return (simpli.isString(arg) && arg.length === 1);
    }
    
    /**
     * Determine if a variable is an object array
     * @param {mixed} arg           The varaible being evulated
     * @param {object} [classObj]   (Optional)The class constructor of the 
     *                              variable
     * @param {integer} [size]      (Optional)The size of the array
     * @return {boolean}            Returns true if the variable is an array 
     *                              containing only object of the class(if 
     *                              specified), false otherwise
     * @memberof simpli
     */
    simpli.isObjectArray = function(arg, size) {
        var i,l;

        if (!simpli.isArray(arg)) {
            return false;
        }
        l = arg.length;
        if (simpli.isDefined(size)) {
            if (!simpli.isInteger(size)) {
                throw new TypeError("Expected arugment 2 to be 'interger', '" +
                    simpli.detailTypeOf(size)+"' given");
            }
            if (l !== size) {
                return false;
            }
        }
        for (i=0; i<l; i++) {
            if (!simpli.isObject(arg[i])) {
                return false;
            }
        }
        return true;
    };
    
    /**
     * Determine if a variable is a number array
     * @param {mixed} arg       The varaible being evulated
     * @param {integer} [size]  (Optional)The size of the array
     * @return {boolean}        Returns true if the variable is an array 
     *                          containing only number, false otherwise
     * @memberof simpli
     */
    simpli.isNumberArray = function(arg, size) {
        var i,l;

        if (!simpli.isArray(arg)) {
            return false;
        }
        l = arg.length;
        if (simpli.isDefined(size)) {
            if (!simpli.isInteger(size)) {
                throw new TypeError("Expected arugment 2 to be 'interger', '" +
                    simpli.detailTypeOf(size)+"' given");
            }
            if (l !== size) {
                return false;
            }
        }
        for (i=0; i<l; i++) {
            if (!simpli.isNumber(arg[i])) {
                return false;
            }
        }
        return true;
    }
    
    /**
     * Determine if a variable is a function array
     * @param {mixed} arg       The varaible being evulated
     * @param {integer} [size]  (Optional)The size of the array
     * @return {boolean}        Returns true if the variable is an array 
     *                          containing only function, false otherwise
     * @memberof simpli
     */
    simpli.isFunctionArray = function(arg, size) {
        var i,l;

        if (!simpli.isArray(arg)) {
            return false;
        }
        l = arg.length;
        if (simpli.isDefined(size)) {
            if (!simpli.isInteger(size)) {
                throw new TypeError("Expected arugment 2 to be 'interger', '" +
                    simpli.detailTypeOf(size)+"' given");
            }
            if (l !== size) {
                return false;
            }
        }
        for (i=0; i<l; i++) {
            if (!simpli.isFunction(arg[i])) {
                return false;
            }
        }
        return true;
    }
    
    /**
     * Determine if a variable is a boolean array
     * @param {mixed} arg       The varaible being evulated
     * @param {integer} [size]  (Optional)The size of the array
     * @return {boolean}        Returns true if the variable is an array 
     *                          containing only boolean, false otherwise
     * @memberof simpli
     */
    simpli.isBooleanArray = function(arg, size) {
        var i,l;

        if (!simpli.isArray(arg)) {
            return false;
        }
        l = arg.length;
        if (simpli.isDefined(size)) {
            if (!simpli.isInteger(size)) {
                throw new TypeError("Expected arugment 2 to be 'interger', '" +
                    simpli.detailTypeOf(size)+"' given");
            }
            if (l !== size) {
                return false;
            }
        }
        for (i=0; i<l; i++) {
            if (!simpli.isBoolean(arg[i])) {
                return false;
            }
        }
        return true;
    }

    /**
     * Determine if a variable is an integer array
     * @param {mixed} arg       The varaible being evulated
     * @param {integer} [size]  (Optional)The size of the array
     * @return {boolean}        Returns true if the variable is an array 
     *                          containing only integer, false otherwise
     * @memberof simpli
     */
    simpli.isIntegerArray = function(arg, size) {
        var i,l;

        if (!simpli.isArray(arg)) {
            return false;
        }
        l = arg.length;
        if (simpli.isDefined(size)) {
            if (!simpli.isInteger(size)) {
                throw new TypeError("Expected arugment 2 to be 'interger', '" +
                    simpli.detailTypeOf(size)+"' given");
            }
            if (l !== size) {
                return false;
            }
        }
        for (i=0; i<l; i++) {
            if (!simpli.isInteger(arg[i])) {
                return false;
            }
        }
        return true;
    }

    /**
     * Alias of simpli.isNumberArray
     * @param {mixed} arg       The varaible being evulated
     * @param {integer} [size]  (Optional)The size of the array
     * @return {boolean}        Returns true if the variable is an array 
     *                          containing only decimal, false otherwise
     * @memberof simpli
     */
    simpli.isDecimalArray = simpli.isNumberArray;

    /**
     * Determine if a variable is a string array
     * @param {mixed} arg       The varaible being evulated
     * @param {integer} [size]  (Optional)The size of the array
     * @return {boolean}        Returns true if the variable is an array 
     *                          containing only string, false otherwise
     * @memberof simpli
     */
    simpli.isStringArray = function(arg, size) {
        var i,l;

        if (!simpli.isArray(arg)) {
            return false;
        }
        l = arg.length;
        if (simpli.isDefined(size)) {
            if (!simpli.isInteger(size)) {
                throw new TypeError("Expected arugment 2 to be 'interger', '" +
                    simpli.detailTypeOf(size)+"' given");
            }
            if (l !== size) {
                return false;
            }
        }
        for (i=0; i<l; i++) {
            if (!simpli.isString(arg[i])) {
                return false;
            }
        }
        return true;
    }
    
    var _argv = {};

    _argv.INVALID_ARGUMENT = function() {
        if (!(this instanceof _argv.INVALID_ARGUMENT)) {
            return new _argv.INVALID_ARGUMENT();
        }
        this.index = -1;
        this.message = "";
        this.error = "";
    }
    /**
     * Get the message
     * @param {object} argvStruct   The argv structure
     * @memberof _argv.INVALID_ARGUMENT#
     * @ignore
     */
    _argv.INVALID_ARGUMENT.prototype.getMessage = function() {
        return this.message;
    }
    /**
     * Get the index of the invalid argument
     * @return {integer}    Returns the index of invalid argument, -1 if the 
     *                      invalid argument is not a single element
     * @memberof _argv.INVALID_ARGUMENT#
     * @ignore
     */
    _argv.INVALID_ARGUMENT.prototype.getIndex = function() {
        return this.index;
    }
    /**
     * Get the error identity code
     * @memberof _argv.INVALID_ARGUMENT#
     * @ignore
     */
    _argv.INVALID_ARGUMENT.prototype.getError = function() {
        return this.error;
    }

    /**
     * Create a mismatch argument number exception
     * @param {object} argvStruct       The argv structure
     * @param {integer} given           The given number of arguments
     * @param {boolean} isLowerBound    Whether the expected number of 
     *                                  arguments is a lower bound
     * @memberof _argv
     * @ignore
     */
    _argv.MISMATCH_ARGNUMBER = function(argvStruct, expected, isLowerBound) {
        var i, argsLen;

        if (!(this instanceof _argv.MISMATCH_ARGNUMBER)) {
            return new _argv.MISMATCH_ARGNUMBER(
                argvStruct, expected, isLowerBound);
        }
        // define parent class
        _argv.INVALID_ARGUMENT.call(this);

        isLowerBound = isLowerBound || false;

        argsLen = argvStruct.length;

        this.message = "Argument number mismatch: Expected "+
            ((this.isLowerBound)?"at least ":"")+expected+" argument(s), "+
            argsLen+" given";
        this.error = simpli.argv.MISMATCH_ARGNUMBER;

        // update the argv structure
        for(i=0; i<argsLen; i++) {
            argvStruct[i].valid = false;
            argvStruct[i].error = simpli.argv.MISMATCH_ARGNUMBER;
        }
    };
    // inheritance
    _argv.MISMATCH_ARGNUMBER.prototype = 
        Object.create(_argv.INVALID_ARGUMENT.prototype);
    _argv.MISMATCH_ARGNUMBER.prototype.constructor = _argv.MISMATCH_ARGNUMBER;

    /**
     * Create an unexpected data type exception
     * @param {object} argvStruct   The argv structure
     * @param {integer} index       The index of the unexpected data type
     * @memberof _argv
     * @ignore
     */
    _argv.UNEXPECTED_DATATYPE = function(argvStruct, index) {
        var argvInstance, i, argsLen;

        if (!(this instanceof _argv.UNEXPECTED_DATATYPE)) {
            return new _argv.UNEXPECTED_DATATYPE(argvStruct, index);
        }
        // define parent class
        _argv.INVALID_ARGUMENT.call(this);

        argvInstance = argvStruct[index];

        this.index = index;
        this.message = "Expected '"+argvInstance.expected+"', '"+
            argvInstance.given+"' given";
        this.error = argvStruct[index].error = simpli.argv.UNEXPECTED_DATATYPE;
    }
    // inheritance
    _argv.UNEXPECTED_DATATYPE.prototype = 
        Object.create(_argv.INVALID_ARGUMENT.prototype);
    _argv.UNEXPECTED_DATATYPE.prototype.constructor = 
        _argv.UNEXPECTED_DATATYPE;

    /**
     * Invalid argument handler for argument checker
     * @param {object} invalidArg   The invalid argument object
     * @param {object} argvStruct   The argv structure
     * @param {string} invokedBy    The invoking function
     * @param {function} callback   The callback fucntion
     * @throws {TypeError}
     * @ignore
     */
    _argv.invalidHandler = 
        function(invalidObj, argvStruct, invokedBy, callback) {

        var message = "", 
            i, l, j, 
            invalidMessage, 
            index, 
            argMessage, argValue, 
            stackTrace, found, 
            file="", line="", column="", 
            argEl, 
            callbackArg, argvInstance;
        
        invalidMessage = invalidObj.getMessage();
        index = invalidObj.getIndex();

        // construct the string list of arguments
        i = 0;
        l = argvStruct.length;
        argMessage = "";
        while(i < l) {
            // display different argument value according to the data type
            argValue = argvStruct[i].value
            argValue = (simpli.isString(argValue))? 
                "\""+argValue+"\"": 
                ((simpli.isNumber(argValue))? 
                    argValue: 
                    toString.call(argValue));

            // highlight the invalid argument
            argMessage += (i===index)? "-->"+argValue+"<--": argValue;

            // add comma delimiter until the last argument
            if (++i < l) {
                argMessage += ", ";
            }
        }

        // get the function name by examining Stack Trace
        stackTrace = getStackTrace();
        // check if Stack Trace is available
        if (!simpli.isNull(stackTrace)) {
            found = false;
            for (i=0,l=stackTrace.length; i<l; i++) {
                // find the Stack Trace corresponding to the invoking function
                if (stackTrace[i].invokedBy === invokedBy || 
                    stackTrace[i].invokedBy === "Function."+invokedBy) {

                    found = true;
                    // shift one more level down the Stack Trace
                    j = i+1;
                    // extract invoking information
                    file = stackTrace[j].file;
                    line = stackTrace[j].line;
                    column = stackTrace[j].column

                    message += invokedBy+"("+argMessage+"): "+invalidMessage+
                        " in "+file+
                        " on line "+line;
                    break;
                }
            }
        }
        // In old Internet Explorer, function declared using 
        // var foo = function() {} cannot be correctly returned using
        // getStackTrace(). Show a simplified message instead.
        if (simpli.isNull(stackTrace) || !found) {
            message += invokedBy+"("+argMessage+"): "+invalidMessage;
        }

        // construct the callback argument
        callbackArg = {
            arguments: [], 
            invokedBy: invokedBy, 
            file: file, 
            line: line, 
            column: column
        };
        for(i=0,l=argvStruct.length; i<l; i++) {
            argvInstance = argvStruct[i];

            // record arguments
            callbackArg.arguments.push({
                valid: argvInstance.valid, 
                index: argvInstance.index, 
                value: argvInstance.value, 
                expected: argvInstance.expected, 
                given: argvInstance.given
            });
            if (simpli.isDefined(argvInstance.error)) {
                callbackArg.arguments[i].error = argvInstance.error;
            }
        }

        // callback function handler
        if (!simpli.isNull(callback)) {
            callback.call(null, callbackArg);
        }
        if (simpli.argv.errorMode() === simpli.argv.ERRMODE_ERROR) {
            // throw Exception under ERROR MODE
            throw new TypeError(message);
        }

        return false;
    };

    /**
     * Ddetermine if the argument is the data type specified
     * This function is used only internally inside closure. It assumes
     * all the arguments are in the right format
     * @param {string} dataType     The data type of the argument
     * @param {mixed} arg           The arg to be evaulated
     * @param {integer} [size]      (Optional)The size of the argument if it 
     *                              is an array
     * @return {boolean}            Returns true if the argument is the data
     *                              type specified, false otherwise
     * @throws {TypeError}
     * @ignore
     */
    _argv.isType = function(arg, dataType, size) {
        if (simpli.isA(dataType, simpli.Type)) {
            // custom data type
            return dataType.is(arg);
        }
        switch(dataType) {
            // JavaScript basic data type
            case "*": 
                return simpli.isMixed(arg);
            case "array":
                return simpli.isArray(arg);
            case "null": 
                return simpli.isNull(arg);
            case "object":
                return simpli.isObject(arg);
            case "number":
                return simpli.isNumber(arg);
            case "boolean":
            case "bool":
                return simpli.isBoolean(arg);
            case "function":
                return simpli.isFunction(arg);
            case "string":
                return simpli.isString(arg);
            default: 
                // Extend data type
                if (simpli.argv.mode() === simpli.argv.MODE_EXTEND) {
                    switch(dataType) {
                        case "mixed": 
                            return simpli.isMixed(arg);
                        case "integer":
                        case "int":
                            return simpli.isInteger(arg);
                        case "decimal": 
                        case "float":
                        case "double": 
                            return simpli.isDecimal(arg);
                        case "char":
                            return simpli.isChar(arg);
                        case "mixed[]": 
                            return simpli.isArray(arg, size);
                        case "object[]":
                            return simpli.isObjectArray(arg, size);
                        case "number[]": 
                            return simpli.isNumberArray(arg, size);
                        case "boolean[]": 
                        case "bool[]":
                            return simpli.isBooleanArray(arg, size);
                        case "string[]": 
                            return simpli.isStringArray(arg, size);
                        case "integer[]": 
                        case "int[]": 
                            return simpli.isIntegerArray(arg, size);
                        case "decimal[]": 
                        case "float[]": 
                        case "double[]": 
                            return simpli.isDecimalArray(arg, size);
                        case "function[]":
                            return simpli.isFunctionArray(arg, size);
                        case "char[]": 
                            if (simpli.isString(arg)) {
                                if (simpli.isDefined(size)) {
                                    return arg.length === size;
                                }
                            } else {
                                return false;
                            }
                    }
                } else {
                    throw new TypeError("Extend data type are not supported "+
                        "in Strict mode");
                }
        }
    };

    _argv.typeRegEx = new RegExp("^(\\*|array|null|" +
        "(mixed|object|number|boolean|bool|function|string|" +
        "integer|int|decimal|float|double|char)(?:\\[([1-9][0-9]*)?\\])?)$");
    _argv.optionalRegEx = /^\[[^\s]+\]$/;
    /**
     * Determine if an argument satisfy any of the data types sepcified
     * @param {mixed} argvInstance  An instance of the argv structure
     * @return {boolean}            Returns true if the argument matches with
     *                              the expected data type
     * @memberof _argv
     * @ignore
     */
    _argv.checkArg = function(argvInstance) {
        var i, l, 
            group, instance, 
            dataType, size, 
            returnValue = false;

        // if the argument is optional, check whether the argument is defined
        // first to reduce unnecessary data type check
        if (argvInstance.optional && !simpli.isDefined(argvInstance.value)) {
            returnValue = true;
        }

        for(i=0,l=argvInstance.signature.length; i<l; i++) {
            instance = argvInstance.signature[i];
            // check the validity of datatype instance
            if (simpli.isA(instance, simpli.Type)) {
                // custom simpli.Type
                dataType = instance;
            } else {
                // pre-defined non-custom datatype
                group = instance.match(_argv.typeRegEx);
                if (group === null) {
                    // unrecognized data type
                    throw new TypeError("Unrecognized data type '"+
                        instance+"'");
                }
                if (returnValue) {
                    // Continue the iterations to check tha validity of all 
                    // the data types
                    continue;
                }
                /* 
                 * The Regular Expression will match all the valid data type 
                 * formats and give different grouping result. The grouping of 
                 * different data type are summarized here:
                 * Test String: `array`
                 * Match Informaiton: 
                 * 1.   `array`
                 *
                 * Test String: `object`
                 * Match Informaiton: 
                 * 1.   `object`
                 * 2.   `object`
                 *
                 * Test String: `object[]`
                 * Match Information: 
                 * 1.   `object[]`
                 * 2.   `object`
                 *
                 * Test String: `object[15]`
                 * Match Information: 
                 * 1.   `object[15]`
                 * 2.   `object`
                 * 3.   `15`
                 */
                // group always has 1 matched string and 3 mathing groups
                // In modern browsers, unmatched group will be undefined while 
                // in pld Internet Explorer, unmatched group will have value ""
                if (simpli.isDefined(group[3]) && group[3] !== "") {
                    // array with upper bound size
                    dataType = group[2] + "[]";
                    size = parseInt(group[3]);
                } else {
                    dataType = group[1];
                    size = undefined;
                }
            }
            // _argv.isType() may throw TypeError if the data type is not 
            // supported in the current mode
            if (_argv.isType(argvInstance.value, dataType, size)) {
                returnValue = true;
            }
        }

        return returnValue;
    };

    /**
     * Define a custom datatype
     * @class simpli.Type
     * @param {string|function} nameOrCallback  The name of the custom data
     *                                          type or the callback function
     *                                          for determining the argument
     *                                          validity
     * @param {function} [callback]             The callback function for 
     *                                          determining the arugment 
     *                                          validity
     * @memberof simpli
     */
    simpli.Type = function(nameOrCallback, callback) {
        // make simpli.Type() new-Agnostic
        if (!(this instanceof simpli.Type)) {
            return new simpli.Type(nameOrCallback, callback);
        }

        if (simpli.isString(nameOrCallback)) {
            // provided with name and callback
            this._name = nameOrCallback;
            if (!simpli.isFunction(callback)) {
                throw new TypeError("Expected argument 2 to be 'function', '"+
                    (typeof callback)+"' given");
            }
            this._callback = callback;
        } else if(simpli.isFunction(nameOrCallback)) {
            // only provided with the callback argument
            this._name = '{simpli.Type}';
            this._callback = nameOrCallback;
        } else {
            throw new TypeError("Expected argument 1 to be 'string' or "+
                "'function', '"+(typeof nameOrCallback)+"' given");
        }

        this._optional = false;
        this._isArray = false;
        this._size = 0;
        this._repeatable = false;
    }
    /**
     * Clone the simpli.Type object
     * @function _clone
     * @return {simpli.Type}    Returns the cloned simpli.Type object
     * @memberof simpli.Type#
     * @ignore
     */
    simpli.Type.prototype._clone = function() {
        var type = new simpli.Type(this.getCallback());
        type._optional = this.isOptional();
        type._isArray = this.isArray();
        type._size = this.getSize();
        type._repeatable = this.isRepeatable();

        return type;
    }
    /**
     * Convert the simpli.Type to callback function
     * @function _toFunction
     * @return {function}   Returns the callback function for determining the 
     *                      validity of argument
     * @memberof simpli.Type#
     * @ignore
     */
    simpli.Type.prototype._toFunction = function() {
        var self = this,
            size;

        return (function(arg) {
            if (self.isOptional() && !simpli.isDefined(arg)) {
                // argument is optional
                return true;
            }
            if (self.isArray()) {
                // array data type
                // check if the argument is an array
                if (!simpli.isArray(arg)) { return false; }
                // determine if the array size is specified
                size = self.getSize();
                if (size > 0 && arg.length > size) { return false; }

                // check for validity of array elements
                for(var i=0; i<arg.length; i++) {
                    if (!self.getCallback()(arg[i])) { return false; }
                }
                return true;
            } else {
                // single element data type
                return self.getCallback()(arg);
            }
        });
    }
    /**
     * Get the name of the simpli.Type
     * @function getName
     * @return {string}     Returns the name of the custom type
     * @memberof simpli.Type#
     */
    simpli.Type.prototype.getName = function() {
        return this._name;
    }
    /**
     * Tell if the simpli.Type is optional argument
     * @return {boolean}    Returns true if the custom type is optional, false
     *                      otherwise
     * @memberof simpli.Type#
     */
    simpli.Type.prototype.isOptional = function() {
        return this._optional;
    }
    /**
     * Tell if the simpli.Type is an array
     * @function isArray
     * @return {boolean}    Returns true if the custom type is an array, false
     *                      otherwise
     * @memberof simpli.Type#
     */
    simpli.Type.prototype.isArray = function() {
        return this._isArray;
    }
    /**
     * Get the size of the simpli.Type array
     * @function getSize
     * @return {integer}    Returns the size of the custom type array. If the 
     *                      custom type is not array, it will still return 0
     * @memberof simpli.Type#
     */
    simpli.Type.prototype.getSize = function() {
        return this._size;
    }
    /**
     * Tell if the simpli.Type is repeatable argument
     * @function isRepeatable
     * @return {boolean}    Returns true if the custom type is repeatable, 
     *                      false otherwise
     * @memberof simpli.Type#
     */
    simpli.Type.prototype.isRepeatable = function() {
        return this._repeatable;
    }
    /**
     * Get the callback function of the simpli.Type
     * @function getCallback
     * @return {function}   Returns the callback function
     * @memberof simpli.Type#
     */
    simpli.Type.prototype.getCallback = function() {
        return this._callback;
    }
    /**
     * Specific the simpli.Type to be optional argument
     * @function optional
     * @return {simpli.Type}    Return the simpli.Type object
     * @memberof simpli.Type#
     */
    simpli.Type.prototype.optional = function() {
        // clone the simpli.Type object
        var type = this._clone();
        // set the 'optional' flag to true
        type._optional = true;
        return type;
    }
    /**
     * Specific the simpli.Type to be array argument
     * @function array
     * @param {integer} [size]      (Optional) The upperbound size of the 
     *                              array (if the datatype is an array)
     * @return {simpli.Type}    Return the simpli.Type object
     * @memberof simpli.Type#
     */
    simpli.Type.prototype.array = function(size) {
        // clone the simpli.Type object
        var type = this._clone();

        // set the 'isArray' flag to true
        type._isArray = true;
        if (simpli.isDefined(size)) {
            if (!simpli.isInteger(size)) {
                throw new TypeError("Expected argument 1 to be 'integer', '"+
                    typeof(size)+"'' given");
            }
            if (size <= 0) {
                throw new TypeError("Expected argument 1 to be greater than "+
                    "0, "+size+" given");
            }
            // update the upperbound size
            type._size = size;
        } else { size = ""; }
        // update the name of custom type
        type._name = this.getName()+"["+size+"]";

        return type;
    }
    /**
     * Specific the simpli.Type to be repeatable argument
     * @function repeatable
     * @return {simpli.Type}    Return the simpli.Type object
     * @memberof simpli.Type#
     */
    simpli.Type.prototype.repeatable = function() {
        // clone the simpli.Type object
        var type = this._clone();
        // set the 'repeatable' flag to true
        type._repeatable = true;
        return type;
    }
    /**
     * Check if a variable matches with the simpli.Type
     * @function is
     * @param {mixed} arg   The variable to check against
     * @return {boolean}    Returns true if the variable matches with the
     *                      simpli.Type, false otherwise
     * @memberof simpli.Type#
     */
    simpli.Type.prototype.is = function(arg) {
        return this._toFunction()(arg);
    }

    /**
     * Run-time arugment check
     * @namespace
     * @param {Arguments} args              The Arguments object
     * @param {array|string} signatures     The array of argument signatures, 
     *                                      or the signature of first argument
     * @param {...string} signatures        The second and consecutive 
     *                                      signature of argument (if the 
     *                                      second argument is not array)
     * @param {function} [callback]         The callback function if there 
     *                                      is/are any invalid arguments
     * @return {boolean}                    Returns true if all the arguments 
     *                                      matches
     * @memberof simpli
     */
    simpli.argv = function(args) {
        var i, j, l, m, 
            thisArgs=simpli.argumentsToArray(arguments), 
            thisArgsLen=thisArgs.length, 
            signatures, callback=null, 
            argsLen, signLen, 
            argvStruct=[], 
            signI, argI, signInstance, 
            isOptional, lastIsOptional, isRepeatable, lastIsRepetable, 
            invalidObj=null, 
            expected, signArray, 
            argvInstance, 
            stackTrace, found, stackTraceLen, invokedBy;

        // check for provided arguments validity and prepare the argv 
        // structure for arguments checking
        if (!simpli.isArguments(args)) {
            throw new TypeError("Expected argument 1 to be 'Arguments' object"+
                ", '"+simpli.detailTypeOf(args)+"' given");
        }
        args = simpli.argumentsToArray(args);

        // check if callback function is specified
        if (simpli.isFunction(thisArgs[thisArgsLen-1])) {
            callback = thisArgs[thisArgsLen-1];
            // remove the last element from this arguments
            thisArgs.pop();
            thisArgsLen--;
        }

        // prepare arguments signature array
        if (thisArgsLen > 2 || 
            (thisArgsLen === 2 && 
                simpli.isString(thisArgs[1]) ||
                simpli.isA(thisArgs[1], simpli.Type)
            )) {

            // list of arguments signature provided as parameters
            signatures = thisArgs;
            signatures.shift();
        } else if (thisArgsLen === 2 && 
            (signatures = thisArgs[1]) && 
            simpli.isArray(signatures)) {

            // list of arguments signature provided as array
        } else {
            throw new TypeError("Expected argument 2 to be 'string', 'array' "+
                "or 'simpli.Type', '"+simpli.detailTypeOf(thisArgs[1])+
                "' given");
        }

        // arguments and signature length
        argsLen = args.length;
        signLen = simpli.isDefined(signatures)? signatures.length: 0;

        // prepare the argv structure
        for(i=0; i<argsLen; i++) {
            argvStruct.push({
                // argument validity
                valid: false, 
                index: i, 
                // argument given value
                value: args[i], 
                expected: '', 
                // detail of the argument given value
                given: simpli.detailTypeOf(args[i]), 
                signature: null, 
                optional: false
            });
        }

        // check the validity of each argument signature and update the 
        // argv structure

        // `isRepetable` is a flag indicating the number of variable-length 
        // arguments specified in the signature. Since there must be only one
        // variable-length argument, so any value greater than 1 would mean it
        // is invalid
        isRepeatable = 0;

        // flags indicating whether the last signature has specified optional 
        // or repeatable
        lastIsOptional = false;
        lastIsRepetable = false;

        signI=0;
        argI=0;
        while(signI<signLen) {
            signInstance = signatures[signI];
            // `isOptional` is a flag indicating whether the current argument 
            // is optional.
            isOptional = false;

            if (simpli.isA(signInstance, simpli.Type)) {
                // signature is a simpli.Type object

                isOptional = signInstance.isOptional();
                isRepeatable += signInstance.isRepeatable()? 1: 0;

                expected = signInstance.getName();
                // wrap the simpli.Type inside an array
                signArray = [signInstance];

            } else if (simpli.isString(signInstance)) {

                // test if the signature specificies optional argument
                isOptional = (
                    // an argument is optional if the signature is surrounded 
                    // by "[]"
                    _argv.optionalRegEx.test(signInstance) && 
                    // remove the "[]"
                    (signInstance = signInstance.slice(1,-1)));

                // test if the signature specificies repetable argument
                isRepeatable += (
                    // repeatable argument
                    signInstance.slice(0,3)==="..."  && 
                    // remove the "..."
                    (signInstance = signInstance.slice(3)))? 1: 0;

                // join the signature using comma
                expected = signInstance.replace('|', ',');

                // convert the signature list to array of signatures
                signArray = signInstance.split("|");
                // check the validity of each signature in the array
                for (i=0,l=signArray.length; i<l; i++) {
                    if (!_argv.typeRegEx.test(signArray[i])) {
                        throw new TypeError("Expected signature to be one of "+
                            "the valid types, '"+signArray[i]+"' given");
                    }
                }

            } else {
                // unknown signature format
                throw new TypeError("Expected signature to be 'string' or "+
                    "'simpli.Type', '"+simpli.detailTypeOf(signInstance)+
                    "' given");
            }

            // update the argvStruct if there are still arguments
            if (argI < argsLen) {
                argvStruct[argI].expected = expected;
                argvStruct[argI].signature = signArray;
                argvStruct[argI].optional = isOptional;
            }

            if (isOptional) {
                // optional argument
                lastIsOptional = true;
            } else {
                // non-optional argument

                // optional argument must appear at the end of declaration
                if (lastIsOptional) {
                    throw new TypeError("Optional argument must appear at "+
                        "the end of the declaration");
                }
                // no more argument available for the current signature
                // |signature| > |arguments|
                if (argI === argsLen) {
                    // Any non-0 value will be evaluated as `true`
                    invalidObj = _argv.MISMATCH_ARGNUMBER(
                        argvStruct, signLen, isRepeatable);
                }
            }

            // variable-length argument
            if (isRepeatable === 1) {

                // the rest of the parameters are variable-length argument

                if (lastIsRepetable) {
                    throw new TypeError("Variable-length argument must be "+
                        "the last signature of the declaration");
                } else if (signI+1 !== signLen) {
                    // there is signature after the current signature, which 
                    // is invalid
                    lastIsRepetable = true;
                    // instead of throwing the TypeError, let the procedure 
                    // goes through one more iteration to detect if there is
                    // more than one variable-length argument
                }

                // make the rest of the arguments to be the type of the 
                // variable-length signature
                for (argI=argI+1; argI<argsLen; argI++) {
                    argvStruct[argI].expected = expected;
                    argvStruct[argI].signature = signArray;
                    argvStruct[argI].optional = isOptional;
                }

            } else if (isRepeatable === 2) {
                // isRepeatable is being incremented twice, which means more 
                // than one signature specificies repeatable argument
                throw new TypeError("Only one variable-length argument is "+
                    "allowed in the declaration");
            }

            signI++;
            argI++;
        }

        // there are still arguments left after iterating through the 
        // signature array
        // |arguments| > |signature|
        if (argI < argsLen) {
            invalidObj = _argv.MISMATCH_ARGNUMBER(argvStruct, signLen);
        }

        // argument type check procedure
        if (simpli.isNull(invalidObj)) {
            // Perform argument type check according to argv structure
            for(i=0,l=argvStruct.length; i<l; i++) {
                argvInstance = argvStruct[i];

                if (!_argv.checkArg(argvInstance)) {
                    if (simpli.isNull(invalidObj)) {
                        // only record the first invalid argument
                        invalidObj = _argv.UNEXPECTED_DATATYPE(argvStruct, i);
                    }
                    break;
                }
            }
        }

        // Error handling procedure
        if (!simpli.isNull(invalidObj)) {
            // find the function which invoke the arugment check
            stackTrace = getStackTrace();
            if (!simpli.isNull(stackTrace)) {
                found = false;
                stackTraceLen=stackTrace.length
                for (i=0; i<stackTraceLen; i++) {
                    if(stackTrace[i].invokedBy === "simpli.argv" || 
                        stackTrace[i].invokedBy === "Function.simpli.argv") {

                        found = true;
                        invokedBy = stackTrace[i+1].invokedBy;
                    }
                }
            }
            // In old Internet Explorer, name of function declared using 
            // var foo = function() {} cannot be correctly returned using
            // getStackTrace()
            if (simpli.isNull(stackTrace) || !found) {
                invokedBy = "function";
            }

            return _argv.invalidHandler(invalidObj, argvStruct, invokedBy, callback);
        }

        return true;
    }

    /**
     * @property {string} argv.MODE_STRICT    Unexpected Datatype
     * @property {string} argv.MODE_STRICT    Mismatch argument number
     * @property {string} argv.MODE_STRICT    STRICT mode
     * @property {string} argv.MODE_EXTEND    EXTEND mode
     * @property {string} simpli.argv.ERRMODE_ERROR     Error reporting mode
     * @property {string} simpli.argv.ERRMODE_SILENT    Silet reporting mode
     * @memberof simpli
     */
    simpli.argv.UNEXPECTED_DATATYPE = "{UNEXPECTED_DATATYPE}";
    simpli.argv.MISMATCH_ARGNUMBER = "{MISMATCH_ARGNUMBER}";
    simpli.argv.MODE_STRICT = "{MODE_STRICT}";
    simpli.argv.MODE_EXTEND = "{MODE_EXTEND}";
    simpli.argv.ERRMODE_ERROR = "{ERRMODE_ERROR}";
    simpli.argv.ERRMODE_SILENT = "{ERRMODE_SILENT}";
    /**
     * Set argument check mode
     * The simpli.argv.mode() function sets the argument check mode at 
     * runtime. If the optional mode is not set, simpli.argv.mode() will just 
     * return the current argument check mode.
     * @param {string} [mode]   (Optional) argument check mode
     * @memberof simpli.argv
     */
    simpli.argv.mode = function(mode) {
        if (simpli.isDefined(mode)) {
            if (mode !== simpli.argv.MODE_STRICT && 
                mode !== simpli.argv.MODE_EXTEND) {

                throw new TypeError("Unrecognized mode '"+mode+"'");
            }
            _argv.mode = mode;
        }
        return _argv.mode;
    };
    /**
     * Set argument check error reporting mode
     * The simpli.argv.errorMode() function sets the argument check reporting
     * mode at runtime. If the optioanl errorMode is not set, 
     * simpli.argv.errorMode() will just return the current argument check 
     * error reporting mode.
     * @param {string} [errorMode]  (Optional) The error mode
     * @memberof simpli.argv
     */
    simpli.argv.errorMode = function(errorMode) {
        if (simpli.isDefined(errorMode)) {
            if (errorMode !== simpli.argv.ERRMODE_ERROR && 
                errorMode !== simpli.argv.ERRMODE_SILENT) {

                throw new TypeError("Unrecognized error mode '"+errorMode+"'");
            }
            _argv.errorMode = errorMode;
        }
        return _argv.errorMode;
    };

    simpli.argv.mode(simpli.argv.MODE_EXTEND);
    simpli.argv.errorMode(simpli.argv.ERRMODE_ERROR);
})(typeof window === "undefined"? global: window);
