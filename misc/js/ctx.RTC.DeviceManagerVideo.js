define(function(require)
{
    var Constants = require('../stateMachine/ctx.RTC.MediaStreamConstants'),
        log = require('../ctx.RTC.Logging');

    var AbstractDeviceManager = require('./ctx.RTC.DeviceManager'),
        eventMediator = require('../event/ctx.RTC.EventMediator'),
        UserMedia = require('../ctx.RTC.UserMedia');

    /**
     * @class VideoDeviceManager
     * @constructor
     * @param {Object} config
     */
    var VideoDeviceManager = function(config)
    {
        config.kind = "video";
        AbstractDeviceManager.call(this, config);

        // reset device id to previously selected device id in case device switch failed
        this._events.subscribeGlobal(this._C.EVENTS_INTERNAL.DEVICE_SWITCH_FAILED, function(data){
            var _deviceId = this._selectedInputDeviceId;
            this._selectedInputDeviceId = this._prevInputDeviceId;

            // notify API about device switch fail
            this.broadcast(this._C.EVENTS_PUBLIC.DEVICE_SWITCH_FAILED, {
                stream: data,
                device: {
                    id: _deviceId,
                    label: this.getDeviceLabel(_deviceId),
                    type: "video"
                }
            });
        }, this);
    };

    VideoDeviceManager.prototype = Object.create(AbstractDeviceManager.prototype);
    VideoDeviceManager.prototype.constructor = VideoDeviceManager;

    /**
     * Class name
     * @property NAME
     * @type {String}
     * @default "VideoDeviceManager"
     */
    VideoDeviceManager.prototype.NAME = "VideoDeviceManager";

    /**
     * Returns event name for setInputDevice
     * @returns {String}
     * @private
     * @method _getEventName
     */
    VideoDeviceManager.prototype._getEventName = function()
    {
        return this._C.DEVICE.SET_INPUT;
    };

    /**
     * Returns filter function for video devices
     * @returns {Function}
     * @private
     * @method _getFilterFunction
     */
    VideoDeviceManager.prototype._getFilterFunction = function(){
        return function(device) {
            return device && device.type === "video";
        };
    };

    // TODO: Use proper DI mechanism/framework here
    var deviceManager = new VideoDeviceManager({
        constants: Constants,
        log: log,
        userMedia: eventMediator.mix(new UserMedia(), "media-requests"),
        eventMediator: eventMediator,
        // FIXME eventChannel name is used as channelID for postal, but could be confused with EventChannel where we get events from GW
        eventChannel: "video-input-devices"
    });


    return deviceManager;
});
