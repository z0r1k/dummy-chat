define(['io'], function(io){

    /**
     * @class Network
     * @constructor
     *
     * @param {String} url
     */
    var Network = function(url){
        this._url = url;
        this._conn = null;
        this._isConnected = null;
    };

    Network.prototype = {

        /**
         * Connects to chat service
         *
         * @return {Promise}
         */
        connect: function(){
            this._isConnected = new Promise(function(resolve, reject){
                try {
                    this._conn = io(this._url);
                    this._conn.on('connect', resolve);
                } catch (e) {
                    reject(e);
                }
            }.bind(this));
        },

        /**
         * Sends message to a server
         *
         * @param {Object} message
         * @return {promise}
         */
        send: function(message){
            if (!message || !Object.keys(message).length) {
                return Promise.reject(new Error('Invalid message'));
            }

            return this._checkConnection()

                .then(function(){
                    return this._isConnected.then(function(){
                        this._conn.emit('new-chat', message);
                    }.bind(this));
                }.bind(this))

                .catch(function(err){
                    return Promise.reject(err);
                });
        },

        /**
         * Registers a callback for a message recieved from a server
         *
         * @param {Function} cb
         * @param {Object} [ct]
         * @return {Promise}
         */
        onNewMessage: function(cb ,ct){
            cb = cb || function(){};
            ct = ct || this;

            return this._checkConnection()

                .then(function(){
                    return this._isConnected.then(function(){
                        this._conn.on('new-chat', cb.bind(ct));
                    }.bind(this));
                }.bind(this))

                .catch(function(err){
                    return Promise.reject(err);
                });
        },

        /**
         * Checks is connection there
         *
         * @return {Promise}
         * @private
         */
        _checkConnection: function(){
            return !this._isConnected ? Promise.reject(new Error('No valid connection')) : Promise.resolve();
        }
    };

    return Network;
});