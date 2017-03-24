define(function(){

    /**
     * @class User (singleton)
     * @constructor
     */
    var User = function(){
        this._uid = -1;
    };

    User.prototype = {
        /**
         * User Id
         * @return {number}
         */
        getUID: function(){
            if (this._uid !== -1) {
                return this._uid;
            }

            this._uid = Math.round(Math.random() * 100 % 100);
            return this._uid;
        }
    };

    return new User();
});