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
 * @module qwiki
 * @class
 * @classdesc Creates/opens the database and other resources
 *
 * @constructor
 */
module.exports = function Qwiki(extensionVersion) {
  'use strict';

  const Dexie = require('dexie'),
        db = new Dexie('dexie'),
        locales = new (require('./locales'))(),
        categories = new (require('./categories'))(db, locales.language),
        defaultArticle = new (require('./defaultarticle'))(locales),
        articles = new (require('./articles'))(db, locales.language,
                                               categories, defaultArticle),
        sites = new (require('./sites'))(),
        options = new (require('./options'))(locales, categories,
                                             sites, changeLanguage);

  db.version(3).stores({
    categories: '&title,metacategory,continue,gcmcontinue,views',
    articles: '&pageid,title,category,content,views,imageurl'
  });

  /**
   * @function
   * Drops the database if the manifest version is greater
   * than the stored one.
   */
  function resetOnVersionChange() {
    if (extensionVersion > options.getExtensionVersion()) {
      options.setExtensionVersion(extensionVersion);
      return db.delete();
    }
    return Promise.resolve();
  }

  /**
   * @function
   * @returns a suitable article
   */
  this.getArticle = () => sites.showForCurrentSite()
    .then(() => resetOnVersionChange())
    .then(() => articles.getArticle());

  /**
   * @function
   * Changes the locales language, drops the whole db and loads the categories
   * for the new language if it's a new one
   *
   * @param newLanguage {string} - the new language
   */
  function changeLanguage(newLanguage) {
    if (newLanguage === locales.language()) {
      return Promise.resolve();
    }
    locales.changeLanguage(newLanguage);
    return db.delete().then(() => categories.loadData());
  }

  /**
   * @function
   * Returns a promise that resolves the last shown article or the default one
   */
  this.getLastArticle = () => defaultArticle.getDefaultArticle();

  this.getOptions = () => options;
};
