require("dotenv").config();
const { bot } = require("./services/telegram");
const db = require("./services/db");
const {
  getClosingIpoMessage,
  getAllIpoMessage,
} = require("./services/notification");

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

process.once("SIGINT", stopBot);
process.once("SIGTERM", stopBot);

startBot();
