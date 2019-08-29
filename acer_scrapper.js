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
      // await page.click("dt.last span");
      //   await page.waitFor(1000);
      // const html = await page.evaluate(() => document.body.innerHTML);
      productDetails = [
        ...productDetails,
        ...(await getProductDetails(html, link))
      ];
    }
  }
  console.log(productDetails);
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

  // Get model name
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

  // Get info (Key->th:value->td)
  const tr = $("tbody").find("tr"); //document.body.querySelectorAll("tbody > tr");
  tr.each(function(index, element) {
    const td = $(element).find("td.data"); //document.body.querySelector(`${element} > td.data`);
    const th = $(element).find("th.label"); //document.body.querySelector(`${element} > th.label`);
    const text = $(th).text();
    const key = text
      .toLowerCase()
      .trim()
      .replace("(", "")
      .replace(")", "")
      .replace("/", "")
      .split(" ")
      .join("_");
    obj[index][key] = $(td)
      .text()
      .replace(text, "")
      .trim();
  });

  // Get images
  const img = [];
  $("img.gallery-image").each(function() {
    img.push($(this).attr("src"));
  });
  obj[index][gallery] = img;

  return obj;
}
