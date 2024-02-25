const express = require('express');
const router = express.Router();

const Attribute = require('../models/Attribute.model')

router.get('/', async (req, res) => {
  try {
    const attribute = await Attribute.find()

    if (!attribute) {
      return res.status(404).json({ msg: 'No Attributes found' });
    }

    res.status(200).json(attribute);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
})

router.get('/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params
      const attribute = await Attribute.find().populate('games.gameId')
      let attr = undefined
      for(i=0; i<attribute.length; i++){
        if(attribute[i].attributeType === type && attribute[i].attributeId === id){
          attr = attribute[i]
        }
      }
    res.status(200).json(attr);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
})

// Edit Attribute
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const {games, role, regions, Mic, language, salary, rank, platform, gender} = req.body
      const attribute = await Attribute.updateOne({"attributeId": id}, {$set:{
        games: [{gameId: games}],
        role,
        regions,
        mic: Mic,
        language,
        type: req.body.type,
        salary,
        rank,
        platform,
        gender
      }})
      
    res.status(200).json(attribute);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
})

router.post('/', async(req, res) => {
  try {
    const { attributeId, attributeType, games, role, regions, Mic, language, type, salary, rank, platform, gender } = req.body
    
    var gamesArr = getNumberArray(games, "gameId");

    const attributeObj = {
    attributeId,
    attributeType,
    games:gamesArr,
    mic: Mic,
    language,
    role,
    regions,
    type,
    salary,
    rank,
    platform,
    gender
    };

    const attribute = await new Attribute(attributeObj).save();
    res.status(201).json(attribute)
  } catch (err) {
    console.log(err)
    res.status(500).json({msg: 'Server'})
  }
})

function getNumberArray(Obj, keyId) {
  const Objarr = Obj.toString().split(",");
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

router.delete('/:id', async(req, res)=>{
  try {
    await Attribute.findByIdAndDelete(req.params.id)
    res.status(200).json({msg: 'Deleted Successfully'})
  } catch (err) {
    console.log(err)
    res.status(500).json({msg: 'Server error'})
  }
})

module.exports = router