const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
const mongoose = require("mongoose");
const mongoDBUrl = require("./config/keys_dev").mongoURI;
const Review = require("./model/scrapped_review");

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  let reviewDetails = [];
  let pageLinks = [];
  // for (let i = 1; i <= 20; i++) {
  //   await page.goto(`https://www.digitaltrends.com/laptop-reviews/page/${i}/`);
  //   const html = await page.evaluate(() => document.body.innerHTML);
  //   pageLinks = await getLinks(html);
  // }

  pageLinks = [
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

  for (let links of pageLinks) {
    await page.goto(links.link);
    await page.waitFor(1000);
    const html = await page.evaluate(() => document.body.innerHTML);
    reviewDetails = [
      ...reviewDetails,
      await getreviewDetails(html, links.link, links.name, links.cover)
    ];
  }

  //console.log(pageLinks);
  //console.log("Count = " + pageLinks.length);
  console.log(reviewDetails);
  //await savedetails(reviewDetails);
  await browser.close();
})();

async function getLinks(html) {
  const links = [];
  const $ = cheerio.load(html);
  $("div.b-flyer").each(function() {
    const link = $(this)
      .find("div.b-meta")
      .find("h3.b-meta__title")
      .find("a")
      .attr("href");
    let cover = $(this)
      .find("div.b-flyer__image")
      .find("img")
      .attr("src");
    const name = $(this)
      .find("div.b-meta")
      .find("h3.b-meta__title")
      .find("a")
      .text()
      .trim()
      .replace("/n", "")
      .replace("\n", "");

    if (!links.includes(link)) {
      links.push({ link, name, cover });
    }
  });
  return links;
}

async function getreviewDetails(html, link, name, cover) {
  const $ = cheerio.load(html);
  const details = {
    link,
    name,
    cover,
    one_liner: $("h2.b-headline__sub-title")
      .text()
      .trim(),
    author: $("cite.b-byline")
      .find("span")
      .find("a.author")
      .text()
      .trim(),
    date: $("cite.b-byline")
      .find("span")
      .find("time")
      .text()
      .trim(),
    pic1: $("article.b-content")
      .find("div.b-review")
      .find("div.b-review__image")
      .find("img")
      .attr("src"),
    text1: $("article.b-content p:nth-child(1)")
      .text()
      .trim(),
    heading: $("article.b-content")
      .find("h2")
      .text()
      .trim(),
    t4: $("article.b-content p:nth-child(4)")
      .text()
      .trim(),
    t5: $("article.b-content p:nth-child(5)")
      .text()
      .trim(),
    pic2: $("article.b-content figure:nth-child(1)")
      .find("img")
      .attr("src"),
    t6: $("article.b-content p:nth-child(6)")
      .text()
      .trim(),
    t7: $("article.b-content p:nth-child(7)")
      .text()
      .trim(),
    pic3: $("article.b-content figure:nth-child(2)")
      .find("img")
      .attr("src"),
    t8: $("article.b-content p:nth-child(8)")
      .text()
      .trim(),
    t9: $("article.b-content p:nth-child(9)")
      .text()
      .trim(),
    t10: $("article.b-content p:nth-child(10)")
      .text()
      .trim(),
    t11: $("article.b-content p:nth-child(11)")
      .text()
      .trim()
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
