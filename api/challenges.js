const express = require('express');
const router = express.Router();

const Team = require('../models/Team.model')
const auth = require("../middleware/auth.middleware");
const Challenge = require("../models/Challenge.model")
const User = require('../models/User.model')
const Profile = require("../models/Profile.model")
const Game = require("../models/Game.model")


router.get('/', auth, async (req, res) => {

    const challenge = await Challenge.find({isOpenMatch:true}).populate({
      path:"invites.playerId"
    }).populate("players.playerId").populate("User_team").populate("game").populate("opponent_team")

    const pro = await Profile.find({user:req.userId})
    let ply = pro[0].playergames
 
    let playergames = []
    for(i=0; i<ply.length; i++){
      console.log(ply[i].game)
      playergames.push(ply[i].game)
    }

    const games = await Game.find({_id: {$in : playergames }})
    
    res.status(200).json({challenge,games})
})

router.post('/create',auth, async (req,res) => {
  const { User_team, game, opponent_team, startDate, startTime,entry_fee, challengeType, format, ChallType } = req.body
  
  try{

    const user = await User.findById(req.userId)
    var pro = await Profile.find({user:user._id})
    var oppTeam = await Team.find({_id:opponent_team})
    const profile = pro[0]

    var playersArr = getNumberArray(req.body.players, "playerId");
    var plyrId = ''
    
    for(var i=0;i < profile.playergames.length; i++){
      pg = profile.playergames[i]
      for(var j=0; j < playersArr.length; j++){
        if(pg.player === playersArr[j].playerId) {
          plyrId = pg.player
        }
      }
    }
    
    for (var i=0; i<oppTeam[0].players.length; i++){
      var opp_team = oppTeam[0].players[i]
      playersArr.push({playerId: opp_team.playerId})
    }

    playersArr = playersArr.filter(function(item) {
      return item.playerId !== plyrId
  })

    var players = []
    players.push({playerId:plyrId,teamId:parseInt(User_team)})

      const challengeObj = {
          User_team:parseInt(User_team),
          opponent_team,
          game:game[0],
          invites:playersArr,
          players,
          startDate,
          startTime,
          format:format[0],
          entry_fee,
          challengeType:challengeType[0],
          ChallType
      }
      
      const challenge = await new Challenge(challengeObj).save();

      res.status(201).json({challenge})
  } catch(error){
      console.log(error)
      res.status(500).json("Server Error")
  }
})

router.post('/postchallenge/create',auth, async (req,res) => {
    const { User_team, game, opponent_team, startDate, startTime,entry_fee, challengeType, format, isOpenMatch, ChallType, maps } = req.body

    try{

      const user = await User.findById(req.userId)
      var pro = await Profile.find({user:user._id}) 
      const profile = pro[0]
      let challenge 

      if(ChallType === "Team"){

        const team = await Team.findById(User_team).populate("squads.squadId")
        let invites = []
        for(i=0; i<team.squads.length; i++){
          if(team.squads[i].squadId && team.squads[i].squadId.game === Number(game[0])){
            for(j=0; j<team.squads[i].squadId.players.length; j++){
              invites.push({playerId:team.squads[i].squadId.players[j].player})
            }
          }
        }

        const plyId = getPlayerId(profile, invites)
        
    let players = []
    players.push({playerId:plyId, teamId:team._id})
    invites = invites.filter(function(item) {
      return item.playerId !== plyId
  }) 

        const challengeObj = {
            User_team:parseInt(User_team),
            opponent_team,
            game:game[0],
            invites,
            players,
            startDate,
            startTime,
            format:format[0],
            maps: maps[0],
            entry_fee,
            challengeType:challengeType[0],
            isOpenMatch,
            ChallType
        }

        challenge = await new Challenge(challengeObj).save();
      } else {
        
      var players = []
      for(var i=0;i < profile.playergames.length; i++){      
        if(profile.playergames[i].game === Number(game[0])){
          players.push({playerId:profile.playergames[i].player})
        }
      }
      const challengeObj = {
        game:game[0],
        players,
        startDate,
        startTime,
        format:format[0],
        entry_fee,
        challengeType:challengeType[0],
        isOpenMatch,
        ChallType
    }
      challenge = await new Challenge(challengeObj).save();
      }
      res.status(201).json({challenge})
    } catch(error){
        console.log(error)
        res.status(500).json("Server Error")
    }
})


router.get("/acceptteam/:challengeId/:profileId", async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.challengeId);
    if (!challenge) {
      return res.status(404).json({ msg: "Challenge not found" });
    }

    const profile = await Profile.findById(req.params.profileId)
    let teams =[];

    let pg = profile?.playergames;
    let playerList = [];
    for (let i = 0; i < pg?.length; i++) {
      var plyr = pg[i]?.player; 
      if (plyr) {
        playerList.push(plyr);
      }
    }
    
    if (playerList.length > 0) {
      teams = await Team.find({ "players.playerId": { $in: playerList } }).populate({
        path:"squads.squadId"
      })
    }  
    let commonTeams = [] 
    for(i=0; i< teams.length; i++){
      for(j=0; j<teams[i].squads.length; j++){
        if(teams[i].squads[j].squadId && teams[i].squads[j].squadId.game === challenge.game ){
          commonTeams.push(teams[i])
      }
    }
  }
    res.status(201).json(commonTeams);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.get('/userchallenges/:type/:profileId', async (req, res) => {
  try {
    const { type } = req.params
    const profile = await Profile.findById({ _id: req.params.profileId })
    const challenges = await Challenge.find().populate({
      path:"invites.playerId"
    }).populate("players.playerId").populate("User_team").populate("game").populate("opponent_team").sort({createdAt: -1})

    let pt = profile.playergames
    let Challe = []

    switch (type) {
      case "User_team":
        for(k=0; k < pt.length; k++){
          for(i=0;i < challenges.length; i++ ){
            if(challenges[i].isOpenMatch === false && challenges[i].User_team !== null){
              let ut = await Team.findById({_id: challenges[i].User_team._id})
              for(j=0; j < ut.players.length; j++){
                for(p=0; p < challenges[i].invites.length; p++){
                  if(pt[k].player === ut.players[j].playerId && pt[k].player === challenges[i].invites[p].playerId._id){
                    Challe.push(challenges[i])
                  }
                }
              }
            }
          }
        }
        res.status(200).json(Challe)
        break;

      case "All Challenges":
        let playergames = []
        for(i=0;i < challenges.length; i++ ){
          if(challenges[i].isOpenMatch === false){
        for(k=0; k < pt.length; k++){
          playergames.push(pt[k].game)
              let ut = await Team.findById({_id: challenges[i].opponent_team._id})
              for(j=0; j < ut.players.length; j++){
                for(p=0; p < challenges[i]?.invites.length; p++){
                  if(pt[k].player === ut.players[j].playerId && pt[k].player === challenges[i].invites[p].playerId._id){
                    Challe.push(challenges[i])
                  }
                }
              }
            }
          }
          else if (challenges[i].isOpenMatch === true){
            Challe.push(challenges[i])
          }
        }
        
        const games = await Game.find({_id: {$in : playergames }}).select({'_id':1, 'name':1})
        res.status(200).json({Challe, games})
        break;
      
      case "My Challenges":
        let plyrArr = []
        for(i=0; i<pt.length; i++){
          plyrArr.push(pt[i].player)
        }
        console.log(plyrArr)
        Challe = await Challenge.find({"players.playerId": {$in : plyrArr}}).populate({
          path:"invites.playerId"
        }).populate("players.playerId").populate("User_team").populate("game").populate("opponent_team")
        res.status(200).json({Challe})
        break;
      default:
        break;
    }
  } catch (error) {
    console.log(error)
    res.status(500).json("Server Error")
  }
})

// @route:  PUT /api/teams/accept/:challengeId/:playerId
// @desc:   accepting open challenge

router.put("/accept/:challengeId/:profileId", async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.challengeId);
    if (!challenge) {
      return res.status(404).json({ msg: "Challenge not found" });
    }

    const profile = await Profile.findById(req.params.profileId)
    let playerId = ''
    for(i=0; i< profile.playergames.length; i++){
      if(profile.playergames[i].game === challenge.game){
        playerId = profile.playergames[i].player
      }
    }

    await Challenge.updateOne(
      {
        _id: req.params.challengeId,
      },
      {
        $push: { 
          players: { playerId: playerId, teamId: null }
        },
      }
    );
    res.status(201).json("Success");
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.put("/teamaccept/:challengeId/:teamId/:profileId", async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.challengeId);
    if (!challenge) {
      return res.status(404).json({ msg: "Challenge not found" });
    }
    const team = await Team.findById(req.params.teamId).populate("squads.squadId")
    const profile = await Profile.findById(req.params.profileId)
    let invites = []
    for(i=0; i<team.squads.length; i++){
      if(team.squads[i].squadId && team.squads[i].squadId.game === challenge.game){
        for(j=0; j<team.squads[i].squadId.players.length; j++){
          invites.push({playerId:team.squads[i].squadId.players[j].player})
        }
      }
    }
    const plyId = getPlayerId(profile, invites)
    let players = []
    players.push({playerId:plyId, teamId:team._id})
    invites = invites.filter(function(item) {
      return item.playerId !== plyId
  }) 
    await Challenge.updateOne(
      {
        _id: req.params.challengeId,
      },
      {
        $push: { 
          invites: invites,
          players:players,
        },
        $set:{
          opponent_team: team._id
        }
      }
    );
    res.status(201).json("Success");
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// @route:  PUT /api/teams/accept/:challengeId/:playerId
// @desc:   accepting challenge

router.put("/accept/:challengeId/:teamId/:playerId", async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.challengeId);
    if (!challenge) {
      return res.status(404).json({ msg: "Challenge not found" });
    }

    await Challenge.updateOne(
      {
        _id: req.params.challengeId,
      },
      {
        $push: { 
          players: { playerId: req.params.playerId, teamId: req.params.teamId }
        },
        $pull: { invites: { playerId: req.params.playerId } },
      }
    );

    res.status(201).json("SUCCESS");
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// @route:  PUT /api/teams/decline/:challengeId/:playerId
// @desc:   declining a challenge

router.put("/decline/:challengeId/:playerId", async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.challengeId);
    if (!challenge) {
      return res.status(404).json({ msg: "Challenge not found" });
    }

    await Challenge.updateOne(
      {
        _id: req.params.challengeId,
      },
      {
        $pull: { invites: { playerId: req.params.playerId } },
      }
    );

    res.status(201).json("SUCCESS");
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.put('/room/:challengeId', auth, async (req, res)=>{
  try {
    const challenge = await Challenge.updateOne({_id: req.params.challengeId}, {$set:{
      'room.roomId': req.body.roomId,
      'room.roompwd': req.body.roompwd
    }})
    res.status(200).json(challenge)
  } catch (err) {
    console.log(err)
    res.status(500).json({msg: "Server Error At Room"})
  }
})

router.get("/challengesbygame/:gameId",async (req,res) => {
  try {
    const challenges = await Challenge.find().populate({
      path:"invites.playerId"
    }).populate("players.playerId").populate("User_team").populate("game").populate("opponent_team")

    let gameChall = []
    for(i=0; i < challenges.length; i++){
      if(challenges[i].game._id == req.params.gameId){
        gameChall.push(challenges[i])
      }
    }

    res.status(200).json(gameChall)
  } catch (err) {
    console.log(err)
    res.status(500).json({msg: "Server Error"})
  }
})


  router.get('/similarchallenges',async (req,res) => {
    try {
      const challenges = await Challenge.find()
      console.log(challenges[0])
      var results
      for(var i=0; i<challenges.length; i++){

        results = await Challenge.aggregate( [
          {
            $group: { _id: {"game":"$game","challengeType":"$challengeType"}}
          }
        ] )
      }
      res.status(200).json(results)
    } catch (err) {
      console.log(err)
      res.status(500).json({msg: "Server Error"})
    }
  })

  // Get Single Challenge.
  router.get('/:challengeId', async (req, res)=>{
    try {
      const challenge = await Challenge.findById({_id: req.params.challengeId}).populate('User_team').populate('opponent_team').populate('game').populate('players.playerId')
      res.status(200).json(challenge)
    } catch (err) {
      console.log(err)
      res.status(500).json({msg: "Server Error At Room"})
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

  function getPlayerId(profile, invites) {
    var plyrId = ''
    
    for(var i=0;i < profile.playergames.length; i++){
      pg = profile.playergames[i]
      for(var j=0; j < invites.length; j++){
        if(pg.player === invites[j].playerId) {
          plyrId = invites[j].playerId
        }
      }
    }
    return plyrId;
  }
  
  

module.exports = router;