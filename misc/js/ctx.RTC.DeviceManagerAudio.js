define(function(require)
{
    var AudioConstants = require('../audio/ctx.RTC.AudioConstants'),
        Logger = require('../ctx.RTC.Logging');

    var AbstractDeviceManager = require('./ctx.RTC.DeviceManager'),
        EventMediator = require('../event/ctx.RTC.EventMediator'),
        UserMedia = require('../ctx.RTC.UserMedia');

    /**
     * @class AudioDeviceManager
     * @constructor
     * @param {Object} config
     */
    var AudioDeviceManager = function(config)
    {
        config.kind = "audio";
        AbstractDeviceManager.call(this, config);
    };

    AudioDeviceManager.prototype = Object.create(AbstractDeviceManager.prototype);
    AudioDeviceManager.prototype.constructor = AudioDeviceManager;

    /**
     * Class name
     * @property NAME
     * @type {String}
     * @default "AudioDeviceManager"
     */
    AudioDeviceManager.prototype.NAME = "AudioDeviceManager";

    /**
     * Returns event name for setInputDevice
     * @returns {String}
     * @private
     * @method _getEventName
     */
    AudioDeviceManager.prototype._getEventName = function()
    {
        return this._C.DEVICE.SET_INPUT;
    };

    /**
     * Returns filter function for audio devices
     * @returns {Function}
     * @private
     * @method _getFilterFunction
     */
    AudioDeviceManager.prototype._getFilterFunction = function(){
        return function(device) {
            return device && (device.type === "audio" || device.type === "audiooutput");
        };
    };

    // FIXME Use proper DI mechanism/framework here
    var deviceManager = new AudioDeviceManager({
        constants: AudioConstants,
        log: Logger,
        userMedia: EventMediator.mix(new UserMedia(), "media-requests"),
        eventMediator: EventMediator,
        // FIXME eventChannel name is used as channelID for postal, but could be confused with EventChannel where we get events from GW
        eventChannel: "audio-input-devices"
    });

    return deviceManager;
});
