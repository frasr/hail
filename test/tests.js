Hail.debug = true;

function isIE() {
  var myNav = navigator.userAgent.toLowerCase();
  return (myNav.indexOf('msie') != -1) ? parseInt(myNav.split('msie')[1]) : Infinity;
}
var oldIE = isIE() && isIE() < 10;

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

if(!oldIE) {
    // Older IE versions only support string values for postMessage,
    // so they don't get the nice errors thrown when non-JSON values are sent.
    asyncTest("PostMessage errors", function(assert) {
        expect(2);
        Hail("export-only.html",function (api) {
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
    });
}

