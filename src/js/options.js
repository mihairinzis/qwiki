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
 * @module options
 * @class
 * @classdesc Exposes and stores letious settings
 * @param locales {Locales}
 * @param categories {Categories}
 * @param sites {Sites}
 * @param changeLanguage {function} - changes current language
 * @constructor
 */
module.exports = function Options(locales, categories, sites, changeLanguage) {
  'use strict';

  /**
   * Enum alignment
   * @readonly
   * @enum {string}
   */
  this.ALIGN = {
    LEFT: 'left',
    MIDDLE: 'middle',
    RIGHT: 'right'
  };

  const storage = new (require('./storage'))('OPTIONS', {
    extensionVersion: 0,
    alignment: this.ALIGN.RIGHT
  });

  this.getExtensionVersion = () => storage.get('extensionVersion');

  this.setExtensionVersion = (newVersion) => {
    storage.set({extensionVersion: newVersion});
  };

  this.categories = categories;
  this.changeLanguage = changeLanguage;
  this.sites = sites;
  this.locales = locales;
  this.getAlignment = () => storage.get('alignment');
  this.setAlignment = (alignment) => {
    storage.set({alignment: alignment});
  };
};
