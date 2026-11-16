const LIST_TITLE_ID = /^tt\d+$/;
const idOf = (edge) => edge?.listItem?.id ?? edge?.node?.title?.id ?? '';

const findSearch = (node, depth = 0) => {
  if (!node || typeof node !== 'object' || depth > 12) return null;
  if (Array.isArray(node.titleListItemSearch?.edges)) return node.titleListItemSearch;
  for (const child of Object.values(node)) {
    const found = findSearch(child, depth + 1);
    if (found) return found;
  }
  return null;
};

function parseWatchlistPage(html) {
  const failed = { ok: false, ids: [], hasNext: false };
  const match = /<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s.exec(String(html ?? ''));
  if (!match) return failed;
  let search;
  try {
    search = findSearch(JSON.parse(match[1]));
  } catch {
    return failed;
  }
  if (!search) return failed;
  const ids = search.edges.map(idOf);
  if (!ids.every((id) => LIST_TITLE_ID.test(id))) return failed;
  return { ok: true, ids, hasNext: search.pageInfo?.hasNextPage === true };
}

if (typeof module !== 'undefined') module.exports = { parseWatchlistPage };
else (globalThis.IWC ??= {}).parseWatchlistPage = parseWatchlistPage;