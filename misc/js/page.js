// todo do we want some lightweight lib for dom manipulation?
define([
    'mr/manager/event',
    'config/pages',
    'mr/module/log',
    'data/translations',
    'mr/manager/notification'
], function(EventManager, PageConfig, Logger, Translations, NotificationManager){
    /**
     * @class PageManager
     * @param {Object} eventManager
     * @param {Array} whitelist
     * @param {Object} logger
     * @param {Object} translations
     * @param {Object} notificationManager
     * @constructor
     */
    var Page = function(eventManager, whitelist, logger, translations, notificationManager){
        this._eventManager = eventManager;
        this._activePage = '';
        this._whitelist = whitelist;
        this._log = logger;
        this._translations = translations;
        this._notificationManager = notificationManager;
        this._requestedLoaders = 0;
    };

    Page.prototype = {
        /**
         * Initializer
         * @private
         */
        init: function(){
            this._initEvents();
        },

        /**
         * Returns current page name and if empty uses default
         * @private
         */
        getCurrentPageName: function(){
            var name, active = this._findActivePage();
            if (active) {
                name = this.getPageName(active.querySelector('.mr-icon'));
            }
            return name || 'video';
        },

        /**
         * Subscribe to events
         * @private
         */
        _initEvents: function(){
            this._eventManager.subscribe('routeInitialized', function(e){
                this._log.debug('Current page', e.detail);
                this.navigateTo(e.detail);
            }, this);

            this._eventManager.subscribe('counterpartPageChanged', function(e){
                if (e.detail.page !== 'documents') {
                    var page = (e.detail.page === 'screenshare') ? 'video' : e.detail.page;

                    if (e.detail.follow && page !== this._activePage) {
                        this._log.info('You are been transferred to ' + page);
                        this._notificationManager.info(this._translations.notifications.page_follow.replace('%page%', page));

                        this.navigateTo(page, null, true);
                    }
                }
            }, this);

            this._eventManager.subscribe('pageReady', function(e){
                this._log.debug('Page %s is ready to be shown', e.detail);
                this.hideLoader();
            }, this);
        },

        /**
         * Navigate to the page
         *
         * @param page
         * @param data
         * @param preventCounterpartNotification
         */
        navigateTo: function(page, data, preventCounterpartNotification) {
            data = data || {};
            preventCounterpartNotification = preventCounterpartNotification || false;

            if (!page) {
                return;
            }

            if (this._activePage === page) {
                this._eventManager.fire('actionPage', {
                    action: 'click',
                    page: page
                });
                return;
            }

            if (this._whitelist.indexOf(page) === -1) {
                this._log.error('Failed to load page', page);
                this._notificationManager.fail(this._translations.notifications.page_load_fail);
                return;
            }

            this.showLoader();

            require(['mr/widget/page-' + page], function(PageWidget){
                this._log.debug('Page %s is loaded', page);
                PageWidget.setData(data);

                var target = document.querySelector('.mr-footer .mr-icon.mr-icon-' + page);
                if (target) {
                    var event = {
                        prevVal: undefined,
                        newVal: undefined,
                        preventCounterpartNotification: preventCounterpartNotification
                    };

                    var parent = target.parentNode.parentNode;
                    if (parent.classList.contains('disabled')) {
                        return;
                    }

                    var active = this._findActivePage();
                    if (active) {
                        event.prevVal = this.getPageName(active.querySelector('.mr-icon'));
                        active.classList.remove('active');
                    }

                    this._setPageClasses(page);

                    event.newVal = page;
                    this._activePage = page;

                    parent.classList.add('active');
                    this._eventManager.fire('activePageChanged', event);
                }
            }.bind(this));
        },

        /**
         * Returns page name
         * @param node
         * @return {string}
         * @private
         */
        getPageName: function(node) {
            var name;
            for (var i = 0; i < node.classList.length; i++) {
                if (node.classList.item(i) !== 'mr-icon') {
                    name = node.classList.item(i).replace('mr-icon-', '');
                    break;
                }
            }

            return name || '';
        },

        /**
         * Shows loading indicator
         */
        showLoader: function(){
            this._eventManager.fire('showMask');
            this._requestedLoaders++;

            var loader = document.querySelector('.mr-layout .mr-loader');
            if (loader) {
                loader.style.display = 'block';
            }
        },

        /**
         * Hides loading indicator
         */
        hideLoader: function(){
            this._eventManager.fire('hideMask');
            this._requestedLoaders--;

            var loader = document.querySelector('.mr-layout .mr-loader');
            if (loader && this._requestedLoaders <= 0) {
                loader.style.display = 'none';
                this._requestedLoaders = 0;
            }
        },

        /**
         * Finds currently selected active page
         * @return {Element|Null}
         * @private
         */
        _findActivePage: function(){
            var node = document.querySelector('.mr-footer div.mr-cell.active');
            return node || null;
        },

        /**
         * Set class name on the content related with the current page
         * @param {String} page
         */
        _setPageClasses: function(page){
            var content = document.querySelector('.mr-layout');
            if (content) {
                content.classList.remove('active-page-' + this._activePage);
                content.classList.add('active-page-' + page);
            }
        },

        /**
         * Removes page
         * @param {String} page
         */
        remove: function(page) {
            if (!page || this._whitelist.indexOf(page) === -1) {
                return;
            }

            var pageNode = document.querySelector('.mr-content .mr-page-' + page);
            if (pageNode) {
                pageNode.parentNode.removeChild(pageNode);
            }

            var navNode = document.querySelector('.mr-footer .mr-icon-' + page);
            if (navNode) {
                navNode = navNode.parentNode.parentNode;
                navNode.parentNode.removeChild(navNode);
            }
        }
    };

    return new Page(EventManager, PageConfig, Logger, Translations, NotificationManager);
});