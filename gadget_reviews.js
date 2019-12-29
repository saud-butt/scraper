const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
const mongoose = require("mongoose");
const mongoDBUrl = require("./config/keys_dev").mongoURI;
const Review = require("./model/scrapped_review");

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  for (let i = 11; i <= 17; i++) {
    await page.goto(`https://gadgets.ndtv.com/laptops/reviews/page-${i}`);
    const html = await page.evaluate(() => document.body.innerHTML);
    const pageLinks = await getLinks(html);
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
    await savedetails(reviewDetails);
  }

  //   await page.goto("https://gadgets.ndtv.com/laptops/reviews/page-2");
  //   const html = await page.evaluate(() => document.body.innerHTML);
  //   pageLinks = await getLinks(html);

  //   pageLinks = [
  //     {
  //       link:
  //         "https://gadgets.ndtv.com/laptops/reviews/asus-vivobook-14-review-india-price-flipkart-x412fa-2066706",
  //       name: "Hp Chromebook 15",
  //       cover: "dsavdjahsvbdjash"
  //     },
  //     {
  //       link:
  //         "https://gadgets.ndtv.com/laptops/reviews/hp-spectre-x360-13-review-13-ap0101tu-india-price-2059448",
  //       name: "Hp Spectre x360 13",
  //       cover: "dsajdksadbjks"
  //     }
  //   ];

  //console.log(pageLinks);
  console.log("Count = " + pageLinks.length);
  //console.log(reviewDetails);
  // await savedetails(reviewDetails);
  await browser.close();
})();

async function getLinks(html) {
  const links = [];
  const $ = cheerio.load(html);
  $("div.story_list")
    .find("ul")
    .find("li")
    .not("li.taboola_article")
    .each(function() {
      const link = $(this)
        .find("div.caption_box")
        .find("a")
        .attr("href");
      let cover = $(this)
        .find("div.thumb")
        .find("img")
        .attr("src");
      const name = $(this)
        .find("div.caption_box")
        .find("a")
        .text()
        .trim();

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
    one_liner: $("h2.sdesc")
      .text()
      .trim(),
    author: $("div.dateline")
      .find("span.reviewer")
      .find("a")
      .text()
      .trim(),
    date: $("div.dateline")
      .find("span.dtreviewed")
      .text()
      .trim(),
    pic1: $("div.story_detail")
      .find("div.fullstoryImage")
      .find("img")
      .attr("src"),
    text1: $("div.content_text")
      .find("p:nth-child(1)")
      .text()
      .trim(),
    text2: $("div.content_text")
      .find("p:nth-child(2)")
      .text()
      .trim(),
    heading1: $("div.content_text")
      .find("h2#heading_1")
      .text()
      .trim(),
    text3: $("div.content_text")
      .find("p:nth-child(3)")
      .text()
      .trim(),
    pic2: $("p.ins_instory_dv_caption")
      .find("img")
      .attr("src"),
    text4: $("div.content_text")
      .find("p:nth-child(6)")
      .text()
      .trim(),
    heading2: $("div.content_text")
      .find("h2#heading_2")
      .text()
      .trim(),
    text5: $("div.content_text")
      .find("p:nth-child(12)")
      .text()
      .trim(),
    text6: $("div.content_text")
      .find("p:nth-child(15)")
      .text()
      .trim(),
    text7: $("div.content_text")
      .find("p:nth-child(16)")
      .text()
      .trim(),
    heading3: $("div.content_text")
      .find("h2#heading_3")
      .text()
      .trim(),
    text8: $("div.content_text")
      .find("p:nth-child(17)")
      .text()
      .trim(),
    text9: $("div.content_text")
      .find("p:nth-child(18)")
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
        const review = new Review({
          cover: reviewDetail.cover,
          name: reviewDetail.name,
          link: reviewDetail.link,
          one_liner: reviewDetail.one_liner,
          author: reviewDetail.author,
          text1: reviewDetail.text1,
          text2: reviewDetail.text2,
          text3: reviewDetail.text3,
          text4: reviewDetail.text4,
          text5: reviewDetail.text5,
          text6: reviewDetail.text6,
          text7: reviewDetail.text7,
          text8: reviewDetail.text8,
          text9: reviewDetail.text9,
          text10: reviewDetail.text10,
          heading1: reviewDetail.heading1,
          heading2: reviewDetail.heading2,
          heading3: reviewDetail.heading3,
          date: reviewDetail.date,
          pics1: reviewDetail.pics1,
          pics2: reviewDetail.pics2
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
