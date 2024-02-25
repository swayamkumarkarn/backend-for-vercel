const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    listing_type: {
      type: String,
    },
    name:{
        type: String,
    },
    imgUrl: {
        type: String,
        default: "/assets/media/default/team.jpg",
    },
    category: {
      type: String,
    },
    collections:{
        type: String,
    },
    price:{
        type: Number,
    },
    desc: {
      type: String,
      required: true,
    },
    properties : {
        type: [String],
    },
    quantity:{
        type: Number,
    },
    offers: {
        type: String,
    },
    sizes: {
        type: [Number],
    },
    colors : {
        type: [String],
    },
    delivery_time: {
        type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Listing", listingSchema);
