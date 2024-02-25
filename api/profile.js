const express = require('express');
const router = express.Router();
var axios = require('axios');

const User = require('../models/User.model');
const Profile = require('../models/Profile.model');
const Follower = require('../models/Follower.model');
const Post = require('../models/Post.model');
const Game = require('../models/Game.model');
const Team = require('../models/Team.model')
const Player = require('../models/Player.model')
const BattlePass = require('../models/BattlePass.model')
const { bpTracker } = require("../server-utils/battlepassTracker")
const Match = require('../models/Match.model')
const Badge = require('../models/Badge.model')
const Address = require('../models/Address.model')
const imagesUpload = require('../middleware/imageUpload.middleware');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const UserPersona = require('../models/UserPersona.model')
const Notification = require('../models/Notification.model')
const Tournament = require('../models/Tournament.model')
const TournamentRules = require('../models/TournamentRules.model')
const Attribute = require('../models/Attribute.model')
const Comment = require('../models/Comment.model')
const Sponsor = require('../models/Sponsor.model')
const Brand = require('../models/Brand.model')
const bcrypt = require('bcryptjs');

const auth = require('../middleware/auth.middleware');
const {
  newFollowerNotification,
  removeFollowerNotification,
} = require('../server-utils/notifications');

// @route   GET /api/profile/:id
// @desc    Get user's profile info
router.get('/:username', async (req, res) => {
  try {
    var id = req.params.username;
    const user = await User.findOne({"username": id});
    if (!user) {
      return res.status(404).json({ msg: 'User not found - Event: UserId' });
    }

    const profile = await Profile.findOne({ user: user._id }).select({"_id":1,"user":1,"current_team":1,"bio":1,
    "online_status":1,"headline":1,"social":1,"playergames":1,"request":1,"teams":1, "gender": 1, "isStatVisible": 1, "isShortcutVisible": 1}).populate({
      path: 'user',
      model: 'User',
      select: { '_id': 1,'name':1,"coverPicUrl":1,"profilePicUrl":1,"username":1},
   })
    .populate({
      path:"playergames",
      populate:{
        path:"game",
        model:"Game",
      }      
    }).populate("headline.game").populate({
      path:"teams.teamId",
      model:"Team",
      select:{'_id':1,'name':1,"imgUrl":1}
    })

    const currentTeam = await Team.findById({_id:profile.current_team})

    const follow = await Follower.findOne({ user: user._id });
    const Userposts = await Post.find({ user: user._id, 'post_type': 'user' })
      .sort({ createdAt: -1 })
      .populate({
        path: 'user',
        model: 'User',
        select: { '_id': 1,'name':1,"coverPicUrl":1,"profilePicUrl":1,"username":1},
     }).populate({
      path: 'shares.user',
      model: 'User',
      select: { '_id': 1,'name':1,"coverPicUrl":1,"profilePicUrl":1,"username":1},
   })

    const sharedPosts = await Post.find({"shares.user" : { $in : user._id }}) 
      .sort({date: -1})
      .populate('user').populate("shares.user");
    
    const posts = sharedPosts.concat(Userposts)

    const badgeArray =
      profile.badges?.length > 0
        ? profile.badges.map(bdg => bdg.badgeId)
        : [];

    const badges = await Badge.find({ _id : { $in : badgeArray } });   

    res.status(200).json({
      profile,
      followers: follow.followers,
      following: follow.following,
      posts,
      badges,
      currentTeam:currentTeam?.name
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.get("/profiledata/:type/:profileId",auth,async (req,res) => {
  try {

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found - Event: UserId' });
    }
    const profile = await Profile.findOne({ _id: req.params.profileId })
    .populate('tournaments.tournamentId')
    .populate('tournaments.team')
    .populate('tournaments.games.gameId')
      const { type } = req.params
    if (!profile) {
      res.status(404).json({ msg: "Profile Not Found" });
    }
    
    switch (type) {

      case "TOURNAMENTS":
        let tours = []
        const tournaments = await Tournament.find({"registered.user": {$in: profile.user} }).populate("games.gameId").populate('registered.user')

        for (let i = 0; i < tournaments.length; i++) {
          tours.push({tournament:tournaments[i], type:"Tournament"})
        }
        
        let teamTournaments = []
        const teamTournament = await Tournament.find({"teams.teamId": {$in : profile?.current_team}}).populate('teams.teamId').populate('games.gameId')
        
        for (let i = 0; i < teamTournament.length; i++) {
          teamTournaments.push({tournament:teamTournament[i], type:"TeamTournament"})
        }

        const prof = profile.tournaments
        let protournaments = []
        for(let i=0; i<prof.length; i++){
          let tournament = await Tournament.findById({_id: prof[i].tournamentId._id}).populate('games.gameId')
          protournaments.push({tournament: tournament, type:"profileTournament", proteam: prof[i].team, ranking: prof[i].team_ranking, winnings: prof[i].winnings})
        }
        
        const Alltournaments = [...tours, ...teamTournaments, ...protournaments]
        res.status(200).json({Alltournaments,type})
          break

      case "TEAMS":
        let proteams = []
        for(let i=0; i < profile.teams.length; i ++){
          let team = await Team.findById({_id: profile.teams[i].teamId}).populate("games.gameId")
          proteams.push({team:team,type:"ProfileTeam"})
        }

        let pg = profile?.playergames;
        let playerList = [];

        for (let i = 0; i < pg?.length; i++) {
          var plyr = pg[i]?.player; 
          if (plyr) {
            playerList.push(plyr);
          }
        }

        let userTeam = []
        
        if (playerList.length > 0) {
          let ut = await Team.find({ "players.playerId": { $in: playerList } }).populate({
            path:"games.gameId"
          }).populate({
            path:"players.playerId"
          });
          
          for(let i=0; i < ut.length; i ++){
            userTeam.push({team:ut[i],type:"PlayerTeam"})
          }
        }  
        let allteam = [...proteams,...userTeam]
        res.status(200).json({teams:allteam,type})
        break

      case "PHOTOS":
        res.status(200).json({photos:profile.imagesgallery,type:"Photos"})
        break
      
      case "VIDEOS":
        res.status(200).json({videos:profile.videosgallery, type:"Videos"})
        break
        
      default:
        break;
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Server error" });
  }
})

// @route   GET /api/profile/:username/followers
// @desc    Get user's followers info
router.get('/:username/followers', async (req, res) => {
  try {
    const user = await User.findOne({
      "username": req.params.username,
    });
    if (!user) {
      return res.status(404).json({ msg: 'User not found : Event: Followers' });
    }

    const followers = await Follower.findOne({ user: user._id }).populate({
      path: "followers.user",
      model: 'User',
      select: ({"_id": 1, "name": 1, "username": 1, "profilePicUrl": 1})
  });
    res.status(200).json(followers?.followers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/profile/:username/following 
// @desc    Get user's following info
router.get('/:username/following', async (req, res) => {
  try {
    const user = await User.findOne({
      username: req.params.username.toLowerCase(),
    });
    if (!user) {
      return res.status(404).json({ msg: 'User not found : Event following' });
    }

    const following = await Follower.findOne({ user: user._id }).populate(
      'following.user'
    );

    res.status(200).json(following?.following);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST /api/profile/follow/:userId
// @desc    Follow or unfollow an user
router.post('/follow/:userId', auth, async (req, res) => {
  try {
    const loggedInUser = await Follower.findOne({ user: req.userId });
    const userToFollowOrUnfollow = await Follower.findOne({
      user: req.params.userId,
    });

    // If either of the user is not found, return error
    if (!loggedInUser || !userToFollowOrUnfollow) {
      return res.status(404).json({ msg: 'User not found: Follow-user' });
    }

    // Check if logged in user is already following the other user (req.params.userId)
    const isFollowing =
      loggedInUser.following.length > 0 &&
      loggedInUser.following.filter(
        (following) => following.user.toString() === req.params.userId
      ).length > 0;

      if(loggedInUser.following.length === 10 ){
        const bp = await BattlePass.findOne({user: req.userId})
        await bpTracker("Follow 10 people",bp._id)
      }

    if (isFollowing) {
      // Unfollow the user if already follwing
      let index = loggedInUser.following.findIndex(
        (following) => following.user.toString() === req.params.userId
      );
      loggedInUser.following.splice(index, 1);
      await loggedInUser.save();

      index = userToFollowOrUnfollow.followers.findIndex(
        (follower) => follower.user.toString() === req.userId
      );
      userToFollowOrUnfollow.followers.splice(index, 1);
      await userToFollowOrUnfollow.save();

      await removeFollowerNotification(req.params.userId, req.userId);

      res.status(200).json(userToFollowOrUnfollow.followers);
    } else {
      loggedInUser.following.unshift({ user: req.params.userId });
      await loggedInUser.save();

      userToFollowOrUnfollow.followers.unshift({ user: req.userId });
      await userToFollowOrUnfollow.save();

      await newFollowerNotification(req.params.userId, req.userId);

      res.status(200).json(userToFollowOrUnfollow.followers);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/profile
// @desc    Get logged in user's profile
router.get('/', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.userId });
    if (!profile) {
      return res.status(404).json({ msg: 'Profile not found' });
    }

    res.status(200).json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   PUT /api/profile
// @desc    Update user profile
router.put('/', auth, async (req, res) => {
  try {
    const { bio, techStack, social } = req.body;

    let profile = await Profile.findOne({ user: req.userId });
    if (!profile) {
      return res.status(404).json({ msg: 'Profile not found' });
    }

    profile = await Profile.findOneAndUpdate(
      { user: req.userId },
      { bio, techStack, social },
      { new: true }
    );

    res.status(200).json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

//Associating player, User IGN and game to MP Profile

router.put('/syncplayeruserign', auth, async (req, res) => {
  try {
    const { player, userign, gameId, userId } = req.body;

    profile = await Profile.findOneAndUpdate(
      { user: userId },
      { playergames : {gameId : gameId, userign:userign, player:player}},
      { new: false }
    );

    res.status(200).json(profile);
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST /api/profile
// @desc    Update user address
router.put('/updateaddress/:profileId',  auth, async (req, res) => {
  try {

    const updAdd = {
      'line1' : req.body.line1,
        'line2' : req.body.line2,
        'city' : req.body.city,
        'state' : req.body.state,
        'country' : req.body.country,
        'zipcode' : req.body.zipcode
    }

    const profile = await Profile.findById(req.params.profileId)

    await Address.findOneAndUpdate({_id:profile.address},updAdd,{new: true})

    res.status(200).json({ msg: 'Address updated successfully...' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});


// @route   GET /api/profile
// @desc    Get the suggested players list
router.post('/suggested/players', auth, async (req, res) => {

  try {

    //const profile = await Profile.findOne({ user: req.query.profileId });
    const profile = await Profile.findById(req.query.profileId);

    console.log(profile);

    if (!profile) {
      return res.status(404).json({ msg: 'Profile not found' });
    }

    
    
    const gameArray = [];

    for(let i=0;i<profile.playergames.length;i++) {
        profile.playergames[i]?.game ? gameArray.push(profile.playergames[i].game) : 0;
    }
    
    const badgeArray =
      profile.badges.length > 0
        ? profile.badges.map(badge => badge.badgeId)
        : [];
        
      let city = profile.address ? profile.address.city : null;
      let zipcode = profile.address ? profile.address.zipcode : null;
      console.log(gameArray);
      const sugplayers = await Profile.aggregate( [
      
          {
            $lookup:
              {
                  from: "users",
                  localField: "user",
                  foreignField: "_id",
                  as: "user_info"
              },                      
        },
        {   $unwind:"$user_info" },
        {
            $lookup:
              {
                  from: "addresses",
                  localField: "address",
                  foreignField: "_id",
                  as: "address_info"
              },
            $lookup:
              {
                  from: "players",
                  localField: "player",
                  foreignField: "_id",
                  as: "player_info"
              }                 
        },
        {
          "$match": {
                "$or": [
              { "address_info.city": { $regex: city, $options: 'i' } },
            {"address_info.zipcode" : zipcode}
            ],
            "$or": [
            { "player_info.games.gameId":{$in: gameArray} }, 
            { "badges.badgeId":{$in:  badgeArray} },
            ]
          }
        },     { $sort: { createdAt: -1 } },

        {
          $project: {
            user_info:1,
            player_info: 1
          }
        }

      ] );
      
      console.log(sugplayers);
      
    res.status(200).json(sugplayers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});


// @route:  PUT /api/auth
// @desc:   Update user cover settings
router.get('/user/username/:key', async (req, res) => {
  try {
    const user = await User.findOne({'public_key' : req.params.key});
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
});

function getObjectArray(Obj, keyId){

  let Objarr = Obj;

  if (!Obj instanceof Array) {
    Objarr = Obj.split(",");
  } 

  var array = [];
      if ( Objarr ){
      for (var i = 0, l = Objarr.length; i < l; i++) {
        if (Objarr[i]) {
          array.push({[keyId]: mongoose.mongo.ObjectId(Objarr[i])});
        }
      }      
    }
    return array;
}

function getId(lists){
  let list = []
  for (let i = 0; i < lists.length; i++) {
    list.push(lists[i]._id)
  }
  return list
}

router.delete('/', auth, async(req, res) => {
  try {
    const id = req.userId
    await UserPersona.findOneAndDelete({user: id})
    const post = await Post.find({user: id})
    const postList = getId(post)
    
    await Comment.deleteMany({post: {$in: postList}})

    await Post.deleteMany({user: id})
    
    await Notification.findOneAndDelete({user: id})
    await Follower.findOneAndDelete({user: id})
    const tournament = await Tournament.find({user: id})
    const tournamentList = getId(tournament)
    await TournamentRules.deleteMany({tournamentId: {$in: tournamentList }})
    await Tournament.deleteMany({user: id})

    const profile = await Profile.findOne({user: id})
    await Address.findByIdAndDelete(profile?.address)

    let pg = profile?.playergames;
    let playerList = [];
    for (let i = 0; i < pg?.length; i++) {
      var plyr = pg[i]?.player; 
      if (plyr) {
        playerList.push(plyr);
      }
    }

    // await Team.updateMany({"employees.employeeId": id}, {
    //   $pull: { employees: { employeeId: id } },
    // })

    await Player.deleteMany({_id: {$in: playerList}})

    await Profile.findOneAndDelete({user: id})
    await Attribute.findOneAndDelete({attributeId: id})
    await Sponsor.deleteMany({user: id})
    await Brand.deleteMany({user: id})
    await User.findByIdAndDelete(id)

    res.status(200).json("Deleted Successfully")
  } catch (err) {
    console.log(err)
    res.status(500).json({msg: "Server Error"})
  }
})


// Profile photo delete
router.delete("/images/:profileId/:collectionId", auth, async (req, res) => {
  try {
    const profile = await Profile.updateOne(
      { _id: req.params.profileId },
      {
        $pull: { imagesgallery: { _id: req.params.collectionId } },
      }
    );
    if (!profile) {
      return res.status(404).json({ msg: "Collection not found" });
    }

    res.status(200).json({ msg: "Success" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Profile video delete
router.delete("/videos/:profileId/:collectionId", auth, async (req, res) => {
  try {
    const profile = await Profile.updateOne(
      { _id: req.params.profileId },
      {
        $pull: { videosgallery: { _id: req.params.collectionId } },
      }
    );
    if (!profile) {
      return res.status(404).json({ msg: "Collection not found" });
    }

    res.status(200).json({ msg: "Success" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Add games to playergames
router.patch("/addgame/:profileId", auth, async (req, res) => {
  const {gameId, userIgn} = req.body
    try{
      let profile = await Profile.findById(req.params.profileId);

      let user = await User.findById(req.userId)

      if (!profile) {
        return res.status(404).json({ msg: 'Profile not found' });
      }
      let playerFields = {}
      playerFields.user = user._id;
      var val = Math.floor(10000000 + Math.random() * 90000000);
      playerFields._id = val;
      playerFields.game = gameId
      var playerId = val;
      const respon = await getPlayerInfo(gameId, userIgn);
      
      if (respon) {
  
        console.log('Got the player info ****************')
        console.log(respon);
        console.log('Check if we really got the player info ****************')
        playerFields.apidata = respon.data;
  
        //Check if the player user is already in our DB
        if(respon.data) {
          let pname = 'undefined'
          if(gameId === 4){
            pname = respon.data.profile.name;
            console.log('Got the player NAMMMMMMMM ****************' + pname);
          }else if(gameId === 1 && gameId === 20 && gameId === 25) {
            pname = respon.data.data.platformInfo.platformUserIdentifier;
          }else if(gameId === 3){
            pname = respon.data.data.platformInfo.platformUserHandle;
          }
  
          let plyrname = new RegExp([pname].join(""), "i");
  
         const pexist = await Player.findOneAndUpdate(
         { name: { $regex: plyrname }  },
         { apidata: respon.data, user: user._id},
         { new: true }
        ); 
  
         console.log('AAAAAA : ' + pexist);
  
          if (pexist != null){
            playerId = pexist._id;
            console.log("not nulllll")
          } else {
             await new Player(playerFields).save() ; 
             console.log("New Players")     
          }
  
        }
  
      const profile1 = await Profile.findOneAndUpdate(
      { user: user._id},
        { $push: { playergames: [ { game : gameId,  userign:userIgn, player:playerId } ] } }
    );
    
    }

    res.status(200).json(profile);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
})

// Rigs
router.put("/rigs/:userId", async(req, res)=> {
  try {
    
    var rigsList = req.body
    delete rigsList.rigsType
    
    var keys = Object.keys(rigsList)
    var rigsArr = []

    keys.forEach((key,index) => {
      if(rigsList[key] !== ''){
      rigsArr.push({rigId: rigsList[key]})
      }
    })

    const profile = await Profile.updateOne({user: req.params.userId}, {$push: {
      rigs: rigsArr
    }
  },
  )

  res.status(200).json(profile)
  } catch (err) {
    console.log(err)
    res.status(500).json({msg: 'Server Error at Rigs '})
  }
})

// Rigs delete
router.delete("/rigs/:profileId/:rigId", auth, async (req, res) => {
  try {
    const profile = await Profile.updateOne(
      { _id: req.params.profileId },
      {
        $pull: { rigs: { _id: req.params.rigId } },
      }
    );
    console.log(profile)
    if (!profile) {
      return res.status(404).json({ msg: "Collection not found" });
    }

    res.status(200).json({ msg: "Success" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// profile team delete
router.delete("/profileteam/:profileId/:teamId/:obj_id", auth, async (req, res) => {
  try {
    // Ensure the teamId is treated as a string if it's not already
    const { profileId, teamId, obj_id } = req.params;
    //obj_id is the actual team object id which will help to delete the array elemet.
    const profile = await Profile.updateOne(
      { _id: profileId },
      {
        $pull: { teams: { _id: obj_id } },
      }
    );
    
    const curr_team_id = await Profile.findOne({ _id: profileId }, { current_team: 1 });
    
    if(curr_team_id.current_team==teamId){
    
      await Profile.updateOne(
        { _id: profileId },
        {
          $unset: { current_team: "" }
        }
      )
      
    }
    // Check if the operation actually modified any documents
    if (profile.modifiedCount === 0) {
      return res.status(404).json({ msg: "Team not found in profile or profile not found." });
    }

    res.status(200).json({ msg: "Team successfully removed from profile." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});


// Adding Teams
router.post("/team/:profileId/", async(req, res)=> {
  try {
    var gamesArr = getNumberArray(req.body.game, "gameId");
    const profile = await Profile.findByIdAndUpdate( req.params.profileId, {$push: {
      teams: {
        teamId: req.body.teamId,
        games: gamesArr,
        role: req.body.role,
        startDate: req.body.teamStartDate,
        endDate: req.body.teamEndDate
      },
    }},
    {new: true}
    )
    res.status(200).json(profile)
  } catch (err) {
    console.log(err)
    res.status(500).json({msg: 'Server Error'})
  }
})

// Adding Tournaments
router.post("/tournaments/:profileId/", imagesUpload.single('image'), async(req, res)=> {
  try {
    var gamesArr = getNumberArray(req.body.games, "gameId");
    const profile = await Profile.findByIdAndUpdate(req.params.profileId, {$push: {
      tournaments: {
        tournamentId: req.body.tournamentId,
        organizer: req.body.organizer,
        games: gamesArr,
        team: req.body.team,
        role: req.body.role,
        year: Date(req.body.year),
        currency: req.body.currency,
        team_ranking: req.body.team_ranking,
        winnings: req.body.winnings
      },
    }
  },
  {new : true}
  )
    res.status(200).json(profile)
  } catch (err) {
    console.log(err)
    res.status(500).json({msg: 'Server Error'})
  }
})

router.put("/type/:profileId", async(req, res)=> {
  try {
    let {profileType , firstName, lastName, username, game, b_role, bio, Online, team, role, startDate, company, industry, facebook, instagram, twitch, youtube, discord, website, link, streamingPlatform, gameId, userIgn} = req.body

    var name = firstName + ' ' + lastName;
    var headline = {
      profileType,
      team: team,
      inGameRole:role,
      game: game,
      link,
      streamingPlatform,
      company,
      industry,
      business_role:b_role,
      startDate
    }

      let profile = await Profile.findById(req.params.profileId);

      let user = await User.findById({_id:profile.user})

      if (!profile) {
        return res.status(404).json({ msg: 'Profile not found' });
      }
      let playerFields = {}
      playerFields.user = user._id;
      var val = Math.floor(10000000 + Math.random() * 90000000);
      playerFields._id = val;
      playerFields.game = gameId
      var playerId = val;
      const respon = await getPlayerInfo(gameId, userIgn);
      
      if (respon) {
  
        console.log('Got the player info ****************')
        // console.log(respon);
        console.log('Check if we really got the player info ****************')
        if(gameId === 20){
          playerFields.apidata = respon?.stat.data?.attributes
          playerFields.name = respon.data[0]?.attributes.name
        }else if(gameId === 26){
          playerFields.apidata = respon.data
          playerFields.name = respon.name
        } else if(gameId === 32){
          userIgn = respon.data.name
          playerFields.apidata = respon.data
          playerFields.name = respon.data.name
        } else {
          playerFields.apidata = respon.data
        }

        //Check if the player user is already in our DB
        if(respon.data) {
          let pname = 'undefined'
          if(gameId === 4){
            pname = respon.data.profile.name;
            console.log('Got the player NAMMMMMMMM ****************' + pname);
          }else if(gameId === 1 && gameId === 25) {
            pname = respon.data.data.platformInfo.platformUserIdentifier;
          }else if(gameId === 3){
            pname = respon.data.data.platformInfo.platformUserHandle;
          }else if(gameId === 20){
            pname = respon.data[0]?.attributes?.name
          }else if(gameId === 26){
            pname = respon.name
          }else if(gameId === 32){
            pname = respon.data.name
          }
  
          let plyrname = new RegExp([pname].join(""), "i");
  
         const pexist = await Player.findOneAndUpdate(
         { name: { $regex: plyrname }  },
         { apidata: respon.data, user: user._id},
         { new: true }
        ); 
  
         console.log('AAAAAA : ' + pexist);
  
          if (pexist != null){
            playerId = pexist._id;
            // console.log("not nulllll")
          } else {
             await new Player(playerFields).save() ; 
             console.log("New Players")     
          }
  
        }

      await Profile.findOneAndUpdate(
      { user: user._id},
        { $push: { playergames: [ { game : gameId,  userign:userIgn, player:playerId } ] } }
    );
    
    }
  
    await Profile.updateOne({_id: req.params.profileId}, {$set: {
      headline,
      current_team: team,
      bio,
      online_status: Online,
      social:{
        facebook,
        instagram,
        twitch,
        youtube,
        discord,
        website
      }
    }
  },
  )

  await User.updateOne({_id: profile.user}, {$set:{
    username,
    name
  }})

  if(bio.length > 0){
    const bp = await BattlePass.findOne({user: user._id})
    await bpTracker("Edit about me",bp._id)
  }

  res.status(200).json("Success")
  } catch (err) {
    console.log(err)
    res.status(500).json({msg: 'Server Error'})
  }
})
router.put("/block/:type", auth, async(req, res)=> {
  try {
    if(req.params.type === 'BLOCK'){

      await Profile.findOneAndUpdate({"user" : req.userId}, {$push: {
        blockList: {user: req.body.userId}
      }
    },
    {new : true}
    )
    
    await Follower.findOneAndUpdate({"user": req.userId},{$pull:{
      followers: {user: req.body.userId},
      following: {user: req.body.userId}
    }
  })
  
  res.status(200).json("Success")
} else {
  // const profile = 
  await Profile.updateOne({"user" : req.userId}, {$pull: {
    blockList: {user: req.body.userId}
  }
  })
  const profile = await Profile.findOne({"user": req.userId}).populate({
  path:"blockList.user",
  model:"User",
  select:{"_id": 1, "name": 1, "username": 1, "profilePicUrl": 1}
})

  res.status(200).json(profile.blockList)
}
  } catch (err) {
    console.log(err)
    res.status(500).json({msg: 'Server Error'})
  }
})

router.put('/settings/:type', auth, async(req, res)=>{
  try {
    switch (req.params.type) {
      case "GENERAL":
        const user = await User.findOneAndUpdate({"_id": req.userId}, {$set: {
          name: req.body.firstName + ' ' + req.body.lastName,
          username: req.body.username,
          profilePicUrl: req.body.profilePicUrl,
          country: req.body.country,
          email: req.body.email,
          phone_number: req.body.phoneNumber
        }})
          // console.log("GENERAL BEE", req.body)
        const profile = await Profile.findOneAndUpdate({"user": req.userId}, {$set:{
          bio: req.body.bio,
          gender: req.body.gender,
          DOB: req.body.DOB,
          // timeZone: rwq.body.timeZone,
        }})
        res.status(200).json("Success")
        break;
        
      case "ACCOUNTS":
        const accUser = await User.findById(req.userId)
        const accProfile = await Profile.findOne({"user": req.userId})
        let {gameId, userIgn, facebook, instagram, twitch, youtube, discord, website} = req.body
        // console.log("ACCOUNTS BEE",req.body)
        if (!accProfile) {
          return res.status(404).json({ msg: 'Profile not found' });
        }

        let playerFields = {}
      playerFields.user = accUser._id;
      var val = Math.floor(10000000 + Math.random() * 90000000);
      playerFields._id = val;
      playerFields.game = gameId
      var playerId = val;
      const respon = await getPlayerInfo(gameId, userIgn);

        if(userIgn.length > 0){
      if (respon) {
  
        console.log('Got the player info ****************')
        // console.log(respon);
        console.log('Check if we really got the player info ****************')
        if(gameId === 20){
          playerFields.apidata = respon?.stat.data?.attributes
          playerFields.name = respon.data[0]?.attributes.name
        }else if(gameId === 26){
          playerFields.apidata = respon.data
          playerFields.name = respon.name
        } else if(gameId === 32){
          userIgn = respon.data.name
          playerFields.apidata = respon.data
          playerFields.name = respon.data.name
        } else if(gameId === 3){
          userIgn = respon.data.data.platformInfo?.platformUserHandle
          playerFields.apidata = respon.data
          playerFields.name = respon.data.data.platformInfo?.platformUserHandle
        } else {
          playerFields.apidata = respon.data
        }

        //Check if the player user is already in our DB
        if(respon.data) {
          let pname = 'undefined'
          if(gameId === 4){
            pname = respon.data.profile.name;
            console.log('Got the player NAMMMMMMMM ****************' + pname);
          }else if(gameId === 1 && gameId === 25) {
            pname = respon.data.data.platformInfo.platformUserIdentifier;
          }else if(gameId === 3){
            pname = respon.data.data.platformInfo.platformUserHandle;
          }else if(gameId === 20){
            pname = respon.data[0]?.attributes?.name
          }else if(gameId === 26){
            pname = respon.name
          }else if(gameId === 32){
            pname = respon.data.name
          }
  
         const pexist = await Player.findOneAndUpdate(
         { name: pname },{$set:{
          apidata: respon.data, user: accUser._id,
        }
      },
      { new: true }
        ); 
  
         console.log('AAAAAA : ' + pexist);
  
          if (pexist != null){
            playerId = pexist._id;
            // console.log("not nulllll")
          } else {
             await new Player(playerFields).save() ; 
             console.log("New Players")     
          }
  
        }

      await Profile.findOneAndUpdate(
      { user: accUser._id},
        { $push: { playergames: [ { game : gameId,  userign:userIgn, player:playerId } ] } }
    );
    
    }
        }

    await Profile.findOneAndUpdate({_id: accProfile._id}, {$set: {
      social:{
        facebook,
        instagram,
        twitch,
        youtube,
        discord,
        website
      }
    }
  },
  )
        res.status(200).json("Success")
        break

      case "SECURITY":
        const { currentPassword, newPassword, retryPassword, isStatVisible, isShortcutVisible, isWagerVisible } = req.body;
        if( currentPassword && currentPassword.length > 0 && newPassword.length > 0){

      let passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?!.* ).{8,}$/;

      if(!passwordRegex.test(newPassword)){
        return res.status(200).json({ msg: 'Use 8 or more characters with a mix of atleast 1 Uppercase,1 Lowercase, numbers and symbols[@$!%*#]' });
      }

      const user = await User.findById(req.userId).select('+password');
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      // Check if current password matches
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(200).json({ msg: 'Incorrect Current Password' });
      }

      if(newPassword !== retryPassword){
        return res.status(200).json({msg: 'Password Do Not Match'})
      }

      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();

    }

    await Profile.findOneAndUpdate({"user": req.userId}, {$set: {
      isStatVisible,
      isWagerVisible,
      isShortcutVisible
    }})
    
        res.status(200).json({msg: "Success"});
        break
        
      default:
        break;
    }
  } catch (err) {
    console.log(err)
    res.status(500).json("Server Error")
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

const getPlayerInfo = async (gam, userign) => {
  try {

    let apiurl = process.env.API_URI_DOTA2;
    const gameId = Number(gam);

    switch(gameId) {
      case 1:
        apiurl = process.env.API_URI_LOL + `/${userign}?TRN-Api-Key=eaf274a8-855c-4d57-b83c-94392c2cd987`;
        break;
      case 4:
        apiurl = process.env.API_URI_DOTA2 + `/players/${userign}`;
        break;
      case 3:
        apiurl = process.env.API_URI_CSGO +  `/${userign}?TRN-Api-Key=eaf274a8-855c-4d57-b83c-94392c2cd987`
        break;
      case 20:
        apiurl = process.env.API_URI_PUBG + `?filter[playerNames]=${userign}`
        break;
      case 25:
        apiurl = process.env.API_URI_APEX + `${userign}?TRN-Api-Key=eaf274a8-855c-4d57-b83c-94392c2cd987`
        break;
      case 14:
        apiurl = process.env.PANDA_OW;
        break;
      case 26:
        let valNames = userign.split('#')
        apiurl = process.env.API_URI_VALORANT + `/${valNames[0]}/${valNames[1]}`
        break;
      case 32:
        if(userign.split('#').length > 1){
          let x = userign.split('#')
          userign = x[1]
        }
        apiurl = process.env.API_URI_CLASH_ROYALE + `/%23${userign}`
        break;
      default:
        apiurl = process.env.PANDA_CSGO;
    } 

    // console.log(apiurl);

    if(gameId === 20){
      const { data } = await axios.get(apiurl, { headers: {
        'Authorization': 'Bearer ' + `${process.env.PUBG_API_KEY}`,
        'Accept': 'application/vnd.api+json'
      } 
    
    });
      const stat = await axios.get(`${process.env.API_URI_PUBG}/${data.data[0].id}/seasons/lifetime?filter[gamepad]=false`, { headers: {
        'Authorization': 'Bearer ' + `${process.env.PUBG_API_KEY}`,
        'Accept': 'application/vnd.api+json'
      } 
    }).then((res)=> res.data)
    return {stat, data: data.data};
  }else 
  if(gameId === 26){
      // ========== The Below section is for valorent match data from 3rd party
      const { data } = await axios.get(apiurl)

      const stat = await axios.get(`${process.env.API_URI_VALORANT_MATCHES}/${data.data.region}/${data.data.puuid}`)

      return {data: stat.data, name: userign}
      // ==========
    } else
    if(gameId === 32){
      // Clash Royale API useing official documentation.
      const {data} = await axios.get(apiurl,
        { headers: {
          'Authorization': 'Bearer ' + `${process.env.CLASH_ROYALE_API_KEY}`,
          'Accept': 'application/json'
        } 
      })
      // console.log("DATAAAAAA", data)
      return { data }
    } else {
      const { data } = await axios.get(apiurl, { headers: { } });
      return { data };
    }
    
  } catch (error) {
    // console.error(error);
  }
};

module.exports = router;
