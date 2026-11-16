function createStore(storageArea) {
  let queue = Promise.resolve();
  const enqueue = (fn) => {
    const run = queue.then(fn);
    queue = run.catch(() => {});
    return run;
  };

  const read = async () => {
    const raw = await storageArea.get(['ids', 'lastSynced', 'lastError', 'lists', 'selectedListId']);
    return {
      ids: raw.ids ?? [],
      lastSynced: raw.lastSynced ?? null,
      lastError: raw.lastError ?? null,
      lists: raw.lists ?? [],
      selectedListId: raw.selectedListId ?? null,
    };
  };

  return {
    getState: () => queue.then(read),
    replaceAll: (ids, now) =>
      enqueue(() => storageArea.set({ ids: [...new Set(ids)], lastSynced: now, lastError: null })),
    recordError: (code, now) => enqueue(() => storageArea.set({ lastError: code, lastErrorAt: now })),
    setLists: (lists) => enqueue(() => storageArea.set({ lists })),
    selectList: (id) =>
      enqueue(() => storageArea.set({ selectedListId: id, ids: [], lastSynced: null, lastError: null })),
    has: async (ids) => {
      await queue;
      const known = new Set((await read()).ids);
      return ids.filter((id) => known.has(id));
    },
  };
}

if (typeof module !== 'undefined') module.exports = { createStore };
else (globalThis.IWC ??= {}).createStore = createStore;