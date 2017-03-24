define(function(){

    /**
     * @class User
     */
    var User = function(){
        this._uid = -1;
    };

    User.prototype = {

        getUID: function(){
            if (this._uid !== -1) {
                return this._uid;
            }

            this._uid = Math.round(Math.random() * 100 % 100);
            return this._uid;
        }

    };

    return User;
});