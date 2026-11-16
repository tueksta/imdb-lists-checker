const MAX_PAGES = 100;

const _deps = typeof module !== 'undefined'
  ? {
      config: require('../config.js'),
      parseListItemsPage: require('./parse-list-items.js').parseListItemsPage,
      parseListsPage: require('./parse-lists.js').parseListsPage,
    }
  : {
      config: globalThis.IWC.config,
      parseListItemsPage: globalThis.IWC.parseListItemsPage,
      parseListsPage: globalThis.IWC.parseListsPage,
    };

const assertImdbUrl = (url) => {
  const { protocol, hostname } = new URL(url);
  if (protocol !== 'https:' || hostname !== 'www.imdb.com') throw new Error('unexpected origin');
};

const isSignInUrl = (url) => /\/(ap\/signin|registration\/signin|signin)/i.test(url);

async function refreshLists(fetchFn, store) {
  const { config, parseListsPage } = _deps;
  const profile = await fetchFn(config.profileUrl, { credentials: 'include' });
  if (isSignInUrl(profile.url)) return 'signed-out';
  assertImdbUrl(profile.url);
  const userId = new URL(profile.url).pathname.match(/^\/user\/([^/]+)/)?.[1];
  if (!userId) throw new Error('could not resolve user id');

  const res = await fetchFn(`https://www.imdb.com/user/${userId}/${config.listsPath}`, { credentials: 'include' });
  if (isSignInUrl(res.url)) return 'signed-out';
  assertImdbUrl(res.url);
  const parsed = parseListsPage(res.ok ? await res.text() : '');
  if (!parsed.ok) throw new Error('unparseable lists page');
  await store.setLists(parsed.lists);
  return 'ok';
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Returns the title ids of one list, or null if IMDb redirected to a sign-in page.
async function fetchListIds(get, parsePage, listId) {
  const url = (n) => `https://www.imdb.com/list/${listId}/?view=compact${n > 1 ? `&page=${n}` : ''}`;
  const seen = new Set();
  const ids = [];
  for (let n = 1; n <= MAX_PAGES; n++) {
    const res = await get(url(n), { credentials: 'include' });
    if (isSignInUrl(res.url)) return null;
    assertImdbUrl(res.url);
    const page = parsePage(res.ok ? await res.text() : '');
    if (!page.ok) throw new Error(`unparseable list page (${listId})`);
    const fresh = page.ids.filter((id) => !seen.has(id));
    fresh.forEach((id) => seen.add(id));
    ids.push(...fresh);
    if (!page.hasNext || fresh.length === 0) break;
  }
  return ids;
}

async function runSync(fetchFn, store, now) {
  const { parseListItemsPage } = _deps;

  // Pause 1.5 s after every 5 requests to IMDb.
  let requests = 0;
  const get = async (...args) => {
    if (requests > 0 && requests % 5 === 0) await sleep(1500);
    requests++;
    return fetchFn(...args);
  };

  try {
    if ((await refreshLists(get, store)) === 'signed-out') {
      await store.recordError('signed-out', now);
      return 'signed-out';
    }
    const { lists } = await store.getState();
    const idsByList = {};
    let partial = false;
    for (const { id, count } of lists) {
      try {
        const ids = await fetchListIds(get, parseListItemsPage, id);
        if (!ids) {
          await store.recordError('signed-out', now);
          return 'signed-out';
        }
        idsByList[id] = ids;
        if (count && ids.length < count) partial = true;
      } catch (error) {
        console.warn(`Skipping list ${id}`, error);
        partial = true;
      }
    }
    await store.replaceAll(idsByList, now);
    if (partial) {
      await store.recordError('partial', now);
      return 'partial';
    }
    return 'ok';
  } catch (error) {
    console.error('List sync failed', error);
    await store.recordError('failed', now);
    return 'failed';
  }
}

if (typeof module !== 'undefined') module.exports = { runSync, refreshLists };
else Object.assign((globalThis.IWC ??= {}), { runSync, refreshLists });