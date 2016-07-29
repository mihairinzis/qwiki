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
   along with Qwiki.  If not, see <http://www.gnu.org/licenses/>.
*/

/**
 * @module defaultarticle
 * @class
 * @classdesc Saves and returns a default article
 * @param locales {Locales}
 *
 * @constructor
 */
module.exports = function DefaultArticle(locales) {
  'use strict';

  const Storage = require('./storage'),
        storage = new Storage('DEFAULT_ARTICLE', {lastArticle: null});

  this.getDefaultArticle = () => {
    if (storage.get('lastArticle')) {
      return Promise.resolve(storage.get('lastArticle'));
    }
    return locales.fetchLocales().then(() => ({
      title: locales.message('default_article_title'),
      content: locales.message('default_article_content')
    }));
  };

  this.setDefaultArticle = (article) => {
    storage.set({lastArticle: article});
  };
};
