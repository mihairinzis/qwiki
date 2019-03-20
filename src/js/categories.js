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
 * @module categories
 * @class
 * @classdesc Saves and finds random categories
 * @param db {Dexie} - a Dexie database instance
 * @param language {function}
 *
 * @constructor
 */
module.exports = function Categories(db, language) {
  'use strict';

  /**
   *  @member {Object} - a category that tells the fetcher to
   *  look for random articles
   */
  this.RANDOM_CATEGORY = {
    title: 'Random',
    metacategory: 'Random',
    views: 0
  };

  const getLocalUrl = new (require('./url'))().getLocalUrl,
        defaultIgnoreContents = ['http://', '<ol', '<ul', '<dl'],
        storage = new (require('./storage'))('WIKI_CATEGORIES', {
          ignoreTitles: [],
          ignoreContents: defaultIgnoreContents,
          metaCategories: {}
        });

  /**
   * @function
   * @returns {string} extension context url of the wikipedia
   * categories file for the current language
   */
  function getCategoriesFile() {
    return getLocalUrl('../wikidata/' + language() + '.json');
  }

  /**
   * @function
   * Saves the avoid words for filtering the fetched articles
   * @param {Object} content - parsed wikipedia categories file
   */
  function getNewIgnoreWords(content) {
    if('ignore_titles_containing' in content) {
      storage.set({ignoreTitles: content.ignore_titles_containing});
    }
    if('ignore_contents_containing' in content) {
      storage.set({
        ignoreContents: defaultIgnoreContents
          .concat(content.ignore_contents_containing)
      });
    }
  }

  function persistMetacategories(metaNames, categorySize) {
    const newMetaCategories = {};
    metaNames.forEach((metaCategory) => {
      newMetaCategories[metaCategory.name] =
        Math.round(metaCategory.size * 100 / categorySize);
    });
    storage.set({metaCategories: newMetaCategories});
  }

  function getNewCategories(contentCategories) {
    const categories = [], metaNames = [];
    if (contentCategories && Object.keys(contentCategories).length) {
      for (let metaCategory in contentCategories) {
        if (contentCategories[metaCategory].length) {
          contentCategories[metaCategory].forEach((category) => {
            categories.push({
              title: category,
              metaCategory: metaCategory
            });
          });
          metaNames.push({
            name: metaCategory,
            size: contentCategories[metaCategory].length
          });
        }
      }
    }
    persistMetacategories(metaNames, categories.length);
    return Promise.resolve(categories);
  }

  /**
   * @function
   * Fetches the categories from file
   */
  function getCategories() {
    return fetch(getCategoriesFile())
      .then(response => response.json())
      .then(content => {
        getNewIgnoreWords(content);
        return getNewCategories(content.categories);
      })
      .catch(() => {
        persistMetacategories([], 0);
        storage.set({ignoreTitles: []});
        storage.set({ignoreContents: defaultIgnoreContents});
        return Promise.reject();
      });
  }

  /**
   * @function
   * Persists new categories in db
   * @param newCategories {array} of title and metaCategory to persist
   */
  function saveNewCategories(newCategories) {
      newCategories.forEach(category => {
        db.categories.add({
          title: category.title,
          metacategory: category.metaCategory,
          continue: '',
          gcmcontinue: '',
          views: 0
        });
      return Promise.resolve();
    });
  }

  /**
   * @function
   * @returns a random category with 0 views
   * or the {RANDOM_CATEGORY} if none exists.
   */
  this.getRandomCategory = () => db.categories.where('views')
    .belowOrEqual(0).count(count => {
      if (count > 0) {
        const rand = Math.floor(Math.random() * count);
        return db.categories.where('views').belowOrEqual(0)
          .offset(rand).first(category => category);
      }
      return Promise.resolve(this.RANDOM_CATEGORY);
    });

  /**
   * @function
   * @returns a random category with metaCategory and 0 views
   * or the {RANDOM_CATEGORY} if none exists.
   * @param metaCategory {string}
   */
  this.getRandomCategoryWithMetacategory = (metaCategory) => db.categories
    .where('views').belowOrEqual(0)
    .and(category => category.metacategory === metaCategory)
    .count(count => {
      if (count > 0) {
        const rand = Math.floor(Math.random() * count);
        return db.categories.where('views').belowOrEqual(0)
          .and(category => category.metacategory === metaCategory)
          .offset(rand).first(category => category);
      }
      return Promise.resolve(this.RANDOM_CATEGORY);
    });

  /**
   * @function
   * Resolves if there are any categories with metaCategory and 0 views
   * @param metaCategory {string}
   */
  this.metaCategoryHasUnfetched = (metaCategory) => db.categories
    .where('views').belowOrEqual(0)
    .and(category => category.metacategory === metaCategory)
    .count(count => count > 0 ? Promise.resolve() : Promise.reject());

  /**
   * @function
   * Opens the databse and fetches the categories from file if they're missing
   */
  this.loadData = () => {
    if (!db.isOpen()) {
      db.open();
    }
    return db.categories.count(count => {
      return count > 0 ? Promise.resolve() : getCategories()
        .then(newCategories => saveNewCategories(newCategories))
        .catch(() => Promise.resolve());
    });
  };

  this.updateCategory = (category, cont, gcmcont, views) => {
    db.categories.update(category, {
      continue: cont,
      gcmcontinue: gcmcont,
      views: views
    });
  };

  /**
   * @function
   * @returns the list of sored meta categories
   * if the list is empty it tries to fetch them from file first
   */
  this.getMetaCategories = () => {
    if (Object.keys(storage.get('metaCategories')).length) {
      return Promise.resolve(storage.get('metaCategories'));
    }
    return getCategories()
      .then(() => storage.get('metaCategories'))
      .catch(() => storage.get('metaCategories'));
  };

  this.setMetaCategories = (metaCategories) => {
    storage.set({metaCategories: metaCategories});
  };

  this.ignoreContents = () => storage.get('ignoreContents');

  this.ignoreTitles = () => storage.get('ignoreTitles');

  /**
   * @function
   * @returns a random metaCategory considering the stored weights;
   * rejects if no meta categories are storred
   */
  this.getRandomMetaCategory = () => {
    const rand = Math.floor(Math.random() * 100) + 1;
    let percentSum = 0;
    for (let metaCategory in storage.get('metaCategories')) {
      percentSum = percentSum + storage.get('metaCategories')[metaCategory];
      if (percentSum >= rand) {
        return Promise.resolve(metaCategory);
      }
    }
    return Promise.reject();
  };
};
