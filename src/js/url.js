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
 * @module url
 * @class
 * @classdesc Utility that resolves the url of the
 * current tab and local paths in
 * the extension context.
 *
 * @constructor
 */
module.exports = function Url() {
  'use strict';

  const CHROME_NEW_TAB_URL = 'chrome://newtab/';
  const FIREFOX_NEW_TAB_TITLE = 'New Tab';

  /**
   * @function
   * @returns the root of an url
   */
  function getRemoteUrlRoot(remoteUrl) {
    const url = document.createElement('a');
    url.href = remoteUrl;
    return url.hostname;
  }

  /**
   * @function
   * @returns the active tab of the first chrome window
   */
  this.getActiveTab = () => new Promise((resolve) => {
    window.chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      resolve(tabs[0]);
    });
  });

  /**
   * @function
   * @returns the active tab url of the first chrome window
   */
  this.getActiveTabUrl = () => this.getActiveTab()
    .then(tab => ({
      url: getRemoteUrlRoot(tab.url),
      isNewTab: tab.url === CHROME_NEW_TAB_URL || tab.title === FIREFOX_NEW_TAB_TITLE
    }));

  /**
   * @function
   * @returns a local file url in the context of the chrome extension
   */
  this.getLocalUrl = (localUrl) => {
    if('chrome' in window && 'runtime' in window.chrome &&
       'getURL' in window.chrome.runtime) {
      return window.chrome.runtime.getURL(localUrl);
    }
    return localUrl;
  };
};
