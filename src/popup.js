(() => {
  const { api } = globalThis.IWC;
  const $ = (id) => document.getElementById(id);
  const when = (ts) => (ts ? new Date(ts).toLocaleString() : 'never');
  const messages = {
    'signed-out': 'Sign in to IMDb',
    failed: 'Last sync failed',
    partial: 'Only part of the list was synced',
  };

  async function render(override = null) {
    const state = await api.runtime.sendMessage({ type: 'state' });
    $('list').replaceChildren(
      new Option('Choose a list…', ''),
      ...state.lists.map((l) => new Option(`${l.name}${l.count != null ? ` (${l.count})` : ''}`, l.id)),
    );
    $('list').value = state.selectedListId ?? '';
    $('count').textContent = state.selectedListId ? `${state.ids.length} titles in list` : 'No list selected';
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

  $('list').addEventListener('change', async (e) => {
    if (!e.target.value) return;
    $('list').disabled = true;
    await api.runtime.sendMessage({ type: 'selectList', id: e.target.value });
    $('list').disabled = false;
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