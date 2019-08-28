const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productSchema = new Schema({
  brand: {
    type: String
  },
  link: {
    type: String
  },
  images: [],
  name: {
    type: String
  },
  dimension: {
    type: String
  },
  weight: {
    type: String
  },
  os: {
    type: String
  },
  display: {
    type: String
  },
  processor: {
    type: String
  },
  chipset: {
    type: String
  },
  graphics: {
    type: String
  },
  memory: {
    memory_type: { type: String },
    no_of_dimm_slots: { type: String },
    max_capacity: { type: String }
  },
  storage: {
    ssd: { type: String },
    hdd: { type: String }
  },
  ports: {
    hdmi: { type: String },
    rj45: { type: String },
    card_reader: { type: String },
    mini_display_port: { type: String },
    usb: { type: String },
    lan: { type: String },
    audio_jacks: { type: String },
    io_ports: { type: String }
  },
  opticaldrive: {
    type: String
  },

  fingerprint: {
    type: String
  },
  speakers: {
    speaker: { type: String },
    woofer: { type: String }
  },
  camera: {
    type: String
  },
  keyboard: {
    type: String
  },
  wireless: {
    type: String
  },
  battery: {
    cell: { type: String },
    type: { type: String },
    whr: { type: String }
  },
  ac_power: {
    type: String
  },
  color: {
    type: String
  },
  price: {
    type: String
  }
});

module.exports = Product = mongoose.model("products", productSchema);
