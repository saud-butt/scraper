const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
const mongoose = require("mongoose");
const mongoDBUrl = require("./config/keys_dev").mongoURI;
const Product = require("./model/product");

const url = [
  "https://us-store.acer.com/laptops/gaming?limit=25"
  // "https://us-store.acer.com/laptops/ultra-thin?limit=25",
  // "https://us-store.acer.com/laptops/convertible?limit=25",
  // "https://us-store.acer.com/laptops/detachable?limit=25",
  // "https://us-store.acer.com/laptops/chromebook?limit=25",
  // "https://us-store.acer.com/laptops/classic?limit=25"
];

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  let obj = [];
  let productDetails = [];
  for (let link of url) {
    await page.goto(link);
    await page.waitFor(1000);
    const html = await page.evaluate(() => document.body.innerHTML);
    //  const pageLinks = await getLinks(html);

    const pageLinks = [
      "https://us-store.acer.com/laptops/gaming/nitro-7-gaming-laptop-an715-51-70tg",
      "https://us-store.acer.com/laptops/gaming/predator-helios-300-ph315-51-785a"
    ];

    obj = [...obj, ...pageLinks];

    for (let link of obj) {
      await page.goto(link);
      await page.waitFor(1000);
      const html = await page.evaluate(() => document.body.innerHTML);
      productDetails = [...productDetails, await getProductDetails(html, link)];
    }
  }

  await saveDetails(productDetails);
  //console.log(productDetails);
  // console.log("Count", productDetails.length);
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

async function getProductDetails(html, link) {
  const $ = cheerio.load(html);
  const detail = {
    brand: "acer",
    link,
    model: $("span.h1")
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
  $("img.gallery-image").each(function() {
    img.push($(this).attr("src"));
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
          screen_size: productDetail.screen_size,
          display_screen_type: productDetail.display_screen_type,
          display_screen_technology: productDetail.display_screen_technology,
          screen_mode: productDetail.screen_mode,
          screen_resolution: productDetail.screen_resolution
        };
        const graphics = {
          graphics_controller_manufacturer:
            productDetail.graphics_controller_manufacturer,
          graphic: productDetail.graphics,
          graphics_memory_capacity: productDetail.graphics_memory_capacity,
          graphics_memory_technology: productDetail.graphics_memory_technology,
          graphics_memory_accessibility:
            productDetail.graphics_memory_accessibility
        };
        const memory = {
          standard_memory: productDetail.standard_memory,
          memory_technology: productDetail.memory_technology,
          no_of_total_memory_slots: productDetail.no_of_total_memory_slots
        };
        const storage = {
          ssd: productDetail.ssd,
          hdd: productDetail.hdd
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
          no_of_speaker: productDetail.no_of_speaker,
          speaker_output_mode: productDetail.speaker_output_mode
        };
        const wireless = {
          wireless_lan_standard: productDetail.wireless_lan_standard,
          bluetooth_standard: productDetail.bluetooth_standard
        };
        const dimensions = {
          height: productDetail.height,
          width: productDetail.width,
          depth: productDetail.depth
        };

        const product = new Product({
          brand: productDetail.brand,
          name: productDetail.model,
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
