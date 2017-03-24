/**
 * FPR Screensharing add-on for Tokbox integration
 * Based on https://github.com/opentok/screensharing-extensions/tree/master/firefox
 */

var pageMod = require('sdk/page-mod');
var prefsService = require('sdk/preferences/service');

var allowDomainsPrefKey = 'media.getusermedia.screensharing.allowed_domains';
var allowScreensharePrefKey = 'media.getusermedia.screensharing.enabled';

var domains = [
    '*.FPR.dev',
    'FPR.com',
    '*.FPR.com'
];

var include = domains.filter(function(domain){
    return domain[0] === '*';
});

// push these domains back to 'domains' because we still need to whitelist them
// but we don't want to have them in the 'include' because '*.FPR.com' would match them already
// and extension wont run if you have duplicate patterns like '*.FPR.com' and '*.live.FPR.com'
// in the same list
//
// but in the future we should actually reiterate over 'includes' and try to match things like '*.FPR.com'
// to filter things like '*.live.FPR.com' out
domains.push('*.test.FPR.com', '*.staging.FPR.com', '*.live.FPR.com');

exports.main = function (options) {
    if (options.loadReason !== 'startup') {
        var curPrefs = prefsService.get(allowDomainsPrefKey).replace(/\s/g, '').split(',');

        domains.forEach(function(domain) {
            if (curPrefs.indexOf(domain) !== -1) {
                return;
            }
            curPrefs.push(domain);
        });

        prefsService.set(allowDomainsPrefKey, curPrefs.join(','));
        prefsService.set(allowDomainsPrefKey, true);
    }
};

exports.onUnload = function (reason) {
    if (reason === 'uninstall' || reason === 'disable') {
        domains.forEach(function(domain) {
            var curPref = prefsService.get(allowDomainsPrefKey);

            var newPref = curPref.split(',').filter(function(pref) {
                return pref.trim() !== domain;
            }).join(',');

            prefsService.set(allowDomainsPrefKey, newPref);
        });
    }
};

pageMod.PageMod({
    include: include,
    // this variable is exposed in order to detect extension installation and is required by
    // https://static.opentok.com/v2/js/opentok.js
    // more information and boilerplate code could be found here
    // https://tokbox.com/developer/guides/screen-sharing/js/#firefox-extension
    contentScript: 'window.wrappedJSObject.OTScreenSharing = cloneInto({}, window.wrappedJSObject);'
});
