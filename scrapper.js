const cheerio = require("cheerio");
const puppeteer = require("puppeteer");

const url =
  "https://www.msi.com/Laptop/Products#?tag_multi_select=579,580,581,582,583,2011";

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
  console.log("Objects", productDetails);
  console.log("Count", productDetails.length);
  await browser.close();
})();

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

async function getProductDetails(html, link) {
  const obj = [];
  const $ = cheerio.load(html);
  const ths = $("thead")
    .find("tr")
    .find("td:not(.info)");
  ths.each(function(index, td) {
    obj.push({
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

async function getGallery(html, link, productDetails) {
  // Extract img links from page
  // Define all variables and convert $.each to collection.each
  // Find object where link matches and key gallery with value of extracted img array
  // Reference -> search javascript method .filter

  const links = [];
  const $ = cheerio.load(html);
  const lk = $(".img-responsive");
  lk.each(function(index, img) {
    links.push(img.src);
  });

  return links;
}
