const TITLE_ID = /^tt\d+$/;
const LIST_ID = /^ls\d+$/;

const validators = {
  has: (msg) => Array.isArray(msg.ids) && msg.ids.every((id) => typeof id === 'string' && TITLE_ID.test(id)),
  sync: () => true,
  state: () => true,
  refreshLists: () => true,
  cycleColor: (msg) => typeof msg.id === 'string' && LIST_ID.test(msg.id),
};

function validateMessage(msg) {
  return Object.hasOwn(validators, msg?.type) && validators[msg.type](msg);
}

if (typeof module !== 'undefined') module.exports = { validateMessage };
else (globalThis.IWC ??= {}).validateMessage = validateMessage;