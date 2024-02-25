const express = require('express');
const router = express.Router();

const Team = require('../models/Team.model');
const User = require('../models/User.model');
const Arena = require('../models/Arena.model');
const Sponsor = require('../models/Sponsor.model');
const League = require('../models/League.model');
const Tournament = require('../models/Tournament.model');

const Rank = require('../models/Rank.model');

router.post('/leaguesbyteams', async (req, res) => {
  const teamsList = req.body;

  try {
    const leagues = await League.find({ "teams.teamId" : { $in : teamsList.teamsList }  })
      .sort({ createdAt: -1 });

    if (!leagues) {
      return res.status(404).json({ msg: 'Leagues not found' });
    }
    res.status(200).json(leagues);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});


router.get('/leaguesbygame/:gameId', async (req, res) => {
  
  var gameId = req.params.gameId

  try {

      let gameArr = [];
      gameArr.push(gameId);
      const tours = await Tournament.find({ "games.gameId" : { $in : gameArr } }).populate('leagues.leagueId')
        .limit(1000)        
        .sort({ createdAt: -1 });

    const legaArray =
      tours?.length > 0
        ? tours.map(tour => tour.leagues[0]?.leagueId?._id)
        : [];

     var lset = new Set(legaArray);
        
    let leagues = [];
    leagues = await League.find({_id : { $in : Array.from(lset) } })
      .limit(Number(process.env.TOURNAMENTS_THRESHOLD_COUNT))        
      .sort({ createdAt: -1 });

    console.log('Leagues Count :' + leagues?.length);
    res.status(200).json(leagues);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});


router.get('/:teamId', async (req, res) => {
  try {
    const team = await Team.findOne({
      _id: req.params.teamId,
    });
    if (!team) {
      return res.status(404).json({ msg: 'Team not found' });
    }

    const empArray =
      team.employees?.length > 0
        ? team.employees.map(emp => emp.employeeId)
        : [];

    const employees = await User.find({ _id : { $in : empArray } });


    const arenaArray =
      team.arenas?.length > 0
        ? team.arenas.map(arn => arn.arenaId)
        : [];

    const arenas = await Arena.find({ _id : { $in : arenaArray } });

    const sponsorArray =
      team.sponsors?.length > 0
        ? team.sponsors.map(spnsor => spnsor.sponsorId)
        : [];

    const sponsors = await Sponsor.find({ _id : { $in : sponsorArray } });


    res.status(200).json({
      team,
      employees,
      arenas,
      sponsors,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});


module.exports = router;
