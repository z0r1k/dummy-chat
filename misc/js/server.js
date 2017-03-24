/**
 * System wide components go here
 */

const server = new (require('hapi').Server)();
const cluster = require('cluster');
const os = require('os');
const fs = require('fs');

/**
 * Config
 * Sets default values
 * Overrides them via env vars or args
 */
const Config = new (require('~/helpers/config/config-helper'))(require('~/helpers/config/adapters/nconf-adapter'));

/**
 * Atlas related components go here to make advantage of using nconf defaults
 */

const ErrorHelper = require('~/helpers/error/error-helper');
const LoggingHelper = new (require('~/helpers/logging/logging-helper'))(require('~/helpers/logging/adapters/winston-adapter'));
const TokenService = require('~/services/token/token-service');

/**
 * Set cluster up
 */
if (cluster.isMaster) {
    os.cpus().forEach(() => {
        cluster.fork();
    });

    // @todo restart fork again? cluster.fork();
    cluster.on('exit', (worker, code, signal) => {
        const message = `worker: ${worker.process.pid} is exited with code: ${code} caused by: ${signal}`;
        const severity = code === 0 ? 'verbose' : 'warn';
        LoggingHelper[severity](message);
    });

    return;
}

/**
 * Set server up
 */

let connectionConfig = {
    port: Config.get('PORT'),
    routes: {
        cors: {
            additionalHeaders: ['token'],
            credentials: true
        }
    }
};

if (Config.get('USE_SSL')) {
    try {
        connectionConfig.tls = {
            key: fs.readFileSync('ssl.key'),
            cert: fs.readFileSync('ssl.cert')
        };
    } catch (e) {
        LoggingHelper.warn('Failed to access SSL keys', e);
    }
}

server.connection(connectionConfig);

server.ext('onPreResponse', (request, reply) => {
    const url = request.url;
    const res = request.response;

    LoggingHelper.verbose(`Incoming request: ${url.href}`);

    if (res.source && res.source.message && res.source.message.length && res.source.message.indexOf('CORS error') === 0) {
        const errResponse = ErrorHelper.generateError('CORS_HEADER_NOT_ALLOWED');
        LoggingHelper.warn('REST err response', errResponse);
        return reply(errResponse.payload).code(errResponse.code);
    }

    if (res.isBoom) {
        let errResponse;

        switch(res.output.statusCode) {
            case 401:
                errResponse = ErrorHelper.generateError('UNAUTHORIZED');
                break;

            case 403:
                errResponse = ErrorHelper.generateError('FORBIDDEN');
                break;

            case 404:
                errResponse = ErrorHelper.generateError('NOT_FOUND');
                break;

            case 500:
                errResponse = ErrorHelper.generateError('INTERNAL_ERROR');
                break;

            case 504:
                errResponse = ErrorHelper.generateError('GATEWAY_TIMEOUT');
                break;
        }

        if (errResponse) {
            LoggingHelper.warn('REST err response', errResponse);
            return reply(errResponse.payload).code(errResponse.code);
        }
    }

    return reply.continue();
});

server.register(require('hapi-auth-jwt2'), (err) => {
    throwIfError(err);

    server.auth.strategy('token', 'jwt', {
        key: Config.get('JWT_SECRET'),

        headerKey: 'token',
        urlKey: false,
        cookieKey: false,

        verifyOptions: {
            algorithms: ['HS256'],
            ignoreExpiration: true,
            audience: Config.get('JWT_AUDIENCE')
        },

        validateFunc: function (decoded, request, callback) {
            TokenService.validate(Config.get('LWS_API_KEY'), request.auth.token, decoded.iss)
                .then((status) => {
                    LoggingHelper.verbose(`JWT token validation response code: ${status}`, decoded);

                    let err, isValid;
                    switch (status) {
                        case 200:
                            err = null;
                            isValid = true;
                            break;

                        case 400:
                            err = new Error('INTERNAL_ERROR');
                            isValid = false;
                            break;

                        case 403:
                            err = new Error('FORBIDDEN');
                            isValid = false;
                            break;

                        default:
                            err = null;
                            isValid = false;
                            break;
                    }

                    return callback(err, isValid);
                })
                .catch((err) => {
                    return callback(err, false);
                });
        },

        errorFunc: (errorContext) => {
            if (errorContext.errorType === 'wrap') {
                switch (errorContext.message.message) {
                    case 'FORBIDDEN':
                        // Boom plugin has this wrap(error, [statusCode], [message])
                        // Where second parameter is [statusCode] that is why this is done in kind of hackish way
                        errorContext.scheme = 403;
                        break;

                    case 'GATEWAY_TIMEOUT':
                        errorContext.scheme = 504;
                        break;

                    case 'INTERNAL_ERROR':
                        errorContext.scheme = 500;
                        break;
                }
            }

            return errorContext;
        }
    });

    // @todo exclude auth for some routes (in routes)
    server.auth.default('token');
});

const apiPath = Config.get('API_PREFIX') ? `/${Config.get('API_PREFIX')}/api/${Config.get('API_VER')}` : `/api/${Config.get('API_VER')}`;
require('./routes')(server, apiPath);

server.start((err) => {
    throwIfError(err);
    LoggingHelper.verbose(`Server running at: ${server.info.address}:${server.info.port}`);
});

process.on('uncaughtException', (e) => {
    LoggingHelper.error('Uncaught exception', e);

    if (Config.get('CRASH_ON_EXCEPTION')) {
        process.exit(1);
    }
});

process.on('unhandledRejection', (err) => {
    LoggingHelper.error('Unhandled promise rejection', err);
});

function throwIfError(err){
    if (err) {
        throw err;
    }
}
