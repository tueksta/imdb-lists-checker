const config = {
  syncIntervalMinutes: 360,
  profileUrl: 'https://www.imdb.com/profile',
  listsPath: 'lists/',
  personRowSelector: 'li.ipc-metadata-list-summary-item',
  titleLinkSelector: [
    'a.ipc-metadata-list-summary-item__t[href*="/title/tt"]',
    'a.ipc-title-link-wrapper[href*="/title/tt"]',
    'a.ipc-lockup-overlay[href*="/title/tt"]',
  ].join(', '),
  posterSelector: '.ipc-poster',
  colors: {
    green: { fill: '#2e9e4f', check: '#ffffff' },
    yellow: { fill: '#f5c518', check: '#14803c' },
    blue: { fill: '#2f7de1', check: '#ffffff' },
    red: { fill: '#d93a3a', check: '#ffffff' },
    purple: { fill: '#8e4ec6', check: '#ffffff' },
    orange: { fill: '#f08a24', check: '#000000' },
    pink: { fill: '#e8559a', check: '#ffffff' },
    gray: { fill: '#8a8f98', check: '#ffffff' },
  },
};

if (typeof module !== 'undefined') module.exports = config;
else (globalThis.IWC ??= {}).config = config;