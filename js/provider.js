/*
 * provider.js — Подключение к Sepolia.
 *
 * Перед любой работой проверяем chainId === 11155111.
 * Если RPC отвечает другой сетью — отказываемся. Mainnet здесь запрещён.
 */
(function (global) {
  'use strict';

  let cachedProvider = null;
  let cachedUrl = null;

  async function connectSepolia() {
    if (cachedProvider) {
      // Перепроверяем chainId на случай смены сети на RPC.
      const id = await cachedProvider.getNetwork().then(n => n.chainId);
      if (id === global.SR_CONFIG.SEPOLIA_CHAIN_ID) return cachedProvider;
      cachedProvider = null;
    }

    const urls = global.SR_CONFIG.SEPOLIA_RPC_URLS;
    const errors = [];

    for (const url of urls) {
      try {
        const provider = new ethers.JsonRpcProvider(url);
        const network = await provider.getNetwork();
        if (network.chainId !== global.SR_CONFIG.SEPOLIA_CHAIN_ID) {
          errors.push(`${url}: chainId=${network.chainId} (ожидался Sepolia ${global.SR_CONFIG.SEPOLIA_CHAIN_ID})`);
          continue;
        }
        // Лёгкий smoke-test: блок должен отвечать.
        await provider.getBlockNumber();
        cachedProvider = provider;
        cachedUrl = url;
        return provider;
      } catch (err) {
        errors.push(`${url}: ${err.message || err}`);
      }
    }

    throw new Error(
      'Не удалось подключиться к Sepolia. Проверьте интернет.\n' +
      errors.join('\n')
    );
  }

  function getActiveRpcUrl() {
    return cachedUrl;
  }

  global.SR_Provider = {
    connectSepolia,
    getActiveRpcUrl
  };
})(typeof window !== 'undefined' ? window : globalThis);
