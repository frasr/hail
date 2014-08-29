//     hail.js 0.1
//     http://www.frasr.com
//     (c) 2014 John Fraser
//     Hail may be freely distributed under the MIT license.



(function () {
    "use strict";

    var root = this;

    // Hail enables simple cross-domain function calls in the browser.
    //
    // Example:
    //
    //     // Server, at http://server.com/hail.html
    //     var api = {
    //         greeting: function (cb) {
    //             cb("Hello from "+document.domain);
    //         }
    //     }
    //     Hail(api);

    //     // Client, on another domain
    //     function connected(api) {
    //         api.greeting(function (message) {
    //             console.log(message);
    //         });
    //     }
    //     Hail("http://server.com/hail.html",connected);
    //
    //     // ouput: "Hello from server.com"
    //
    // Usage:
    //
    //     Hail(url, localAPI, function (remoteAPI) {});
    //     Hail(iframe, localAPI, function (remoteAPI) {});
    //
    // All parameters are optional. If `url` or `iframe` isn't included,
    // Hail connects to the parent window.

    root.Hail = function (win, apiOrCB) {

        var api, cb, domain;
        if (arguments.length < 2) {
            apiOrCB = win;
            win = window.parent;
            domain = domainFromURL(document.referrer);
        }
        if (typeof win === "string") {
            domready(function () {
                win = makeIFrame(win);
                domain = domainFromURL(win.src);
                win = win.contentWindow;
            });
        }
        if (!win.postMessage && win.contentWindow) win = win.contentWindow;
        cb = (typeof apiOrCB === "function") ? apiOrCB : undefined;
        api = (typeof apiOrCB === "object") ? apiOrCB : undefined;

        var lut = {
            handshake: function (remoteAPI) {
                delete lut["handshake"];
                if (remoteAPI && cb) {
                    var stubs = {};
                    for (var i = 0; i < remoteAPI.length; i++) {
                        stubs[remoteAPI[i]] = makeStub(remoteAPI[i])
                    }
                    cb(stubs);
                }
                if (api) sendHandshake();
            }
        };
        // if (api) extend(lut,api);
        if (api) Object.keys(api).forEach(function (key) {
            lut[key] = api[key];
        });

        function sendHandshake() {
            send({name:"handshake",args: api ? [Object.keys(api)] : []});
        }

        function makeStub(name) {
            return function () {
                var args = slice(arguments), callbackID = luid();
                if (typeof args[args.length-1] === "function") {
                    var cb = args.pop();
                    lut[callbackID] = function () {
                        delete lut[callbackID];
                        cb.apply(this,arguments);
                    }
                }
                send({name:name,args:args,cb:callbackID});
            }
        }

        function send(obj) {
            console.log(win);
            log("sending",obj,domain||"*");
            win.postMessage(obj, domain||"*");
        }

        function receive(e) {
            var data = e.data, args = slice(data.args);
            if (e.source !== win) return;
            if (domain && domain !== e.origin) return;

            log("received",data,domain||"*");

            var fn = lut[data.name];

            if (fn) {
                fn.apply({event:e},args.concat([function (cbArgs) {
                    if (data.cb) send({name:data.cb,args:slice(arguments)});
                }]));
            } else {
                log("Unknown function: "+data.name);
            }
        }

        window.addEventListener("message", receive, true);
        domready(sendHandshake);
    }

    // Utilities
    // ---------

    // A locally unique id, for callbacks
    function luid() { return "id"+Math.floor(Math.random()*Math.pow(2,32)); }

    // Slice, for turning arguments objects into arrays
    function slice(list,start,finish) { return Array.prototype.slice.call(list,start,finish); }

    // Given a URL, find the domain for postMessage
    function domainFromURL(url) { return url.match(/^(\w+:\/\/[^\/]+|)/)[1].toLowerCase(); }

    // Distilled from domready (c) Dustin Diaz 2014 - License MIT
    function domready(fn) {/^loaded|^c/.test(document.readyState) ? fn() : document.addEventListener("DOMContentLoaded",fn);}

    // Open a hidden iframe with the given URL
    function makeIFrame(url) {
        var iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.src = url;
        document.body.appendChild(iframe);
        return iframe;
    }

    // If Hail.debug is true, output logging info
    function log() {
        var isTop = (window === top), clientName = isTop ? "Top" : "IFrame";
        if (Hail.debug) console.log.apply(console,[clientName+":"].concat(slice(arguments)));
    }

}).call(this);


