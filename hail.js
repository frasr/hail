//     hail.js 0.1
//     http://www.frasr.com
//     (c) 2014 John Fraser
//     Hail may be freely distributed under the MIT license.
//     Comments formatted for Docco.

(function (root) {
    "use strict";

    root.Hail = function (url, api, onConnect) {

        // We'll handle arguments ourselves
        var win, domain, args = slice(arguments);
        url = api = onConnect = undefined;

        // Process arguments
        // -----------------

        // Get `win` from `url` or `iframe`.
        // To fight xss, we only accept messages from the same domain
        // as `url` or `iframe.src`.

        if (typeof args[0] === "string") {
            url = args.shift();
            domready(function () {
                var iframe = makeIFrame(url);
                domain = domainFromURL(iframe.src);
                win = iframe.contentWindow;
            });
        } else if (args[0].tagName === "iframe") {
            var iframe = args.shift();
            win = iframe.contentWindow;
            domain = domainFromURL(iframe.src)
        } else {
            win = window.parent;
            domain = domainFromURL(document.referrer);
        }

        // Get `api`
        if (typeof args[0] === "object") {
            api = args.shift();
        }

        // Get `onConnect()` callback
        onConnect = args.shift();

        // Set up lookup table for local API
        // ---------------------------------

        // Build `lut` to map names to functions.
        // If we call a remote API, we'll also store a return callback here under a random `luid()`.
        var lut = {};

        // Add local API to `lut`.
        if (api) Object.keys(api).forEach(function (key) {
            lut[key] = api[key];
        });

        // Add handhake handler to `lut`.
        lut["$handshake"] = handshake;


        // Handle handshake request
        // ------------------------

        // Respond to incoming handshake by building local stubs, sending our own API.
        function handshake(remoteAPI, isResponse, debug) {
            // If the other is debugging, enter debug mode too
            Hail.debug = Hail.debug || debug;

            // Build a single stub function.
            function makeStub(name) {
                return function () {
                    var args = slice(arguments), callbackID = luid();
                    if (typeof args[args.length-1] === "function") {
                        var cb = args.pop();
                        // Register one-time-use return callback.
                        lut[callbackID] = function () {
                            delete lut[callbackID];
                            cb.apply(this,arguments);
                        }
                    }
                    send(name,args,callbackID);
                }
            }

            // Only accept handshake once.
            delete lut["$handshake"];

            // Build stubs for remote API.
            if (remoteAPI && onConnect) {
                var stubs = {};
                for (var i = 0; i < remoteAPI.length; i++) {
                    stubs[remoteAPI[i]] = makeStub(remoteAPI[i])
                }
                onConnect(stubs);
            }

            // If we have a local API to share, send handshake back.
            if (!isResponse) sendHandshake(true);
        }

        // Helper to send handshake with local API, if present
        function sendHandshake(isResponse) {
            var names = api ? Object.keys(api) : []
            send("$handshake", [names, isResponse, Hail.debug]);
        }



        // Send and receive function calls via postMessage
        // -----------------------------------------------

        // IE9 `postMessage` only supports strings.

        //     TODO: nicer browser detection.
        function isIE() {
          var myNav = navigator.userAgent.toLowerCase();
          return (myNav.indexOf('msie') != -1) ? parseInt(myNav.split('msie')[1]) : Infinity;
        }
        var oldIE = isIE() && isIE() < 10;

        function pack(obj) { return oldIE ? JSON.stringify(obj) : obj; }
        function unpack(val) { return oldIE ? JSON.parse(val) : val; }

        // Send function call as message.
        function send(name,args,callbackID) {
            var obj = {name:name,args:args,cb:callbackID};
            log("sending",obj,domain||"*");
            win.postMessage(pack(obj), domain||"*");
        }

        // Recieve message, do security checks, and call function.
        function receive(e) {
            var data = unpack(e.data), args = slice(data.args);
            if (e.source !== win) return;
            if (domain && domain !== e.origin) return;

            log("received",data,domain||"*");

            // Find function being called by remote client.
            var fn = lut[data.name];

            // Call it or complain that it's missing.
            if (fn) {
                if (data.cb) args.push(function (cbArgs) {
                    send(data.cb, slice(arguments));
                });
                fn.apply({event:e},args);
            } else {
                log("Hail received call to unknown function '"+data.name+"'");
            }
        }

        // Start it
        // --------

        // Listen for messages.
        window.addEventListener("message", receive, true);

        // Send initial handshake.
        domready(function () {
            sendHandshake(false);
        });
    }

    // Utilities
    // ---------

    // A locally unique id for callbacks.
    function luid() { return "id"+Math.floor(Math.random()*Math.pow(2,32)); }

    // Slice, for turning arguments objects into arrays.
    function slice(list,start,finish) { return Array.prototype.slice.call(list||[],start,finish); }

    // Given a URL, find the domain for postMessage.
    function domainFromURL(url) { return url.match(/^(\w+:\/\/[^\/]+|)/)[1].toLowerCase(); }

    // Distilled from domready (c)Dustin Diaz 2014 - License MIT.
    function domready(fn) {/^loaded|^c/.test(document.readyState) ? fn() : document.addEventListener("DOMContentLoaded",fn);}

    // Open a hidden `iframe` with the given URL.
    function makeIFrame(url) {
        var iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.src = url;
        document.body.appendChild(iframe);
        return iframe;
    }

    // If `Hail.debug` is true, output logging info.
    function log() {
        // In IE9 and earlier, console only exists when the debugger is open because Microsoft
        if (!window.console) return;

        // In IE9 and earlier, console.log doesn't support apply() because Microsoft
        var smartLog = Function.prototype.bind.call(console.log,console);

        var isTop = (window === top), clientName = isTop ? "Top" : "IFrame";
        smartLog.apply(console,[clientName+":"].concat(slice(arguments)));
    }

})(window);


