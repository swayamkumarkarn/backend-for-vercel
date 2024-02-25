const express = require("express");
const router = express.Router();

const TournamentStat = require("../models/TournamentStat.model");
const auth = require('../middleware/auth.middleware');

router.get("/", async (req, res) => {
  try {
    const tournamentstat = await TournamentStat.find();

    if (!tournamentstat) {
      return res.status(404).json({ msg: "Tournament Stat not found" });
    }
    res.status(200).json(tournamentstat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
});

router.post('/', auth, async (req, res) => {
  const { tournamentId, place, mp , wins, loss, w_streak} = req.body
  try {
    const newObj = {
      tournamentId,
      place,
      mp,wins,loss,w_streak
    }
    const tournamentstat = await new TournamentStat(newObj).save();
    res.status(200).json(tournamentstat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
})

router.patch('/:tournamentStatId', auth, async (req, res) => {
  const {  place, mp , wins, loss, w_streak} = req.body
  try{
    console.log(req.body)
    let tournament = await TournamentStat.findById(req.params.tournamentStatId);
    if (!tournament) {
      return res.status(404).json({ msg: 'Tournament Stat not found' });
    }
    const newObj = {
      place,
      mp,wins,loss,w_streak
    }
    p = await TournamentStat.findByIdAndUpdate(req.params.tournamentStatId, newObj, {
      new: true,
    });
    res.status(201).json(p);
  }catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
})

// @route   DELETE /api/tournamentstat/:tournamentStatId
// @desc    Delete a tournamentstat by ID
router.delete('/:tournamentStatId', auth, async (req, res) => {
  console.log(req.params.tournamentStatId)
  try {
    const tournament = await TournamentStat.findById(req.params.tournamentStatId);
    if (!tournament) {
      return res.status(404).json({ msg: 'Tournament Stat not found' });
    }
    await tournament.remove();
    res.status(200).json({ msg: 'Tournament Stat deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});
module.exports = router;
