# Telegram IPO Bot

A Telegram bot that tracks Indian stock market IPOs, retrieves live Grey Market Premium (GMP) data and subscription numbers, and sends daily notifications about IPOs closing that day.

---

## Features

- **Live IPO and GMP Tracking**: Scrapes real-time IPO information from [InvestorGain](https://www.investorgain.com/report/live-ipo-gmp/331/), including open and close dates, expected listing dates, current GMP, and subscription numbers.
- **Daily Notifications**: Automatically sends an alert every morning at 9:00 AM IST to all subscribed users with the list of IPOs closing that day.
- **Interactive Reminders**: Daily alert messages include an inline reminder button so you can request a follow-up alert 1 hour later.
- **Lightweight Embedded Database**: Stores subscriber information and cached IPO records locally using [NeDB](https://github.com/louischatriot/nedb) without requiring an external database setup.
- **Caching**: Keeps scraped IPO data cached for 4 hours to avoid hitting the source website unnecessarily.

---

## Bot Commands

| Command | Description |
| :--- | :--- |
| `/start` | Welcome message and list of commands |
| `/help` | Display command help |
| `/subscribe` | Subscribe to receive daily morning alerts |
| `/unsubscribe` | Unsubscribe from notifications |
| `/today` | Show IPOs closing today (includes reminder button) |
| `/all` | Show all active IPOs |
| `/thanks` | A simple thank you command |

---

## Tech Stack & Dependencies

- [Telegraf](https://telegraf.js.org/) - Modern Telegram bot framework for Node.js
- [Cheerio](https://cheerio.js.org/) - Fast, flexible HTML parsing and scraping
- [NeDB](https://github.com/louischatriot/nedb) - Embedded persistent JSON datastore
- [node-cron](https://github.com/node-cron/node-cron) - Task scheduler using standard cron syntax
---

## How to Set Up the Bot

Follow these steps to create your Telegram bot, configure the environment, and get it running.

### 1. Create a Telegram Bot

1. Open Telegram and search for [@BotFather](https://t.me/BotFather).
2. Start a chat and send the command `/newbot`.
3. Choose a name for your bot (e.g. `My IPO Notifier`).
4. Choose a username for your bot that ends in `bot` (e.g. `my_ipo_alert_bot`).
5. BotFather will reply with your **HTTP API Token**. Save this token—you will need it in step 3.

### 2. Install Dependencies

Make sure you have [Node.js](https://nodejs.org/) installed, then run:

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file from the provided example:

```bash
cp env.example .env
```

Open `.env` and fill in your values:

```env
TELEGRAM_BOT_TOKEN="your_bot_token_from_botfather"
NOTIFICATION_CRON_TIME="00 09 * * *"
```

- `TELEGRAM_BOT_TOKEN`: The API token you received from [@BotFather](https://t.me/BotFather).
- `NOTIFICATION_CRON_TIME`: The cron schedule for daily alerts. By default, it runs every day at 9:00 AM IST (`00 09 * * *`). You can test or customize cron patterns with [crontab.guru](https://crontab.guru/).

### 4. Run the Bot

**Development mode** (restarts automatically when code changes):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

Once running, you should see:
```text
Notification cron scheduled, first occurrence at: ...
Bot started
```

Open your bot in Telegram, tap **Start** or type `/start`, and use `/subscribe` to begin receiving daily alerts.

---

## License

This project is licensed under the ISC License.
