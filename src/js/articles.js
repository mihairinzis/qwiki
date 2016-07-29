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
 * @module articles
 * @class
 * @classdesc Finds not seen articles and fetches new ones
 * @param db {Dexie} - a Dexie database instance
 * @param language {function}
 * @param categories {Categories}
 * @param defaultArticle {DefaultArticle}
 *
 * @constructor
 */
module.exports = function Articles(db, language, categories, defaultArticle) {
  'use strict';

  const ArticlesFetcher = require('./articlefetcher'),
        ARTICLE_LIMIT = 3000;

  /**
   * @function
   * Fetches new articles using a @see {ArticleFetcher}
   * @param category {Category} - the category data for the fetcher
   * @returns the fetched {Article} list, if any
   */
  function fetchArticles(category) {
    const fetcher = new ArticlesFetcher(language, categories, category);
    return fetcher.fetchArticles()
      .then(articles => {
        articles.forEach(article => {
          db.articles.add(article);
        });
        if (category !== categories.RANDOM_CATEGORY) {
          db.categories.update(category.title, category);
        }
        if (articles.length <= 0) {
          return Promise.reject();
        }
        cleanupArticles();
        return Promise.resolve(articles);
      });
  }

  /**
   * @function
   * Deletes the exceeding number of articles in db above ARTICLE_LIMIT, if any.
   * The first to be deleted are those with higher views.
   */
  function cleanupArticles() {
    db.articles.count(count => {
      if (count > ARTICLE_LIMIT) {
        db.articles.orderBy('views')
          .limit(count - ARTICLE_LIMIT)
          .reverse()
          .delete();
      }
    });
  }

  /**
   * @function
   * @returns {Article} either the first one with the least views
   * or the default article @see {DefaultArticle}
   */
  function getNotFoundArticle() {
    return db.articles.orderBy('views')
      .first(article => article ?
             article : defaultArticle.getDefaultArticle());
  }

  /**
   * @function
   * Updates the number of views and sets the url for the article
   * @param {Article} article - the article to update
   * @returns {Article} the updated article
   */
  function updateArticle(article) {
    if (article && article.hasOwnProperty('pageid')) {
      article.views = article.views + 1;
      db.articles.put(article);
      article.url = 'https://' + language() + '.wikipedia.org/wiki/' +
        encodeURIComponent(article.title);
      defaultArticle.setDefaultArticle(article);
    }
    return Promise.resolve(article);
  }

  /**
   * @function
   * @returns an {Article} that either is the:
   * - first with 0 views in db;
   * - first in a list of newly fetched articles
   * - default article
   */
  function findArticle() {
    return db.articles.where('views').belowOrEqual(0)
      .first(article => article ? article : categories.getRandomCategory()
             .then(category => fetchArticles(category))
             .then(articles => articles[0])
             .catch(() => getNotFoundArticle()));
  }

  /**
   * @param metaCategory - the meta category to filter by
   * @returns an {Article} that either is the:
   * - first with 0 views and metaCategory in db;
   * - first in a list of newly fetched articles with  metaCategory
   * - default article
   */
  function findArticleWithMetaCategory(metaCategory) {
    return db.articles.where('views').belowOrEqual(0)
      .and(article => article.category === metaCategory)
      .first(article => article ? article :
             categories.metaCategoryHasUnfetched(metaCategory)
             .then(() => categories.getRandomCategoryWithMetacategory(metaCategory))
             .then(category => fetchArticles(category))
             .then(articles => articles[0]))
             .catch(() => findArticle());
  }

  /**
   * @function
   * @returns an {Article} with 0 views and a random meta category
   */
  this.getArticle = () => categories.loadData()
    .then(() => categories.getRandomMetaCategory())
    .then(metaCategory => findArticleWithMetaCategory(metaCategory))
    .catch(() => findArticle())
    .then(article => updateArticle(article));
};
