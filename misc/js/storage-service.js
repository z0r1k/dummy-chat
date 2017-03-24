const Config = new (require('~/helpers/config/config-helper'))(require('~/helpers/config/adapters/nconf-adapter'));
const Hazelcast = require('hazelcast-client');
const LoggingHelper = new (require('~/helpers/logging/logging-helper'))(require('~/helpers/logging/adapters/winston-adapter'));

const TTL = Config.get('RTC_TOKEN_LIFETIME') * 1000;

const hzClient = Hazelcast.Client;
let hzConfig = new Hazelcast.Config.ClientConfig();

hzConfig.properties['hazelcast.logging'] = LoggingHelper.hzAdapter;

let address = {};
if (Config.get('STORAGE_ADDRESS')) {
    address.host = Config.get('STORAGE_ADDRESS');
}
if (Config.get('STORAGE_PORT')) {
    address.port = Config.get('STORAGE_PORT');
}

if (Object.keys(address).length) {
    hzConfig.networkConfig.addresses = [address];
}

hzConfig.networkConfig.connectionAttemptLimit = Config.get('STORAGE_RECONNECT_LIMIT');
hzConfig.networkConfig.connectionAttemptPeriod = Config.get('STORAGE_CONNECTION_PERIOD') * 1000;
hzConfig.networkConfig.connectionTimeout = Config.get('STORAGE_CONNECTION_TIMEOUT') * 1000;

/**
 * @class StorageService
 */
class StorageService {

    /**
     * @constructor
     * @param {Object} adapter
     */
    constructor(adapter) {
        /**
         * @property _adapter
         * @type {Object}
         * @private
         */
        this._adapter = adapter;
        this.connect();
    }

    /**
     * Creates a connection to the storage cluster
     * @return {Promise}
     */
    connect() {
        /**
         * @property _client
         * @private
         */
        this._client = this._adapter.getClient();
        return this._client;
    }

    /**
     * Destroys an connection to the storage cluster
     * @return {Promise}
     */
    disconnect() {
        return this._client.then((client) => {
            return client.shutdown();
        });
    }

    /**
     * Adds or updates an entry to the collection
     * @param {String} type
     * @param {String} name
     * @param {String} key
     * @param {*} value
     * @returns {Promise}
     */
    set(type, name, key, value) {
        type = type || 'map';

        if (!name || !key || !value) {
            return Promise.reject('Invalid input');
        }

        return this._client.then((client) => {
            const map = type === 'map' ? client.getMap(name) : client.getMultiMap(name);
            return map.putIfAbsent(key, value, this._adapter.getTTL());
        });
    }

    /**
     * Retrieves an entry from the collection
     * @param {String} type
     * @param {String} name
     * @param {String} key
     * @returns {Promise}
     */
    get(type, name, key) {
        type = type || 'map';

        if (!name || !key) {
            return Promise.reject('Invalid input');
        }

        return this._client.then((client) => {
            const map = type === 'map' ? client.getMap(name) : client.getMultiMap(name);
            return map.get(key);
        });
    }

    /**
     * Removes an entry from the collection
     * @param {String} type
     * @param {String} name
     * @param {String} key
     * @returns {Promise}
     */
    del(type, name, key) {
        type = type || 'map';

        if (!name || !key) {
            return Promise.reject('Invalid input');
        }

        return this._client.then((client) => {
            const map = type === 'map' ? client.getMap(name) : client.getMultiMap(name);
            return map.remove(key);
        });
    }

    /**
     * Checks is key exists within a collection
     * @param {String} type
     * @param {String} name
     * @param {String} key
     * @return {Promise}
     */
    isKeySet(type, name, key) {
        type = type || 'map';

        if (!name || !key) {
            return Promise.reject('Invalid input');
        }

        return this._client.then((client) => {
            const map = type === 'map' ? client.getMap(name) : client.getMultiMap(name);
            return map.containsKey(key);
        });
    }

    /**
     * Tries for <timeout> to acquire lock of the key with auto lease after <lease>
     * @param {String} type
     * @param {String} name
     * @param {String} key
     * @return {Promise}
     */
    tryLock(type, name, key) {
        type = type || 'map';

        if (!name || !key) {
            return Promise.reject('Invalid input');
        }

        return this._client.then((client) => {
            const map = type === 'map' ? client.getMap(name) : client.getMultiMap(name);
            return map.tryLock(key, this._adapter.getLockTimeout(), this._adapter.getLockLease());
        });
    }

    /**
     * Tries to unlock the key if client is owner of that key
     * @param {String} type
     * @param {String} name
     * @param {String} key
     * @return {Promise}
     */
    unlock(type, name, key) {
        type = type || 'map';

        if (!name || !key) {
            return Promise.reject('Invalid input');
        }

        return this._client.then((client) => {
            const map = type === 'map' ? client.getMap(name) : client.getMultiMap(name);
            return map.unlock(key);
        });
    }

    isLocked(type, name, key) {
        type = type || 'map';

        if (!name || !key) {
            return Promise.reject('Invalid input');
        }

        return this._client.then((client) => {
            const map = type === 'map' ? client.getMap(name) : client.getMultiMap(name);
            return map.isLocked(key);
        });

    }
}

module.exports = new StorageService({
    getClient: () => {
        return hzClient.newHazelcastClient(hzConfig);
    },
    getTTL: () => TTL,
    getLockTimeout: () => 5 * 1000,
    getLockLease: () => 10 * 1000
});