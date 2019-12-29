const cheerio = require("cheerio");
const puppeteer = require("puppeteer");

const url = "https://www.razer.com/gaming-laptops";

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  //await page.goto(url);
  //let html = await page.evaluate(() => document.body.innerHTML);
  //const pageLinks = await getProductLinks(html);
  const pageLink1 = [
    "https://www.razer.com/gaming-laptops/razer-blade",
    "https://www.razer.com/gaming-laptops/razer-blade-stealth",
    "https://www.razer.com/gaming-laptops/razer-blade-15-v1"
  ];
  const pageLink2 =
    "https://www.razer.com/comparisons/blade-pro?_ga=2.228099925.958463292.1567401537-766502304.1566317377";
  const pageLink3 =
    "https://www.razer.com/gaming-laptops/razer-blade-stealth-v4";
  const pageLink4 = "https://www.razer.com/gaming-laptops/razer-blade-pro";
  let links = [];
  let productDetails = [];

  //links = [...links, ...pageLink1];
  //   for (let link of links) {
  //     await page.goto(link);
  //     await page.waitFor(1000);
  //     html = page.evaluate(() => document.body.innerHTML);
  //     productDetails = [
  //       ...productDetails,
  //       ...(await getProductDetails1(html, link))
  //     ];
  //   }

  const link = "https://www.razer.com/gaming-laptops/razer-blade-15-v1";
  await page.goto(link);
  await page.waitFor(1000);
  const html = await page.evaluate(() => document.body.innerHTML);
  productDetails = [...productDetails, await getProductDetails2(html, link)];

  //   await page.goto(pageLink4);
  //   await page.waitFor(1000);
  //   const html = await page.evaluate(() => document.body.innerHTML);
  //   productDetails = [
  //     ...productDetails,
  //     await getProductDetails4(html, pageLink4)
  //   ];

  //   await page.goto(pageLink3);
  //   await page.waitFor(1000);
  //   const html = await page.evaluate(() => document.body.innerHTML);
  //   productDetails = [
  //     ...productDetails,
  //     await getProductDetails3(html, pageLink3)
  //   ];

  console.log(productDetails);
  console.log("Count = " + productDetails.length);

  await browser.close();
})();

async function getProductLinks(html) {
  const links = [];
  const $ = cheerio.load(html);
  $("div.categorised-content-listing-item-image").each(function() {
    const link = $(this)
      .find("a")
      .attr("href");
    if (!links.includes(link)) {
      links.push(`https://www.razer.com${link}`);
    }
  });
  links.splice(6, 17);
  links.splice(2, 2);
  return links;
}

async function getProductDetails1(html, link) {
  const $ = cheerio.load(html);
  const details = [];

  const models = $("div.container")
    .find("div.compare-row")
    .find("div.compare-group")
    .find("div.text-center");
  models.each(function(index, model) {
    details.push({
      brand: "razer",
      category: "gaming",
      link,
      model: $(model)
        .find("p")
        .text()
        .trim()
    });
  });
  return details;
}

async function getProductDetails4(html, link) {
  const $ = cheerio.load(html);
  const details = [];
  const img = [];
  $(".gallery-content")
    .find("a")
    .each(function() {
      img.push(
        $(this)
          .find("img")
          .attr("src")
      );
    });
  details.push({
    brand: "razer",
    link,
    category: "gaming",
    gallery: img
  });

  const specs = $("div.container").find("div.bordered");
  specs.each(function() {
    const specTitle = $(this).find("div.col-sm-3 h3");
    const specDescription = $(this)
      .find("div.col-sm-9")
      .text()
      .trim();
    const key = specTitle
      .text()
      .toLowerCase()
      .trim()
      .replace("&", "")
      .replace("/", "")
      .replace("keyboard__trackpad", "keyboard")
      .split(" ")
      .join("_");
    details[key] = specDescription;
  });

  return details;
}

async function getProductDetails3(html, link) {
  const $ = cheerio.load(html);
  const details = [];
  const img = [];
  $(".logo-images")
    .find("a")
    .each(function() {
      img.push($(this).attr("href"));
    });
  details.push({
    brand: "razer",
    link,
    category: "gaming",
    gallery: img,
    model: $(".sub-menu-product-title")
      .text()
      .trim()
  });

  const specs = $("div.border_bottom");
  specs.each(function() {
    const specTitle = $(this).find(".title");
    const specDescription = $(this)
      .find("div.col-xs-12")
      .text()
      .trim()
      .replace("\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t\t", " ")
      .replace("\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t", " ")
      .replace("\n\t\t\t\t\t\t\t\t\t", " ")
      .replace("\n\t\t\t\t\t\t\t\t\t", " ")
      .replace("\n\t\t\t\t\t\t\t\t\t", " ")
      .replace("\n\t\t\t\t\t\t\t\t\t", " ")
      .replace("\n\t\t\t\t\t\t\t\t\t", " ")
      .replace("\n\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t", " ");
    const key = specTitle
      .text()
      .toLowerCase()
      .trim()
      .replace("&", "")
      .replace("/", "")
      .replace("(", "")
      .replace(")", "")
      .replace(".", "")
      .split(" ")
      .join("_")
      .replace("operating_system", "os")
      .replace("processors", "processor")
      .replace("input__output", "ports")
      .replace("keyboard__trackpad", "keyboard")
      .replace("web_camera", "camera")
      .replace("power__battery", "battery_and_power")
      .replace("size_approx", "dimensions")
      .replace("finish__color", "finish")
      .replace("weight_approx", "approx_weight");
    details[key] = specDescription;
  });

  return details;
}

async function getProductDetails2(html, link) {
  const $ = cheerio.load(html);
  const details = [];
  const img = [];

  let span = $("div.sub-menu-price-panel")
    .find("div.cost")
    .find("span")
    .text();
  let text = $("div.sub-menu-price-panel")
    .find("div.cost")
    .text();
  let info = text.split(span).join("");

  details.push({
    brand: "razer",
    category: "gaming",
    model: $("h1.sub-menu-product-title")
      .text()
      .trim(),
    price: info
      .trim()
      .replace("US$", "")
      .replace(",", "")
      .replace(".99", "")
      .replace("From   "),
    link
  });

  $(".gallery-content")
    .find("a")
    .each(function() {
      img.push(
        $(this)
          .find("img")
          .attr("src")
      );
    });

  const models = $("col-xs-6");
  models.each(function() {
    details.push({
      model: $(this)
        .find("p.product-name")
        .text()
        .trim(),
      cover: $(this)
        .find("img")
        .attr("src")
    });
  });

  const titles = $("div.container:last-child").find(
    "div.col-xs-12, div.compare-group"
  );
  titles.each(function() {
    const title = $(this).find("div h2");
    const specTitle = title.text();
    const key = specTitle
      .toLowerCase()
      .trim()
      .replace("®", "")
      .replace("&", "")
      .split(" ")
      .join("_");
    //console.log(key);

    let descriptions = $(this).find("div.col-xs-12");
    if (descriptions) {
      descriptions.each(function(index, description) {
        const specDescription = $(description).text();
        details[key] = specDescription.trim().replace(specTitle, "");
        // console.log(specDescription);
      });
    } else {
      descriptions = $(this).find("div.col-xs-6");
      descriptions.each(function(index, description) {
        const specDescription = $(description).text();
        details[key] = specDescription.trim().replace(specTitle, "");
        console.log(specDescription);
      });
    }
  });
  console.log(details);
  return details;
}
