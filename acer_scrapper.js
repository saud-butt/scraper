const cheerio = require("cheerio");
const puppeteer = require("puppeteer");

const url = "https://us-store.acer.com/laptops";

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(url);
  console.log("Page opened");
})();
