const config = {
  syncIntervalMinutes: 360,
  profileUrl: 'https://www.imdb.com/profile',
  listsPath: 'lists/',
  personRowSelector: 'li.ipc-metadata-list-summary-item',
  titleLinkSelector: 'a.ipc-metadata-list-summary-item__t[href*="/title/tt"]',
  posterSelector: '.ipc-poster',
};

if (typeof module !== 'undefined') module.exports = config;
else (globalThis.IWC ??= {}).config = config;