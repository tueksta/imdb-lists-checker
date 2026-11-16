(() => {
  const { api, createRibbon } = globalThis.IWC;
  const $ = (id) => document.getElementById(id);
  const when = (ts) => (ts ? new Date(ts).toLocaleString() : 'never');
  const messages = {
    'signed-out': 'Sign in to IMDb',
    failed: 'Last sync failed',
    partial: 'Some lists were only partly synced',
  };

  function buildRow(list, synced, color) {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ribbon-btn';
    button.dataset.id = list.id;
    button.title = 'Click to change the color';
    button.append(createRibbon(document, { width: 12, height: 17, color }));
    const text = document.createElement('span');
    text.textContent = list.name;
    li.append(button, text);
    if (list.count != null) {
      const count = document.createElement('span');
      count.className = 'count';
      count.textContent = `(${synced ?? 0}/${list.count})`;
      li.append(count);
    }
    return li;
  }

  async function render(override = null) {
    const state = await api.runtime.sendMessage({ type: 'state' });
    $('lists').replaceChildren(
      ...state.lists.map((l) => buildRow(l, state.idsByList[l.id]?.length, state.colors[l.id])),
    );
    const total = new Set(Object.values(state.idsByList).flat()).size;
    $('count').textContent = `${total} titles in ${state.lists.length} lists`;
    $('synced').textContent = `Last synced: ${when(state.lastSynced)}`;
    const code = override ?? state.lastError;
    $('status').textContent = messages[code] ?? '';
    $('status').className = code ? 'error' : '';
    return state;
  }

  async function refreshLists() {
    $('refresh').disabled = true;
    const result = await api.runtime.sendMessage({ type: 'refreshLists' });
    $('refresh').disabled = false;
    await render(result === 'signed-out' ? 'signed-out' : result === null ? 'failed' : null);
  }

  $('lists').addEventListener('click', async (e) => {
    const button = e.target.closest('button[data-id]');
    if (!button) return;
    await api.runtime.sendMessage({ type: 'cycleColor', id: button.dataset.id });
    render();
  });

  $('sync').addEventListener('click', async () => {
    $('sync').disabled = true;
    await api.runtime.sendMessage({ type: 'sync' });
    $('sync').disabled = false;
    render();
  });

  $('refresh').addEventListener('click', refreshLists);

  render().then((state) => { if (!state.lists.length) refreshLists(); });
})();