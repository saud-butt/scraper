const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
  cover: {
    type: String
  },
  name: {
    type: String
  },
  link: {
    type: String
  },
  one_liner: {
    type: String
  },
  text1: {
    type: String
  },
  heading1: {
    type: String
  },
  heading2: {
    type: String
  },
  heading3: {
    type: String
  },
  author: {
    type: String
  },
  date: {
    type: String
  },
  text2: {
    type: String
  },
  text3: {
    type: String
  },
  text4: {
    type: String
  },
  text5: {
    type: String
  },
  text6: {
    type: String
  },
  text7: {
    type: String
  },
  text8: {
    type: String
  },
  text9: {
    type: String
  },
  text10: {
    type: String
  },
  pic1: {
    type: String
  },
  pic2: {
    type: String
  }
});

module.exports = Review = mongoose.model("reviews", reviewSchema);
