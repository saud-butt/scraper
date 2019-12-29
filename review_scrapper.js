const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
const mongoose = require("mongoose");
const mongoDBUrl = require("./config/keys_dev").mongoURI;
const Review = require("./model/scrapped_review");

const url = "https://www.cnet.com/topics/laptops/products/";
(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(url);
  // const html = await page.evaluate(() => document.body.innerHTML);
  // const pageLinks = await getLinks(html);

  const pageLinks = [
    {
      link: "https://www.cnet.com/reviews/hp-chromebook-15-2019-review/",
      name: "Hp Chromebook 15",
      cover: "dsavdjahsvbdjash"
    },
    {
      link: "https://www.cnet.com/reviews/hp-spectre-x360-13-late-2019-review/",
      name: "Hp Spectre x360 13",
      cover: "dsajdksadbjks"
    }
  ];

  // const pageLinks = [
  //   "https://www.cnet.com/reviews/hp-spectre-x360-13-late-2019-review/",
  //   "https://www.cnet.com/reviews/hp-chromebook-15-2019-review/"
  // ];

  let reviewDetails = [];

  for (let links of pageLinks) {
    await page.goto(links.link);
    await page.waitFor(1000);
    const html = await page.evaluate(() => document.body.innerHTML);
    reviewDetails = [
      ...reviewDetails,
      await getreviewDetails(html, links.link, links.name, links.cover)
    ];
  }

  // console.log(pageLinks);
  // console.log("Count = " + pageLinks.length);
  console.log(reviewDetails);
  //await savedetails(reviewDetails);
  await browser.close();
})();

async function getLinks(html) {
  const links = [];
  const $ = cheerio.load(html);
  $("div.items section").each(function() {
    const link = $(this)
      .find("a.imageWrap")
      .attr("href");
    let cover = $(this)
      .find("figure.img")
      .find("img")
      .attr("src");
    if ((cover = "")) {
      cover = $(this)
        .find("figure.img")
        .find("span")
        .find("img.lazy")
        .attr("src");
    }
    const text = $(this)
      .find("div.itemInfo")
      .find("h3")
      .text()
      .trim()
      .replace("/n", "")
      .replace("\n", "");
    const span = $(this)
      .find("div.itemInfo")
      .find("h3")
      .find("span")
      .text()
      .trim();
    const name = text.split(span).join("");

    if (!links.includes(link)) {
      links.push({ link: `https://www.cnet.com${link}`, name, cover });
    }
  });
  return links;
}

async function getreviewDetails(html, link, name, cover) {
  const $ = cheerio.load(html);
  const details = {
    title: $("div.row")
      .find("h1.speakableText")
      .text()
      .trim(),
    link,
    name,
    cover,
    text: $("div.row")
      .find("p.-et-yvru_uvb")
      .text()
      .trim(),
    avatar: $("figure")
      .find("img")
      .attr("src"),
    author: $("a.author")
      .text()
      .trim(),
    time: $("time")
      .text()
      .trim(),
    pic: $("span.imageContainer")
      .find("span")
      .find("img")
      .attr("src")
    // info1: $("p.speakableTextp1")
    //   .text()
    //   .trim(),
    // info2: $("p.speakableTextp2")
    //   .text()
    //   .trim()
  };

  return details;
}

// Send Data to Data-Base
async function savedetails(reviewDetails) {
  mongoose
    .connect(mongoDBUrl, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false
    })
    .then(() => {
      for (let reviewDetail of reviewDetails) {
        const memory = {
          memory_type: reviewDetail.memory
        };
        const storage = {
          hdd: reviewDetail.storage
        };
        const ports = {
          hdmi: reviewDetail.ports
        };
        const battery = {
          type: reviewDetail.battery
        };
        const speakers = {
          speaker: reviewDetail.audio
        };
        const dimensions = {
          speaker: reviewDetail.dimension_w_x_d_x_h
        };
        const os = {
          operating_system: reviewDetail.operating_system
        };
        const display = {
          type: reviewDetail.display
        };
        const processor = {
          processor_type: reviewDetail.processor
        };
        const graphics = {
          model: reviewDetail.graphics
        };
        const wireless = {
          wifi: reviewDetail.wlan
        };

        const review = new Review({
          category: reviewDetail.category,
          brand: reviewDetail.brand,
          name: reviewDetail.model,
          cover: reviewDetail.cover,
          ports,
          memory,
          graphics,
          os,
          processor,
          display,
          storage,
          camera: reviewDetail.webcam,
          speakers,
          battery,
          wireless,
          weight: reviewDetail.weight,
          dimensions,
          link: reviewDetail.link,
          images: reviewDetail.gallery,
          security: reviewDetail.security,
          color: reviewDetail.color
        })
          .save()
          .then(createdReview => {
            mongoose.disconnect();
          })
          .catch(err => console.log(err));
      }
    })
    .catch(e => console.log(`MongoDB Error: ${e}`));
}
