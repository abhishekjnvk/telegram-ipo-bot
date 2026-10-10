const axios = require('axios');
const cheerio = require('cheerio');
const db = require('./db');
const url = 'https://www.investorgain.com/report/live-ipo-gmp/331/';
let lastScrapedAt = null;

const formatDate = (date, format) => {
  return date.toLocaleString('en-GB', format).replace(',', '').split(' ').join('-');
};

const parseDate = dateStr => {
  const [day, month] = dateStr.split('-');
  const monthIndex = new Date(Date.parse(`${month} 1, 2023`)).getMonth();
  const year = new Date().getFullYear();
  return new Date(year, monthIndex, day).getTime();
};

const isDateInRange = (openDate, closeDate) => {
  const parseDate = (dateStr) => {
    const match = dateStr.match(/^(\d{1,2}-[A-Za-z]{3})/);

    if (!match) return null;

    const [day, month] = match[1].split('-');
    const monthIndex = new Date(`${month} 1, 2000`).getMonth();

    return new Date(new Date().getFullYear(), monthIndex, Number(day));
  };

  const open = parseDate(openDate);
  const close = parseDate(closeDate);

  if (!open || !close) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return today >= open && today <= close;
};

const getPercentageProfit = estListing => {
  if (!estListing) return null;
  const match = estListing.match(/\(([^)]+)%\)/);
  return match ? parseFloat(match[1]) : null;
};

const filterAlphaNumericInLowecase = (string) => string.toLowerCase().replace(/[^a-z0-9]/g, '');
const filterNumericChars=(str)=> str.replace(/[^0-9]/g, '');

const scrapIPOData = async (onlyClosingToday = false) => {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const tableData = [];
    const headers = [];

    $('table thead tr th').each((index, element) => {
      headers.push($(element).text().trim());
    });

    $('table tbody tr').each((index, element) => {
      const row = $(element);
      const cells = row.find('td');
      const rowData = {};

      headers.forEach((header, i) => {
        rowData[filterAlphaNumericInLowecase(header)] = $(cells[i]).text().trim();
      });

      const closeDate = rowData['close'];
      const openDate = rowData['open'];
      const isOpen = isDateInRange(openDate, closeDate);
      const isClosing = closeDate === formatDate(new Date(), { day: 'numeric', month: 'short' });
      if ((onlyClosingToday && isClosing) || (!onlyClosingToday && isOpen)) {
        tableData.push({
          ipo_name: rowData['name'],
          closing_today: isClosing,
          open: openDate,
          close: closeDate,
          gmp: rowData['gmp'],
          subscribed: rowData['sub'],
          listing: rowData['listing'],
          total_price: Number(filterNumericChars(rowData['lot'])) * Number(filterNumericChars(rowData['price'])),
          percentage_profit: getPercentageProfit(rowData['gmp'])
        });
      }
    });

    return tableData;
  } catch (error) {
    console.error('Error fetching the website:', error.message);
    return [];
  }
};

const scrapeTable = async () => {
  if (lastScrapedAt && Date.now() - lastScrapedAt < 4 * 60 * 60 * 1000) {
    console.log("IPO data already scraped in last 4 hours");
    return;
  }

  const ipoArr = await scrapIPOData();
  const ipoTableName = db.TABLE_NAME.IPO;

  await db.deleteAll(ipoTableName);
  await Promise.all(ipoArr.map(ipo => db.create(ipoTableName, ipo)));

  lastScrapedAt = Date.now();
  console.log("IPO data scraped successfully");
};

const getIPOData = async (filter = {}) => {
  await scrapeTable();
  const ipoTableName = db.TABLE_NAME.IPO;
  return await db.find(ipoTableName, filter);
};

const getClosingIPO = async () => {
  return await getIPOData({ closing_today: true });
};

const getAllIpo = async () => {
  return await getIPOData();
};

module.exports = { getClosingIPO, getAllIpo };
