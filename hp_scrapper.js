const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
// const mongoose = require("mongoose");
// const mongoDBUrl = require("./config/keys_dev").mongoURI;
// const Product = require("./model/product");

const url = [
  "https://store.hp.com/in-en/default/laptops-tablets.html?hp_facet_formfactor=Standard%20laptop&product_list_limit=30"
  // "https://store.hp.com/in-en/default/laptops-tablets.html?hp_facet_formfactor=Standard+laptop&p=2&product_list_limit=30",
  // "https://store.hp.com/in-en/default/laptops-tablets.html?hp_facet_formfactor=Standard+laptop&p=3&product_list_limit=30",
  // "https://store.hp.com/in-en/default/laptops-tablets.html?hp_facet_formfactor=Standard+laptop&p=4&product_list_limit=30",
  // "https://store.hp.com/in-en/default/laptops-tablets.html?hp_facet_formfactor=Standard+laptop&p=5&product_list_limit=30",
  // "https://store.hp.com/in-en/default/laptops-tablets/personal-laptops.html?hp_facet_usage=Gaming&p=1&product_list_limit=30",
  // "https://store.hp.com/in-en/default/laptops-tablets.html?hp_facet_formfactor%5B0%5D=Convertible&hp_facet_formfactor%5B1%5D=Detachable&product_list_limit=30",
  // "https://store.hp.com/in-en/default/laptops-tablets.html?hp_facet_formfactor%5B0%5D=Convertible&hp_facet_formfactor%5B1%5D=Detachable&p=2&product_list_limit=30",
  // "https://store.hp.com/in-en/default/laptops-tablets.html?hp_facet_formfactor=Mobile+workstation&product_list_limit=30"
];

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  let links = [];
  let productDetails = [];

  for (let URL of url) {
    await page.goto(URL);
    await page.waitFor(1000);
    let html = await page.evaluate(() => document.body.innerHTML);
    const pageLinks = await getProductLinks(html);
    links = [...links, ...pageLinks];

    // for (let link of links) {

    //   await page.waitFor(1000);
    //   html = await page.evaluate(() => document.body.innerHTML);
    //   productDetails = [...productDetails, await getProductDetails(html, link)];
    // }

    //Testing
    const link =
      "https://store.hp.com/in-en/default/hp-zbook-15v-g5-mobile-workstation-4ta08pa.html";
    await page.goto(link);
    html = await page.evaluate(() => document.body.innerHTML);
    productDetails = [...productDetails, await getProductDetails(html, link)];
  }
  console.log(links);
  console.log("Count = ", links.length);
  // console.log(productDetails);
  //await savedetails(productDetails);
  await browser.close();
})();

async function getProductLinks(html) {
  const links = [];
  const $ = cheerio.load(html);
  $("li.product-item").each(function() {
    const link = $(this)
      .find("a")
      .attr("href");
    if (!links.includes(link)) {
      links.push(link);
    }
  });
  return links;
}

async function getProductDetails(page, html, link) {
  const $ = cheerio.load(html);
  const details = {
    brand: "hp",
    link,
    cover: $("div.fotorama__active").attr("href"),
    category: "home",
    model: $("h1.page-title")
      .text()
      .trim()
  };
  const tr = $("tbody").find("tr");
  tr.each(function(index, element) {
    const specTitle = $(element)
      .find("th")
      .text();
    const specDescription = $(element)
      .find("td")
      .trim()
      .text();

    const key = specTitle
      .toLowerCase()
      .trim()
      // .replace(".", "")
      // .replace('"', "")
      .replace("(", "")
      .replace(")", "")
      // .replace("®", "")
      // .replace("/", "")
      .split(" ")
      .join("_");
    // .replace("io_input__output_ports", "ports")
    // .replace("io_inputoutput_ports", "ports")
    // .replace("connectivity", "wireless")
    // .replace("total-memeory", "memory")
    // .replace("security_features", "security")
    // .replace("ports__slots", "ports")
    // .replace("colorfinish", "color")
    // .replace("portslots", "ports")
    // .replace("color_options", "color")
    // .replace("dimensions_h_x_w_x_d", "dimensions_w_x_d_x_h")
    // .replace("backlit_keyboard", "keyboard")
    // .replace("webcam", "camera")
    // .replace("camera__webcam", "camera")
    // .replace("audio9", "audio")
    // .replace("wifibluetooth", "wireless");
    details[key] = specDescription;
  });

  return details;
}
