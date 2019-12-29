const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
const mongoose = require("mongoose");
const mongoDBUrl = require("./config/keys_dev").mongoURI;
const Product = require("./model/product");

// const url =[
//   "https://pricebaba.com/laptop/pricelist/razer-laptop-price-list-in-india",
//"https://pricebaba.com/laptop/pricelist/hp-laptops?brand=BRND-HP&limit=40&active=true&status=10&status=20&status=30&start=0&sort=latest-desc&page=2",
//"https://pricebaba.com/laptop/pricelist/asus-laptops?brand=BRND-ASUS&active=true&status=10&status=20&status=30&sort=latest-desc&&page=2"
//""https://pricebaba.com/laptop/pricelist/2-in-1-laptops?page=2"
//""https://pricebaba.com/laptop/pricelist/gigabyte-laptop-price-list-in-india"
//"https://pricebaba.com/laptop/pricelist/gigabyte-laptop-price-list-in-india?brand=BRND-APPLE&brand=BRND-GIGABYTE&active=true&status=10&status=20&status=30&sort=popularity-desc&start=0&limit=40"
//];

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  //for (let i = 2; i < 12; i++) {
  await page.goto(
    "https://pricebaba.com/laptop/pricelist/gigabyte-laptop-price-list-in-india?brand=BRND-APPLE&brand=BRND-GIGABYTE&active=true&status=10&status=20&status=30&sort=popularity-desc&page=2"
  );
  const html = await page.evaluate(() => document.body.innerHTML);
  const pageLinks = await getLinks(html);

  //   const pageLinks = [
  //     "https://pricebaba.com/laptop/hp-15-db1061au-8vy90pa-ryzen-5-4gb-1tb-hdd-windows",

  //     "https://pricebaba.com/laptop/hp-15-db0244au-7wr12pa-amd-a9-apu-4gb-1tb-hdd-windows"
  //   ];

  let productDetails = [];

  for (let link of pageLinks) {
    await page.goto(link);
    await page.waitFor(1000);
    const html = await page.evaluate(() => document.body.innerHTML);
    productDetails = [
      ...productDetails,
      await getProductDetails(page, html, link)
    ];
    await page.goto(`${link}#showLargeGallery`);
    await page.waitFor(1000);
    const gallery = await page.evaluate(() => document.body.innerHTML);
    productDetails = await getGallery(gallery, link, productDetails);
  }

  //console.log(pageLinks);
  //console.log("count = " + pageLinks.length);
  //console.log(productDetails);
  await savedetails(productDetails);
  // }
  await browser.close();
})();

async function getLinks(html) {
  const links = [];
  const $ = cheerio.load(html);
  $("div.col-12.p-h-xs.v-al-top.flt-l").each(function() {
    const link = $(this)
      .find("div.col-8.v-al-mdl")
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
    brand: "apple",
    link,
    category: "standard",
    price: $("span.txt-xl")
      .text()
      .trim()
      .replace("Rs. ", "")
      .replace(",", "")
      .replace(",", ""),
    model: $("h1.txt-wt-b")
      .text()
      .trim(),
    cover: $("img.gllry__img").attr("data-src")
  };
  const tr = $("div#keyspecificationsTab")
    .find("ul.keyspec")
    .find("li.p-b-m");
  tr.each(function(index, element) {
    const specTitle = $(element)
      .find("span")
      .text();
    const specDescription = $(element)
      .find("ul.m-t-s")
      .text()
      .trim();
    const key = specTitle
      .toLowerCase()
      .trim()
      //   .replace(".", "")
      //   .replace('"', "")
      //   .replace("(", "")
      //   .replace(")", "")
      //   .replace("®", "")
      //   .replace("/", "")
      .split(" ")
      .join("_");
    //   .replace("io_input__output_ports", "ports")
    //   .replace("io_inputoutput_ports", "ports")
    //   .replace("connectivity", "wireless")
    //   .replace("total-memeory", "memory")
    //   .replace("security_features", "security")
    //   .replace("ports__slots", "ports")
    //   .replace("colorfinish", "color")
    //   .replace("portslots", "ports")
    //   .replace("color_options", "color")
    //   .replace("dimensions_h_x_w_x_d", "dimensions_w_x_d_x_h")
    //   .replace("backlit_keyboard", "keyboard")
    //   .replace("webcam", "camera")
    //   .replace("camera__webcam", "camera")
    //   .replace("audio9", "audio")
    //   .replace("wifibluetooth", "wireless");
    details[key] = specDescription;
  });

  return details;
}

async function getGallery(html, link, productDetails) {
  const images = [];
  const $ = cheerio.load(html);
  $("img.gllry__img").each(function() {
    images.push($(this).attr("data-src"));
  });

  productDetails.filter(productDetail => {
    if (link === productDetail.link) {
      productDetail.gallery = images;
      return true;
    }
  });
  return productDetails;
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
        const storage = {
          hdd: productDetail.storage
        };

        const battery = {
          type: productDetail.battery
        };
        const speakers = {
          speaker: productDetail.audio
        };

        const os = {
          operating_system: productDetail.os
        };
        const display = {
          type: productDetail.display
        };
        const processor = {
          processor_type: productDetail.performance
        };

        const wireless = {
          wifi: productDetail.ports_and_connectivity
        };

        const product = new Product({
          category: productDetail.category,
          brand: productDetail.brand,
          name: productDetail.model,
          cover: productDetail.cover,
          price: productDetail.price,
          os,
          processor,
          display,
          storage,
          camera: productDetail.webcam,
          speakers,
          battery,
          wireless,
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
