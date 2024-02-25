const express = require("express");
const router = express.Router();

const Squad = require("../models/Squad.model");
const Team = require("../models/Team.model");
const User = require("../models/User.model");
const Arena = require("../models/Arena.model");
const Sponsor = require("../models/Sponsor.model");
const Job = require("../models/Job.model");
const Profile = require("../models/Profile.model");
const Game = require("../models/Game.model")
const RigsData = require("../models/RigsData.model")
const Match = require("../models/Match.model");
const Player = require("../models/Player.model");
const Attribute = require('../models/Attribute.model')
const UserPersona = require("../models/UserPersona.model");
var mongoose = require("mongoose");
const imagesUpload = require("../middleware/imageUpload.middleware");
const { bpTracker } = require("../server-utils/battlepassTracker")
const BattlePass = require("../models/BattlePass.model")
const Post = require("../models/Post.model")
const Tournament = require('../models/Tournament.model')

const auth = require("../middleware/auth.middleware");

router.get("/getTeamIds", async (req, res) => {
  try {
    const teams = await Team.find()
      .limit(Number(process.env.TEAM_THRESHOLD_COUNT))
      .sort({ createdAt: -1 });

    if (!teams) {
      return res.status(404).json({ msg: "Teams not found" });
    }

    var teamIds = [];
    for (let i = 0; i < teams?.length; i++) {
      teamIds.push(teams[i]._id);
    }

    res.status(200).json(teamIds);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/all", async (req, res) => {
  try {
    // Retrieve the page number and limit from query parameters (with defaults if not provided)
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10; // Default limit to 10 if not provided or not set in .env

    // Calculate the skip value
    const skip = (page - 1) * limit;

    // Query the database with limit and skip for pagination
    const teams = await Team.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    if (!teams.length) {
      return res.status(404).json({ msg: "Teams not found" });
    }

    // Optional: Return total number of documents to calculate total pages on the client-side
    const totalTeams = await Team.countDocuments();

    var teamIds = teams.map(team => team._id);

    // Return paginated data along with pagination details
    res.status(200).json({
      teams: teamIds,
      currentPage: page,
      totalPages: Math.ceil(totalTeams / limit),
      totalTeams: totalTeams
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
});


router.get("/:teamId", async (req, res) => {
  try {
    const team = await Team.findOne({ _id : req.params.teamId })
      .populate({
        path: "employees.employeeId",
      })
      .populate({
        path: 'request.playerId',
        model: 'Player',
        select: {"_id": 1}
      })

    if (!team) {
      res.status(404).json({ msg: "Team Not Found" });
    }

    const arenaArray =
      team.arenas?.length > 0 ? team.arenas.map((arn) => arn.arenaId) : [];

    const arenas = await Arena.find({ _id: { $in: arenaArray } });

    const empArray =
        team.employees?.length > 0
          ? team.employees.map((emp) => emp.employeeId)
          : [];

    const employees = await User.find({ _id: { $in: empArray } });

    const gameArray =
        team.games?.length > 0
          ? team.games.map((game) => game.gameId)
          : [];

    const games = await Game.find({ _id: { $in: gameArray } });

    const teamPosts = await Post.find({'post_type': 'team', 'username': team.name})
    .populate({
      path: "shares.user",
      model: "User",
      select: {"_id": 1, "name": 1, "username": 1}
    })

    res.status(200).json({
      team,
      arenas,
      employees,
      games,
      teamPosts
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/teamdata/:type/:teamId",async (req,res) => {
  try {
    const team = await Team.findOne({ _id: req.params.teamId })
      const { type } = req.params
    if (!team) {
      res.status(404).json({ msg: "Team Not Found" });
    }
    switch (type) {
      case "RIGS":
            const rigsArray = 
          team.rigs?.length > 0
            ? team.rigs.map((rig) => rig.rigId)
            : []

        const rigs = await RigsData.find({_id: { $in: rigsArray }})
        res.status(200).json({rigs,type})  
        break;
      
      case "SPONSORS":
        const sponsorArray =
            team.sponsors?.length > 0
              ? team.sponsors.map((spnsor) => spnsor.sponsorId)
              : [];

        const sponsors = await Sponsor.find({ _id: { $in: sponsorArray } });
        res.status(200).json({sponsors, type})
        break

      case "ABOUT":
          const teams = await Team.findOne({ _id: req.params.teamId }).populate('employees.employeeId')
          const employees = teams.employees
          res.status(200).json({employees, type})
          break

      case "SQUADS":
            const playerArray =
              team.players?.length > 0 ? team.players.map((plyr) => plyr.playerId) : [];

            const players = await Player.find({ _id: { $in: playerArray } });

            const squdArray =
                team.squads?.length > 0 ? team.squads.map((squad) => squad.squadId) : [];

              const squads = await Squad.find({ _id: { $in: squdArray } }).populate('game').populate({
                path: "players.player",
              });
              res.status(200).json({players,squads,type})
              break
      case "MATCHES":
            const teamMatches = await Match.find({ "opponents.opponent._id": team._id })
                .limit(10)
                .sort({ createdAt: -1 });
            res.status(200).json({teamMatches,type})
            break
      
      case "JOINES":
            const team1 = await Team.findOne({ _id: req.params.teamId }).populate({
              path: 'request.playerId',
              model: 'Player',
              select: { '_id': 1,'name':1,"imgUrl":1,"apidata":1},
           })

            res.status(200).json({joines:team1.request,type})
            break
      case "TOURNAMENTS":

      let teamTournaments = []
      const tournament = await Tournament.find({"teams.teamId": req.params.teamId}).populate({
        path: 'games.gameId',
        model: 'Game',
        select: {"_id": 1, "imgUrl": 1}
      })
        
        for (let i = 0; i < tournament.length; i++) {
          teamTournaments.push({tournament:tournament[i], type:"registeredTournament"})
        }

        const prof = team.tournaments
        let protournaments = []
        for(let i=0; i<prof.length; i++){
          let tournament = await Tournament.findById({_id: prof[i].tournamentId}).populate({
            path: 'games.gameId',
            model: 'Game',
            select: {"_id": 1, "imgUrl": 1}
          })
          protournaments.push({tournament: tournament, type:"teamTournament", proteam: prof[i].team, ranking: prof[i].team_ranking, winnings: prof[i].winnings})
        }

        const Alltournaments = [...teamTournaments, ...protournaments]

        res.status(200).json({Alltournaments, type})
        break;
      default:
        break;
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Server error" });
  }
})

router.get("/teamsbygame/:gameId", async (req, res) => {
  try {
    var gameId = req.params.gameId;
    let team = [];
    let data = []
    const attribute = await Attribute.find({attributeType: 'TEAM'}).sort({createdAt:-1})
    
    if (gameId == "undefined") {
        for (let i = 0; i < attribute.length; i++) {

        team = await Team.findOne({_id:attribute[i].attributeId}).populate("games.gameId").populate({ path: "employees.employeeId" }).populate("request.playerId");
        if (team !== null){
          data.push({team:team,attribute:attribute[i]})
        }
      }
        res.status(200).json(data)
      } else {
        let gameArr = [];
        gameArr.push(gameId);
        
          for (let i = 0; i < attribute.length; i++){

            team = await Team.findOne({ _id: attribute[i].attributeId, "games.gameId": { $in: gameArr } } 
            )
            .limit(Number(process.env.TEAM_THRESHOLD_COUNT))
            .sort({ createdAt: -1 })
            .populate("games.gameId")
            .populate({ path: "employees.employeeId" }).populate("request.playerId"); 
            if (team !== null){
              data.push({team:team,attribute:attribute[i]})
            }
          }
          
          res.status(200).json(data)
        }

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
});

// Profile Photo Update
router.put(
  "/profilePic/:teamId",
  auth,
  imagesUpload.single("profilePic"),
  async (req, res) => {
    try {
      const updatedUser = {};

      if (req.file && req.file.path) updatedUser.imgUrl = req.file.path;

      var team = await Team.findByIdAndUpdate(req.params.teamId, updatedUser, {
        new: true,
      });
      res.status(200).json(team);
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Server error" });
    }
  }
);

// Cover Photo Update
router.put(
  "/coverPic/:teamId",
  imagesUpload.single("coverPic"),
  async (req, res) => {
    try {
      const updatedUser = {};

      if (req.file && req.file.path) updatedUser.coverPhoto = req.file.path;
      var team = await Team.findByIdAndUpdate(req.params.teamId, updatedUser);
      res.status(200).json(team);
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Server error" });
    }
  }
);

// @desc:   Create team
router.post(
  "/create",
  auth,
  imagesUpload.single("imgUrl"),
  async (req, res) => {
    try {
      const { isClaim } = req.body
      var gamesArr = getNumberArray(req.body.games, "gameId");
      var arnArr = getObjectArray(req.body.arena, "arenaId");
      var sponArr = getObjectArray(req.body.sponsor, "sponsorId");
      
      let profile = await Profile.findOne({ user: req.userId });
      let plyrArr = []

      if(isClaim === "true") {
        plyrArr = profile.playergames.map((elm) => ({
          playerId: elm.player,
        }));
      }

      // var rigsfarray = [];

      // if(req.body.keyboard.length > 0){
      //   rigsfarray.push({rigId: req.body.keyboard})
      // } 
      // if(req.body.mouse.length > 0){
      //   rigsfarray.push({rigId: req.body.mouse})
      // }
      
      var val = Math.floor(10000000 + Math.random() * 90000000);
      const team = new Team({
        _id: val,
        name: req.body.name,
        founded: req.body.founded,
        games: gamesArr,
        prizepool: req.body.prizepool,
        region: req.body.region,
        achievements: req.body.achievements,
        // rigs: rigsfarray,
        arenas: arnArr,
        sponsors: sponArr,
        players: plyrArr,
        description: req.body.description,
        social: {
          facebook: req.body.facebook,
          twitch: req.body.twitch,
          website: req.body.website,
          instagram: req.body.instagram,
          youtube: req.body.youtube,
          discord: req.body.discord
        },
        isClaimed:isClaim,
        employees: [{
          employeeId: isClaim === "true" ? req.userId : null,
          role: req.body.role
        }]
      });

      if (req.file) team.imgUrl = req.file.path;

      await team.save();

      if(isClaim === "true"){
        const userpersona = await UserPersona.findOne({ user: req.userId });
        await userpersona.personas.push({ teamId: team._id, type: "team" });
        await userpersona.save();
      }

      const bp = await BattlePass.findOne({user: req.userId})
      await bpTracker("Create a team",bp._id)

      return res.status(200).json({_id: team._id});
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Server error" });
    }
  }
);

const getNumberArray = (Obj, keyId) => {
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

function getObjectArray(Obj, keyId) {
  // let Objarr = Obj;

  // if (!Obj instanceof Array) {
  //   Objarr = Obj.split(",");
  // }

  const Objarr = Obj.toString().split(",");

  var array = [];
  if (Objarr) {
    for (var i = 0, l = Objarr.length; i < l; i++) {
      if (Objarr[i]) {
        array.push({ [keyId]: mongoose.mongo.ObjectId(Objarr[i]) });
      }
    }
  }
  return array;
}

function getObjectArraySponsor(Obj, keyId) {
  let Objarr = Obj;

  if (!Obj instanceof Array) {
    Objarr = Obj.split(",");
  }

  var array = [];
  if (Objarr) {
    for (var i = 0, l = Objarr.length; i < l; i++) {
      if (Objarr[i]) {
        array.push({ [keyId]: mongoose.mongo.ObjectId(Objarr[i]) });
      }
    }
  }
  return array;
}

// desc   Team Search
router.post("/search", async (req, res) => {
  const { search, filters } = req.body;

  if (search) {
    var mssg = "";

    var sname = new RegExp([search].join(""), "i");

    const team = await Team.find({ name: { $regex: sname } }).populate("games.gameId")

    let teamList = []
    for(i=0; i < team.length; i++){
      const attribute = await Attribute.find({attributeId:team[i]._id, attributeType: "TEAM"})
      teamList.push({team:team[i], attribute:attribute[0]})
    }
      
    res.status(200).json(teamList);
  }
});

// desc   Delete Team
router.delete("/:teamId", auth, async (req, res) => {
  try {
    const userpersona = await UserPersona.findOne({user: req.body.user})
    await userpersona.personas.pop({ teamId: req.params.teamId, type: "team" });
    await  userpersona.save()
    const team = await Team.findByIdAndDelete(req.params.teamId);
    if (!team) {
      res.status(404).json({ msg: "Team Not Found" });
    }
    res.status(200).json({ msg: "Deleted Successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server Error" });
  }
});

router.get("/jobs/:teamId", async (req, res) => {
  try {
    var _id = req.params.teamId;
    const jobs = await Job.find({ status: true, job_owner: _id }).sort({
      createdAt: -1,
    }).populate('job_owner')

    if (!jobs) {
      return res.status(404).json({ msg: "Jobs not found" });
    }
    res.status(200).json(jobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
});

router.put("/gamedata/:gameId/:userId/:teamId", auth, async(req, res) => {
  try {
    const { gameId , userId, teamId } = req.params
    const game = Number(gameId)
    
    const profile = await Profile.findOne({user: userId})
    const userTeam = await Team.findOne({_id:teamId}).populate("squads.squadId")

    let isSquadGame = false
    let isPlayerGame = false
    let plyrId = ''

    for (i=0 ; i < userTeam.squads.length; i++){
      if(userTeam.squads[i].squadId.game === game){
        isSquadGame = true
      }
    }
    for(j=0 ; j < profile.playergames.length; j++){
      if( profile.playergames[j].game === game){
        isPlayerGame = true
        plyrId = profile.playergames[j].player
      }
    }
    
    if( isSquadGame && isPlayerGame ){
      await Profile.updateOne(
        {
          _id: profile._id,
        },
        {
          $push: { request: { playerId: plyrId, teamId: userTeam._id } },
        }
      );
      res.status(200).json("SUCCESS")
    } else {
      return res.status(404).json({msg: ""})
    }

  } catch (err) {
    console.log(err)
    res.status(500).json({msg: 'Server Error'})
  }
})

router.post("/sponsors/:teamId", async (req, res) => {
  try {
    var sponArr = getObjectArraySponsor(req.body.sponsor, "sponsorId");
    var tId = req.params.teamId;

    if (sponArr.length > 0) {
      const team = await Team.findOneAndUpdate(
        { _id: tId },
        { $push: {sponsors: sponArr } },
        { new: true }
      );
      return res.status(200).json(team);
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Internal server error at sponsors" });
  }
});

// Team Sponsor Delete
router.put('/sponsordelete/:teamId/:sponsorId', async(req, res)=>{
  try {
    await Team.updateOne({_id: req.params.teamId}, {$pull:{
      sponsors: {sponsorId: req.params.sponsorId}
    }})
    res.status(200).json({msg: 'Deleted Successfully'})
  } catch (err) {
    console.log(err)
    res.status(500).json({msg: "Server Error"})
  }
})

// Add member
router.post("/ins/about/:teamId", async (req, res) => {
  try {
    const team = await Team.findByIdAndUpdate(
      req.params.teamId,
      {
        $push: {
          employees: req.body
        },
      },
      { new: true }
    ).populate({
      path: 'employees.employeeId',
      model: 'User',
      select: { '_id': 1,'name':1,"profilePicUrl":1},
   })
    res.status(200).json(team.employees);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server Error" });
  }
});

// Delete a rig
router.delete("/rigs/:teamId/:rigId", auth, async (req, res) => {
  try {
    const team = await Team.updateOne(
      { _id: req.params.teamId },
      {
        $pull: { rigs: { rigId: req.params.rigId } },
      }
    );
    res.status(200).json(team);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server Error" });
  }
});

// Delete a member
router.delete("/del/about/:teamId/:employeeId", auth, async (req, res) => {
  try {
    await Team.updateOne(
      { _id: req.params.teamId },
      {
        $pull: { employees: { _id: req.params.employeeId } },
      }
    );
    const team1 = await Team.findOne({ _id: req.params.teamId }).populate({
      path: 'employees.employeeId',
      model: 'User',
      select: { '_id': 1,'name':1,"profilePicUrl":1},
   })
    res.status(200).json(team1.employees);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server Error" });
  }
});

// edit member
router.patch("/upd/about/:teamId", auth, async (req, res) => {
  const { value, _id } = req.body;
  // console.log(_id);
  try {
    let team = await Team.findById(req.params.teamId);

    if (!team) {
      return res.status(404).json({ msg: "Team not found" });
    }

    for (var i = 0; i < team.employees.length; i++) {
      if (team.employees[i]._id == _id)
        team.employees[i].role = value;
    }
    await team.save();
    await team.populate({
      path: 'employees.employeeId',
      model: 'User',
      select: { '_id': 1,'name':1,"profilePicUrl":1},
   })
    res.status(200).json(team.employees);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Team photo delete
router.delete("/images/:teamId/:collectionId", auth, async (req, res) => {
  try {
    const team = await Team.updateOne(
      { _id: req.params.teamId },
      {
        $pull: { imagesgallery: { _id: req.params.collectionId } },
      }
    );
    if (!team) {
      return res.status(404).json({ msg: "Collection not found" });
    }

    res.status(200).json({ msg: "Success" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Team video delete
router.delete("/videos/:teamId/:collectionId", auth, async (req, res) => {
  try {
    const team = await Team.updateOne(
      { _id: req.params.teamId },
      {
        $pull: { videosgallery: { _id: req.params.collectionId } },
      }
    );
    if (!team) {
      return res.status(404).json({ msg: "Collection not found" });
    }

    res.status(200).json({ msg: "Success" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// @route   PUT /api/teams/fav/:teamId
// @desc    add teams to favs
router.put("/favs/team/:teamId", auth, async (req, res) => {
  try {
    let profile = await Profile.find({ user: req.userId });

    let team = await Team.findById(req.params.teamId);
    if (!team) {
      return res.status(404).json({ msg: "Team not found" });
    }

    const isLiked =
      team.favourites.filter(
        (fav) => fav.profile.toString() === profile[0]._id.toString()
      ).length > 0;

    if (isLiked) {
      // Unlike the team if already liked
      const index = team.favourites.findIndex(
        (fav) => fav.profile.toString() === profile[0]._id
      );
      team.favourites.splice(index, 1);
      team = await team.save();

      res.status(200).json(team);
    } else {
      // Like the team
      team.favourites.unshift({ profile: profile[0]._id });
      team = await team.save();

      res.status(200).json(team);
    }
    // res.status(200).json("WORKS")
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Adding Tournaments in teams
router.post("/tournaments/:teamId/",imagesUpload.single("image"), async(req, res)=> {
  try {
    var gamesArr = getNumberArray(req.body.games, "gameId");
    const team = await Team.findByIdAndUpdate(req.params.teamId, {$push: {
      tournaments: {
        tournamentId: req.body.tournamentId,
        organizer: req.body.organizer,
        games: gamesArr,
        upload_proof: {images: req.file.path, createdAt: Date.now()},
        year: Date(req.body.year),
        currency: req.body.currency,
        team_ranking: req.body.team_ranking,
        winnings: req.body.winnings
      },
    }
  },
  {new : true}
  )
    res.status(200).json(team)
  } catch (err) {
    console.log(err)
    res.status(500).json({msg: 'Server Error'})
  }
})

router.get("/favourites/team", auth, async (req, res) => {
  try {
    let profile = await Profile.find({ user: req.userId });

    if (!profile) {
      return res.status(404).json({ msg: "Profile not found" });
    }

    let teams = await Team.find({
      "favourites.profile": { $in: profile[0]._id },
    }).populate("request.playerId").populate('games.gameId');
    let teamfavs = []
    for(i=0; i < teams.length; i++){
      const attribute = await Attribute.find({attributeId:teams[i]._id, attributeType: "TEAM"})
      teamfavs.push({team:teams[i], attribute:attribute[0]})
    }

    res.status(200).json(teamfavs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
});

// @route   PUT /api/teams/follow/:teamId
// @desc    follow or unfollow a team
router.put("/follow/team/:teamId", auth, async (req, res) => {
  try {
    let team = await Team.findById(req.params.teamId);
    if (!team) {
      return res.status(404).json({ msg: "Team not found" });
    }

    const isFollowing =
      team.followers.filter(
        (follower) => follower.user.toString() === req.userId
      ).length > 0;

    if (isFollowing) {
      // Unlike the team if already following
      const index = team.followers.findIndex(
        (follower) => follower.user.toString() === req.userId
      );
      team.followers.splice(index, 1);
      team = await team.save();

      res.status(200).json(team);
    } else {
      // Follow the team
      team.followers.unshift({ user: req.userId });
      team = await team.save();

      res.status(200).json(team);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// @route   GET /api/teams/:teamId/followers
// @desc    Get team's followers info
router.get('/:teamId/followers', async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId,).populate({
      path: "followers.user",
      model: "User",
      select: {"_id":1, "name": 1, "username": 1}
    }).select({"followers": 1})
    if (!team) {
      return res.status(404).json({ msg: 'Team not found' });
    }

    res.status(200).json(team);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route:  PUT /api/teams/send/:teamId/:playerId
// @desc:   sending request
router.put("/send/:teamId/:playerId", async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId);
    if (!team) {
      return res.status(404).json({ msg: "Team not found" });
    }

    var isReqSent = false
    for(i = 0; i<team.request[i];i++){
        if(team.request[i].playerId === req.params.playerId){
          isReqSent = true
        }
    }
    
    if (isReqSent === true) {
      return res.status(200).json({ msg: "Request already sent" });
    } else {
      await Team.updateOne(
        {
          _id: req.params.teamId,
        },
        {
          $push: { request: { playerId: req.params.playerId } },
        }
      );
    }
    res.status(201).json("SUCCESS");
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// @route:  PUT /api/teams/accept/:teamId/:playerId
// @desc:   accepting request

router.put("/accept/:teamId/:playerId/:type",auth, async (req, res) => {
  try {
    const { type } = req.params
    const team = await Team.findById(req.params.teamId);
    if (!team) {
      return res.status(404).json({ msg: "Team not found" });
    }

    const profile = await Profile.find({"playergames.player":req.params.playerId})
    const user = await User.findOne({_id:profile[0].user})
    
    const bp = await BattlePass.findOne({user: user._id})
    await bpTracker("Join a Team",bp._id)

    if( type === "PROFILE" ){
      await Team.updateOne(
        {
          _id: req.params.teamId,
        },
        {
          $push: { 
            players: { playerId: req.params.playerId },
            followers: { user: user._id }
          }
        }
      );
      await Profile.updateOne(
        {
          _id: profile[0]._id,
        },
        {
          $pull: { request: { playerId: req.params.playerId } }
        }
      );
      res.status(200).json({joines:profile[0].request})
    } else {
      await Team.updateOne(
        {
          _id: req.params.teamId,
        },
        {
          $push: { 
            players: { playerId: req.params.playerId },
            followers: { user: user._id }
          },
          $pull: { request: { playerId: req.params.playerId } }
        }
      );
      const team1 = await Team.findOne({ _id: req.params.teamId }).populate({
        path: 'request.playerId',
        model: 'Player',
        select: { '_id': 1,'name':1,"imgUrl":1,"apidata":1},
     })
      res.status(200).json({joines:team1.request})
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// @route:  PUT /api/teams/decline/:teamId/:playerId
// @desc:   declining a request

router.put("/decline/:teamId/:playerId/:type", async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId);
    if (!team) {
      return res.status(404).json({ msg: "Team not found" });
    }
    const profile = await Profile.find({"playergames.player":req.params.playerId})

    if(req.params.type === "PROFILE"){
    await Profile.updateOne(
      {
        _id: profile[0]._id,
      },
      {
        $pull: { request: { playerId: req.params.playerId } }
      }
    );

    res.status(200).json({joines:profile.request})
    } else {
    await Team.updateOne(
      {
        _id: req.params.teamId,
      },
      {
        $pull: { request: { playerId: req.params.playerId } },
      }
    );
    const team1 = await Team.findOne({ _id: req.params.teamId }).populate({
      path: 'request.playerId',
      model: 'Player',
      select: { '_id': 1,'name':1,"imgUrl":1,"apidata":1},
   })
   
    res.status(200).json({joines:team1.request})
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// About team description
router.put("/desc/:teamId", async (req, res) => {
  const { desc } = req.body;
  try {
    if (!desc) {
      return res.status(400).json({ msg: "Text required" });
    }
    let team = await Team.findById(req.params.teamId);

    if (!team) {
      return res.status(404).json({ msg: "Team not found" });
    }

    const newDesc = { desc };
    team = await Team.findByIdAndUpdate(
      req.params.teamId,
      { $set: { 'about.description': req.body.desc } },
      { new: true }
    );
    res.status(200).json(team);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.put('/edit/:teamId', async(req, res)=>{
  try {
    var arnArr = getObjectArray(req.body.arena, "arenaId");
    var gamesArr = getNumberArray(req.body.game, "gameId");

    const team = await Team.updateOne({_id:req.params.teamId}, {$set:{
      name: req.body.teamname,
      founded: req.body.founded,
      description: req.body.about,
      arenas: arnArr,
      region: req.body.region,
      games: gamesArr,
      social:{
        facebook: req.body.facebook,
        instagram: req.body.instagram,
        twitch: req.body.twitch,
        youtube: req.body.youtube,
        discord: req.body.discord,
        website: req.body.website,
      }
    }})

    await Team.findByIdAndUpdate(
      req.params.teamId,
      {
        $push: {
          employees: req.body.emp
        },
      },
      { new: true }
    );

    res.status(200).json(team)
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
})

// Social Links Update
router.put(
  "/sociallinks/:teamId",
  auth,
  async (req, res) => {
    try {
      var team = await Team.updateOne({_id: req.params.teamId}, {$set: {
        "social.facebook": req.body.sociallinks.facebook,
        "social.instagram": req.body.sociallinks.instagram,
        "social.twitch": req.body.sociallinks.twitch,
        "social.discord": req.body.sociallinks.discord,
        "social.youtube": req.body.sociallinks.youtube,
        "social.twitter": req.body.sociallinks.twitter,
        website: req.body.sociallinks.website
      }});

      res.status(200).json(team);
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Server error" });
    }
  }
);

router.put("/rigs/:teamId", async(req, res)=> {
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
    
    const team = await Team.updateOne({_id: req.params.teamId}, {$push: {
      rigs: rigsArr
    }
  },
  )

  res.status(200).json(team)
  } catch (err) {
    console.log(err)
    res.status(500).json({msg: 'Server Error at Rigs '})
  }
})

module.exports = router;
