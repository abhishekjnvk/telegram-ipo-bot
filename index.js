require("dotenv").config();
const cron = require("node-cron");
const parser = require("cron-parser");
const { bot, REMINDER_MARKUP } = require("./services/telegram");
const db = require("./services/db");
const {
  sendNotifications,
  getClosingIpoMessage,
  getAllIpoMessage,
} = require("./services/notification");

const NOTIFICATION_CRON = process.env.NOTIFICATION_CRON_TIME || "00 09 * * *"; // daily at 9:00 AM

const handleSubscription = async (ctx, action) => {
  try {
    const chatId = ctx.message.chat.id;
    if (!chatId) throw Error("Chat id is required");

    let message = "";
    if (action === "subscribe") {
      const body = {
        name: ctx.message.chat.first_name,
        username: ctx.message.chat.username,
        type: ctx.message.chat.type,
        _id: chatId,
      };
      const getById = await db.getById(db.TABLE_NAME.SUBSCRIPTIONS, chatId);
      if (!getById) {
        await db.create(db.TABLE_NAME.SUBSCRIPTIONS, body);
        message =
          "You have been subscribed! You will get notifications for closing IPOs.";
      } else {
        message = "You are already subscribed!";
      }
    } else if (action === "unsubscribe") {
      const userData = await db.getById(db.TABLE_NAME.SUBSCRIPTIONS, chatId);
      if (!userData) {
        message = "You are not subscribed";
      } else {
        await db.delete(db.TABLE_NAME.SUBSCRIPTIONS, chatId);
        message = "You have been unsubscribed!";
      }
    }

    ctx.reply(message);
  } catch (error) {
    console.error(error);
    ctx.reply("Something went wrong");
  }
};

const handleIpoMessage = async (ctx, type) => {
  try {
    const message =
      type === "closingToday"
        ? await getClosingIpoMessage()
        : await getAllIpoMessage();
    if (message) {
      ctx.reply(message, {
        parse_mode: "Markdown",
        reply_markup: type === "closingToday" ? REMINDER_MARKUP : undefined,
      });
    } else {
      ctx.reply(
        type === "closingToday" ? "No IPOs closing today" : "No IPOs available"
      );
    }
  } catch (error) {
    console.error(error);
    ctx.reply("Something went wrong");
  }
};

const handleRemindAction = async (ctx) => {
  try {
    ctx.answerCbQuery();
    const messageId = ctx.update.callback_query.message.message_id;
    ctx.telegram.editMessageReplyMarkup(ctx.chat.id, messageId, null);

    const messageTime = ctx.update.callback_query.message.date;
    const thresholdTime = 2 * 3600; // 2 hours

    if ((messageTime + thresholdTime) * 1000 < Date.now()) {
      ctx.reply(
        "Sorry, you can't set reminder for messages older than 2 hours"
      );
      return;
    }

    ctx.reply("You will be reminded in 1 hour");
    setTimeout(async () => {
      const closingTodayMessage = await getClosingIpoMessage();
      await ctx.reply("As requested, here is your reminder");
      if (closingTodayMessage) {
        ctx.reply(closingTodayMessage, { parse_mode: "Markdown" });
      }
    }, 3600 * 1000); // 1 hour
  } catch (error) {
    console.error(error);
    ctx.reply("Something went wrong");
  }
};

const registerAllCommands = () => {
  bot.command("subscribe", (ctx) => handleSubscription(ctx, "subscribe"));
  bot.command("unsubscribe", (ctx) => handleSubscription(ctx, "unsubscribe"));
  bot.command("today", (ctx) => handleIpoMessage(ctx, "closingToday"));
  bot.command("all", (ctx) => handleIpoMessage(ctx, "all"));
  bot.command("thanks", (ctx) =>
    ctx.reply(`You're welcome, ${ctx.message.chat.first_name} ❤️`)
  );

  const startMessage =
    "Please select a command \n/subscribe - subscribe for daily IPO notifications\n/unsubscribe - unsubscribe from all notifications\n/today - get list of IPOs closing today\n/all - get list of all active IPOs";
  bot.help((ctx) => ctx.reply(startMessage));
  bot.start((ctx) => ctx.reply(startMessage));
  bot.on("message", (ctx) => ctx.reply("Invalid command"));

  bot.action("remind_me", handleRemindAction);
};

const startBot = async () => {
  try {
    registerAllCommands();
    await bot.launch(() => {
      console.log("Bot started");
    });
  } catch (error) {
    console.error("Failed to start bot:", error);
    process.exit(1);
  }
};

const stopBot = async () => {
  try {
    await bot.stop();
    console.log("Bot stopped");
    process.exit(0);
  } catch (error) {
    console.error("Failed to stop bot:", error);
    process.exit(1);
  }
};

const scheduleNotifications = () => {
  const notificationTask = cron.schedule(NOTIFICATION_CRON, sendNotifications, {
    name: "daily_notification",
    timezone: "Asia/Kolkata",
  });
  const interval = parser.parseExpression(NOTIFICATION_CRON);
  console.log(
    "Notification cron scheduled, first occurrence at: ",
    interval.next().getTime()
  );

  notificationTask.start();
};

process.once("SIGINT", stopBot);
process.once("SIGTERM", stopBot);

startBot();
scheduleNotifications();
