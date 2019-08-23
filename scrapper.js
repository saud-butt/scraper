const cheerio = require("cheerio");
const puppeteer = require("puppeteer");

const url = "https://www.reddit.com/r/news/";

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(url);
  const html = await page.evaluate(() => document.body.innerHTML);

  const $ = cheerio.load(html);
  const newsHeadlines = [];

  $('a[href*="/r/news/comments"]  > div > h3').each(function() {
    newsHeadlines.push({
      title: $(this).text()
    });
  });

  console.log(newsHeadlines);
  await browser.close();
})();
