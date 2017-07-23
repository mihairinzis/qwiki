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
 * @module options-page
 * Options content page
 */
(function() {
  'use strict';

  const createElement = require('./element'),
        options = window.chrome.extension.getBackgroundPage().background.getOptions(),
        optionsDiv = document.body.appendChild(createElement({
          tagName: 'div',
          attributes: {'id': 'qwiki-options'}
        })),
        slidersDiv = document.body.appendChild(createElement({
          tagName: 'div',
          attributes: {'id': 'qwiki-sliders'}
        }));
  let message = null;

  function displayOptions() {
    if (options) {
      options.locales.fetchLocales().then(() => {
        message = options.locales.message;
        optionsDiv.innerHTML = '';
        slidersDiv.innerHTML = '';
        showLanguages(
          options.locales.getLanguageTranslations(),
          options.locales.language()
        );
        showEnablers();
        showAlignment();
        options.categories.getMetaCategories()
          .then(metaCategories => {
            reloadSliders(metaCategories);
          });
      });
    } else {
      document.body.innerHTML = '<p>Options are sad</p>';
    }
  }

  function showLanguages(translations, language) {
    const option = optionsDiv.appendChild(createElement({
      tagName: 'div',
      className: 'qwiki-option'
    }));
    option.appendChild(createElement({
      tagName: 'label',
      className: 'qwiki-option-label',
      attributes: {'for': 'language-select'},
      text: message('language')
    }));
    let select = option.appendChild(createElement({
      tagName: 'select',
      className: 'qwiki-select',
      attributes: {'id': 'language-select'}
    }));
    translations.forEach((locale) => {
      const langOpt = select.appendChild(createElement({
        tagName: 'option',
        attributes: {'value': locale.language},
        text: locale.translation
      }));
      if (locale.language === language) {
        langOpt.selected = true;
      }
    });
    select.addEventListener('change', function() {
      options.changeLanguage(this.value).then(() => {
        displayOptions();
      });
    });
  }

  function createCheckbox(checkboxId, labelText) {
    const option = optionsDiv.appendChild(createElement({
      tagName: 'div',
      className: 'qwiki-option'
    }));
    const label = option.appendChild(createElement({
      tagName: 'label',
      attributes: {'for': checkboxId},
      text: labelText
    }));
    const checkbox = option.appendChild(createElement({
      tagName: 'input',
      attributes: {
        'id': checkboxId,
        'type': 'checkbox'
      }
    }));
    return {label: label, checkbox: checkbox};
  }

  function showEnablers() {
    const enabledForNewTab = createCheckbox(
      'enabled-for-new-tab', message('enabled_for_newtab')
    );
    enabledForNewTab.checkbox.checked = options.sites.isShowForNewTabOnly();
    enabledForNewTab.checkbox.addEventListener('change', () => {
      options.sites.showForNewTabOnly(enabledForNewTab.checkbox.checked);
      displayOptions();
    });
    const enabledForSite = createCheckbox(
      'enabled-for-site', message('enabled_for_site')
    );
    options.sites.getCurrentSite().then((site) => {
      enabledForSite.checkbox.checked = site.isEnabled();
      if (enabledForNewTab.checkbox.checked) {
        enabledForSite.checkbox.disabled = true;
        enabledForSite.label.className = 'disabled';
      }
      enabledForSite.checkbox.addEventListener('change', () => {
        if (site.isEnabled()) {
          site.disable();
        } else {
          site.enable();
        }
      });
    }).catch(() => {
      // no active tab, ignore
    });
    const showPicturesInNewTab = createCheckbox(
      'show-pictures-in-new-tab', message('pictures_in_newtab')
    );
    showPicturesInNewTab.checkbox.checked = options.getShowPicturesInNewTab();
    showPicturesInNewTab.checkbox.addEventListener('change', () => {
       options.setShowPicturesInNewTab(showPicturesInNewTab.checkbox.checked);
    });
  }

  function showAlignment() {
    const option = optionsDiv.appendChild(createElement({
      tagName: 'div',
      className: 'qwiki-option'
    }));
    option.appendChild(createElement({
      tagName: 'label',
      className: 'qwiki-option-label',
      attributes: {'for': 'alignment-select'},
      text: message('alignment')
    }));
    const select = option.appendChild(createElement({
      tagName: 'select',
      className: 'qwiki-select',
      attributes: {'id': 'alignment-select'}
    }));
    for (let alignment in options.ALIGN) {
      const alOpt = select.appendChild(createElement({
        tagName: 'option',
        attributes: {'value': options.ALIGN[alignment]},
        text: message([options.ALIGN[alignment]])
      }));
      if (options.ALIGN[alignment] === options.getAlignment()) {
        alOpt.selected = true;
      }
    }
    select.addEventListener('change', function() {
      options.setAlignment(this.value);
    });
  }

  function reloadSliders(metaCategories) {
    function sliderChanged() {
      function getSlidersSum() {
        let sum = 0;
        for (let metaCategory in metaCategories) {
          sum += metaCategories[metaCategory];
        }
        return sum;
      }
      metaCategories[this.id] = parseInt(this.value, 10);
      while (getSlidersSum() !== 100) {
        for (let metaCategory in metaCategories) {
          if (metaCategory !== this.id) {
            let slider = document.getElementById(metaCategory);
            if (getSlidersSum() > 100 && metaCategories[metaCategory] > 0) {
              metaCategories[metaCategory] -= 1;
            }
            if (getSlidersSum() < 100 && metaCategories[metaCategory] < 100) {
              metaCategories[metaCategory] += 1;
            }
            slider.value = metaCategories[metaCategory];
          }
        }
      }
      options.categories.setMetaCategories(metaCategories);
    }

    if (Object.keys(metaCategories).length > 1) {
      for (let metaCategory in metaCategories) {
        slidersDiv.appendChild(createElement({
          tagName: 'label', className: 'qwiki-slider-label',
          attributes: {'for': metaCategory},
          text: metaCategory
        }));
        let slider = slidersDiv.appendChild(createElement({
          tagName: 'input',
          className: 'qwiki-slider-input',
          value: metaCategories[metaCategory],
          attributes: {
            id: metaCategory,
            type: 'range'
          }
        }));
        slider.addEventListener('change', sliderChanged);
      }
    }
  }

  displayOptions();
}());
