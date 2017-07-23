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
 * @classdesc Finds unseen articles and fetches new ones
 * @param language {function}
 * @param categories {Categories}
 * @param category {Category} - the category details to fetch for
 *
 * @constructor
 */
module.exports = function ArticleFetcher(language, categories, category) {
  'use strict';

  const ARTICLE_CONTENT_LIMIT = 1700,
        params = {
          format: 'json',
          action: 'query',
          prop: 'extracts|pageimages',
          exlimit: 'max',
          exintro: '',
          piprop:'original',
          pilimit: 'max',
          generator: category === categories.RANDOM_CATEGORY ?
            'random' : 'categorymembers'
        };

  if (category === categories.RANDOM_CATEGORY) {
    params.grnnamespace = '0';
    params.grnlimit = '20';
  } else {
    params.gcmtitle = 'Category:' + category.title;
    params.gcmnamespace = '0';
    params.gcmlimit = '20';
    params.gcmcontinue = category.cmcont || '';
    params.continue =  category.cont || '';
  }

  /**
   * @function
   * @returns the joined params with the wikipedia link to get the api call url
   */
  function url() {
    return 'https://' + language() + '.wikipedia.org/w/api.php?' +
      Object.keys(params)
      .map(key => encodeURIComponent(key) + '=' +
           encodeURIComponent(params[key])).join('&');
  }

  function getValidArticle(jsonArticle, badTitles, badContents) {
    function containsBadWords(text, badList) {
      return badList.map(word => word.toLowerCase())
        .some(badWord => text.toLowerCase().indexOf(badWord) >= 0);
    }

    function getContent(extract) {
      const wrapper = document.createElement('wrapper');
      wrapper.innerHTML = extract;
      const content = document.createElement('content');
      for (let i = 0; i < wrapper.childNodes.length; ++i) {
        if (content.textContent.length +
            wrapper.childNodes[i].textContent.length < ARTICLE_CONTENT_LIMIT) {
          if (wrapper.childNodes[i].textContent.trim().length > 0) {
            content.appendChild(wrapper.childNodes[i]);
          }
        } else {
          return content;
        }
      }
      return content;
    }

    if (!('pageid' in jsonArticle) || !('title' in jsonArticle) ||
        !('extract' in jsonArticle) || jsonArticle.extract.length < 350 ||
        jsonArticle.ns !== 0 || containsBadWords(jsonArticle.title, badTitles) ||
        containsBadWords(jsonArticle.extract, badContents)) {
      return null;
    }

    const articleContent = getContent(jsonArticle.extract);
    return articleContent.innerHTML.length > 0 ? {
      pageid: parseInt(jsonArticle.pageid, 10),
      content: articleContent.innerHTML,
      category: category.metacategory,
      title: jsonArticle.title,
      imageurl: jsonArticle.original ? jsonArticle.original.source : null,
      views: 0
    } : null;
  }

  /**
   * @function
   * @returns {array} of validated {Article} from json
   * @param json {Object} - containing wikipedia article extracts
   */
  function extractArticles(json) {
    const fetchedArticles = [];
    if ('query' in json && 'pages' in json.query) {
      for (let pageid in json.query.pages) {
        if (json.query.pages.hasOwnProperty(pageid)) {
          const article = getValidArticle(json.query.pages[pageid],
                                          categories.ignoreTitles(),
                                          categories.ignoreContents());
          if (article) {
            fetchedArticles.push(article);
          }
        }
      }
      if ('continue' in json && 'gcmcontinue' in json.continue &&
          'continue' in json.continue) {
        category.gcmcontinue = json.continue.gcmcontinue;
        category.continue = json.continue.continue;
      } else {
        category.gcmcontinue = '';
        category.continue = '';
        category.views += 1;
      }
    }
    return fetchedArticles;
  }

  /**
   * @function
   * Fetches articles using the given language and category data
   * @returns {array} of fetched {Article}
   */
  this.fetchArticles = () => fetch(url())
    .then(response => response.json())
    .then(content => extractArticles(content));
};
