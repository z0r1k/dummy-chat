/**
@module     g-gameconfig-selector
@requires   g-widget
@copyright  2012 
@license    http://G.de/license
@version    $Revision: $
**/
YUI.add("g-gameconfig-selector", function(Y) {

var
    // component name
    NAME = "gameconfig-selector",

    // template names
    TEMPLATE_NAME = "gameconfig-selector",
    TEMPLATE_ITEM_NAME = "gameconfig-selector-item",

    // events

    /**
    @event E_CLOSE
    @param event {Object}
    **/
    E_CLOSE = "close",
    /**
    @event E_GAMECONFIG_SELECTED
    @param event {Object} Gets selected gameconfigid
    **/
    E_GAMECONFIG_SELECTED = "gameconfig-selected",

    // css classes
    CSS_CLASSES = {
        current: "g-gameconfig-image-current"
    },

    // localization
    intl = {};

/**
@class GameconfigSelector
@constructor
@extends    G.Widget
**/
function GameconfigSelector() {
    GameconfigSelector.superclass.constructor.apply(this, arguments);
}

/**
@property NAME
@type String
@static
**/
GameconfigSelector.NAME = NAME;

/**
@property ATTRS
@type Object
@static
**/
GameconfigSelector.ATTRS = {
    /**
    @type {Number}
    @attribute gameid
    **/
    gameid: {
        value: null
    }
};

GameconfigSelector.prototype = {
    /**
    @type {G.ServiceLocalGame}
    @property _serviceLocalGame
    **/
    _serviceLocalGame: null,

    /**
    @type {G.ManagerTemplate}
    @property _managerTemplate
    **/
    _managerTemplate: null,

    /**
    @type {G.DataManager}
    @property _managerData
    **/
    _managerData: null,

    /**
    Initializer of a instance
    @method  initializer
    @param {Object} cfg
    @protected
    **/
    initializer: function(cfg) {
        intl = G.R.get("factory").intl({module: "g-" + NAME});
        this._serviceLocalGame = cfg.serviceLocalGame || G.R.get("serviceLocalGame");
        this._managerTemplate = cfg.managerTemplate || G.R.get("managerTemplate");
        this._managerData = cfg.managerData || G.R.get("managerData");
    },

    /**
    Destructor of a instance
    @method  destructor
    @protected
    **/
    destructor: function() {
        this._serviceLocalGame = null;
        this._managerTemplate = null;
        this._managerData = null;
    },

    /**
    Responsible to add the widget to the DOM. 
    @method  renderAsyncUI
    @param {Function} callback
    **/
    renderAsyncUI: function(callback) {
        var gameid = this.get("gameid"),
            cbox = this.get("contentBox"),
            hvg = G.R.get("helperViewGame");

        cbox.hide();

        this._managerData.ensureLocal({
            flows: [gameid],
            templates: [TEMPLATE_NAME, TEMPLATE_ITEM_NAME]
        },{
            sourceid: NAME
        },function(success) {
            if (!success) {
                Y.log("Cannot load data", "warn", NAME);
                return;
            }

            this._serviceLocalGame.gameConfigGet({gameid: gameid}, function(rsp) {
                if (!rsp) {
                    G.R.get("helperViewPopup").showAlertPopup({
                        message: intl.__("This game does not have gameconfigs")
                    });
                    return;
                }

                // respect removed configs
                var configs = [];
                Y.each(rsp, function(o) {
                    if (!o.flow.remover) {
                        configs.push(o.flow);
                    }
                }, this);

                if (configs.length > 1) {
                    var game = this._managerData.getLocal("flows", gameid),
                        opt = {};

                    opt[game.game.guid] = game.game.guid;
                    hvg.loadGameTranslations(opt, function(intlCfg) {
                        var data = {
                            configs: configs,
                            game: game || {},
                            intl: intl,
                            intlCfg: intlCfg ? intlCfg[game.game.guid] : {}
                        };
                        cbox.setContent(this._managerTemplate.includeTemplate(TEMPLATE_NAME, data));
                        cbox.show();
                        callback.call(this);
                    }, this);
                } else if (1 === configs.length) {
                    var gameconfigid = parseInt(configs[0].id, 10);
                    this.fire(E_GAMECONFIG_SELECTED, {
                        gameid: this.get("gameid"),
                        gameconfigid: gameconfigid
                    });
                    return; // skip bindUI()
                }
            }, this);
        }, this);
    },

    /**
    @method  bindUI
    **/
    bindUI: function() {
        var cbox = this.get("contentBox");

        // handle close button
        this._addListener(cbox, "delegate", "click", function() {
            this.fire(E_CLOSE);
        }, "button[name='close']", this);

        // notify subscribers about selected game config
        this._addListener(cbox, "delegate", "click", function(e) {
            var game = G.R.get("managerData").getLocal("flows", this.get("gameid")),
                gameconfigid = parseInt(e.currentTarget.one("figure").getAttribute("data-playableid"), 10);

            if (!gameconfigid || game && "maintenance" === game.game.status) {
                e.halt();
                return;
            }

            this.fire(E_GAMECONFIG_SELECTED, {
                gameid: this.get("gameid"),
                gameconfigid: gameconfigid
            });
        }, ".g-gameconfig-configs-list li", this);

        // change background image
        this._addListener(cbox, "delegate", "mouseenter", function(e) {
            var cssClassCurrent = CSS_CLASSES.current,
                item = e.currentTarget,
                index = item.getAttribute("data-index"),
                img = cbox.one("img[data-index='" + index + "']");

            this._removeCurrent();
            if (img) {
                img.addClass(cssClassCurrent);
            }
        }, ".g-gameconfig-configs-list li", this);

        // restore default image
        this._addListener(cbox, "delegate", "mouseleave", function() {
            var cssClassCurrent = CSS_CLASSES.current,
                img = cbox.one("img[data-index='0']");

            this._removeCurrent();
            if (img) {
                img.addClass(cssClassCurrent);
            }
        }, ".g-gameconfig-configs-list li", this);
    },

    /**
    @method  syncUI
    **/
    syncUI: function() {
    },

    /**
    Set bottom left possition
    @method  setPosition
    @param {Number|String} left
    @param {Number|String} bottom
    @param  {Object} [options]  Additional options as follows:
    <pre>
    - [options.mode] (String) The mode, feasible is "table" to position the widget in "table" mode
    </pre>
    **/
    setPosition: function(left, bottom, options) {
        var bbox = this.get("boundingBox");

        options = options || {};

        left = left || "";
        bottom = bottom || "";

        if (Y.Lang.isNumber(left)) {
            left = left + "px";
        }

        if (Y.Lang.isNumber(bottom)) {
            if ("table" === options.mode) {
                bottom += (Y.DOM.winHeight() <= 800) ? 600 : 720;
            }
            bottom = bottom + "px";
        }

        bbox.setStyles({left: left, bottom: bottom, zIndex: 14, position: "fixed"});
    },

    /**
    Remove "current" css class name from images
    @method _removeCurrent
    @protected
    **/
    _removeCurrent: function() {
        var cbox = this.get("contentBox"),
            cssClassCurrent = CSS_CLASSES.current;

        cbox.all("." + cssClassCurrent).each(function(node) {
            if (node) {
                node.removeClass(cssClassCurrent);
            }
        }, this);
    }
};

G.GameconfigSelector = Y.extend(GameconfigSelector, G.Widget, GameconfigSelector.prototype);

}, "@VERSION@", {
    lang: G.Config.moduleLang,
    requires: [
        "base", 
        "g-widget", 
        "event", 
        "gcss-gameconfig-selector", 
        "g-service-local-game"
    ]
});