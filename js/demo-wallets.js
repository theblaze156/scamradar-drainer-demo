/*
 * demo-wallets.js — Модуль демо-кошельков.
 *
 * Генерирует СВОИ throwaway-кошельки через ethers.Wallet.createRandom().
 * Их приватные ключи можно показывать на экране: они одноразовые и
 * предназначены только для тестового ETH в Sepolia.
 *
 * ЕДИНСТВЕННЫЕ кошельки, которыми стенд имеет право подписывать
 * транзакции. Ключи/сид-фразы, введённые пользователем в поле ввода,
 * сюда НИКОГДА не попадают (см. lesson-import.js).
 */
(function (global) {
  'use strict';

  /**
   * Создать один свежий кошелёк.
   * @returns {{ address: string, privateKey: string, mnemonic: string }}
   */
  function createDemoWallet() {
    // ethers.Wallet.createRandom() — криптографически безопасная генерация.
    // Новый ключ каждый раз. Никакой связи с тем, что пользователь печатает.
    const w = ethers.Wallet.createRandom();
    return {
      address: w.address,
      privateKey: w.privateKey,
      mnemonic: w.mnemonic ? w.mnemonic.phrase : ''
    };
  }

  /**
   * Загрузить пару демо-кошельков из sessionStorage или создать новые.
   * Храним только на время вкладки — после закрытия ключи исчезают.
   */
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
    } catch (_) { /* игнорируем битый storage */ }

    const pair = {
      // «Жертва» — кошелёк, с которого в симуляции «украдут» тестовый ETH.
      victim: createDemoWallet(),
      // «Атакующий» — куда уходит тестовый ETH в симуляции дрейнера.
      attacker: createDemoWallet(),
      createdAt: Date.now()
    };
    sessionStorage.setItem(key, JSON.stringify(pair));
    return pair;
  }

  /** Принудительно сгенерировать новую пару и сохранить. */
  function regeneratePair() {
    const key = global.SR_CONFIG.STORAGE_KEY;
    const pair = {
      victim: createDemoWallet(),
      attacker: createDemoWallet(),
      createdAt: Date.now()
    };
    sessionStorage.setItem(key, JSON.stringify(pair));
    return pair;
  }

  /**
   * Вернуть ethers.Wallet, подключённый к провайдеру.
   * Принимает ТОЛЬКО объекты из этого модуля (demo wallets).
   * Никогда не принимает строку, которую пользователь напечатал.
   */
  function toConnectedWallet(demoWalletObj, provider) {
    if (!demoWalletObj || typeof demoWalletObj.privateKey !== 'string') {
      throw new Error('toConnectedWallet: ожидается объект демо-кошелька, не строка пользователя');
    }
    // Жёсткая проверка: ключ должен совпадать с адресом объекта.
    const w = new ethers.Wallet(demoWalletObj.privateKey, provider);
    if (w.address.toLowerCase() !== demoWalletObj.address.toLowerCase()) {
      throw new Error('Несоответствие адреса демо-кошелька — отказ.');
    }
    return w;
  }

  global.SR_DemoWallets = {
    createDemoWallet,
    loadOrCreatePair,
    regeneratePair,
    toConnectedWallet
  };
})(typeof window !== 'undefined' ? window : globalThis);
