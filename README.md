# Scam Radar — Drainer Demo (учебный стенд, Sepolia)

Telegram Mini App, который **учит**, как работают дрейнеры/свиперы крипто-кошельков,
**не крадя** и **не перемещая** чужие средства.

Канал: [t.me/ScamRadarDaily](https://t.me/ScamRadarDaily)

## Что внутри

| Модуль | Файл | Что делает |
|--------|------|------------|
| Конфиг | `js/config.js` | Только Sepolia RPC, chainId `11155111`, faucet-ссылки |
| Демо-кошельки | `js/demo-wallets.js` | `ethers.Wallet.createRandom()` — единственные ключи для подписи |
| Провайдер | `js/provider.js` | Подключение к Sepolia + проверка chainId |
| Урок импорта | `js/lesson-import.js` | Активное поле ввода → красное предупреждение + театр. **Ключ пользователя НЕ импортируется и НЕ подписывает** |
| Сканер | `js/scanner.js` | `getBalance` только чтение |
| Sweep Simulation | `js/sweep-sim.js` | Реальный transfer Sepolia ETH между двумя демо-кошельками |
| GUI | `js/app.js` + `index.html` | Вкладки, управление, faucet |

## Жёсткие правила безопасности

1. Поле «импорт» **никогда** не передаёт ввод в `ethers.Wallet` / `fromPhrase` / `sendTransaction`.
2. Подпись/broadcast — **только** кошельками из `SR_DemoWallets` (созданы в приложении).
3. RPC — **только** Sepolia. Mainnet в коде отсутствует.
4. Сканер — read-only.

## Локальный просмотр

Нужен любой статический HTTP-сервер (браузерные модули + CORS к RPC):

```bash
cd scamradar_drainer_demo
python3 -m http.server 8080
# открыть http://127.0.0.1:8080
```

Или:

```bash
npx --yes serve -l 8080 .
```

## Как получить тестовый Sepolia ETH

1. Откройте вкладку **«④ Управление»**.
2. Скопируйте адрес **жертвы (victim)**.
3. Запросите ETH на одном из кранов:
   - [Google Cloud Web3 Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)
   - [Alchemy Sepolia Faucet](https://www.alchemy.com/faucets/ethereum-sepolia)
   - [PoW Faucet](https://sepolia-faucet.pk910.de/)
4. Нажмите **«Обновить балансы»**, затем на вкладке **«③ Sweep Simulation»** —
   **«Запустить Sweep Simulation»**.

## Деплой как Telegram Mini App

### 1. Хостинг статики

Залейте папку `scamradar_drainer_demo/` (весь `index.html` + `js/`) на любой HTTPS-хостинг:

- GitHub Pages / Cloudflare Pages / Netlify / Vercel / свой nginx
- Важно: **HTTPS** обязателен для Telegram WebApp
- Cordova/файл `file://` — не подойдёт (RPC и SDK требуют http(s))

Пример с Cloudflare Pages: перетащите папку в dashboard → получите URL вида
`https://scamradar-drainer-demo.pages.dev`

### 2. Привязка к боту (BotFather)

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram.
2. `/mybots` → выберите бота (или `/newbot`).
3. **Bot Settings → Menu Button** (или **Configure Mini App** / **Web App**):
   - URL = ваш `https://…/index.html` (или корень, если `index.html` дефолтный).
4. Альтернатива через команду:
   - `/setmenubutton` → бот → URL Mini App.
5. Для отдельной кнопки в сообщении используйте
   [InlineKeyboardButton.web_app](https://core.telegram.org/bots/api#inlinekeyboardbutton)
   с тем же URL.

### 3. Проверка

- Откройте бота → Menu / кнопка WebApp → стенд должен развернуться на весь экран.
- Баннер «Учебный стенд… Sepolia…» виден сразу.
- Вкладка «Урок»: вставьте мусорную «сид-фразу» → красное предупреждение, ключ не ушёл в сеть.

## Структура

```
scamradar_drainer_demo/
├── index.html
├── README.md
└── js/
    ├── config.js
    ├── demo-wallets.js
    ├── provider.js
    ├── lesson-import.js
    ├── scanner.js
    ├── sweep-sim.js
    └── app.js
```

## Чего здесь НЕТ (и не будет)

- Импорта пользовательского ключа / сид-фразы в `ethers.Wallet`
- Mainnet RPC
- Hashcat / перебора secp256k1 / «восстановления» чужих ключей
- Отправки ключей на сервер

Это учебный материал для канала Scam Radar, не атакующий инструмент.
