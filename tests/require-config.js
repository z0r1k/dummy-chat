define(function(){

    var ROOT = '../',
        BOWER = ROOT + 'app/bower_components';

    requirejs.config({
        'waitSeconds': 1,
        'enforceDefine': true,
        'baseUrl': './',
        'paths': {
            'app': ROOT + '/app/js',
            'chai': BOWER + '/chai/chai'
        }
    });

    require(['test-cases'], function(){
        window.mocha.run();
    });

});