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
 * @module element
 * @function
 * @returns a new html element
 * @param options {Object} - options for element
 */
module.exports = function(options) {
  'use strict';

  if (!options.tagName) {
    return null;
  }
  const el = document.createElement(options.tagName);
  if (typeof options.className !== 'undefined') {
    el.className = options.className;
  }
  if (typeof options.attributes !== 'undefined') {
    for (let att in options.attributes) {
      el.setAttribute(att, options.attributes[att]);
    }
  }
  if (typeof options.html !== 'undefined') {
    el.innerHTML = options.html;
  }
  if (typeof options.text !== 'undefined') {
    el.appendChild(document.createTextNode(options.text));
  }
  if (typeof options.value !== 'undefined') {
    el.value = options.value;
  }
  return el;
};
