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
    await page.goto(link);
    // await page.waitFor(1000);
    // await page.evaluate(() => document.body.innerHTML);
    // const images = [];
    // const $ = cheerio.load(html);
    // $(".gallery-list-item").each(function() {
    //   images.push(
    //     $(this)
    //       .find("img")
    //       .attr("src")
    //   );
    // });

    // productDetails.gallery = images;

    await page.goto(`${link}/sp#sp`);
    await page.waitFor(1000);
    const html = await page.evaluate(() => document.body.innerHTML);
    productDetails = [
      ...productDetails,
      ...(await getProductDetails(html, link))
    ];
    console.log(productDetails);
  }
  // await saveObject(productDetails);
  //console.log(productDetails);
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
  const obj = [];
  const $ = cheerio.load(html);

  $(".childModel").each(function() {
    const detail = {
      brand: "gigabyte",
      link,
      model: $(".name")
        .text()
        .trim()
    };
    const data = $(".specRow");
    data.each(function(index, element) {
      const specTitle = $(element)
        .find(".specTitle")
        .text();
      const specDescription = $(element)
        .find(".specText:not(.specTitle)")
        .text()
        .trim();
      const key = specTitle
        .toLowerCase()
        .trim()
        .replace("/", "")
        .split(" ")
        .join("_");
      detail[key] = specDescription;
    });
  });

  return obj;
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
        const memory = {
          memory_type: productDetail.memory_type,
          no_of_dimm_slots: productDetail.no_of_dimm_slots,
          max_capacity: productDetail.max_capacity
        };
        const storage = {
          ssd: productDetail.ssd,
          hdd: productDetail.hdd
        };
        const ports = {
          hdmi: productDetail.hdmi,
          rj45: productDetail.rj45,
          card_reader: productDetail.card_reader,
          mini_display_port: productDetail.mini_display_port,
          usb: productDetail.usb,
          lan: productDetail.lan,
          audio_jack: productDetail.audio_jack,
          io_ports: productDetail.io_ports
        };
        const battery = {
          cell: productDetail.battery_cell,
          type: productDetail.battery_type,
          whr: productDetail.battery_whr
        };
        const speakers = {
          speaker: productDetail.speaker,
          woofer: productDetail.woofer
        };

        const product = new Product({
          brand: productDetail.brand,
          name: productDetail.model,
          ports,
          memory,
          graphics: productDetail.graphics,
          os: productDetail.os,
          processor: productDetail.cpu,
          display: productDetail.display,
          chipset: productDetail.chipset,
          storage,
          camera: productDetail.webcam,
          keyboard: productDetail.keyboard,
          speakers,
          ac_power: productDetail.ac_adapter,
          battery,
          wireless: productDetail.wireless_lan__bluetooth,
          weight: productDetail.weight_w_battery,
          dimensions: productDetail.dimension_wxdxh_mm,
          link: productDetail.link,
          images: productDetail.gallery
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
