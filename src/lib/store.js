function createStore(storageArea) {
  let queue = Promise.resolve();
  const enqueue = (fn) => {
    const run = queue.then(fn);
    queue = run.catch(() => {});
    return run;
  };

  const read = async () => {
    const raw = await storageArea.get(['idsByList', 'lastSynced', 'lastError', 'lists', 'selectedListId']);
    return {
      idsByList: raw.idsByList ?? {},
      lastSynced: raw.lastSynced ?? null,
      lastError: raw.lastError ?? null,
      lists: raw.lists ?? [],
      selectedListId: raw.selectedListId ?? null,
    };
  };

  return {
    getState: () => queue.then(read),
    replaceAll: (idsByList, now) =>
      enqueue(() => storageArea.set({ idsByList, lastSynced: now, lastError: null })),
    recordError: (code, now) => enqueue(() => storageArea.set({ lastError: code, lastErrorAt: now })),
    setLists: (lists) => enqueue(() => storageArea.set({ lists })),
    selectList: (id) => enqueue(() => storageArea.set({ selectedListId: id })),
    has: async (ids) => {
      await queue;
      const { idsByList } = await read();
      const known = new Set(Object.values(idsByList).flat());
      return ids.filter((id) => known.has(id));
    },
  };
}

if (typeof module !== 'undefined') module.exports = { createStore };
else (globalThis.IWC ??= {}).createStore = createStore;