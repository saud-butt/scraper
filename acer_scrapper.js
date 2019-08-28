const cheerio = require("cheerio");
const puppeteer = require("puppeteer");

const url = [
  "https://us-store.acer.com/laptops/gaming?limit=25",
  "https://us-store.acer.com/laptops/ultra-thin?limit=25",
  "https://us-store.acer.com/laptops/convertible?limit=25",
  "https://us-store.acer.com/laptops/detachable?limit=25",
  "https://us-store.acer.com/laptops/chromebook?limit=25",
  "https://us-store.acer.com/laptops/classic?limit=25"
];

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  let URL = [];
  let obj = [];
  URL = [...url];
  for (let link of URL) {
    await page.goto(link);
    const html = await page.evaluate(
      () => document.body.querySelector("#products-list").innerHTML
    );
    const pageLinks = await getLinks(html);
    //console.log(pageLinks);

    obj = [...obj, ...pageLinks];

    let productDetails = [];
    for (let link of obj) {
      await page.goto(link);
      //   await page.waitFor(1000);
      productDetails = [
        ...productDetails,
        ...(await getProductDetails(html, link))
      ];
    }
  }
  console.log("Count", productDetails.length);
  await browser.close();
})();

// Get links of laptops
async function getLinks(html) {
  const links = [];
  const $ = cheerio.load(html);
  $(".product-name a").each(function() {
    const link = $(this).attr("href");
    if (!links.includes(link)) {
      links.push($(this).attr("href"));
    }
  });
  //   console.log("Count" + links.length);
  return links;
}

async function getProductDetails(html, link) {
  const obj = [];
  const $ = cheerio.load(html);
  const span = $("span.h1");
  span.each(function(index, h1) {
    obj.push({
      brand: "acer",
      link,
      model: $(h1)
        .text()
        .trim()
    });
  });
  const tr = $("tbody").find("tr");
  tr.each(function(index, element) {
    const ths = $(element).find("th.label");
    ths.each(function(index, th) {
      const text = $(th).text();
      const key = text
        .toLocaleLowerCase()
        .trim()
        .replace("(", "")
        .replace(")", "")
        .replace("/", "")
        .split(" ")
        .join("_");
      obj[index][key] = $(th)
        .text()
        .replace(text, "")
        .trim();
    });
  });
  console.log(productDetails);
  return obj;
}
