const winston = require('winston');
const Config = new (require('~/helpers/config/config-helper'))(require('~/helpers/config/adapters/nconf-adapter'));

/**
 * @class WinstonAdapter
 * @todo add winston-syslog transport
 */
const logger = new (winston.Logger)({
    level: Config.get('LOG_LEVEL'),
    transports: [
        new (winston.transports.Console)({
            colorize: 'all',
            timestamp: true
        })
    ]
});

// for unit testing in mocha
const suppressLogging = !!(Config.get('LOG_SUPPRESS') || process.env.LOG_SUPPRESS);
if (suppressLogging) {
    logger.remove(winston.transports.Console);
}

module.exports = logger;