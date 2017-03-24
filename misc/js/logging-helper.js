/**
 * @class LoggingHelper
 */
class LoggingHelper {

    /**
     * @constructor
     * @param {Object} adapter
     */
    constructor(adapter) {
        this._logger = adapter || console;
    }

    /**
     * Returns hazelcast logger
     * @returns {Object}
     */
    get hzAdapter() {
        return {
            log: (level, classname, message, info) => {
                const _levels = [
                    'error',   // 0 - emerg
                    'warn',    // 1 - alert
                    'info',    // 2 - crit
                    'verbose', // 6 - info
                    'debug',   // 7 - debug
                    'silly'    // 7 - debug
                ];

                let entry = `${classname}: ${message}`;
                entry = info ? entry + ' additional info: ' + info : '';

                this._logger.log(_levels[level], entry);
            }
        };
    }

    /**
     * Logs an entry with defined level
     * @param {String} level
     * @param {String} message
     * @param {Object} [metadata]
     */
    _entry(level, message, metadata) {
        level = level || 'info';
        return metadata ? this._logger.log(level, message, metadata) : this._logger.log(level, message);
    }

    /**
     * Logs info level log
     * @param {String} message
     * @param {Object} [metadata]
     */
    log(message, metadata) {
        return this._entry('info', message, metadata);
    }

    /**
     * Logs info level log
     * @param {String} message
     * @param {Object} [metadata]
     */
    info(message, metadata) {
        return this.log(message, metadata);
    }

    /**
     * Logs error level log
     * @param {String} message
     * @param {Object} [metadata]
     */
    error(message, metadata) {
        return this._entry('error', message, metadata);
    }

    /**
     * Logs warning level log
     * @param {String} message
     * @param {Object} [metadata]
     */
    warn(message, metadata) {
        return this._entry('warn', message, metadata);
    }

    /**
     * Logs debug level log
     * @param {String} message
     * @param {Object} [metadata]
     */
    debug(message, metadata) {
        return this._entry('debug', message, metadata);
    }

    /**
     * Logs verbose level log
     * @param {String} message
     * @param {Object} [metadata]
     */
    verbose(message, metadata) {
        return this._entry('verbose', message, metadata);
    }

    /**
     * Logs silly level log
     * @param {String} message
     * @param {Object} [metadata]
     */
    silly(message, metadata) {
        return this._entry('silly', message, metadata);
    }
}

module.exports = LoggingHelper;