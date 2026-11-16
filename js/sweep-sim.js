/*
 * sweep-sim.js — Sweep Simulation между ДЕМО-кошельками (Sepolia).
 *
 * ============================================================
 * Подписывает и бродкастит ТОЛЬКО кошельками из SR_DemoWallets
 * (ethers.Wallet.createRandom() внутри приложения).
 *
 * НИКОГДА не принимает приватный ключ / сид из поля ввода пользователя.
 * Сигнатура функции: runSweepSimulation(pair, log) —
 * pair приходит из SR_DemoWallets.loadOrCreatePair().
 * ============================================================
 *
 * Что показывает урок:
 *   1) читаем баланс «жертвы» (демо);
 *   2) оцениваем газ;
 *   3) собираем tx value = balance - gasCost («sweep max»);
 *   4) подписываем ключом демо-жертвы;
 *   5) бродкастим в Sepolia;
 *   6) ждём receipt.
 *
 * Что делает НАСТОЯЩИЙ дрейнер:
 *   То же самое, но ключ — ВАШ, а получатель — адрес мошенника,
 *   и сеть — mainnet. Один клик «Import wallet» → минус все средства.
 *
 * Как защититься:
 *   Не импортируйте ключ в чужие приложения. Подписывайте только
 *   через свой кошелёк (расширение / аппаратный), проверяя адрес
 *   получателя и сумму в окне подтверждения.
 */
(function (global) {
  'use strict';

  /**
   * @param {{ victim: object, attacker: object }} pair — ТОЛЬКО из SR_DemoWallets
   * @param {(line: string) => void} log
   * @returns {Promise<{ hash?: string, explorerUrl?: string, skipped?: boolean, reason?: string }>}
   */
  async function runSweepSimulation(pair, log) {
    if (!pair || !pair.victim || !pair.attacker) {
      throw new Error('Нужна пара демо-кошельков из SR_DemoWallets');
    }
    // Защита от случайной передачи строки пользователя:
    if (typeof pair.victim === 'string' || typeof pair.attacker === 'string') {
      throw new Error('ОТКАЗ: строка пользователя не принимается. Только объекты демо-кошельков.');
    }

    const provider = await global.SR_Provider.connectSepolia();
    const rpc = global.SR_Provider.getActiveRpcUrl();
    log(`[SWEEP] Sepolia RPC: ${rpc}`);
    log(`[SWEEP] Victim (демо):   ${pair.victim.address}`);
    log(`[SWEEP] Attacker (демо): ${pair.attacker.address}`);

    const victimWallet = global.SR_DemoWallets.toConnectedWallet(pair.victim, provider);

    const balanceWei = await provider.getBalance(pair.victim.address);
    log(`[SWEEP] Баланс жертвы: ${ethers.formatEther(balanceWei)} ETH`);

    if (balanceWei === 0n) {
      log('[SWEEP] Баланс 0. Пополните демо-кошелёк жертвы через faucet (вкладка «Управление»).');
      return { skipped: true, reason: 'zero balance' };
    }

    // Оценка газа для простого transfer.
    const feeData = await provider.getFeeData();
    const gasLimit = 21000n;
    // Берём maxFeePerGas если есть (EIP-1559), иначе gasPrice.
    const gasPrice = feeData.maxFeePerGas || feeData.gasPrice || 0n;
    const gasCost = gasLimit * gasPrice;

    if (balanceWei <= gasCost) {
      log(`[SWEEP] Баланса не хватает на газ (${ethers.formatEther(gasCost)} ETH).`);
      log('[SWEEP] Пополните кошелёк жертвы через faucet.');
      return { skipped: true, reason: 'insufficient for gas' };
    }

    const value = balanceWei - gasCost;
    log(`[SWEEP] Отправляем «sweep max»: ${ethers.formatEther(value)} ETH`);
    log(`[SWEEP] Газ (оценка): ${ethers.formatEther(gasCost)} ETH`);

    // Формируем транзакцию явно — чтобы в UI было видно каждое поле.
    const txRequest = {
      to: pair.attacker.address,
      value,
      gasLimit,
      chainId: Number(global.SR_CONFIG.SEPOLIA_CHAIN_ID),
      type: 2,
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
    };

    log('[SWEEP] Подпись ключом ДЕМО-жертвы (не вашим!)…');
    // victimWallet создан из pair.victim.privateKey — ключ приложения, не пользователя.
    const txResponse = await victimWallet.sendTransaction(txRequest);
    log(`[SWEEP] Broadcast: ${txResponse.hash}`);
    log(`[SWEEP] Explorer: ${global.SR_CONFIG.EXPLORER_TX}${txResponse.hash}`);

    log('[SWEEP] Ждём подтверждения…');
    const receipt = await txResponse.wait();
    log(`[SWEEP] ✅ Подтверждено. Блок: ${receipt.blockNumber}, status: ${receipt.status}`);

    // Балансы после.
    const balV = await provider.getBalance(pair.victim.address);
    const balA = await provider.getBalance(pair.attacker.address);
    log(`[SWEEP] Victim после:   ${ethers.formatEther(balV)} ETH`);
    log(`[SWEEP] Attacker после: ${ethers.formatEther(balA)} ETH`);
    log('[УРОК] Вот так дрейнер «подметает» кошелёк. Разница: у него был БЫ ВАШ ключ.');

    return {
      hash: txResponse.hash,
      explorerUrl: global.SR_CONFIG.EXPLORER_TX + txResponse.hash,
      receipt
    };
  }

  global.SR_SweepSim = {
    runSweepSimulation
  };
})(typeof window !== 'undefined' ? window : globalThis);
