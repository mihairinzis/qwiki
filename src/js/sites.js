/**
   Copyright 2016 Mihai Rînziș

   Qwiki is free software: you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation, either version 3 of the License, or
   (at your option) any later version.

   Qwiki is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with Qwiki. If not, see <http://www.gnu.org/licenses/>.
*/

/**
 * @module sites
 * @class
 * @classdesc Utility that tells if, disables or enables
 * the url of the current tab.
 *
 * @constructor
 */
module.exports = function Sites() {
  'use strict';

  const url = new (require('./url'))(),
        storage = new (require('./storage'))('SITES', {
          disabledSites: [],
          showOnlyNewTab: false
        }),
        disabledSites = storage.get('disabledSites'),
        SECONDS_BETWEEN_SHOWS = 2;
  let currentSite = null,
      lastShowDate = null;

  /**
   * @function
   * @returns false if:
   * - current site/new tab is disabled
   * - called succesivelly for same site
   * @param {string} siteUrl - the site url
   * @param {boolean} isNewTab - if it's a new tab or not
   */
  function showForSite(siteUrl, isNewTab) {
    /** In order to ignore refreshes caused by frequent ajax calls
     *  requests that are more frequent than SECONDS_BETWEEN_SHOWS
     *  are also ignored. */
    if (lastShowDate && (new Date() - lastShowDate) / 1000 < SECONDS_BETWEEN_SHOWS) {
      return false;
    }
    if (storage.get('showOnlyNewTab')) {
      return isNewTab;
    }
    if (disabledSites.indexOf(siteUrl) !== -1) {
      return false;
    }
    if (!isNewTab && siteUrl === currentSite) {
      return false;
    }
    currentSite = siteUrl;
    lastShowDate = new Date();
    return true;
  }

  /**
   * @function
   * Resolves if there is an active tab and showForsite returns true;
   * rejects otherwise.
   */
  this.showForCurrentSite = () => url.getActiveTabUrl()
    .then(tab => showForSite(tab.url, tab.isNewTab) ?
          Promise.resolve() : Promise.reject());

  /**
   * @function
   * Sets the showOnlyNewTab flag to checked
   * @param {boolean} checked
   */
  this.showForNewTabOnly = (checked) => {
    storage.set({showOnlyNewTab: checked});
  };

  this.isShowForNewTabOnly = () => storage.get('showOnlyNewTab');

  /**
   * @function
   * Provides function utils that check for, enable, or disable
   * the url of the current tab
   */
  this.getCurrentSite = () => url.getActiveTabUrl().then(tab => ({
    isEnabled: () => disabledSites.indexOf(tab.url) === -1,
    enable: () => {
      const siteIndex = disabledSites.indexOf(tab.url);
      if(siteIndex > -1) {
        disabledSites.splice(siteIndex, 1);
        storage.persist();
      }
    },
    disable: () => {
      const siteIndex = disabledSites.indexOf(tab.url);
      if(siteIndex === -1) {
        disabledSites.push(tab.url);
        storage.persist();
      }
    }
  }));

  this.isCurrentSiteNewTab = () => url.getActiveTabUrl()
    .then(tab => tab.isNewTab);
};
