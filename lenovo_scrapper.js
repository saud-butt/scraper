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
  const pageLinks = await getLinks(html);

  // const pageLinks = [
  //   "https://www.lenovo.com/pk/en/laptops/ideapad/l-series/IdeaPad-L340-17IRH-Gaming/p/88IPL301162"
  //   "https://www.lenovo.com/pk/en/laptops/legion-laptops/legion-y-series/Lenovo-Legion-Y530-15ICH/p/88GMY501020"
  // ];

  let productDetails = [];

  for (let link of pageLinks) {
    await page.goto(link);
    await page.waitFor(1000);
    const html = await page.evaluate(() => document.body.innerHTML);
    productDetails = [
      ...productDetails,
      await getProductDetails(page, html, link)
    ];
    await page.goto(`${link}/gallery/image`);
    await page.waitFor(1000);
    const gallery = await page.evaluate(() => document.body.innerHTML);
    productDetails = await getGallery(gallery, link, productDetails);
  }

  //console.log(productDetails);
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
  const details = {
    brand: "lenovo",
    link,
    category: "home",
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
      .replace("®", "")
      .replace("/", "")
      .split(" ")
      .join("_")
      .replace("io_input__output_ports", "ports")
      .replace("connectivity", "wireless")
      .replace("total-memeory", "memory")
      .replace("security_features", "security")
      .replace("ports__slots", "ports")
      .replace("colorfinish", "color")
      .replace("portslots", "ports")
      .replace("color_options", "color")
      .replace("w_x_d_x_h", "h_x_w_x_d")
      .replace("backlit_keyboard", "keyboard")
      .replace("webcam", "camera")
      .replace("camera__webcam", "camera")
      .replace("audio9", "audio")
      .replace("wifibluetooth", "wireless");
    details[key] = specDescription;
  });

  return details;
}

async function getGallery(html, link, productDetails) {
  const images = [];
  const $ = cheerio.load(html);
  $("img").each(function() {
    images.push(`https://www.lenovo.com${$(this).attr("src")}`);
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
        const memory = {
          memory_type: productDetail.memory
        };
        const storage = {
          hdd: productDetail.storage
        };
        const ports = {
          hdmi: productDetail.ports
        };
        const battery = {
          type: productDetail.battery
        };
        const speakers = {
          speaker: productDetail.audio
        };
        const dimensions = {
          speaker: productDetail.dimension_w_x_d_x_h
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
          model: productDetail.graphics
        };
        const wireless = {
          wifi: productDetail.wlan
        };

        const product = new Product({
          category: productDetail.category,
          brand: productDetail.brand,
          name: productDetail.model,
          ports,
          memory,
          graphics,
          os,
          processor,
          display,
          storage,
          camera: productDetail.webcam,
          speakers,
          battery,
          wireless,
          weight: productDetail.weight,
          dimensions,
          link: productDetail.link,
          images: productDetail.gallery,
          security: productDetail.security,
          color: productDetail.color
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
