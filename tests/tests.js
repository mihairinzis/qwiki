var fs = require('fs'),
    assert = require('chai').assert,
    expect = require('chai').expect,
    fetch = require('node-fetch'),
    locales = JSON.parse(fs.readFileSync('src/locales.json').toString());

function getCategoriesFromFile(locale) {
  var localePath = 'src/wikidata/' + locale + '.json';
  try {
    var stats = fs.statSync(localePath);
    return JSON.parse(fs.readFileSync(localePath).toString());
  } catch(e) {
    // locale file does not exist
  }
  return null;
}

describe("Categories are unique", function() {
  function checkCategories(categoryJson) {
    it(locale + " parsed correctly", function() {
      assert.isNotNull(categoryJson);
    });

    it(locale + " has mandatory fields", function() {
      expect(categoryJson).to.have.all.keys(
        'ignore_titles_containing', 'ignore_contents_containing', 'categories'
      );
    });

    it(locale + " has meta categories", function() {
      expect(Object.keys(categoryJson.categories)).to.have.length.above(0);
    });

    it(locale + " has unique categories", function() {
      var categories = [];
      for (var metaCategory in categoryJson.categories) {
        expect(Object.keys(categoryJson.categories[metaCategory])).to.have.length.above(0);
        categoryJson.categories[metaCategory].forEach(function (category) {
          expect(categories).to.not.include(category);
          categories.push(category);
        });
      }
    });
  }

  for (var locale in locales) {
    var categoryJson = getCategoriesFromFile(locale);
    if (categoryJson) {
      checkCategories(categoryJson);
    }
  }
});

// skipped as these tests should be run rarely
describe.skip("Categories have articles", function() {
  function checkArticles(categoriesUrl, chunkNumber) {
    it("checking at " + chunkNumber, function(done) {
      this.timeout(10000);
      return fetch(categoriesUrl)
        .then(function(res) {
          return res.json();
        }).then(function(categories) {
          if('query' in categories && 'pages' in categories.query) {
            for (var categNumber in categories.query.pages) {
              var category = categories.query.pages[categNumber];
              try {
                expect(category.categoryinfo.pages).to.be.above(
                  0, category.title + ' has no pages'
                );
              } catch(err) {
                console.log(err.message);
              }
            }
          }
          done();
        });
    });
  }

  for (var locale in locales) {
    var categoryJson = getCategoriesFromFile(locale),
        categoryTitles = [];
    if (categoryJson) {
      for (var metaCategory in categoryJson.categories) {
        categoryJson.categories[metaCategory].forEach(function (category) {
          categoryTitles.push(category);
        });
      }
      for (i=0, j=categoryTitles.length; i<j; i+=50) {
        link = 'https://' + locale
          + '.wikimpedia.org/w/api.php?action=query&format=json&prop=categoryinfo&titles=Category:'
          + categoryTitles.slice(i,i+50).join('|Category:');
        checkArticles(link, i+50);
      }
    }
  }
});
