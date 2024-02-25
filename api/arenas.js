const express = require("express");
const router = express.Router();

const Arenas = require("../models/Arena.model");
const auth = require('../middleware/auth.middleware');
const imagesUpload = require('../middleware/imageUpload.middleware');

// @route   GET api/arenas
// @desc    get all the arenas
router.get("/", async (req, res) => {
  try {
    const arenas = await Arenas.find();
    res.status(200).json(arenas);
  } catch (err) {
    res.status(500).json({ msg: "error in server, try again later" });
  }
});


router.post('/create', auth, imagesUpload.single('logoUrl'), async (req, res) => {
  try {
    const arena = new Arenas({
      'name': req.body.name,
      'description': req.body.description,
      'address': req.body.address,
      'location': req.body.location
    })

    if (req.file) arena.logoUrl = req.file.path;

    await arena.save()
    res.status(201).json({msg:"arena created successfully!"})
  } catch (err) {
    console.log(err)
    res.status(500).json({msg:"server error in arena"})
  }
})

module.exports = router;
