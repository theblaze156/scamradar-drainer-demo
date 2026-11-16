/*
 * app.js — GUI / панель управления учебным стендом Scam Radar.
 * Связывает модули с DOM. Никакой крипто-логики здесь нет —
 * только UI и вызовы SR_* модулей.
 */
(function () {
  'use strict';

  // ---------- Telegram WebApp (если открыто внутри Telegram) ----------
  try {
    if (window.Telegram && Telegram.WebApp) {
      Telegram.WebApp.ready();
      Telegram.WebApp.expand();
      // Тёмная тема под Binance-like UI.
      if (Telegram.WebApp.setHeaderColor) {
        Telegram.WebApp.setHeaderColor('#181a20');
      }
    }
  } catch (_) { /* вне Telegram — ок */ }

  // ---------- Утилиты UI ----------
  function $(id) { return document.getElementById(id); }

  function setActiveTab(name) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    const panel = $('tab-' + name);
    const btn = document.querySelector('.tab-btn[data-tab="' + name + '"]');
    if (panel) panel.classList.add('active');
    if (btn) btn.classList.add('active');
  }

  function makeLogger(consoleId) {
    const el = $(consoleId);
    return function log(line) {
      if (!el) return;
      const ts = new Date().toLocaleTimeString('ru-RU');
      el.textContent += (el.textContent ? '\n' : '') + '[' + ts + '] ' + line;
      el.scrollTop = el.scrollHeight;
    };
  }

  function short(addr) {
    return addr ? addr.slice(0, 6) + '…' + addr.slice(-4) : '—';
  }

  // ---------- Рендер демо-кошельков ----------
  function renderWallets(pair) {
    $('victim-address').textContent = pair.victim.address;
    $('victim-pk').textContent = pair.victim.privateKey;
    $('attacker-address').textContent = pair.attacker.address;
    $('attacker-pk').textContent = pair.attacker.privateKey;

    $('victim-link').href = SR_CONFIG.EXPLORER_ADDR + pair.victim.address;
    $('attacker-link').href = SR_CONFIG.EXPLORER_ADDR + pair.attacker.address;

    // Подсказки для faucet: адрес жертвы, который надо пополнить.
    $('faucet-hint-addr').textContent = pair.victim.address;
  }

  function renderFaucets() {
    const box = $('faucet-list');
    box.innerHTML = '';
    SR_CONFIG.FAUCETS.forEach(f => {
      const a = document.createElement('a');
      a.href = f.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.className = 'faucet-link';
      a.textContent = f.name;
      box.appendChild(a);
    });
  }

  // ---------- UI-объект для lesson-import ----------
  const lessonUi = {
    hideWarning() {
      const w = $('import-warning');
      if (w) w.classList.add('hidden');
    },
    showBigWarning(text) {
      const w = $('import-warning');
      if (!w) return;
      w.classList.remove('hidden');
      $('import-warning-text').textContent = text;
    },
    clearInput() {
      const inp = $('fake-import-input');
      if (inp) inp.value = '';
    },
    clearTheatre() {
      const t = $('drain-theatre');
      if (t) t.textContent = '';
    },
    appendTheatre(msg) {
      const t = $('drain-theatre');
      if (!t) return;
      t.textContent += (t.textContent ? '\n' : '') + msg;
      t.scrollTop = t.scrollHeight;
    }
  };

  // ---------- Обновление балансов демо ----------
  async function refreshDemoBalances() {
    const log = makeLogger('manage-console');
    try {
      const provider = await SR_Provider.connectSepolia();
      $('rpc-status').textContent = '● Sepolia: ' + SR_Provider.getActiveRpcUrl();
      $('rpc-status').className = 'rpc-status ok';

      const pair = SR_DemoWallets.loadOrCreatePair();
      const bv = await provider.getBalance(pair.victim.address);
      const ba = await provider.getBalance(pair.attacker.address);
      $('victim-balance').textContent = ethers.formatEther(bv) + ' ETH';
      $('attacker-balance').textContent = ethers.formatEther(ba) + ' ETH';
      log('Балансы обновлены.');
    } catch (err) {
      $('rpc-status').textContent = '● RPC ошибка';
      $('rpc-status').className = 'rpc-status err';
      log('Ошибка RPC: ' + (err.message || err));
    }
  }

  // ---------- Инициализация ----------
  function init() {
    // Демо-кошельки
    const pair = SR_DemoWallets.loadOrCreatePair();
    renderWallets(pair);
    renderFaucets();

    // Вкладки
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => setActiveTab(btn.dataset.tab));
    });
    setActiveTab('lesson');

    // Урок импорта — поле активно, но ключ НЕ обрабатывается как крипто-секрет.
    SR_LessonImport.bind($('fake-import-input'), lessonUi);

    // Кнопка «показать анимацию без ввода» (для тех, кто не хочет ничего печатать).
    $('btn-play-theatre').addEventListener('click', () => {
      lessonUi.showBigWarning(
        'Демонстрация без ввода ключа.\n\n' +
        'Ниже — что делает настоящий дрейнер после того, как жертва вставила сид/ключ. ' +
        'Этот стенд ничего не подписывает вашим ключом (его у нас нет).'
      );
      // Вызываем театральную часть через публичный вход: симулируем «похожий» ввод
      // путём прямой отрисовки — без передачи пользовательского секрета.
      // Используем внутренний путь: onUserTypedSecret с фейковой строкой-маркером,
      // которая выглядит как ключ ТОЛЬКО для эвристики UI, затем сразу очищается.
      // ВАЖНО: эта строка — НЕ чей-то ключ, а заведомо невалидный hex-паттерн
      // вида "00...demo", который эвристика всё равно распознает как «похоже».
      // Чтобы не плодить путаницу — вызываем театр напрямую через UI:
      const theatre = SR_LessonImport;
      // Прямой вызов: эмулируем «пользователь что-то вставил», но строка — мусор для урока.
      theatre.onUserTypedSecret(
        '0x00000000000000000000000000000000000000000000000000000000deadbeef',
        lessonUi
      );
    });

    // Сканер
    $('btn-scan').addEventListener('click', async () => {
      const log = makeLogger('scanner-console');
      $('scanner-console').textContent = '';
      const addrs = SR_Scanner.parseAddressList($('scanner-targets').value);
      if (!addrs.length) {
        log('Вставьте хотя бы один 0x-адрес (Sepolia).');
        return;
      }
      $('btn-scan').disabled = true;
      try {
        await SR_Scanner.scanBalances(addrs, log);
      } catch (err) {
        log('Ошибка: ' + (err.message || err));
      } finally {
        $('btn-scan').disabled = false;
      }
    });

    // Подставить адреса демо в сканер
    $('btn-scan-fill-demo').addEventListener('click', () => {
      const p = SR_DemoWallets.loadOrCreatePair();
      $('scanner-targets').value = p.victim.address + '\n' + p.attacker.address;
    });

    // Sweep simulation
    $('btn-sweep').addEventListener('click', async () => {
      const log = makeLogger('sweep-console');
      $('sweep-console').textContent = '';
      $('btn-sweep').disabled = true;
      try {
        const p = SR_DemoWallets.loadOrCreatePair();
        const result = await SR_SweepSim.runSweepSimulation(p, log);
        if (result && result.explorerUrl) {
          $('sweep-tx-link').href = result.explorerUrl;
          $('sweep-tx-link').textContent = result.hash;
          $('sweep-tx-wrap').classList.remove('hidden');
        }
        await refreshDemoBalances();
      } catch (err) {
        log('Ошибка: ' + (err.message || err));
      } finally {
        $('btn-sweep').disabled = false;
      }
    });

    // Управление
    $('btn-regen').addEventListener('click', () => {
      const p = SR_DemoWallets.regeneratePair();
      renderWallets(p);
      $('victim-balance').textContent = '—';
      $('attacker-balance').textContent = '—';
      makeLogger('manage-console')('Новая пара демо-кошельков создана. Старые ключи забыты.');
    });

    $('btn-refresh-balances').addEventListener('click', () => {
      $('manage-console').textContent = '';
      refreshDemoBalances();
    });

    // Копирование адресов
    document.querySelectorAll('[data-copy]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-copy');
        const text = $(id).textContent.trim();
        try {
          await navigator.clipboard.writeText(text);
          btn.textContent = 'Скопировано';
          setTimeout(() => { btn.textContent = 'Копировать'; }, 1500);
        } catch (_) {
          btn.textContent = 'Ctrl+C вручную';
        }
      });
    });

    // Первичный статус RPC (не блокируем UI)
    refreshDemoBalances();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
