function createStore(storageArea) {
  let queue = Promise.resolve();
  const enqueue = (fn) => {
    const run = queue.then(fn);
    queue = run.catch(() => {});
    return run;
  };

  const read = async () => {
    const raw = await storageArea.get(['idsByList', 'lastSynced', 'lastError', 'lists', 'colors']);
    return {
      idsByList: raw.idsByList ?? {},
      lastSynced: raw.lastSynced ?? null,
      lastError: raw.lastError ?? null,
      lists: raw.lists ?? [],
      colors: raw.colors ?? {},
    };
  };

  return {
    getState: () => queue.then(read),
    replaceAll: (idsByList, now) =>
      enqueue(() => storageArea.set({ idsByList, lastSynced: now, lastError: null })),
    recordError: (code, now) => enqueue(() => storageArea.set({ lastError: code, lastErrorAt: now })),
    setLists: (lists) => enqueue(() => storageArea.set({ lists })),
    selectList: (id) => enqueue(() => storageArea.set({ selectedListId: id })),
    cycleColor: (id, keys) =>
      enqueue(async () => {
        const { colors } = await read();
        const current = Math.max(0, keys.indexOf(colors[id]));
        await storageArea.set({ colors: { ...colors, [id]: keys[(current + 1) % keys.length] } });
      }),
    has: async (ids) => {
      await queue;
      const { lists, idsByList, colors } = await read();
      const sets = lists.map((l) => ({
        name: l.name,
        color: colors[l.id] ?? null,
        set: new Set(idsByList[l.id] ?? []),
      }));
      const out = {};
      for (const id of ids) {
        const hits = sets.filter((s) => s.set.has(id)).map(({ name, color }) => ({ name, color }));
        if (hits.length) out[id] = hits;
      }
      return out;
    },
  };
}

if (typeof module !== 'undefined') module.exports = { createStore };
else (globalThis.IWC ??= {}).createStore = createStore;