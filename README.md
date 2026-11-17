# IMDb Lists Checker

Browser extension for Chrome that adds a ribbon with a checkmark ✓ over each film poster on an IMDb person page (`/name/nm…`) when that film is on one of your IMDb lists. A film on several lists gets one ribbon per list, each in that list's color.

## Install (unpacked)

- **Chrome:** `chrome://extensions` → Developer mode → Load unpacked → select this folder.

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
