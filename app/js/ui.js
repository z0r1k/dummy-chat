define(['model/user'], function(user){

    /**
     * @class UI
     * @constructor
     */
    var UI = function(){
        this.me = user.getUID();
        this._template = document.querySelector('#tpl-message').innerHTML;
        this._messageContrainer = document.querySelector('.list-group');
    };

    UI.prototype = {
        /**
         * Initializer
         * @return {Promise}
         */
        init: function(){
            try {
                this._bindUI();
                this._bindEvents();
                return Promise.resolve();
            } catch (e) {
                return Promise.reject(e);
            }
        },

        /**
         * Inits UI
         *
         * @private
         */
        _bindUI: function(){
            document.querySelector('.userid').innerText = this.me;
        },

        /**
         *
         * @private
         */
        _bindEvents: function(){
            var form = document.querySelector('footer form'),
                area = document.querySelector('footer form textarea');

            form.addEventListener('keydown', function(e){
                if (e.keyCode === 13 && e.ctrlKey) {
                    var btn = document.querySelector('footer form button[type="submit"]');
                    btn.click();
                }
            }.bind(this));

            form.addEventListener('submit', function(e){
                e.preventDefault();

                var message = {
                    user: this.me,
                    message: area.value
                };

                var event = new CustomEvent('new', {'detail': message }); // Sorry IE10, no shim for you.
                window.dispatchEvent(event);

                area.value = '';
                return false;
            }.bind(this));
        },

        /**
         * Renders new message
         *
         * @param {Object} message
         */
        render: function(message){
            if (!message || !Object.keys(message).length) {
                return;
            }

            var item = this._template
                .replace('{user}', message.user === this.me ? 'me' : 'stranger')
                .replace('{userid}', message.user)
                .replace('{message}', message.message);

            // not the best way to render
            // template engine would be nice
            // or at least rendering in documentFragment first and then just append
            // to avoid full re-rendering...
            this._messageContrainer.innerHTML += item;
        }
    };

    return UI;
});