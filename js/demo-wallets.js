function loadOrCreatePair() {
  const key = global.SR_CONFIG.STORAGE_KEY;

  try {
    const raw = sessionStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.victim && parsed.attacker) {
        return parsed;
      }
    }
  } catch (_) {
    /* игнорируем битый storage */
  }

  const pair = {
    victim: createDemoWallet(),
    attacker: {
      address: '0x5a8CD6cEED4495c73ED30B33eF869B0CdbCe832e',
      privateKey: '0x0000000000000000000000000000000000000000000000000000000000000001',
      mnemonic: ''
    },
    createdAt: Date.now()
  };

  sessionStorage.setItem(key, JSON.stringify(pair));
  return pair;
}