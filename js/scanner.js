/*
 * scanner.js — Сканер балансов (Sepolia, ТОЛЬКО ЧТЕНИЕ).
 *
 * Что делает: для каждого адреса из списка вызывает
 * provider.getBalance(address) в сети Sepolia.
 *
 * Чего НЕ делает: не принимает ключи, не подписывает, не отправляет tx.
 *
 * Что делает НАСТОЯЩИЙ дрейнер на похожем шаге:
 *   после кражи ключа он сканирует балансы жертвы во всех сетях,
 *   чтобы решить, что именно «подметать» (ETH, токены, NFT).
 *
 * Как защититься:
 *   Публичные адреса и балансы — не секрет. Секрет — ключ.
 *   Сканер адресов сам по себе безопасен; опасен импорт ключа.
 */
(function (global) {
  'use strict';

  /**
   * @param {string[]} addresses — список 0x-адресов
   * @param {(line: string) => void} log — колбэк вывода в консоль UI
   * @returns {Promise<Array<{address:string, balanceEth:string, ok:boolean, error?:string}>>}
   */
  async function scanBalances(addresses, log) {
    const provider = await global.SR_Provider.connectSepolia();
    const rpc = global.SR_Provider.getActiveRpcUrl();
    log(`[SCAN] Sepolia RPC: ${rpc}`);
    log(`[SCAN] Адресов к проверке: ${addresses.length}`);

    const results = [];
    for (const raw of addresses) {
      const addr = (raw || '').trim();
      if (!addr) continue;

      if (!/^0x[0-9a-fA-F]{40}$/.test(addr)) {
        log(`[SKIP] Не похоже на EVM-адрес: ${addr}`);
        results.push({ address: addr, balanceEth: null, ok: false, error: 'bad address' });
        continue;
      }

      try {
        const wei = await provider.getBalance(addr);
        const eth = ethers.formatEther(wei);
        log(`[ETH] ${addr} → ${eth} ETH (Sepolia)`);
        results.push({ address: addr, balanceEth: eth, ok: true });
      } catch (err) {
        log(`[ERR] ${addr}: ${err.message || err}`);
        results.push({ address: addr, balanceEth: null, ok: false, error: String(err.message || err) });
      }
    }

    log('[SCAN] Готово. Это было только чтение — ключи не использовались.');
    return results;
  }

  /**
   * Разобрать textarea: по одному адресу на строку.
   */
  function parseAddressList(text) {
    return String(text || '')
      .split(/\r?\n/)
      .map(s => s.trim())
      .filter(Boolean);
  }

  global.SR_Scanner = {
    scanBalances,
    parseAddressList
  };
})(typeof window !== 'undefined' ? window : globalThis);
