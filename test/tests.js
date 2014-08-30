Hail.debug = true;

function isIE() {
  var myNav = navigator.userAgent.toLowerCase();
  return (myNav.indexOf('msie') != -1) ? parseInt(myNav.split('msie')[1]) : Infinity;
}
var oldIE = isIE() && isIE() < 10;

asyncTest("Client-server", function(assert) {
    expect(6);

    Hail("server.html",function (api) {
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


if(!oldIE) {
    // Older IE versions only support string values for postMessage,
    // so they don't get the nice errors thrown when non-JSON values are sent.
    asyncTest("PostMessage errors", function(assert) {
        expect(2);
        Hail("server.html",function (api) {
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

Hail("server.html",function (api) {
    asyncTest("Immediate startup", function(assert) {
        expect(1);
        api.echo("foo",function (returned) {
            equal("foo",returned,"Immediate startup works");
            start();
        });
    });
});