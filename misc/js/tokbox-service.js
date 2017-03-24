const Config = new (require('~/helpers/config/config-helper'))(require('~/helpers/config/adapters/nconf-adapter'));

const TOKBOX_API_KEY = Config.get('RTC_API_KEY');
const TOKBOX_API_SECRET = Config.get('RTC_API_SECRET');
const TOKBOX_MODE = Config.get('RTC_MODE');

const opentok = new (require('opentok'))(TOKBOX_API_KEY, TOKBOX_API_SECRET);
const RoleHelper = require('~/helpers/role/role-helper');

/**
 * @class TokboxService
 */
class TokboxService {

    /**
     * @param {Object} opentok
     * @constructor
     */
    constructor(opentok) {
        /**
         * OpenTok instance
         * @type {Object}
         * @private
         */
        this._tokbox = opentok;
    }

    /**
     * Creates new conference and returns id
     * @returns {Promise}
     */
    createConference() {
        return new Promise((resolve, reject) => {

            this._tokbox.createSession({ mediaMode: TOKBOX_MODE }, (err, conference) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve({ id: conference.sessionId });
            });

        });
    }

    /**
     * Returns conference key
     * @returns {Promise}
     */
    getKey() {
        return Promise.resolve({ key: TOKBOX_API_KEY });
    }

    /**
     * Returns participant token by conferenceId
     * @param {String} conferenceId
     * @param {String} role
     * @returns {Promise}
     */
    getToken(conferenceId, role) {
        return new Promise((resolve, reject) => {
            if (!conferenceId) {
                reject(new Error('ConferenceId is not provided'));
                return;
            }

            if (!RoleHelper.isValidRole(role)) {
                reject(new Error('Role is not valid'));
                return;
            }

            try {
                const token = this._tokbox.generateToken(conferenceId, {
                    role: role,
                    expireTime: parseInt(Config.get('RTC_TOKEN_LIFETIME') + Date.now() / 1000, 10)
                });

                token ? resolve({ token: token }) : reject(new Error('Failed to generate token'));
            } catch(e) {
                reject(e);
            }
        });
    }

}

module.exports = new TokboxService(opentok);