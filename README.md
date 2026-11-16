# IMDb List Checker

Browser extension (Chrome, Edge, Firefox) that adds a ribbon with a checkmark ✓ over each film poster on an IMDb person page (`/name/nm…`) when that film is on one of your IMDb lists. A film on several lists gets one ribbon per list, each in that list's color.

## Install (unpacked)

- **Chrome:** `chrome://extensions` → Developer mode → Load unpacked → select this folder.
- **Edge:** `edge://extensions` → Developer mode → Load unpacked → select this folder.
- **Firefox:** `about:debugging#/runtime/this-firefox` → Load Temporary Add-on → select `manifest.json`.
- **Safari:** see [docs/safari.md](docs/safari.md).

Firefox treats host permissions as optional: after installing, grant "Access your data for imdb.com" in the add-on's Permissions tab.

Stay signed in to IMDb. The extension syncs on install, on browser startup, every 6 hours, and from the popup's "Sync now".

## Usage

Open the extension popup to see all your IMDb lists with the number of titles synced (`synced/total`). Click the ribbon in front of a list to cycle its color through eight color schemes. Person pages use that color for every film on that list. Hover a ribbon on a person page to see which list it stands for.

Color changes show up when you reload an already open IMDb tab.

## How it works

- The background worker reads your profile's lists page with your existing IMDb session, then reads every list and caches the title IDs per list in `storage.local`. Requests to IMDb are paced: a short pause after every few requests.
- Person pages ask the worker which of the visible titles are on which lists and insert one ribbon per matching list. Lookups use the cache only and make no requests.
- List colors are stored locally, one per list.

## Permissions and privacy

`storage` and `alarms` for the cache and schedule; `https://www.imdb.com/*` to read your lists and decorate pages. Nothing leaves your browser, there are no other network calls, and the extension never modifies your lists.

Full policy: [PRIVACY.md](PRIVACY.md).

## Fragility

This relies on IMDb's page markup and embedded page data, which are not a public API. If IMDb changes them, the popup shows "Last sync failed" (the old cache is kept) or checkmarks stop appearing. Selectors live in `src/config.js`; the parsers are `src/lib/parse-lists.js` (your lists page) and `src/lib/parse-list-items.js` (the titles of one list).

Lists that contain no titles (for example lists of people or images) cannot be parsed and show up as `0/N` in the popup.

## Development

```
npm test         # unit tests
npm run package  # dist/chrome.zip (Chrome, Edge) and dist/firefox.zip
npm run lint     # package, then run Mozilla's validator on the Firefox build
```

## Merging and releasing

Work on a branch and merge to `main` through a pull request:

```
git switch -c my-change
# commit, then
git push -u origin my-change
gh pr create --fill
```

Before merging, run `npm test` and `npm run lint` and check the change in a browser (see [docs/manual-test-checklist.md](docs/manual-test-checklist.md)). Squash-merge, then update your local `main`:

```
gh pr merge --squash --delete-branch
git switch main && git pull
```

Merging does not publish anything. To release what is on `main`:

1. Bump `version` in `manifest.json` (semver; every store rejects a version it has already received), commit and merge it like any other change.
2. Tag the merged commit with the same version and push the tag:
   ```
   git switch main && git pull
   git tag v0.2.0
   git push origin v0.2.0
   ```
3. The **Release** workflow (Actions tab) tests, packages, creates a GitHub Release with both zips, and submits to the Chrome Web Store, Microsoft Edge Add-ons and Firefox Add-ons. It fails if the tag and manifest version differ.
4. Each store reviews the submission (hours to days). If a store job fails, fix the cause and use *Re-run failed jobs*; a store that already accepted the version will reject a second upload of it.

Store accounts, API keys and the repository secrets the workflow needs are covered in [docs/publishing.md](docs/publishing.md).