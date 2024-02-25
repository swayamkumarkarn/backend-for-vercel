const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Listings = require("../models/Listing.model")

const auth = require("../middleware/auth.middleware");
const upload = require("../middleware/imageUpload.middleware");

router.get('/', async (req, res) => {
    const listings = await Listings.find()

    res.status(200).json(listings)
})

// @route   POST /api/listings
// @desc    Create a new listing
router.post("/create", upload.array("image", 1), async (req, res) => {
    const { desc, user,Type, name, category, collections, price, properties, quantity, offers, sizes, colors, delivery_time } = req.body;
  
    try {
      const listObj = {
        user,
        list_type: Type,
        desc,
        name,
        category,
        collections,
        price,
        properties,
        quantity,
        offers,
        sizes,
        colors,
        delivery_time,
        images: req.body.imgUrl,
      };
  
      const listing = await new Listings(listObj).save();
  
      res.status(201).json(listing);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Server error" });
    }
  });


module.exports = router;