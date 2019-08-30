const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
const mongoose = require("mongoose");
const mongoDBUrl = require("./config/keys_dev").mongoURI;
const Product = require("./model/product");

const url = "https://www.lenovo.com/pk/en/laptops/c/Laptops";
(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(url);
  const html = await page.evaluate(() => document.body.innerHTML);
  //const pageLinks = await getLinks(html);
  const pageLinks = [
    "https://www.lenovo.com/pk/en/laptops/thinkpad/t-series/ThinkPad-T480/p/22TP2TT4800",
    "https://www.lenovo.com/pk/en/laptops/thinkpad/x-series/X1-Carbon-Gen-7/p/22TP2TXX17G"
  ];
  let obj = [];
  let productDetails = [];
  obj = [...obj, ...pageLinks];
  for (let link of obj) {
    await page.goto(link);
    await page.waitFor(1000);
    const html = await page.evaluate(() => document.body.innerHTML);
    productDetails = [
      ...productDetails,
      await getProductDetails(page, html, link)
    ];
  }

  await savedetails(productDetails);
  await browser.close();
})();

async function getLinks(html) {
  const links = [];
  const $ = cheerio.load(html);
  $("a.vam-subseries").each(function() {
    const link = $(this).attr("href");
    if (!links.includes(link)) {
      links.push(`https://www.lenovo.com${link}`);
    }
  });
  return links;
}

async function getProductDetails(page, html, link) {
  const $ = cheerio.load(html);
  await page.goto(`${link}/gallery/image`);
  await page.waitFor(1000);
  html = await page.evaluate(() => document.body.innerHTML);
  const img = [];
  $(".galleria-image")
    .find("img")
    .each(function() {
      img.push($(this).attr("src"));
    });
  const detail = {
    brand: "lenovo",
    link,
    images: img,
    model: $("h1.desktopHeader")
      .text()
      .trim()
  };
  const tr = $("tbody").find("tr");
  tr.each(function(index, element) {
    const specTitle = $(element)
      .find("td:first-child")
      .text();
    const specDescription = $(element)
      .find("td:last-child")
      .text()
      .trim();
    const key = specTitle
      .toLowerCase()
      .trim()
      .replace(".", "")
      .replace('"', "")
      .replace("(", "")
      .replace(")", "")
      .split(" ")
      .join("_");
    detail[key] = specDescription;
  });

  return detail;
}

// Send Data to Data-Base
async function savedetails(productDetails) {
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
          ports: productDetail.ports,
          memory: productDetail.memory,
          graphics: productDetail.graphics,
          os: productDetail.operating_system,
          processor: productDetail.processor,
          display: productDetail.display,
          storage: productDetail.storage,
          camera: productDetail.camera,
          keyboard: productDetail.keyboard,
          speakers: productDetail.audio,
          ac_power: productDetail.ac_adapter,
          battery: productDetail.battery,
          wireless: productDetail.connectivity,
          weight: productDetail.weight,
          dimensions: productDetail.dimension_w_x_d_x_h,
          link: productDetail.link,
          images: productDetail.images,
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
