const _ribbonPalette = typeof module !== 'undefined'
  ? require('../config.js').colors
  : globalThis.IWC.config.colors;

const RIBBON_NS = 'http://www.w3.org/2000/svg';

// Always drawn in an 18x26 viewBox, so any width and height scale it.
function createRibbon(doc, { width = 18, height = 26, color } = {}) {
  const { fill, check } = _ribbonPalette[color] ?? Object.values(_ribbonPalette)[0];
  const el = (tag, attrs) => {
    const node = doc.createElementNS(RIBBON_NS, tag);
    for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
    return node;
  };
  const svg = el('svg', { width, height, viewBox: '0 0 18 26', 'aria-hidden': 'true' });
  svg.append(
    el('polygon', { points: '0 0 18 0 18 24 9 19 0 24', fill }),
    el('path', { d: 'M4.5 8.5 8 12 13.5 5.5', fill: 'none', stroke: check, 'stroke-width': '2.5' }),
  );
  return svg;
}

if (typeof module !== 'undefined') module.exports = { createRibbon };
else (globalThis.IWC ??= {}).createRibbon = createRibbon;