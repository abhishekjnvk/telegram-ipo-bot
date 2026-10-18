const db = require("./db");
const { bot, REMINDER_MARKUP } = require("./telegram");
const { getClosingIPO, getAllIpo } = require("./scrap");

const formatMessage = (ipoArr, title, addFooter = false) => {
  const messageHeader = `*${title}:*\n\n`;
  const messageBody = ipoArr.map(ipo => (
    `*${ipo.ipo_name}*\n` +
    `*Open:* ${ipo.open}\n` +
    `*Close:* ${ipo.close}\n` +
    `*Listing:* ${ipo.listing}\n` +
    `*GMP:* ${ipo.gmp}\n` +
    `*Subscribed:* ${ipo.subscribed}\n` +
    `*Amount:* ${ipo.total_price}\n\n` +
    "==================\n\n"
  )).join('');

  const messageFooter = addFooter ? "/thanks - to thank the developer" : '';
  
  return `${messageHeader}${messageBody}${messageFooter}`;
};

const getClosingIpoMessage = async () => {
  const table = await getClosingIPO();
  return table.length ? formatMessage(table, "IPOs closing today", true) : null;
};

const getAllIpoMessage = async () => {
  const table = await getAllIpo();
  return table.length ? formatMessage(table, "Active IPOs") : null;
};

const sendNotifications = async () => {
  try {
    const message = await getClosingIpoMessage();
    if (message) {
      const subscribedUsers = await db.getAll("subscriptions");
      subscribedUsers.forEach(user => {
        bot.telegram.sendMessage(user._id, message, {
          parse_mode: "Markdown",
          reply_markup: REMINDER_MARKUP,
        });
      });
    } else {
      console.log("No IPOs for today");
    }
  } catch (error) {
    console.error("Error sending notifications:", error);
  }
};

module.exports = { sendNotifications, getClosingIpoMessage, getAllIpoMessage };
