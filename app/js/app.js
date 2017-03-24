define(function(){
    var BOWER = '../bower_components';

    requirejs.config({
        basePath: './',

        paths: {
            'io': BOWER + '/socket.io-client/dist/socket.io.min'
        }
    });

    require(['service/network', 'ui'], function(Network, UI){
        var net = new Network('http://localhost:8000');
        var ui = new UI();

        Promise.all([net.connect(), ui.init()])

            .then(function(){
                net.onNewMessage(ui.render, ui)
            })

            .then(function(){
                window.addEventListener('new', function(e){
                    net.send(e.detail);
                })
            })

            .catch(console.error.bind(console, 'Something went wrong'));
    });
});