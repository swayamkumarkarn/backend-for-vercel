const express = require('express');
const router = express.Router();

const Challenge = require("../models/Challenge.model")
const auth = require("../middleware/auth.middleware")
const Tournament = require("../models/Tournament.model");
const Group = require("../models/Group.model")
const Match = require("../models/Match.model")
const Team = require("../models/Team.model")
const Profile = require("../models/Profile.model")
const Brand = require("../models/Brand.model")
const SupportAdmin = require("../models/SupportAdmin.model")
const UserPersona = require("../models/UserPersona.model")
const Sponsor = require("../models/Sponsor.model")
const imagesUpload = require("../middleware/imageUpload.middleware")

router.get('/admindata',async (req,res) => {
    try{
      const tournaments = await Tournament.find().limit(Number(5000)).sort({ createdAt: -1 });
  
      if(!tournaments){
        return res.status(404).json({msg : 'No data'})
      }

      const challenges = await Challenge.find().limit(Number(15)).populate("User_team").populate("game").populate("opponent_team").populate("players.playerId")
      .sort({ createdAt: -1 });
  
      if(!challenges){
        return res.status(404).json({msg: 'No data'})
      }

      res.status(200).json({tournaments, challenges})
    } catch(error){
      console.error(error);
      res.status(500).json({ msg: 'Server error' });
    }
  })

// ----- SUPPORT ADMIN ROUTES -----
router.get('/supportadmindata/:type', auth, async (req,res) => {
  try{
    const { type } = req.params
    switch (type) {
      case "TEAMS":
        const dataSet  = await SupportAdmin.findOne({user:req.userId}).populate({
          path: 'teams.teamId',
          model: 'Team',
          select: { '_id': 1,"name":1,"imgUrl":1},
       }).populate({
        path:'teams.user',
        model: 'User',
        select: { '_id':1, 'name':1, 'profilePicUrl':1 }
       })
       res.status(200).json(dataSet.teams)
        break;
      
      case "TOURNAMENTS":
        const dataSet2  = await SupportAdmin.findOne({user:req.userId}).populate({
              path: 'tournaments.tournamentId',
              model: 'Tournament',
              select: { '_id': 1,"name":1,"imgUrl":1},
           }).populate({
            path:'tournaments.user',
            model: 'User',
            select: { '_id':1, 'name':1, 'profilePicUrl':1 }
           })
        res.status(200).json(dataSet2.tournaments)
        break
      
      case "BRANDS":
        const dataSet3  = await SupportAdmin.findOne({user:req.userId}).populate({
          path: 'brands.brandId',
          model: 'Brand',
          select: { '_id': 1,"name":1,"logoUrl":1},
        }).populate({
          path:'brands.user',
          model: 'User',
          select: { '_id':1, 'name':1, 'profilePicUrl':1 }
         })
        res.status(200).json(dataSet3.brands)
        break
         
      case "TOUR BRACKET":
        const tours = await Tournament.find({isMatchSetting: true}).select({"_id": 1, "name":1, "imgUrl": 1, "playType": 1, "isMatchSetting": 1})
        res.status(200).json(tours)
        break

      default:
        break;
    }
  } catch(error){
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
})

router.post('/team/:teamId/:userId', auth, imagesUpload.array("images", 5), async (req,res) => {
  try {
    var path = [];
    let teamId =  Number(req.params.teamId)
    for (let i = 0; i < req.files.length; i++) {
      path.push(req.files[i]);
    }

    await SupportAdmin.updateMany(
      {
        $push: { 
          teams: { teamId: teamId, user: req.params.userId, imageproof:{ images: path }, applyDate: Date(),
        }
        },
      }
    );
    res.status(200).json("Success")
  } catch (error) {
    console.log(error)
    res.status(500).json({msg: "Server error"})
  }
})

router.post('/tournament/:tournamentId/:userId', auth, imagesUpload.array("images", 5), async (req,res) => {
  try {
    var path = [];
    let tournamentId =  Number(req.params.tournamentId)
    for (let i = 0; i < req.files.length; i++) {
      path.push(req.files[i]);
    }

    await SupportAdmin.updateMany(
      {
        $push: { 
          tournaments: { tournamentId: tournamentId, user: req.params.userId, imageproof:{ images: path }, applyDate: Date(),
        }
        },
      }
    );
    res.status(200).json("Success")
  } catch (error) {
    console.log(error)
    res.status(500).json({msg: "Server error"})
  }
})

router.post('/brand/:brandId/:userId', auth, imagesUpload.array("images", 5), async (req,res) => {
  try {
    var path = [];
    for (let i = 0; i < req.files.length; i++) {
      path.push(req.files[i]);
    }

    await SupportAdmin.updateMany(
      {
        $push: { 
          brands: { brandId: req.params.brandId, user: req.params.userId, imageproof:{ images: path }, applyDate: Date(),
        }
        },
      }
    );
    res.status(200).json("Success")
  } catch (error) {
    console.log(error)
    res.status(500).json({msg: "Server error"})
  }
})

router.put('/approve/:type/:Id/:userId', auth, async (req,res) => {
  try {
    const { Id, userId, type } = req.params  

    switch (type) {
      case "Teams":
        const team = await Team.findById(Id)
        let profile = await Profile.findOne({ user: userId });
        let plyrArr = []

        plyrArr = profile.playergames.map((elm) => ({
          playerId: elm.player,
        }));

        await Team.updateOne(
          {
            _id: Id,
          },
          {
            $push: { players: plyrArr },
            $set: {isClaimed: true, employees: { employeeId: userId } }
          }
        ); 

        const teamuserpersona = await UserPersona.findOne({ user: userId });
        await teamuserpersona.personas.push({ teamId: team._id, type: "team" });
        await teamuserpersona.save();

        await SupportAdmin.updateMany({
          $pull: {
            teams: {teamId:Id, user: userId}
          }
        })
    break;
      
    case "Tournaments":
      const tournament = await Tournament.findById(Id)
      await Tournament.updateOne(
        {
          _id: Id,
        },
        {
          $set: {isClaimed: true, user: userId }
        }
      );
      const touruserpersona = await UserPersona.findOne({ user: userId });
    await touruserpersona.personas.push({ tournamentId: tournament._id, type: "tournament" });
    await touruserpersona.save();
    await SupportAdmin.updateMany({
      $pull: {
        tournaments: {tournamentId:Id, user: userId}
      }
    })
      break
    
    case "Brands":
      const brand = await Brand.findById(Id)
      await Brand.updateOne(
        {
          _id: Id,
        },
        {
          $set: {isClaimed: true, user: userId }
        }
      );
      await Sponsor.updateOne(
        {
          brand:brand._id,
        },
        {
          $set: { user: userId }
        }
      );
      await Organiser.updateOne({brand:brand._id},{$set:{user: userId}})
      const branduserpersona = await UserPersona.findOne({ user: userId });
      await branduserpersona.personas.push({ brandId: brand._id, type: "brand" });
      await branduserpersona.save();
      await SupportAdmin.updateMany({
        $pull: {
          brands: { brandId:Id, user: userId}
        }
      })
      break
    
      default:
        break;
    }
    res.status(200).json("Success")
  } catch (error) {
    console.log(error)
    res.status(500).json({msg: "Server Error"})
  }
})

router.put('/deny/:type/:Id/:userId', auth, async (req,res) => {
  try { 
    const { Id, userId, type } = req.params
    switch (type) {
      case "Teams":
        await SupportAdmin.updateMany({
          $pull: {
            teams: {teamId:Id, user: userId}
          }
        })
        break;
      case "Tournaments":
        await SupportAdmin.updateMany({
          $pull: {
            tournaments: {tournamentId:Id, user: userId}
          }
        })
        break;
      case "Brands":
        await SupportAdmin.updateMany({
          $pull: {
            brands: { brandId:Id, user: userId}
          }
        })
        break
      default:
        break;
    }
    res.status(200).json("Success")
  } catch (error) {
    console.log(error)
    res.status(500).json({msg: "Server Error"})
  }
})

router.get('/bracketData/:Type/:tournamentId', auth, async(req, res)=>{
  try {
    const tournament = await Tournament.findById(req.params.tournamentId).populate({
      path: 'registered.user',
      model: 'User',
      select: {"_id": 1, "name": 1, "username": 1, "profilePicUrl": 1}
    }).populate({
      path: 'teams.teamId',
      model: 'Team',
      select: {"_id": 1, "name": 1, "imgUrl": 1}
    })

    switch(req.params.Type){
      case "SEED":
        let playerList = []

        if(tournament.playType === "SOLO"){
          playerList = tournament.registered
        }else{
          playerList = tournament.teams
        }

        res.status(200).json({data: playerList})
        break;
      case "MATCHES":
        let groupData = await Group.find({"tournamentId": tournament._id})
        let matchesData = await Match.find({"groupId": groupData[0]._id}).populate({
          path: "participants.participantId",
          model: "User",
          select: {"_id": 1, "name": 1, "profilePicUrl": 1}
        }).populate({
          path: "games.gameId",
          model: "Game",
          select: {"_id": 1, "name": 1}
        })
        res.status(200).json({data: matchesData, isMatchPlayersSet: groupData[0].isMatchPlayersSet})
        break;
       
      default:
        break;
    }

  } catch (err) {
    console.log(err)
    res.status(500).json({msg: "Server Error"})
  }
})

router.put('/setMatchesWithPlayers/:tournamentId',async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.tournamentId).populate({
      path: 'registered.user',
      model: 'User',
      select: {"_id": 1, "name": 1, "username": 1, "profilePicUrl": 1}
    }).populate({
      path: 'teams.teamId',
      model: 'Team',
      select: {"_id": 1, "name": 1, "imgUrl": 1}
    })
        let group = await Group.find({"tournamentId": tournament._id})
        let matches = await Match.find({"groupId": group[0]._id})
        let membersData = req.body

        if(tournament.playType === "SOLO"){
          for(i=0; i < matches.length; i++){
            for(k=0; k < matches[i].participants.length; k++){
              for(m=0; m < membersData.length; m++){
                if(matches[i].participants[k].isByes === false && matches[i].instance === "Round1"){
                  matches[i].participants[k].participantId = membersData[m].user._id,
                  membersData.splice(m,1)
                  await matches[i].save()
                  break
                }
                if(matches[i].participants[k].isByes === true && matches[i].instance === "Round2"){
                  matches[i].participants[k].participantId = membersData[m].user._id,
                  matches[i].participants[k].isByes = false
                  console.log(membersData[m])
                  membersData.splice(m,1)
                  await matches[i].save()
                  break
                }
              }
            }
          }
        } else {
          for(i=0; i < matches.length; i++){
            for(k=0; k < matches[i].opponents.length; k++){
              for(m=0; m < membersData.length; m++){
                if(matches[i].opponents[k].isByes === false && matches[i].instance === "Round1"){
                  let dataObj = {
                    _id: membersData[m].teamId._id,
                    image_url: membersData[m].teamId.imgUrl,
                    name: membersData[m].teamId.name,
                  }
                  matches[i].opponents[k].opponent = dataObj
                  membersData.splice(m,1)
                  await matches[i].save()
                  break
                }
                if(matches[i].opponents[k].isByes === true && matches[i].instance === "Round2"){
                  let dataObj = {
                    _id: membersData[m].teamId._id,
                    image_url: membersData[m].teamId.imgUrl,
                    name: membersData[m].teamId.name,
                  }
                  matches[i].opponents[k].opponent = dataObj,
                  matches[i].opponents[k].isByes = false
                  membersData.splice(m,1)
                  await matches[i].save()
                  break
                }
              }
            }
          }
        }
        
        group[0].isMatchPlayersSet = true
        await group[0].save()
        res.status(200).json({matches, isMatchPlayersSet: group[0].isMatchPlayersSet})
  } catch (err) {
    console.log(err)
    res.status(500).json({msg: "Server Error"})
  }
})

router.get('/shuffle/:tournamentId', async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.tournamentId).populate({
      path: 'registered.user',
      model: 'User',
      select: {"_id": 1, "name": 1, "username": 1, "profilePicUrl": 1}
    }).populate({
      path: 'teams.teamId',
      model: 'Team',
      select: {"_id": 1, "name": 1, "imgUrl": 1}
    })
    const group = await Group.findOne({tournamentId: tournament._id})
    const matches = await Match.find({groupId: group._id}).limit(100)
    let final
    let newTour

    const shuffle = async (array) => {
      let currentIndex = array.length,  randomIndex;
    
      // While there remain elements to shuffle.
      while (currentIndex != 0) {
    
        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
    
        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
          array[randomIndex], array[currentIndex]];
      }
      return array;
    }

    if(tournament.playType === "SOLO"){
      final = await shuffle(tournament.registered)
      await Tournament.findByIdAndUpdate(tournament._id,{
        registered: final
      }).populate({
        path: 'registered.user',
        model: 'User',
        select: {"_id": 1, "name": 1, "username": 1, "profilePicUrl": 1}
      }).populate({
        path: 'teams.teamId',
        model: 'Team',
        select: {"_id": 1, "name": 1, "imgUrl": 1}
      })
    }else{
      final = await shuffle(tournament.teams)
      await Tournament.findByIdAndUpdate(tournament._id, {$set:{
        teams: final
      }}).populate({
        path: 'registered.user',
        model: 'User',
        select: {"_id": 1, "name": 1, "username": 1, "profilePicUrl": 1}
      }).populate({
        path: 'teams.teamId',
        model: 'Team',
        select: {"_id": 1, "name": 1, "imgUrl": 1}
      })
    }

    newTour = await Tournament.findById(tournament._id).populate({
      path: 'registered.user',
      model: 'User',
      select: {"_id": 1, "name": 1, "username": 1, "profilePicUrl": 1}
    }).populate({
      path: 'teams.teamId',
      model: 'Team',
      select: {"_id": 1, "name": 1, "imgUrl": 1}
    })

    let data = newTour.registered.length > 0 ? newTour.registered : newTour.teams
    res.status(200).json(data)
  } catch (err) {
    console.log(err)
    res.status(500).json({msg: "Server Error"})
  }
})

module.exports = router;