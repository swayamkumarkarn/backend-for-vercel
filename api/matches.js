const express = require('express');
const router = express.Router();

const Match = require('../models/Match.model');

// @route   GET api/matches/:matchId
// @desc    get all the matches
router.get('/:matchId', async (req, res) => {
  try {
    const match = await Match.findById({_id : req.params.matchId})

    if (!match) {
      return res.status(404).json({ msg: 'Match not found' });
    }
    res.status(200).json(match);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET api/matches
// @desc    get all the matches
router.get('/', async (req, res) => {
  try {
    const matches = await Match.find({})

    if (!matches) {
      return res.status(404).json({ msg: 'Match not found' });
    }
    res.status(200).json(matches);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});


// @route   GET api/matches (3 Matches)
// @desc    get all the matches
router.get('/top/matchs', async (req, res) => {
  try {
    const topmats = await Match.find({startDate : {$gte: new Date() } })
      .limit(Number(2))
      .sort({ scheduledAt: 1 });

    res.status(200).json(topmats);
  } catch (error) {
    console.error(error);
  }
});


module.exports = router