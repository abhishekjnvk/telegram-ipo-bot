const { getClosingIPO, getAllIpo } = require("./services/scrap");

const main = async () => {
  try {
    console.log("Fetching active IPOs...");
    const activeIpos = await getAllIpo();
    console.log(`Found ${activeIpos.length} active IPOs`);

    const closingIpos = await getClosingIPO();
    console.log(`Found ${closingIpos.length} IPOs closing today`);
  } catch (error) {
    console.error("Error running scraper:", error);
  }
};

main();
