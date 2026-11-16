/*
 * config.js — Конфигурация учебного стенда Scam Radar.
 *
 * ВАЖНО: этот стенд работает ТОЛЬКО в тестовой сети Sepolia.
 * В коде нет ни одного mainnet RPC. Тестовый ETH ничего не стоит,
 * поэтому даже настоящие подписи здесь безопасны — они двигают
 * «игрушечные» деньги между кошельками, которые создало само приложение.
 */
(function (global) {
  'use strict';

  const CONFIG = Object.freeze({
    // Публичные RPC-узлы Sepolia (только тестовая сеть). Берём первый рабочий.
    SEPOLIA_RPC_URLS: Object.freeze([
      'https://ethereum-sepolia-rpc.publicnode.com',
      'https://rpc.sepolia.org',
      'https://sepolia.drpc.org'
    ]),

    // Chain ID Sepolia. Каждый провайдер проверяется на этот ID перед работой.
    // Если RPC вдруг отвечает другим chainId (например, 1 = mainnet) — стенд
    // отказывается работать. Это защита «на всякий случай».
    SEPOLIA_CHAIN_ID: 11155111n,

    // Обозреватель блоков тестовой сети — для ссылок на транзакции.
    EXPLORER_TX: 'https://sepolia.etherscan.io/tx/',
    EXPLORER_ADDR: 'https://sepolia.etherscan.io/address/',

    // Краны (faucet), где можно бесплатно получить тестовый Sepolia ETH.
    FAUCETS: Object.freeze([
      { name: 'Google Cloud Web3 Faucet', url: 'https://cloud.google.com/application/web3/faucet/ethereum/sepolia' },
      { name: 'Alchemy Sepolia Faucet', url: 'https://www.alchemy.com/faucets/ethereum-sepolia' },
      { name: 'PoW Faucet (без аккаунта)', url: 'https://sepolia-faucet.pk910.de/' }
    ]),

    // Ключ хранения демо-кошельков в sessionStorage (живут до закрытия вкладки).
    STORAGE_KEY: 'scamradar_demo_wallets_v1'
  });

  global.SR_CONFIG = CONFIG;
})(typeof window !== 'undefined' ? window : globalThis);
