Hail enables simple cross-domain function calls in the browser.

Example:

    // Server, at http://server.com/hail.html
    var api = {
        greeting: function (cb) {
            cb("Hello from "+document.domain);
        }
    }
    Hail(api);

    // Client, on another domain
    function connected(api) {
        api.greeting(function (message) {
            console.log(message);
        });
    }
    Hail("http://server.com/hail.html",connected);

    // ouput: "Hello from server.com"

Usage:

    Hail(url, localAPI, function (remoteAPI) {});
    Hail(iframe, localAPI, function (remoteAPI) {});

All parameters are optional. If `url` or `iframe` isn't included,
Hail connects to the parent window.