const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
const mongoose = require("mongoose");
const mongoDBUrl = require("./config/keys_dev").mongoURI;
const Product = require("./model/product");

const url = [
  "https://www.gigabyte.com/Laptop#AERO-series"
  // "https://www.gigabyte.com/Laptop#All-Laptop"
];

// Main function
(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  let obj = [];
  let productDetails = [];
  // for (let link of url) {
  // await page.goto(link);
  // await page.waitFor(1000);
  // const html = await page.evaluate(() => document.body.innerHTML);
  // const pageLinks = await getProductLinks(html);
  const pageLinks = [
    "https://www.gigabyte.com/Laptop/AERO-17-HDR--Intel-9th-Gen",
    "https://www.gigabyte.com/Laptop/Sabre-15-G8"
  ];
  obj = [...obj, ...pageLinks];
  for (let link of obj) {
    await page.goto(`${link}/gallery#gallery`);
    await page.waitFor(1000);
    let html = await page.evaluate(() => document.body.innerHTML);
    const images = [];
    const $ = cheerio.load(html);
    $(".gallery-list-item").each(function() {
      images.push(
        $(this)
          .find("img")
          .attr("src")
      );
    });

    productDetails.gallery = images;

    await page.goto(`${link}/sp#sp`);
    await page.waitFor(1000);
    html = await page.evaluate(() => document.body.innerHTML);
    productDetails = [...productDetails, await getProductDetails(html, link)];
  }
  //await saveObject(productDetails);
  console.log(productDetails);
  console.log("Count", productDetails.length);
  //}

  await browser.close();
})();

async function getProductLinks(html) {
  const links = [];
  const $ = cheerio.load(html);
  $(".product-box-head").each(function() {
    const link = $(this).attr("href");
    if (!links.includes(link)) {
      links.push(`https://www.gigabyte.com${link}`);
    }
  });
  return links;
}
// Get product details and save as array of objects
async function getProductDetails(html, link) {
  const $ = cheerio.load(html);
  const detail = [];
  const model = $("div.owl-item");
  model.each(function(index, name) {
    detail.push({
      brand: "gigabyte",
      link,
      model: $(name)
        .find("div.childModel div.name")
        .text()
        .trim()
    });

    const col = $(model).find("div.childModel div.specRow");
    col.each(function(index, element) {
      const rows = $(element).find(".specText");
      rows.each(function(index, row) {
        const specTitle = $(row)
          .find(".specTitle")
          .text();
        const specDescription = $(row)
          .find("div:last-child")
          .text()
          .trim();
        const key = specTitle
          .toLowerCase()
          .trim()
          .replace("/", "")
          .split(" ")
          .join("_");
        detail[index][key] = specDescription;
      });
    });
  });

  return detail;
}

// Send Data to Data-Base
async function saveObject(productDetails) {
  mongoose
    .connect(mongoDBUrl, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false
    })
    .then(() => {
      for (let productDetail of productDetails) {
        const product = new Product({
          brand: productDetail.brand,
          name: productDetail.model,
          ports: productDetail.io_port,
          memory: productDetail.system_memory,
          graphics: productDetail.video_graphics,
          os: productDetail.os,
          processor: productDetail.cpu,
          display: productDetail.display,
          chipset: productDetail.chipset,
          storage: productDetail.storage,
          camera: productDetail.webcam,
          keyboard: productDetail.keyboard_type,
          speakers: productDetail.audio,
          ac_power: productDetail.adapter,
          battery: productDetail.battery,
          wireless: productDetail.communications,
          weight: productDetail.weight,
          dimensions: productDetail.dimensions,
          link: productDetail.link,
          images: productDetail.gallery,
          security: productDetail.security
        })
          .save()
          .then(createdProduct => {
            mongoose.disconnect();
          })
          .catch(err => console.log(err));
      }
    })
    .catch(e => console.log(`MongoDB Error: ${e}`));
}
