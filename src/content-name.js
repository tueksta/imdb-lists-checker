(() => {
  const { api, config, collectRows, markRows } = globalThis.IWC;
  let timer = null;

  async function scan() {
    const entries = collectRows(document, config);
    if (!entries.length) return;
    const matches = await api.runtime.sendMessage({ type: 'has', ids: [...new Set(entries.map((e) => e.id))] });
    markRows(entries, matches ?? {}, document);
  }

  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(scan, 200);
  };

  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  schedule();
})();
