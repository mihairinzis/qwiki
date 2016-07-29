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
 * @module chrome-background
 * Chrome background page
 */

/**
 * @global {Object} that communicates with the injected javascript
 * through chrome messages.
 * @see content module
 */
background = (function() {
  'use strict';

  const url = new (require('./url'))(),
        qwiki = new (require('./qwiki'))(getExtensionVersion());

  function sendMessageToCurrentTab(method, message) {
    url.getActiveTab().then(tab => {
      if (tab) {
        window.chrome.tabs.sendMessage(tab.id, {
          method: method,
          data: message
        });
      }
    });
  }

  function createBookmark(folderId) {
    qwiki.getLastArticle().then(article => {
      window.chrome.bookmarks.create({
        parentId: folderId,
        title: article.title,
        url: article.url
      });
    });
  }

  function createFolderAndBookmark(folderTitle) {
    window.chrome.bookmarks.getTree((tree) => {
      const bookmarkBarId = tree[0].children[0].id;
      window.chrome.bookmarks.create({
        parentId: bookmarkBarId,
        index: 0,
        title: folderTitle
      }, (newFolder) => {
        createBookmark(newFolder.id);
      });
    });
  }

  function getExtensionVersion() {
    if ('chrome' in window && 'runtime' in window.chrome &&
        'getManifest' in window.chrome.runtime) {
      return parseFloat(window.chrome.runtime.getManifest().version);
    }
    return 0;
  }

  return {
    sendArticle: () => {
      Promise.all([
        qwiki.getArticle(),
        qwiki.getOptions().sites.isCurrentSiteNewTab(),
        qwiki.getOptions().locales.fetchLocales()
      ]).then(results => {
        sendMessageToCurrentTab('articleReady', {
          article: results[0],
          alignment: qwiki.getOptions().getAlignment(),
          isNewTab: results[1],
          bookmarkTitle: qwiki.getOptions().locales.message('bookmark'),
          closeTitle: qwiki.getOptions().locales.message('close')
        });
      }).catch(() => {
        // sites.showForCurrentSite returned false
      });
    },

    bookmarkLastArticle: () => {
      const folderTitle = 'Qwiki';
      window.chrome.bookmarks.search(folderTitle, (folders) => {
        if(folders.length > 0) {
          for (let i = 0; i < folders.length; ++i) {
            if(!folders[i].hasOwnProperty('url') &&
               folders[i].title === folderTitle) {
              createBookmark(folders[i].id);
              return;
            }
          }
        }
        createFolderAndBookmark(folderTitle);
      });
    },

    getOptions: qwiki.getOptions
  };
}());

window.chrome.runtime.onMessage.addListener((request) => {
  if (request.method === 'getArticle') {
    background.sendArticle();
  } else if (request.method === 'bookmarkLastArticle') {
    background.bookmarkLastArticle();
  }
});
