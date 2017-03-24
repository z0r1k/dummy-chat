const assert = require('assert');

describe('ConferenceKeysHandler', () => {
    const TokboxService = require('~/test/mock/services/tokbox/tokbox-service-mock');
    const SessionService = require('~/test/mock/services/session/session-service-mock');
    const StorageService = require('~/test/mock/services/storage/storage-service-mock');

    const handler = require('~/handlers/conference/keys')(TokboxService, SessionService, StorageService);

    const reply = (cb, done) => {
        let _response,
            _code;

        return (response) => {
            _response = response;

            return {
                code: (code) => {
                    _code = code;

                    try {
                        cb({
                            response: _response,
                            code: _code
                        });
                    } catch (e) {
                        done(e);
                    }
                }
            };
        };
    };

    let request = {};

    beforeEach(() => {
        request = {
            url: {
                query: {
                    sessionId: true
                }
            },
            auth: {
                credentials: {
                    uid: 1,
                    role: 'expert'
                }
            }
        };
    });

    afterEach(() => {
        TokboxService.should().reset();
    });

    it('should return successful response', (done) => {
        handler(request, reply((result) => {

            assert.equal(result.code, 200);
            assert.deepEqual(result.response, {
                conference: {
                    id: 1,
                    key: 'key'
                },
                participant: {
                    key: 'token'
                }
            });
            done();

        }, done));
    });

    it('should return Session error response', (done) => {
        request = Object.assign({}, request, {
            url: {
                query: {
                    sessionId: false
                }
            }
        });

        handler(request, reply((result) => {

            assert.equal(result.code, 400);
            assert.deepEqual(result.response, {
                code: 40000,
                message: 'BAD_INPUT'
            });
            done();

        }, done));
    });

    it('should return Tokbox error response', (done) => {
        TokboxService.should().fail();

        handler(request, reply((result) => {

            assert.equal(result.code, 502);
            assert.deepEqual(result.response, {
                code: 50201,
                message: 'BAD_GATEWAY',
                scope: 'TOKBOX'
            });
            done();

        }, done));
    });

    it('should return Hazelcast error response', (done) => {
        StorageService.should().fail();

        handler(request, reply((result) => {

            assert.equal(result.code, 502);
            assert.deepEqual(result.response, {
                code: 50202,
                message: 'BAD_GATEWAY',
                scope: 'HAZELCAST'
            });

            StorageService.should().reset();
            done();

        }, done));
    });

});