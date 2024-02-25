const express = require('express');
const router = express.Router();

const TournamentRules = require('../models/TournamentRules.model')
const Tournament = require('../models/Tournament.model')
const { getName } = require('country-list')

router.get('/', async (req, res) => {
  try {
    const tourRules = await TournamentRules.find()

    if (!tourRules) {
      return res.status(404).json({ msg: 'No Tournament found' });
    }

    res.status(200).json(tourRules);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
})

router.put('/:tournamentId', async (req, res) => {
  try {
    const { check_in, forfeit, prizeRules, matchSettings, general, compete, cusRuleHead, cusRuleBody, country, admins, contact } = req.body
    var eligibleList = getStringArray(country, 'TourEdit')

    const tourRules = await TournamentRules.updateOne({tournamentId: req.params.tournamentId}, {$set : {
        check_in,
        forfeit,
        prizeRules,
        matchSettings,
        general,
        compete,
        cusRuleHead,
        cusRuleBody,
        admins,
        contact
      }})

    await Tournament.updateOne({_id: req.params.tournamentId},{$set:{
      eligibleCountries: eligibleList,
    }
  })

    res.status(200).json(tourRules)
  } catch (err) {
    console.log(err)
    res.status(500).json({ msg: 'Server' })
  }
})

router.get('/:tournamentId', async (req, res) => {
  try {
    const tournament = await TournamentRules.findOne({tournamentId: req.params.tournamentId}).populate('admins')

    if (!tournament) {
      return res.status(404).json({ msg: 'No Tournament found' });
    }

    res.status(200).json(tournament);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
})

function getStringArray(Obj, type) {
  let Objarr = ''
  if(type === 'TourEdit'){
    Objarr =  Obj
  }else{
    Objarr = Obj.split(",")
  }
  var array = [];
  if (Objarr) {
    for (var i = 0, l = Objarr.length; i < l; i++) {
      if (Objarr[i]) {
        array.push({
          name: getName(Objarr[i]),
          iso: Objarr[i]
        })
      }
    }
  }
  return array;
}

module.exports = router