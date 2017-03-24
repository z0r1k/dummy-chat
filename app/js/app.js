define(function(){
    var BOWER = '../bower_components';

    requirejs.config({
        basePath: './',

        paths: {
            'io': BOWER + '/socket.io-client/dist/socket.io.min'
        }
    });

    require(['service/network', 'model/user'], function(Network, User){
        var net = new Network('http://localhost:8000');
        var user = new User();

        Promise.all([net.connect()])

            .then(function(){
                net.onNewMessage(function(msg){
                    console.log("<<<", msg);
                }, this)
            })

            .then(function(){
                var msg = {
                    user: user.getUID(),
                    message: 'hello'
                };

                console.log(">>>", msg);
                net.send(msg)
            })

            .catch(console.error.bind(console, 'Something went wrong'));
    });
});