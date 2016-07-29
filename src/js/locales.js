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
 * @module locales
 * @class
 * @classdesc Fetches the available locales file and stores the current language
 *
 * @constructor
 */
module.exports = function Locales() {
  'use strict';

  const getLocalUrl = new (require('./url'))().getLocalUrl,
        storage = new (require('./storage'))('LOCALES', {language: 'en'});
  let locales = null;

  this.fetchLocales = () => {
    if (locales) {
      return Promise.resolve();
    }
    return fetch(getLocalUrl('../locales.json'))
      .then(response => response.json())
      .then(content => {
        locales = content;
        return Promise.resolve();
      });
  };

  /**
   * @function
   * Gets the message for the given key. Make sure to call fetchLocales before
   * first call.
   * @param key {string} - locale message key
   * @returns {string} the locales message for current language if available,
   * otherwise the english message
   */
  this.message = (key) => {
    const language = storage.get('language');
    if (locales[language] && locales[language][key]) {
      return locales[language][key];
    }
    return locales.en[key];
  };

  this.language = () => storage.get('language');

  /**
   * @function
   * @returns {array} of locale codes with their specific language translations
   */
  this.getLanguageTranslations = () => {
    const translations = [];
    for (let locale in locales) {
      const translation = locales[locale].hasOwnProperty('language_translation') ?
            locales[locale].language_translation : locale;
      translations.push({language: locale, translation: translation});
    }
    return translations;
  };

  this.changeLanguage = (newLanguage) => {
    if (newLanguage !== storage.get('language')) {
      storage.set({language: newLanguage});
    }
  };
};
