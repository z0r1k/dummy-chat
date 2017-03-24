define([
    "../polyfill/ctx.RTC.Promise",
    "../helper/ctx.RTC.HelperBrowser",
    "../helper/ctx.RTC.HelperStream"
], function(Promise, HelperBrowser, HelperStream){
    /**
     * No operational function
     */
    var NOOP = function(){};

    /**
     * Abstract Device Manager
     * @class DeviceManager
     * @param {object} config
     * @constructor
     */
    var DeviceManager = function(config){
        /**
         * Event functionality which will be mixed in by subclass
         * @type {Object}
         * @private
         */
        this._events = null;

        /**
         * Constants
         * @property _C
         * @type {Object}
         * @private
         */
        this._C = null;

        /**
         * Logger
         * @property _log
         * @type {Object}
         * @private
         */
        this._log = null;

        /**
         * getUserMedia wrapper
         * @property _userMedia
         * @type {Object}
         * @private
         */
        this._userMedia = null;

        /**
         * Device kind (audio/video)
         * @type {String}
         * @private
         * @property _deviceKind
         */
        this._deviceKind = "";

        /**
         * Device list counter
         * @property _prevDeviceCount
         * @type {number}
         * @private
         */
        this._prevDeviceCount = -1;

        /**
         * Input device id
         * @property _selectedInputDeviceId
         * @type {String}
         * @private
         */
        this._selectedInputDeviceId = "";

        /**
         * Previous input device id
         * @property _prevInputDeviceId
         * @type {String}
         * @private
         */
        this._prevInputDeviceId = "";

        /**
         * Indicated was gUM called already or not
         * @type {boolean}
         * @private
         */
        this._wasGUMCalled = false;

        this._init(config);
    };
    DeviceManager.prototype = {
        /**
         * List of fetched audio devices (lookup table)
         * @property _deviceList
         * @type {Object}
         * @private
         */
        _deviceList: {},

        /**
         * List of possible statuses for device enumeration
         * @property _deviceListStatus
         * @type {Object}
         * @private
         */
        _deviceListStatus: {
            success: "success",
            notAvailable: "notAvailable"
        },

        /**
         * Event name for device list change
         * @property _deviceListChangedEvent
         * @private
         */
        _deviceListChangedEvent: "deviceListChanged",

        /**
         * Interval ID for device polling
         * @property _intervalId
         * @type {Number}
         * @private
         */
        _intervalId: -1,

        /**
         * Interval in milliseconds for device polling
         * @property _interval
         * @type {Number}
         * @private
         */
        _interval: -1,

        /**
         * Default interval in milliseconds for device polling
         * @property _DEFAULT_INTERVAL
         * @type {Number}
         * @default 2000
         * @private
         */
        _DEFAULT_INTERVAL: 2000,

        /**
         * Initializer
         * @param config
         * @private
         */
        _init: function(config)
        {
            this._events = config.eventMediator.mix({}, config.eventChannel);
            this._C = config.constants;
            this._log = config.log;
            this._userMedia = config.userMedia;
            this._deviceKind = config.kind || "";
            this._prevDeviceCount = 0;
        },

        /**
         * Get class name
         * @returns {String}
         * @method getName
         */
        getName: function()
        {
            return this.NAME || "";
        },

        /**
         * Returns list of audio devices
         * @param {Function} callback
         * @param {Object} context
         * @method enumerateDevices
         * @async
         */
        enumerateDevices: function(callback, context)
        {
            callback = callback || NOOP;
            context = context || this;

            var self = this;

            // Let's make sure that there is no timer running already (if this method called once again)
            this._clearDevicePollingInterval();

            // input device polling to detect new or removed devices
            var _compare = function(o){
                if (o.devices.length !== this._prevDeviceCount) {
                    this._notify(o.devices);
                }
                this._prevDeviceCount = o.devices.length;
            };

            // success callback
            var _success = function(){
                self._enumerateInputDevices().then(function(result){
                    callback.call(context, result.devices, result.status);
                    self._startDevicePollingInterval(_compare, self);
                });
            };

            // failure callback
            var _fail = function(err){
                self._log.warn("%s: Cannot retrieve device list. Either no permission to access user media was given " +
                    "or getUserMedia failed to fetch stream from selected device. %O", self.getName(), err);
                callback.call(context, [], self._deviceListStatus.notAvailable);
            };

            // stops media stream since there is no need to have it but just for getting labels
            var _stopStream = function(stream){
                HelperStream.stop(stream);
            };

            // if it is http only there is no way to get labels so no need to call gUM
            if (!HelperBrowser.isHTTPS() || this._wasGUMCalled) {
                _success();
                return;
            }

            var constraints = {};
            switch (this._deviceKind) {
                case "audio":
                    constraints.audio = true;
                    break;
                case "video":
                    constraints.video = true;
                    break;
                default:
                    constraints.audio = true;
                    constraints.video = true;
                    break;
            }

            this._userMedia.get(constraints).then(_stopStream).then(function(){
                self._wasGUMCalled = true;
            }).then(_success).catch(_fail);
        },

        /**
        * Sets input device in asynchronous way
        * @param {String} id of device
        * @method setInputDevice
        */
        setInputDevice: function(id)
        {
            if (!id) {
                this._log.warn(this.getName() + " setInputDevice() is invoked without proper device id");
                return;
            }
            if (id === this._selectedInputDeviceId) {
                // ignore same device switch to avoid WebRTC renegotiation
                return;
            }

            // save previous device id
            this._prevInputDeviceId = this._selectedInputDeviceId;
            // set new device id
            this._selectedInputDeviceId = id;

            // log device change with device name or id
            var deviceName = this.getDeviceLabel(id);
            this._log.log(this.getName() + ".setInputDevice() - inputDevice='" + (deviceName || id) + "'");

            this._events.publishGlobal(this._getEventName(), id);
        },

        /**
        * Get selected input device id if any
        * @returns {String}
        * @method getInputDevice
        */
        getInputDevice: function()
        {
            return this._selectedInputDeviceId ? this._selectedInputDeviceId : "";
        },

        /**
         * Retrieves input device id by it's label
         * @param {String} label
         * @returns {String}
         * @method getDeviceByLabel
         */
        getDeviceByLabel: function(label)
        {
            return this._deviceList[label] || "";
        },

        /**
         * Retrieves input device label by it's id
         * @param id
         * @returns {String}
         * @method getDeviceLabel
         */
        getDeviceLabel: function(id)
        {
            if (!id || !id.length) {
                return "";
            }
            return Object.keys(this._deviceList).filter(function(label){
                return this._deviceList[label] === id;
            }, this)[0] || "";
        },

        /**
         * Sets interval in milliseconds for input device polling
         * @param interval
         * @method setDevicePollingInterval
         */
        setDevicePollingInterval: function(interval)
        {
            interval = parseInt(interval, 10);
            this._interval = interval || this._DEFAULT_INTERVAL;
        },

        /**
         * Returns interval for input device polling
         * @returns {Number}
         * @method getDevicePollingInterval
         */
        getDevicePollingInterval: function()
        {
            if (!this._interval || -1 === this._interval) {
                return this._DEFAULT_INTERVAL;
            }
            return this._interval;
        },

        /**
         * Starts device polling timer
         * @param callback
         * @param context
         * @method _startDevicePollingInterval
         * @private
         */
        _startDevicePollingInterval: function(callback, context)
        {
            this._intervalId = setInterval(function(){
                this._enumerateInputDevices().then(callback.bind(context));
            }.bind(this), this.getDevicePollingInterval());
        },

        /**
         * Stops device polling timer
         * @private
         * @method _clearDevicePollingInterval
         */
        _clearDevicePollingInterval: function()
        {
            if (this._intervalId && -1 !== this._intervalId) {
                clearInterval(this._intervalId);
            }
        },

        /**
         * Returns list of input devices
         * @method _enumerateInputDevices
         * @private
         * @async
         */
        _enumerateInputDevices: function()
        {
            var promise;
            var self = this;

            if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
                promise = navigator.mediaDevices.enumerateDevices();
            } else {
                promise = new Promise(function(resolve){
                    window.MediaStreamTrack.getSources(resolve);
                });
            }

            var _processDevices = function(devices){
                var list = [];
                devices.forEach(function(device){
                    if (device.label.toLowerCase() === "default") {
                        return;
                    }

                    var id = device.deviceId || device.id,
                        label = device.label,
                        type;

                    switch (device.kind) {
                        case "audio":
                        case "audioinput":
                            label = label || "Microphone";
                            type = "audio";
                            break;

                        case "video":
                        case "videoinput":
                            label = label || "Camera";
                            type = "video";
                            break;

                        default:
                            label = label || "Audio Output";
                            type = "audiooutput";
                            break;
                    }

                    list.push({
                        id: id,
                        label: label,
                        type: type
                    });
                });

                // filter returns new array so we get data immutability for free :P
                list = list.filter(self._getFilterFunction(), self);

                // If device list was requested over HTTP and index to device
                // so label will be like Microphone 1, Camera 1, etc
                if (!HelperBrowser.isHTTPS()) {
                    var idxInput = 0,
                        idxOutput = 0;
                    list = list.map(function(device){
                        var idx;
                        if (device.type === "audio") {
                            idx = ++idxInput;
                        } else {
                            idx = ++idxOutput;
                        }

                        device.label += " " + idx;
                        self._deviceList[device.label] = device.id;

                        return device;
                    });
                } else {
                    list.forEach(function(device){
                        self._deviceList[device.label] = device.id;
                    });
                }

                return {
                    status: list.length ? self._deviceListStatus.success : self._deviceListStatus.notAvailable,
                    devices: list
                };
            };

            return promise.then(_processDevices);
        },

        /**
         * Filter function for device list
         * @returns {Function}
         * @private
         */
        _getFilterFunction: function()
        {
            return function(){
                return true;
            };
        },

        /**
         * Notifies subscribers about device change
         * @param devices
         * @private
         * @method _notify
         * @fires deviceListChanged
         */
        _notify: function(devices)
        {
            devices = devices || [];
            this._events.broadcast(this._deviceListChangedEvent, devices);
        },

        /**
         * Subscribe to device list update events
         * @param event
         * @param callback
         * @param context
         * @returns {Object|Null}
         * @method subscribe
         */
        subscribe: function(event, callback, context)
        {
            return this._events.subscribeBroadcasted(event, callback, context);
        },

        /**
         * Unsubscribe from device list update events
         * @param event
         * @method unsubscribe
         */
        unsubscribe: function(event)
        {
            this._events.unsubscribeBroadcasted(event);
        },

        /**
         * Cleanup for all possible leftovers
         * @method clear
         */
        clear: function()
        {
            // clear any input device polling intervals
            this._clearDevicePollingInterval();

            // state cleanup
            this._prevInputDeviceId = "";
            this._selectedInputDeviceId = "";
            this._deviceList = {};

            this._wasGUMCalled = false;
        }
    };

    return DeviceManager;
});
