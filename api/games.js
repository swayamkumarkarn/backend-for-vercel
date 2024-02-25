const express = require('express');
const router = express.Router();

const Game = require('../models/Game.model');
const Match = require('../models/Match.model')
const Profile = require('../models/Profile.model')
const User = require('../models/User.model')
const Tournament = require("../models/Tournament.model")
const Team = require("../models/Team.model")
const League = require("../models/League.model")

const auth = require("../middleware/auth.middleware");

// @route   GET api/games/:gameId
// @desc    get all the games
router.get('/:id', async (req, res) => {
  try {
    const games = await Game.findById({_id : req.params.id})

    const matchArray = await Match.find({'games._id': games._id}).sort({createdAt: -1})

    res.status(200).json({games, matchArray});
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.get("/gamedata/:type/:gameId",auth,async (req,res) => {
  try {

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found - Event: UserId' });
    }
    const game = await Game.findOne({ _id: req.params.gameId })
    const { type } = req.params
    console.log(game)
    if (!game) {
      res.status(404).json({ msg: "Game Not Found" });
    }
    
    switch (type) {
      case "TEAMS":

        const team = await Team.find({"games.gameId": { $in: game._id } } 
        )
        .limit(Number(process.env.TEAM_THRESHOLD_COUNT))
        .sort({ createdAt: -1 })            
      
        res.status(200).json(team)
        break

      case "LEAGUES":        
          const tours = await Tournament.find({ "games.gameId" : { $in : game._id } }).populate('leagues.leagueId')
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

        res.status(200).json(leagues);
      default:
        break;
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Server error" });
  }
})

// @route   PUT /api/games/follow/:gameId
// @desc    follow or unfollow a game
router.put("/follow/:gameId", auth, async (req, res) => {
  try {
    let game = await Game.findById(req.params.gameId);
    if (!game) {
      return res.status(404).json({ msg: "game not found" });
    }

    const isFollowing =
      game.followers.filter(
        (follower) => follower.user.toString() === req.userId
      ).length > 0;

    if (isFollowing) {
      // Unlike the game if already following
      const index = game.followers.findIndex(
        (follower) => follower.user.toString() === req.userId
      );
      game.followers.splice(index, 1);
      game = await game.save();

      res.status(200).json(game);
    } else {
      // Follow the game
      game.followers.unshift({ user: req.userId });
      game = await game.save();

      res.status(200).json(game);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error at follow game" });
  }
});


module.exports = router