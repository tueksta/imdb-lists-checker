const test = require('node:test');
const assert = require('node:assert');
const { parseListItemsPage } = require('../src/lib/parse-list-items.js');
const { watchlistHtml } = require('./helpers/pages.js');

test('parseListItemsPage_validPage_returnsIdsAndHasNext', () => {
  assert.deepStrictEqual(parseListItemsPage(watchlistHtml(['tt1', 'tt22'], true)), { ok: true, ids: ['tt1', 'tt22'], hasNext: true });
});

test('parseListItemsPage_emptyList_okWithNoIds', () => {
  assert.deepStrictEqual(parseListItemsPage(watchlistHtml([], false)), { ok: true, ids: [], hasNext: false });
});

test('parseListItemsPage_signInHtml_notOk', () => {
  assert.strictEqual(parseListItemsPage('<html><body>Sign in</body></html>').ok, false);
});

test('parseListItemsPage_emptyString_notOk', () => {
  assert.strictEqual(parseListItemsPage('').ok, false);
});

test('parseListItemsPage_nonTitleId_notOk', () => {
  assert.strictEqual(parseListItemsPage(watchlistHtml(['nm0000354'], false)).ok, false);
});

test('parseListItemsPage_malformedJson_notOk', () => {
  assert.strictEqual(parseListItemsPage('<script id="__NEXT_DATA__" type="application/json">{oops</script>').ok, false);
});
