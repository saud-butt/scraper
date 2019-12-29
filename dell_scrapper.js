const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
const mongoose = require("mongoose");
const mongoDBUrl = require("./config/keys_dev").mongoURI;
const Product = require("./model/product");

const url = [
  "https://www.dell.com/pk/p/laptops.aspx?c=pk&l=en&s=dhs&~ck=mn",
  "https://www.dell.com/p/dell-tablets.aspx?c=pk&l=en&s=dhs&~ck=mn"
];

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  let links = [];
  let productDetails = [];
  let category;
  for (let URL of url) {
    await page.goto(URL);
    let html = await page.evaluate(() => document.body.innerHTML);
    const pageLinks = await getProductLinks(html);
    links = [...links, ...pageLinks];
    if (
      url == "https://www.dell.com/pk/p/laptops.aspx?c=pk&l=en&s=dhs&~ck=mn"
    ) {
      category = "standard";
    } else {
      category = "gaming";
    }
    for (let link of links) {
      await page.goto(link);
      await page.waitFor(1000);
      html = await page.evaluate(() => document.body.innerHTML);
      productDetails = [
        ...productDetails,
        await getProductDetails(html, link, category)
      ];
    }
  }

  // // TESTING
  // const link =
  //   "https://www.dell.com/pk/p/inspiron-14-3480-laptop/pd?ref=PD_Family";
  // await page.goto(link);
  // html = await page.evaluate(() => document.body.innerHTML);
  // productDetails = [...productDetails, await getProductDetails(html, link)];

  //console.log(productDetails);
  await savedetails(productDetails);
  await browser.close();
})();

async function getProductLinks(html) {
  const links = [];
  const $ = cheerio.load(html);
  $("div.row")
    .find("div.seriesOptions")
    .find("a")
    .each(function() {
      const link = $(this).attr("href");
      if (!links.includes(link)) {
        links.push(`https://www.dell.com${link}`);
      }
    });
  return links;
}

async function getProductDetails(html, link, category) {
  const $ = cheerio.load(html);
  const img = [];
  img.push(
    `https:${$("div#heroContent")
      .find("img")
      .attr("src")}`
  );
  const details = {
    brand: "dell",
    model: $("#mastheadPageTitle")
      .text()
      .trim()
      .replace("\n\t\t\t\t\t\t\t\t", ""),
    link,
    category,
    gallery: img
  };

  let key = "";
  $(".singleConfig")
    .find("div")
    .each(function() {
      if ($(this).hasClass("specTitle")) {
        key = $(this)
          .text()
          .toLowerCase()
          .trim()
          .replace("&", "")
          .split(" ")
          .join("_");
      } else {
        details[key] = $(this)
          .text()
          .trim();
      }
    });

  return details;
}

async function savedetails(productDetails) {
  mongoose
    .connect(mongoDBUrl, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false
    })
    .then(() => {
      for (let productDetail of productDetails) {
        const memory = {
          memory: productDetail.memory1
        };
        const storage = {
          hdd: productDetail.hard_drive
        };
        const ports = {
          hdmi: productDetail.ports
        };
        const speakers = {
          speaker: productDetail.audio_and_speakers
        };
        const dimensions = {
          height: productDetail.dimensions__weight
        };
        const os = {
          operating_system: productDetail.operating_system
        };
        const display = {
          type: productDetail.display
        };
        const processor = {
          processor_type: productDetail.processor
        };
        const graphics = {
          model: productDetail.video_card
        };
        const wireless = {
          wifi: productDetail.wireless
        };

        const product = new Product({
          category: productDetail.category,
          brand: productDetail.brand,
          cover: productDetail.gallery[0],
          name: productDetail.model,
          ports,
          memory,
          graphics,
          os,
          processor,
          display,
          opticaldrive: productDetail.optical_drive,
          storage,
          camera: productDetail.camera,
          speakers,
          wireless,
          dimensions,
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
