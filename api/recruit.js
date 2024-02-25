const express = require('express');
const router = express.Router();

const Recruit = require('../models/Recruit.model')
const Team = require('../models/Team.model')

router.get('/', async (req, res) => {
  try {
    const recruite = await Recruit.find()

    if (!recruite) {
      return res.status(404).json({ msg: 'No Recruits found' });
    }

    res.status(200).json(recruite);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
})

router.get('/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params
      const recruits = await Recruit.find().populate('games.gameId')
      let rec = undefined
      for(i=0; i<recruits.length; i++){
        if(recruits[i].RecruitType === type && recruits[i].RecruitId === id){
          rec = recruits[i]
        }
      }
    res.status(200).json(rec);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
})

router.post('/', async(req, res) => {
  try {
    const { RecruitId, RecruitType, games, role, region, Mic, language, type, salary, rank, availability, platform } = req.body
    
    let gamesArr = []
    gamesArr.push({gameId:games})

    const recruitObj = {
    RecruitId,
    RecruitType,
    games:gamesArr,
    mic: Mic,
    language,
    role,
    regions:region,
    type,
    salary,
    rank,
    availability,
    platform
    };

    const recruit = await new Recruit(recruitObj).save();
    res.status(201).json(recruit)
  } catch (err) {
    console.log(err)
    res.status(500).json({msg: 'Server'})
  }
})

router.delete('/:id', async(req, res)=>{
  try {
    await Recruit.findByIdAndDelete(req.params.id)
    res.status(200).json({msg: 'Deleted Successfully'})
  } catch (err) {
    console.log(err)
    res.status(500).json({msg: 'Server error'})
  }
})

module.exports = router