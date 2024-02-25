const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth.middleware')
const Players = require('../models/Player.model')
const Game = require('../models/Game.model')
const Rank = require('../models/Rank.model')
const User = require('../models/User.model')
const Team = require('../models/Team.model')

// @route   GET api/player
// @desc    get all the players
//Might have to remove this and use the another one below playersbyteambygame
router.get('/playersbygame/:gameId', async (req, res)=>{
try {

    var gameId = req.params.gameId
    let players = [];
    if (gameId == 'undefined') {

        players = await Players.find().populate({
          path:"user",
          model:"User",
          select:{'_id':1,'username':1}
        })
          .limit(Number(process.env.PLAYERS_THRESHOLD_COUNT))
          .sort({ createdAt: -1 });

    } else {

      players = await Players.find({ "current_videogame._id" : gameId }).populate('current_videogame').populate('current_team')
      .populate({
        path:"user",
        model:"User",
        select:{'_id':1,'username':1}
        })
        .limit(Number(process.env.PLAYERS_THRESHOLD_COUNT)+10)
        .sort({ createdAt: -1 });
    }

        console.log('players :' + players.length );

    var playerList = []
    
    for(let i=0; i < players?.length; i++){
    
    const rankArray = players[i].ranks.length > 0 ? players[i].ranks.map(rank => rank.rankId) : []
    
    const rank = await Rank.find({_id: {$in :rankArray}})
    
    playerList.push({players: players[i], rank: rank})
    
    }

    res.status(200).json(playerList)
  } catch (err) {
        res.status(500).json(err)
        console.log(err)
    }
})


// @route   GET api/player 
// @desc    NEW WAY TO get all the players 
router.get('/playersbyteamsbygame/:gameId', async (req, res)=>{
try {

    var gameId = req.params.gameId
    console.log(gameId);
    let teams = [];
    if (gameId == 'undefined') {
      teams = await Team.find()
        .limit(500)
        .sort({ createdAt: -1 });
    } else {
       let gameArr = [];
      gameArr.push(gameId);
      teams = await Team.find({ "games.gameId" : { $in : gameArr } })
        .limit(Number(process.env.TEAM_THRESHOLD_COUNT))
        .sort({ createdAt: -1 });
    }

     var pset = new Set();

    for(let i=0; i < teams?.length; i++){
        if (teams[i].players && teams[i].players.length > 0) {
            for(let pi=0; pi < teams[i].players.length; pi++){
                pset.add(parseInt(teams[i].players[pi].playerId));
            }
        }
    }        
      const players = await Players.find({_id : { $in : Array.from(pset) } })
        .limit(Number(process.env.PLAYERS_THRESHOLD_COUNT))        
        .sort({ createdAt: -1 });

    if(!players){
        return res.status(404).json({msg: "Player not found"})
    }

    console.log(players.length)
    res.status(200).json(players)
  } catch (err) {
        res.status(500).json(err)
        console.log(err)
    }
})


// @route   GET api/player/:userId
// @desc    get players with ID
router.get('/:userId', async (req,res) =>{
  try {
    let player = await Players.findById(req.params.userId).populate("team.teamId")

    if(!player){
      return res.status(404).json({msg: "Player not found"})
    }

    let playerList = []
    
    const gameArray = player?.games?.length > 0 ? player.games.map(game => game.gameId) : [];

    const games = await Game.find({_id : {$in : gameArray}})

    const rankArray = player?.ranks?.length > 0 ? player.ranks.map(rank => rank.rankId) : []
    
    const rank = await Rank.find({_id: {$in :rankArray}})

    const teamArray = player?.team?.length > 0 ? player.team.map(team => team.teamId) : []

    const team = await Team.find({_id: {$in: teamArray }})
    
    playerList.push({players: player,rank: rank, games: games, team: team})
    
    res.status(200).json(playerList)
  } catch (err) {
    console.log(err)
    res.status(500).json({msg: 'server error'})
  }
} )

// @route   GET api/player/:search
// @desc    get players with passed search name
router.get('/getplayers/:search', async (req,res) => {

  try {

    var sname = new RegExp([req.params.search].join(""), "i");

    let players = await Players.find({name: { $regex: sname } });
    if(!players){
      return res.status(404).json({msg: "Players not found"})
    }

    res.status(200).json(players)
  } catch (err) {
    console.log(err)
    res.json(500).json({msg: 'server error'})
  }
 

 })

 // Getting player stats based on playerId
 router.get('/getstats/:playerId', async(req, res)=>{

   if(req.params.playerId > 0){
  try {
    const player = await Players.findById(req.params.playerId)
    if(player.game === 3){
      main = {
        kills: player.apidata.data.segments[0].stats.kills.value,
        loss: player.apidata.data.segments[0].stats.losses.value,
        deaths: player.apidata.data.segments[0].stats.deaths.value,
        kda: Math.round(player.apidata.data.segments[0].stats.kd.value * 100) / 100,
      }
      return res.status(200).json(main)
    } else if(player.game === 1){
      main = {
        kills: player.apidata.data.segments[0].stats.kills.value,
        loss: player.apidata.data.segments[0].stats.losses.value,
        deaths: player.apidata.data.segments[0].stats.deaths.value,
        kda: Math.round(player.apidata.data.segments[0].stats.kda.value * 100) / 100,
      }
      return res.status(200).json(main)
    } 

    else if (player.game === 20){
      main = {
        kills: player.apidata.gameModeStats.squad.kills,
        deaths: "--",
        loss: player.apidata.gameModeStats.squad.losses,
        kda: ((player.apidata.gameModeStats.squad.kills + player.apidata.gameModeStats.squad.assists) / player.apidata.gameModeStats.squad.losses).toFixed(2),
      }
      return res.status(200).json(main)
    } else if(player.game === 32){
      main = {
        kills: player.apidata.wins,
        loss: player.apidata.losses,
        kda: '--',
        deaths: '--'
      }
      return res.status(200).json(main)
    } else {
      main = {
        kills: '--',
        loss: '--',
        kda: '--',
        deaths: '--'
      }
      return res.status(200).json(main)
    }

  } catch (err) {
    console.log(err)
    res.status(500).json("Server Error")
  }
}
})

// @route   POST api/player/:userId
// @desc    Post Player detail
router.post('/:userId', async (req, res) => {

    const {nickName, description, region, won, loss, drawn, total_games_played } = req.body

try {
    
const playerObj = {
    nickName,
    description,
    region,
    won,
    loss,
    drawn,
    total_games_played
}

const player = await new Players(playerObj).save()

res.status(201).json(player)
} catch (err) {
    res.status(500).json({msg:"server error"})
}

})

module.exports = router