define(function(){
    var BOWER = '../bower_components';

    requirejs.config({
        basePath: './',

        paths: {
            'io': BOWER + '/socket.io-client/dist/socket.io.min'
        }
    });

    require(['main'], function(){
        // ..
    });
});