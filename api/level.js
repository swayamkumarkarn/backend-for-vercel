const express = require('express');
const router = express.Router();

const Level = require('../models/Level.model')
const auth = require('../middleware/auth.middleware')
const Reward = require('../models/Reward.model')

router.get('/', async (req, res) => {
  try {
    const levels = await Level.find()

    if (!levels) {
      return res.status(404).json({ msg: 'No Level found.' });
    }
      
    res.status(200).json(levels);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
})

router.post('/', auth, async(req, res) => {
  try {
    var gamesArr = getNumberArray(req.body.rewardId, "rewardId");

    const postObj = {
        _id:req.body._id,
        reward:gamesArr
    };
    
    const level = await new Level(postObj).save();
    res.status(201).json(level);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
})

function getNumberArray(Obj, keyId) {
  const Objarr = Obj.split(",");
  var array = [];
  if (Objarr) {
    for (var i = 0, l = Objarr.length; i < l; i++) {
      if (Objarr[i]) {
        let game = Number(Objarr[i]);
        array.push({ [keyId]: game });
      }
    }
  }
  return array;
}
module.exports = router