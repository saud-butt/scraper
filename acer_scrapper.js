const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
const mongoose = require("mongoose");
const mongoDBUrl = require("./config/keys_dev").mongoURI;
const Product = require("./model/product");

const url = [
  "https://us-store.acer.com/laptops/ultra-thin?limit=25",
  "https://us-store.acer.com/laptops/convertible?limit=25",
  "https://us-store.acer.com/laptops/detachable?limit=25",
  "https://us-store.acer.com/laptops/chromebook?limit=25",

  "https://us-store.acer.com/laptops/classic?limit=25",
  "https://us-store.acer.com/laptops/gaming?limit=25"
];

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  let obj = [];
  let category;
  let productDetails = [];
  for (let link of url) {
    if (link == "https://us-store.acer.com/laptops/gaming?limit=25") {
      category = "gaming";
    } else if (
      link == "https://us-store.acer.com/laptops/convertible?limit=25" ||
      "https://us-store.acer.com/laptops/detachable?limit=25"
    ) {
      category = "tablet";
    } else {
      category = "standard";
    }
    await page.goto(link);
    await page.waitFor(1000);
    const html = await page.evaluate(() => document.body.innerHTML);
    const pageLinks = await getLinks(html);

    // const pageLinks = [
    //   //    "https://store.acer.com/en-us/laptops/gaming/nitro-7-gaming-laptop-an715-51-70tg",
    //   "https://store.acer.com/en-us/laptops/gaming/predator-helios-300-ph315-51-71fs"
    // ];

    obj = [...obj, ...pageLinks];

    for (let link of pageLinks) {
      await page.goto(link);
      await page.waitFor(5000);
      const html = await page.evaluate(() => document.body.innerHTML);
      productDetails = [
        ...productDetails,
        await getProductDetails(html, link, category)
      ];
    }
  }

  await saveDetails(productDetails);
  //console.log(productDetails);
  //console.log("Count", productDetails.length);
  await browser.close();
})();

async function getLinks(html) {
  const links = [];
  const $ = cheerio.load(html);
  $(".product-name a").each(function() {
    const link = $(this).attr("href");
    if (!links.includes(link)) {
      links.push($(this).attr("href"));
    }
  });
  return links;
}

async function getProductDetails(html, link, category) {
  const $ = cheerio.load(html);
  const detail = {
    brand: "acer",
    link,
    category,
    model: $("h1.page-title")
      .find("span.base")
      .text()
      .trim()
  };
  const tr = $("tbody").find("tr");
  tr.each(function(index, element) {
    const specTitle = $(element)
      .find("th.label")
      .text();
    const specDescription = $(element)
      .find("td.data")
      .text()
      .trim();
    const key = specTitle
      .toLowerCase()
      .trim()
      .replace("(", "")
      .replace("®", "")
      .replace("-", "_")
      .replace("™", "")
      .replace(".", "_")
      .replace(")", "")
      .replace("/", "")
      .split(" ")
      .join("_");
    detail[key] = specDescription;
  });

  const img = [];
  $("div.fotorama__nav__frame").each(function() {
    img.push(
      $(this)
        .find("img")
        .attr("src")
    );
  });
  detail.gallery = img;

  return detail;
}

async function saveDetails(productDetails) {
  mongoose
    .connect(mongoDBUrl, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false
    })
    .then(() => {
      for (let productDetail of productDetails) {
        const os = {
          operating_system: productDetail.operating_system,
          operating_system_architecture:
            productDetail.operating_system_architecture
        };
        const processor = {
          processor_type: productDetail.processor_type,
          processor_model: productDetail.processor_model,
          processor_core: productDetail.processor_core,
          processor_speed: productDetail.processor_speed,
          processor_speed_turbo: productDetail.processor_speed_turbo
        };
        const display = {
          size: productDetail.screen_size,
          type: productDetail.display_screen_type,
          technology: productDetail.display_screen_technology,
          mode: productDetail.screen_mode,
          resolution: productDetail.screen_resolution
        };
        const graphics = {
          manufacturer: productDetail.graphics_controller_manufacturer,
          model: productDetail.graphics,
          capacity: productDetail.graphics_memory_capacity,
          technology: productDetail.graphics_memory_technology,
          accessibility: productDetail.graphics_memory_accessibility
        };
        const memory = {
          memory: productDetail.standard_memory,
          memory_type: productDetail.memory_technology,
          max_capacity: productDetail.no_of_total_memory_slots
        };
        const storage = {
          hdd: productDetail.total_hard_drive_capacity
        };
        const ports = {
          hdmi: productDetail.hdmi,
          rj45: productDetail.rj45,
          card_reader: productDetail.memory_card_supported,
          mini_display_port: productDetail.mini_display_port,
          usb_2_0: productDetail.no_of_usb_2_0_ports,
          usb_3_0: productDetail.number_of_usb_3_1_gen_2_type_c_ports,
          usb_3_1: productDetail.number_of_thunderbolt_3_usb_3_1_ports,
          lan: productDetail.lan,
          audio_jack: productDetail.headphone_jack,
          io_ports: productDetail.io_ports
        };
        const battery = {
          cell: productDetail.number_of_cells,
          type: productDetail.battery_chemistry,
          capacity: productDetail.battery_capacity,
          run_time: productDetail.maximum_battery_runtime
        };
        const speakers = {
          speaker: productDetail.no_of_speaker,
          output: productDetail.speaker_output_mode
        };
        const wireless = {
          wifi: productDetail.wireless_lan_standard,
          bluetooth: productDetail.bluetooth_standard
        };
        const dimensions = {
          height: productDetail.height,
          width: productDetail.width,
          depth: productDetail.depth
        };

        const product = new Product({
          category: productDetail.category,
          brand: productDetail.brand,
          name: productDetail.model,
          cover: productDetail.gallery[0],
          ports,
          memory,
          graphics,
          os,
          processor,
          display,
          storage,
          camera: productDetail.webcam_resolution_front,
          keyboard: productDetail.keyboard_type,
          speakers,
          ac_power: productDetail.maximum_power_supply_wattage,
          battery,
          wireless,
          weight: productDetail.weight_approximate,
          dimensions,
          link: productDetail.link,
          images: productDetail.gallery,
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
