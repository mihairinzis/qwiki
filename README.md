qwiki
=============

A browser extension that shows nonintrusive Wikipedia snippets on the new tab and/or any other page.

## Building

- Make sure you have npm (https://nodejs.org/) installed
- Use npm to fetch the dependencies and build the dist version.

```bash
npm install && npm run build_chrome
```

- The unpacked Google Chrome(ium) extension is built in *dist/chrome-qwiki*

## Google Chrome installation

- Go to Settings -> **Extensions**
- Check **Developer mode**
- Hit **Load unpacked extension**
- Pick the qwiki/dist/chrome-qwiki directory.

## Testing

- There are a few tests that validate all article category json files
(mostly check if there are no duplicates). To run them use:

``` bash
npm run test
```

## License
- This program is released under the GNU General Public License. Check [LICENSE](LICENSE) for more info.
- The included [font](src/fonts/Lato-Light.woff) is released under the [SIL Open Font License 1.1.](http://scripts.sil.org/OFL). Read more about it at [latofonts.com](http://www.latofonts.com/).
