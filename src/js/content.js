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
 * @module content
 * Injects an article text bubble in the active tab page.
 * Communicates with the background page through chrome messages.
 * @see chrome-background module
 */

(function() {
  'use strict';

  const createElement = require('./element');
  let isNewTab = false,
      smallScreen = false;

  function sendToBackground(method, data) {
    window.chrome.runtime.sendMessage({method: method, data: data});
  }

  const qwikiFrame = createElement({
    tagName: 'div',
    attributes: {id: 'qwiki-frame'}
  });
  const qwikiFrameTextDiv = qwikiFrame.appendChild(createElement({
    tagName: 'div',
    attributes: {'id': 'qwiki-text'}
  }));

  function resizeQwikiFrame(alignment) {
    const width = 45,
          height = 25,
          middleRight = (98 - width) / 2,
          leftRight = 99 - width;

    qwikiFrame.style.width = smallScreen || isNewTab ? '98%' : width + '%';
    qwikiFrame.style.height = isNewTab ? 'auto' : height + 'px';
    if (isNewTab || smallScreen || alignment === 'right') {
      qwikiFrame.style.right = '1%';
    } else if (alignment === 'left') {
      qwikiFrame.style.right = leftRight + '%';
      qwikiFrame.style.bottom = height + 'px';
    } else if (alignment === 'middle') {
      qwikiFrame.style.right = middleRight + '%';
    }
  }

  qwikiFrame.onmouseleave = function() {
    if (!isNewTab) {
      qwikiFrame.className = 'qwiki-hidden';
    }
  };

  qwikiFrame.onmouseover = function() {
    if (!isNewTab) {
      qwikiFrame.className = 'qwiki-visible';
    }
  };

  function displayArticle(article) {
    if (!isNewTab) {
      qwikiFrameTextDiv.onmouseover = () => {
        qwikiFrame.style.height = 'auto';
      };
      setTimeout(() => {
        qwikiFrame.className = 'qwiki-slow-hidden';
      }, 100);
    }

    qwikiFrameTextDiv.innerHTML = article.content;
    qwikiFrameTextDiv.addEventListener('click', (event) => {
      event.stopPropagation();
      window.location = article.url;
    });

    document.body.insertBefore(qwikiFrame, document.body.firstChild);
  }

  function displayButtons(bookmarkTitle, closeTitle) {
    const close = qwikiFrame.appendChild(createElement({
      tagName: 'div',
      attributes: {
        id: 'close-image',
        title: closeTitle
      },
      className: 'buttons-image'
    }));

    close.addEventListener('click', () => {
      qwikiFrame.style.display = 'none';
    });

    const bookmark = qwikiFrame.appendChild(createElement({
      tagName: 'div',
      attributes: {
        id: 'bookmark-image',
        title: bookmarkTitle
      },
      className: 'buttons-image'
    }));

    bookmark.addEventListener('click', () => {
      if (bookmark.style.opacity !== '1') {
        sendToBackground('bookmarkLastArticle');
        bookmark.style.opacity = 1;
      }
    });
  }

  window.chrome.runtime.onMessage.addListener((request) => {
    if (request.method === 'articleReady') {
      isNewTab = request.data.isNewTab;
      resizeQwikiFrame(request.data.alignment);
      displayArticle(request.data.article);
      displayButtons(request.data.bookmarkTitle, request.data.closeTitle);
    }
  });

  sendToBackground('getArticle');
}());
