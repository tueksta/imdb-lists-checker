const _titleIdFromHref = typeof module !== 'undefined'
  ? require('./extract-ids.js').titleIdFromHref
  : globalThis.IWC.titleIdFromHref;

const SVG_NS = 'http://www.w3.org/2000/svg';

const RIBBON_SVG = ['svg', { width: '18', height: '26', viewBox: '0 0 18 26', 'aria-hidden': 'true' }, [
  ['polygon', { points: '0 0 18 0 18 24 9 19 0 24', fill: '#2e9e4f' }],
  ['path', { d: 'M4.5 8.5 8 12 13.5 5.5', fill: 'none', stroke: '#fff', 'stroke-width': '2' }],
]];

const _createRibbon = typeof module !== 'undefined'
  ? require('./ribbon.js').createRibbon
  : globalThis.IWC.createRibbon;

function svgNode(doc, [tag, attrs, children = []]) {
  const node = doc.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
  for (const child of children) node.appendChild(svgNode(doc, child));
  return node;
}

function collectRows(root, cfg) {
  const entries = [];
  const idOf = (el) => {
    const link = el.querySelector(cfg.titleLinkSelector);
    return link && _titleIdFromHref(link.getAttribute('href'));
  };

  for (const el of root.querySelectorAll(cfg.personRowSelector)) {
    if (el.hasAttribute('data-iwc')) continue;
    const id = idOf(el);
    if (id) entries.push({ el, id, host: el.querySelector(cfg.posterSelector) ?? el });
  }

  // Grid tiles: posters that are not part of a list row.
  for (const poster of root.querySelectorAll(cfg.posterSelector)) {
    if (poster.hasAttribute('data-iwc') || poster.closest(cfg.personRowSelector)) continue;
    const id = idOf(poster);
    if (id) entries.push({ el: poster, id, host: poster });
  }
  return entries;
}

// matches: { [titleId]: [{ id, name, color }, ...] }
function markRows(entries, matches, doc) {
  let added = 0;
  for (const { el, id, host } of entries) {
    el.setAttribute('data-iwc', '');
    const hits = matches[id];
    if (!hits?.length) continue;
    host.classList.add('iwc-host');
    hits.forEach(({ id: listId, name, color }, i) => {
      if (!/^ls\d+$/.test(listId)) return;
      const mark = doc.createElement('a');
      mark.className = 'iwc-check';
      mark.href = `/list/${listId}/`;
      mark.title = `On list: ${name}`;
      mark.setAttribute('aria-label', `Open list: ${name}`);
      mark.style.setProperty('--iwc-i', String(i));
      mark.appendChild(_createRibbon(doc, { color }));
      host.appendChild(mark);
      added++;
    });
  }
  return added;
}

if (typeof module !== 'undefined') module.exports = { collectRows, markRows };
else Object.assign((globalThis.IWC ??= {}), { collectRows, markRows });
