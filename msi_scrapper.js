const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
const mongoose = require("mongoose");
const mongoDBUrl = require("./config/keys_dev").mongoURI;
const Product = require("./model/product");

// Connect MongoDB

const url =
  "https://www.msi.com/Laptop/Products#?tag_multi_select=579,580,581,582,583,2011";

// Main function
(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(url);
  let obj = [];
  let hasNextPage = true;
  while (hasNextPage) {
    await page.waitFor(1000);
    const pageDetail = await prepareNextPage(page);
    hasNextPage = pageDetail.hasNextPage;
    const pageLinks = await getProductionLinks(pageDetail.html);
    obj = [...obj, ...pageLinks];
    if (hasNextPage) {
      await page.click(
        `#mainbox2 > ul.pagination > li:not(.last_li):nth-child(${pageDetail.nextLinkIndex}) > a`
      );
    }
  }
  let productDetails = [];
  for (let link of obj) {
    await page.goto(`${link}/Specification`);
    await page.waitFor(1000);
    const html = await page.evaluate(() => document.body.innerHTML);
    productDetails = [
      ...productDetails,
      ...(await getProductDetails(html, link))
    ];
    await page.goto(`${link}/Gallery`);
    await page.waitFor(1000);
    const gallery = await page.evaluate(() => document.body.innerHTML);
    productDetails = await getGallery(gallery, link, productDetails);
  }
  await saveObject(productDetails);
  console.log("Count", productDetails.length);
  await browser.close();
})();

// Get the next page ready to open
async function prepareNextPage(page) {
  return page.evaluate(() => {
    const nodes = document.body
      .querySelector(".pagination")
      .querySelectorAll("li:not(.last_li)");
    const nextLinkIndex = nodes.length;
    const nextLink = nodes[nextLinkIndex - 1];
    return {
      hasNextPage: !nextLink.classList.value.includes("active"),
      html: document.body.querySelector("#product_box_list").innerHTML,
      nextLinkIndex
    };
  });
}

// Get links of all the laptops on site
async function getProductionLinks(html) {
  const links = [];
  const $ = cheerio.load(html);
  $("a.productcard-link").each(function() {
    const link = $(this).attr("href");
    if (!links.includes(link)) {
      links.push($(this).attr("href"));
    }
  });
  return links;
}

// Get product details and save as array of objects
async function getProductDetails(html, link) {
  const obj = [];
  const $ = cheerio.load(html);
  const ths = $("thead")
    .find("tr")
    .find("td:not(.info)");
  ths.each(function(index, td) {
    obj.push({
      brand: "msi",
      link,
      model: $(td)
        .text()
        .trim()
    });
  });
  const tr = $("tbody").find("tr");
  tr.each(function(index, element) {
    const tds = $(element).find("td");
    tds.each(function(index, td) {
      const span = $(td).find("span");
      const text = span.text();
      const key = text
        .toLowerCase()
        .trim()
        .replace("(", "")
        .replace(")", "")
        .replace("&", "")
        .replace("/", "")
        .split(" ")
        .join("_");
      obj[index][key] = $(td)
        .text()
        .replace(text, "")
        .trim();
    });
  });
  return obj;
}

// Get image links
async function getGallery(html, link, productDetails) {
  const links = [];
  const $ = cheerio.load(html);
  $(".img-responsive").each(function() {
    links.push($(this).attr("src"));
  });

  productDetails.filter(productDetail => {
    if (link === productDetail.link) {
      productDetail.gallery = links;
      return true;
    }
  });
  return productDetails;
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
