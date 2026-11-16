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
      const { lists, idsByList } = await read();
      const sets = lists.map((l) => ({ name: l.name, set: new Set(idsByList[l.id] ?? []) }));
      const out = {};
      for (const id of ids) {
        const names = sets.filter((s) => s.set.has(id)).map((s) => s.name);
        if (names.length) out[id] = names;
      }
      return out;
    },
  };
}

if (typeof module !== 'undefined') module.exports = { createStore };
else (globalThis.IWC ??= {}).createStore = createStore;