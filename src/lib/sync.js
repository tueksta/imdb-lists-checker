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

async function runSync(fetchFn, store, now) {
  const { parseListItemsPage } = _deps;
  try {
    const { selectedListId, lists } = await store.getState();
    if (!selectedListId) return 'no-list';

    const pageUrl = (n) =>
      `https://www.imdb.com/list/${selectedListId}/?view=compact${n > 1 ? `&page=${n}` : ''}`;

    const first = await fetchFn(pageUrl(1), { credentials: 'include' });
    if (isSignInUrl(first.url)) {
      await store.recordError('signed-out', now);
      return 'signed-out';
    }
    assertImdbUrl(first.url);

    const seen = new Set();
    const ids = [];
    let page = parseListItemsPage(first.ok ? await first.text() : '');
    for (let n = 2; ; n++) {
      if (!page.ok) throw new Error('unparseable list page');
      const fresh = page.ids.filter((id) => !seen.has(id));
      fresh.forEach((id) => seen.add(id));
      ids.push(...fresh);
      if (!page.hasNext || fresh.length === 0 || n > MAX_PAGES) break;
      const next = await fetchFn(pageUrl(n), { credentials: 'include' });
      assertImdbUrl(next.url);
      page = parseListItemsPage(next.ok ? await next.text() : '');
    }

    await store.replaceAll(ids, now);
    const expected = lists.find((l) => l.id === selectedListId)?.count;
    if (expected && ids.length < expected) {
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