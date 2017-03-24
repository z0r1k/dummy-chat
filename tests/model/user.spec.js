define(['chai', 'app/model/user'], function(chai, user){
    var expect = chai.expect;

    describe('UserModel', function(){
        it('should return uuid', function(){
            expect(user.getUID()).to.be.not.equal(-1);
        });

        it('should return same uuid', function(){
            var uuid = user.getUID();
            var anotherUUID = user.getUID();
            expect(uuid).to.be.equal(anotherUUID);
        });
    });

});