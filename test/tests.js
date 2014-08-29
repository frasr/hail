Hail.debug = true;
asyncTest("Return types", function() {
    expect(3);

    Hail("server.html",function (api) {
        api.add(3,4,function (sum) {
            equal(sum,7,"Immediate return");
        });

        var now = Date.now();
        api.write("date",now);
        api.read("date",function (date) {
            equal(date,now,"No return");
        });

        api.delayedAdd(3,4,function (sum) {
            equal(sum,7,"Delayed return");
            start();
        });

    });
});

asyncTest("Stuff", function() {
    expect(1);

    Hail("server.html",function (api) {
        var arg = {name:"jesse"};
        api.echo(arg,function (returned) {
            equal(JSON.stringify(arg),JSON.stringify(returned),"Complex objects");
            start();
        });
    });
});

asyncTest("Errors", function(assert) {
    expect(1);

    Hail("server.html",function (api) {
            assert.throws(function () {
                api.echo({fn:alert});
            },
            "Throws"
        );
        start();
    });
});


Hail("server.html",function (api) {
    asyncTest("Errors2", function(assert) {
        expect(1);

        assert.throws(function () {
            api.echo({fn:alert});
        },"Throws");

        start();
    });
});
//
// QUnit.test("Errors", function(assert) {
//     assert.throws(
//         function() {
//             throw "error"
//         },
//         "throws with just a message, not using the 'expected' argument"
//     );
// });

// asyncTest("Round trip", function() {
//     expect(1);
//
//     Hail("server.html",{
//         finish: function (a,b) {
//             equal(a,"howdy");
//             equal(b,13);
//             start();
//             // alert("echo");
//             console.log("api is ",api);
//             // api.alert(msg);
//         }
//     },function (api) {
//         api.echo("howdy",13);
//     });
// });
