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
 * @module storage
 * @class
 * @classdesc Utility that reads and writes to local storage
 * @param localStorageItem {string} - the local storage item key
 * @param fields {Object} - the fields and their defaults to save on creation
 * @constructor
 */
module.exports = function Storage(localStorageItem, fields) {
  'use strict';

  const stored = JSON.parse(localStorage.getItem(localStorageItem));
  let storage = {};

  if (stored) {
    storage = stored;
  } else {
    addToStorage(fields);
  }

  function addToStorage(newFields) {
    for (let fieldKey in newFields) {
      storage[fieldKey] = newFields[fieldKey];
    }
  }

  this.persist = () => {
    if (Object.keys(storage).length) {
      localStorage.setItem(localStorageItem, JSON.stringify(storage));
    }
  };

  this.set = (newFields) => {
    addToStorage(newFields);
    this.persist();
  };

  this.get = (key) => storage[key];
};
