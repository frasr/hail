Hail.debug = true;

// Detect old versions of Internet Explorer.
function oldIE() { return /MSIE [1-9]/.test(navigator.userAgent); }

asyncTest("export-only server", function(assert) {
    expect(6);

    Hail("export-only.html",function (api) {
        api.add(3,4,function (sum) {equal(sum,7,"function returns value")});

        var now = +new Date();
        api.write("date",now);
        api.read("date",function (date) {equal(date,now,"can write to localStorage and read after")});

        var arg = {name:"jesse"};
        api.echo(arg,function (returned) {
            equal(JSON.stringify(arg),JSON.stringify(returned),"can pass and return objects");
        });

        api.ping(function () {assert.ok(true,"functions with no arguments work")});
        api.ping(function (cb) {equal(cb,undefined,"Callbacks don't get passed callbacks")});

        api.delayedAdd(3,4,function (sum) {
            equal(sum,7,"Delayed return");
            start();
        });
    });
});

Hail("export-only.html",function (api) {
    asyncTest("Immediate startup", function(assert) {
        expect(1);
        api.echo("foo",function (returned) {
            equal("foo",returned,"Immediate startup works");
            start();
        });
    });
});

asyncTest("import-only server", function(assert) {
    expect(1);

    Hail("import-only.html",{
        callback: function (arg) {
            equal(arg.worked,"yes","Server calls local api function");
            start();
        }
    });
});

asyncTest("import-export server", function(assert) {
    var remaining = 2;
    expect(remaining);

    Hail("import-export.html",{
        callback: function (arg) {
            equal(arg.worked,"yes","Server calls local api function");
            if (!--remaining) start();
        }
    }, function (api) {
        console.log(api);
        api.echo("hi", function (val) {
            equal(val,"hi","Server's api works");
            if (!--remaining) start();
        })
    });
});

asyncTest("static iframe", function(assert) {
    var iframe = document.getElementById("iframe");
    var remaining = 2;
    expect(remaining);

    Hail(iframe,{
        callback: function (arg) {
            equal(arg.worked,"yes","Server calls local api function");
            if (!--remaining) start();
        }
    }, function (api) {
        console.log(api);
        api.echo("hi", function (val) {
            equal(val,"hi","Server's api works");
            if (!--remaining) start();
        })
    });
});

if(!oldIE()) {
    Hail("export-only.html",function (api) {
        // IE versions before 10 only support string values for postMessage,
        // so they don't get the nice errors thrown when non-JSON values are sent.
        asyncTest("PostMessage errors", function(assert) {
            expect(2);
            assert.throws(function () {
                api.echo(alert,function () {
                    assert.ok(false,"Callback should not be called");
                });
            },"throws error when passing functions");

            assert.throws(function () {
                api.echo({fn:alert});
            },"throws error when passing functions in objects");

            start();
        });

        // IE versions before 10 don't support typed arrays or blobs
        asyncTest("Typed data", function(assert) {
            expect(3);
            var buf = new ArrayBuffer(10);
            var view = new Uint8Array(buf);
            var blob = new Blob(['<a id="a"><b id="b">hey!</b></a>'], {type : 'text/html'});


            for (var i = 0; i < view.length; i++) {
                view[i] = i;
            }

            api.echo(view,function (returned) {
                deepEqual(view,returned,"can pass Uint8Array");
            });

            api.echo(buf,function (returned) {
                deepEqual(buf,returned,"can pass ArrayBuffer");
            });

            api.echo(blob,function (returned) {
                deepEqual(blob,returned,"can pass blob");
                start();
            });
        });
    });
}

