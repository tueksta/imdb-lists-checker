const ROW_MARKER = 'data-testid="user-ll-item"';
const NAME_CLASS = /class="[^"]*\bipc-metadata-list-summary-item__t\b/;

const decodeEntities = (s) => s
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'")
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&amp;/g, '&');

function parseRow(chunk) {
  for (const [, attrs, text] of chunk.matchAll(/<a\b([^>]*)>([^<]*)<\/a>/g)) {
    if (!NAME_CLASS.test(attrs)) continue;
    const id = /href="[^"]*?\/list\/(ls\d+)/.exec(attrs)?.[1];
    if (!id) continue;
    const meta = /ipc-metadata-list-summary-item__tl[^>]*>(.*?)<\/ul>/s.exec(chunk)?.[1] ?? '';
    const digits = /\d[\d.,]*/.exec(meta.replace(/<[^>]*>/g, ' '))?.[0] ?? '';
    const count = digits ? Number(digits.replace(/\D/g, '')) : null;
    return { id, name: decodeEntities(text.trim()), count };
  }
  return null;
}

function parseListsPage(html) {
  const failed = { ok: false, lists: [] };
  const chunks = String(html ?? '').split(ROW_MARKER).slice(1);
  if (!chunks.length) return failed;
  const seen = new Set();
  const lists = [];
  for (const chunk of chunks) {
    const row = parseRow(chunk);
    if (row && !seen.has(row.id)) {
      seen.add(row.id);
      lists.push(row);
    }
  }
  return lists.length ? { ok: true, lists } : failed;
}

if (typeof module !== 'undefined') module.exports = { parseListsPage };
else (globalThis.IWC ??= {}).parseListsPage = parseListsPage;