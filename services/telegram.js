const { Telegraf } = require("telegraf");
const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (!botToken) {
  throw new Error("TELEGRAM_BOT_TOKEN is not set");
}

const bot = new Telegraf(botToken);

const REMINDER_MARKUP = {
  inline_keyboard: [
    [{ text: "Remind me in 1 hour", callback_data: "remind_me" }],
  ],
};

module.exports = { bot, REMINDER_MARKUP };
