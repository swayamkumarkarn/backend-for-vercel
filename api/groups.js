const express = require('express');
const router = express.Router();

const Game = require('../models/Game.model');
const Team = require('../models/Team.model')
const Player = require('../models/Player.model')
const User = require('../models/User.model')
const Tournament = require('../models/Tournament.model')
const Group = require("../models/Group.model")

// GET groups
router.get('/groupsbytour/:tournamentId', async(req, res)=>{
    try {
      const groups = await Group.find({tournamentId: req.params.tournamentId}).populate({
        path: 'participants.participantId',
        model: 'User',
        select: { '_id': 1,"profilePicUrl":1,"username":1},
     })
  
      res.status(200).json(groups)
    } catch (err) {
      console.log(err)
      res.status(500).json({msg: "Server Error"})
    }
  })

module.exports = router;
