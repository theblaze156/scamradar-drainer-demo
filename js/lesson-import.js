/*
 * lesson-import.js — Урок «импорт ключа = кража».
 *
 * ============================================================
 * ЖЁСТКОЕ ПРАВИЛО БЕЗОПАСНОСТИ (не нарушать никогда):
 *   Поле ввода сид-фразы / приватного ключа АКТИВНО (реагирует
 *   на ввод), но приложение НИКОГДА:
 *     • не импортирует введённый ключ (ethers.Wallet.fromPhrase /
 *       new ethers.Wallet(userInput) — ЗАПРЕЩЕНЫ здесь);
 *     • не деривирует из него адрес;
 *     • не подписывает им транзакции;
 *     • не отправляет его на сервер / в localStorage / никуда.
 *
 *   Вместо этого: красное предупреждение + театральная анимация
 *   «дрейна» на ДЕМО-кошельках, которые создало само приложение.
 * ============================================================
 *
 * Что делает НАСТОЯЩИЙ дрейнер на этом шаге:
 *   1) принимает ваш сид/ключ в «импорт кошелька»;
 *   2) мгновенно создаёт Wallet из введённого;
 *   3) читает балансы всех сетей;
 *   4) подписывает и бродкастит «sweep max» на адрес атакующего.
 *
 * Как защититься:
 *   • Никогда не вводите сид-фразу / приватный ключ никуда, кроме
 *     официального ПО кошелька, которое вы сами скачали с
 *     проверенного источника.
 *   • Для dApp используйте WalletConnect / расширение (MetaMask и т.п.) —
 *     они подписывают локально, сайт ключ не видит.
 *   • Если уже ввели — считайте ключ скомпрометированным: создайте
 *     новый кошелёк и срочно переведите средства туда.
 */
(function (global) {
  'use strict';

  // Флаг: анимация уже запущена (чтобы не плодить таймеры).
  let animRunning = false;

  /**
   * Обработчик ввода. Вызывается на input/change поля.
   * НАМЕРЕННО не передаёт value ни в ethers, ни наружу.
   */
  function onUserTypedSecret(rawValue, ui) {
    // Мы читаем длину / «похоже ли на ключ» только чтобы решить,
    // показывать ли урок. Саму строку НЕ сохраняем и НЕ парсим как ключ.
    const looksLikeSecret = looksLikeKeyOrSeed(rawValue);

    if (!looksLikeSecret) {
      ui.hideWarning();
      return;
    }

    // Очищаем поле сразу — чтобы секрет не болтался в DOM дольше нужного.
    // (Настоящий дрейнер, наоборот, забирает значение и держит его.)
    ui.clearInput();

    ui.showBigWarning(
      'СТОП! Вот прямо сейчас настоящий дрейнер увёл бы все ваши средства.\n\n' +
      'Никогда не вводите сид-фразу / приватный ключ в приложения, сайты, ' +
      '«поддержку» или Mini App.\n\n' +
      'Этот стенд НЕ импортировал ваш ввод и НЕ подписал им ничего. ' +
      'Ниже — театральная анимация того, что сделал бы дрейнер, ' +
      'на ДЕМО-кошельках (testnet).'
    );

    // Театр: анимация «дрейна» на демо-кошельках. Без реальной подписи
    // введённым ключом — ключа пользователя у нас просто нет.
    playDrainTheatre(ui);
  }

  /**
   * Грубая эвристика «похоже на секрет».
   * Не валидирует криптографически и не трогает ethers —
   * только решает, показывать ли урок.
   */
  function looksLikeKeyOrSeed(value) {
    if (!value || typeof value !== 'string') return false;
    const v = value.trim();
    if (!v) return false;

    // 64 hex-символа (с 0x или без) — типичный вид приватного ключа.
    const hex = v.replace(/^0x/i, '');
    if (/^[0-9a-fA-F]{64}$/.test(hex)) return true;

    // 12 / 15 / 18 / 21 / 24 слова через пробел — типичная сид-фраза BIP-39.
    const words = v.split(/\s+/).filter(Boolean);
    if ([12, 15, 18, 21, 24].includes(words.length) &&
        words.every(w => /^[a-zA-Z]+$/.test(w))) {
      return true;
    }

    // Если человек уже набрал много символов, похожих на секрет — тоже урок.
    if (words.length >= 8 && words.every(w => /^[a-zA-Z]+$/.test(w))) return true;
    if (hex.length >= 40 && /^[0-9a-fA-F]+$/.test(hex)) return true;

    return false;
  }

  /**
   * Театральная анимация «дрейна».
   * Использует адреса ДЕМО-кошельков (victim → attacker) только как декорации.
   * Никакой подписи, никакого broadcast, никакого ethers.Wallet(userInput).
   */
  function playDrainTheatre(ui) {
    if (animRunning) return;
    animRunning = true;

    const pair = global.SR_DemoWallets.loadOrCreatePair();
    const steps = [
      { t: 0,    msg: '[ДРЕЙНЕР] Получен ввод пользователя…' },
      { t: 600,  msg: '[ДРЕЙНЕР] (в реальности) Wallet.fromPhrase / new Wallet(pk)…' },
      { t: 1200, msg: `[ДРЕЙНЕР] Адрес жертвы (демо): ${short(pair.victim.address)}` },
      { t: 1800, msg: '[ДРЕЙНЕР] Читаю балансы во всех сетях…' },
      { t: 2400, msg: '[ДРЕЙНЕР] Собираю «sweep max» транзакцию…' },
      { t: 3000, msg: `[ДРЕЙНЕР] Получатель (атакующий, демо): ${short(pair.attacker.address)}` },
      { t: 3600, msg: '[ДРЕЙНЕР] wallet.signTransaction(...) — подпись ключом ЖЕРТВЫ' },
      { t: 4200, msg: '[ДРЕЙНЕР] provider.broadcastTransaction(...) — ушло в сеть' },
      { t: 5000, msg: '[ДРЕЙНЕР] ✅ Средства «украдены». В реальности — уже поздно.' },
      { t: 5800, msg: '[УРОК] Этот стенд НЕ сделал ничего из перечисленного с вашим вводом.\n' +
                      'Защита: никогда не вставляйте сид/ключ в чужие формы. Используйте WalletConnect / расширение.' }
    ];

    ui.clearTheatre();
    steps.forEach(step => {
      setTimeout(() => {
        ui.appendTheatre(step.msg);
        if (step === steps[steps.length - 1]) {
          animRunning = false;
        }
      }, step.t);
    });
  }

  function short(addr) {
    return addr ? (addr.slice(0, 6) + '…' + addr.slice(-4)) : '?';
  }

  /**
   * Привязка к DOM. ui-объект создаётся в app.js.
   */
  function bind(inputEl, ui) {
    if (!inputEl) return;
    // input — реагируем по мере набора; paste — сразу после вставки.
    inputEl.addEventListener('input', () => onUserTypedSecret(inputEl.value, ui));
    inputEl.addEventListener('paste', () => {
      // paste срабатывает до обновления value — ждём тик.
      setTimeout(() => onUserTypedSecret(inputEl.value, ui), 0);
    });
  }

  global.SR_LessonImport = {
    bind,
    onUserTypedSecret,
    looksLikeKeyOrSeed,
    // Экспорт для тестов: гарантируем, что модуля НЕТ функции importUserKey.
  };
})(typeof window !== 'undefined' ? window : globalThis);
