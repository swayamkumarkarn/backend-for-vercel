const express = require("express");
const router = express.Router();

const Tournament = require("../models/Tournament.model");
const Team = require("../models/Team.model");
const User = require("../models/User.model");
const Arena = require("../models/Arena.model");
const Sponsor = require("../models/Sponsor.model");
const Organizer = require("../models/Organizer.model");
const Match = require("../models/Match.model");
const League = require("../models/League.model");
const Game = require("../models/Game.model");
const Series = require("../models/Series.model");
const UserPersona = require("../models/UserPersona.model");
const TournamentRules = require("../models/TournamentRules.model")
const Attribute = require("../models/Attribute.model")
const Group = require("../models/Group.model")
const Profile = require("../models/Profile.model")
const Squad = require("../models/Squad.model")
const Post = require('../models/Post.model')
const Brand = require('../models/Brand.model')
const Upload = require('../middleware/imageUpload.middleware')
var mongoose = require("mongoose");
const { getName } = require('country-list')

const auth = require("../middleware/auth.middleware");
const { singleEliminationSoloHandler, singleEliminationTeamHandler, groupSoloHandler } = require("../server-utils/tournamentManager")

const functions = require("../middleware/functions.middleware");

router.get("/", async (req, res) => {
  try {
    const tournaments = await Tournament.find()
      .limit(Number(process.env.TOURNAMENTS_THRESHOLD_COUNT))
      .sort({ startDate: -1 });

    if (!tournaments) {
      return res.status(404).json({ msg: "Tournaments not found" });
    }

    const tournamentList =
      tournaments.length > 0
        ? tournaments.map((tournament) => ({
            tournament,
          }))
        : [];

    res.status(200).json(tournamentList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/:tournamentname",auth , async (req, res) => {
  try {
    const tournament = await Tournament.findOne({"name": req.params.tournamentname})
      // .populate("seriesId")
      // .populate("leagues.leagueId")
      .populate("games.gameId")
      .populate("user")
      .populate("registered.user")
      .populate("teams.teamId")
      .populate("prizes.prize_sponsor")
      .populate({
        path: 'maps.mapId',
        model: 'Map',
        select: { '_id': 1,'name':1,"imgUrl":1, "game": 1},
     })

    if (!tournament) {
      return res.status(404).json({ msg: "Tournament not found" });
    }

    const arenaArray =
      tournament.arenas?.length > 0
        ? tournament.arenas.map((arn) => arn.arenaId)
        : [];

    const arenas = await Arena.find({ _id: { $in: arenaArray } }).populate(
      "arena"
    );
    const tourGroups = await Group.find({tournamentId: tournament._id}).populate({
      path: 'participants.participantId',
      model: 'User',
      select: { '_id': 1,"profilePicUrl":1,"username":1},
   }).populate({
    path: 'teams.teamId',
    model: 'Team',
    select: { '_id': 1,"imgUrl":1,"name":1},
 })

 const group = await Group.findOne({tournamentId: tournament._id})
 const matches = await Match.find({groupId: group._id}).limit(100).populate({
  path: "participants.participantId",
  model: "User",
  select: {"_id": 1, "name": 1, "profilePicUrl": 1}
}).populate({
  path: "games.gameId",
  model: "Game",
  select: {"_id": 1, "name": 1}
})
let tournamentMatches = {
  matches, isMatchPlayersSet: group.isMatchPlayersSet
}

    const sponsorArray =
      tournament.sponsors?.length > 0
        ? tournament.sponsors.map((spnsor) => spnsor.sponsorId)
        : [];

    const sponsors = await Sponsor.find({ _id: { $in: sponsorArray } });

    const orgArray =
      tournament.organizers?.length > 0
        ? tournament.organizers.map((org) => org.organizerId)
        : [];

    let organizers = []
    organizers = await Organizer.find({ _id: { $in: orgArray } });
    const user = await User.findOne({_id: {$in: orgArray} })
    if(user !== null){
      organizers.push(user)
    }

    const tourPosts = await Post.find({"post_type":'tour', 'username': req.params.tournamentname})
    .populate({
      path: "shares.user",
      model: "User",
      select: {"_id": 1, "name": 1, "username": 1, "profilePicUrl": 1}
    })
    .populate({
      path: "user",
      model: "User",
      select: {"_id": 1, "name": 1, "username": 1, "profilePicUrl": 1}
    })

    res.status(200).json({
      tournament,
      arenas,
      sponsors,
      tourPosts,
      organizers,
      tournamentMatches,
      tourGroups
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/tournamentByLeague", async (req, res) => {
  const { leagueId } = req.body;

  if (leagueId) {
    Tournament.find(
      { "leagues.leagueId": { $regex: leagueId } },
      function (err, result) {
        if (err) return res.status(404).json({ mssg: "Tournaments not found" });

        const tournamentList =
          result.length > 0
            ? result.map((tournament) => ({
                tournament,
              }))
            : [];

        res.status(200).json(tournamentList);
      }
    );
  }
});

router.get("/tournamentsbygame/:gameId", async (req, res) => {
  try {
    var gameId = req.params.gameId;
    
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    let tours = [];
    if (gameId == "undefined") {
      tours = await Tournament.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('registered.user')
        .populate('teams.teamId')
        .populate({
          path: 'games.gameId',
          model: 'Game',
          select: {"_id": 1, "name": 1}
        })
    } else {
      let gameArr = [];
      gameArr.push(gameId);
      tours = await Tournament.find({ "games.gameId": { $in: gameArr }})
        .sort({ createdAt: -1 })
        .populate('registered.user')
        .populate('teams.teamId')
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'games.gameId',
          model: 'Game',
          select: {"_id": 1, "name": 1}
        })
    }

    if (!tours) {
      return res.status(404).json({ msg: "Tournaments not found" });
    }

    var tourList = [];

    for (let i = 0; i < tours.length; i++) {
      const gamArray =
        tours[i].games.length > 0 ? tours[i].games.map((gm) => gm.gameId) : [];

      const games = await Game.find({ _id: { $in: gamArray } });
      tourList.push({ tournament: tours[i], games: games });
      // }
    }

    console.log(tourList.length);
    res.status(200).json(tourList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/search", async (req, res) => {
  const { search, filters } = req.body;
  try {
  var tourList = [];
  if (search) {
    var mssg = "";

    var sname = new RegExp([search].join(""), "i");
    
    const tournamentList = await Tournament.find({name: {$regex: sname}}).populate('registered.user').populate('teams.teamId')

    for (let i = 0; i < tournamentList.length; i++) {
      const gamArray =
        tournamentList[i].games.length > 0 ? tournamentList[i].games.map((gm) => gm.gameId) : [];

      const games = await Game.find({ _id: { $in: gamArray } });
      tourList.push({ tournament: tournamentList[i], games: games });

      }
  }
  res.status(200).json(tourList)
} catch (err) {
  console.log(err)
  res.status(500).json("Server Error")
}
});

router.post("/tournamentsbydate", async (req, res) => {
  var startDate = req.body.startDate;
  var endDate = req.body.endDate;
  var gameId = req.body.gameId;

  var conditions = {};
  var and_clauses = [];

  and_clauses.push({
    startDate: { $gte: new Date(new Date(startDate).setHours(00, 00, 00)) },
  });

  and_clauses.push({
    endDate: { $lt: new Date(new Date(endDate).setHours(23, 59, 59)) },
  });

  if (gameId != "undefined" || gameId === "") {
    let v = { $in: [gameId] };
    and_clauses.push({ ["games.gameId"]: v });
  }

  conditions["$and"] = and_clauses;

  const result = await Tournament.find(conditions).populate("matches");

  const tournamentList =
    result.length > 0
      ? result.map((tournament) => ({
          tournament,
        }))
      : [];

  console.log(tournamentList.length);
  res.status(200).json(tournamentList);
});

// @desc:   Create tournament a new user
router.post("/create", Upload.single('imgUrl') , async (req, res) => {
  try {
    const { isClaim } = req.body

    var orgArr = getSponsorObjectArray(req.body.organizer, "organizerId");
    var sponArr = getSponsorObjectArray(req.body.sponsor, "sponsorId");
    var eligibleList = getStringArray(req.body.eligibleCountries)
    var mapsArr = getNumberArray(req.body.maps, "mapId")
    var gamesArr = []
    gamesArr.push({gameId:req.body.game})
    var val = Math.floor(10000000 + Math.random() * 90000000);

    const tournament = new Tournament({
      _id: val,
      user: isClaim === "true" ? req.body.user : null,
      name: req.body.name.trim(),
      coverPhoto: req.body.coverPhoto,
      games: gamesArr,
      currency: req.body.currency,
      prizepool: req.body.prizepool,
      category: req.body.category,
      tournamentType: req.body.tournamentType,
      Type: req.body.Type,
      participants: req.body.participants,
      minParticipants:req.body.minParticipants,
      entranceFee: req.body.entranceFee === null ? 0 : req.body.entranceFee,
      startDate: req.body.startDate,
      startTime: req.body.startTime,
      endDate: req.body.endDate,
      endTime: req.body.endTime,
      location: req.body.location,
      address: req.body.address,
      organizers: orgArr,
      // cohosts: req.body.cohosts,
      platform: req.body.platform,
      sponsors: sponArr,
      description: req.body.description,
      // tickets: req.body.tickets,
      website: req.body.website,
      social: {
          facebook: req.body.facebook,
          twitch: req.body.twitch,
          instagram: req.body.instagram,
          youtube: req.body.youtube,
          discord: req.body.discord
        },
      // seriesId: Number(req.body.series),

      playType: req.body.playType,
      status:"Open",
      numberOfTeam: req.body.numberOfTeam,
      minTeams: req.body.minTeams,
      isClaimed:isClaim,
      checkIn: req.body.checkIn,
      teamSize: req.body.teamSize,
      eligibleCountries: eligibleList,
      maps: mapsArr,
      mode: req.body.mode,
      matchType: req.body.matchType
    });

    if(req.file) tournament.imgUrl = req.file.path

    await tournament.save();
    if(isClaim === "true"){  
      const userpersona = await UserPersona.findOne({ user: req.body.user });
      await userpersona.personas.push({
        tournamentId: tournament._id,
        type: "tournament",
      }); 
      await userpersona.save();
    }

    await new TournamentRules({tournamentId: tournament._id}).save()
    
    let tourattributes = {}
    tourattributes.attributeId = tournament._id
    tourattributes.attributeType = "TOURNAMENT"
    tourattributes.type = tournament.tournamentType
    tourattributes.format = tournament.playType
    tourattributes.category = tournament.category
    tourattributes.date = tournament.startDate
    tourattributes.platform = tournament.platform
    tourattributes.games = gamesArr

    await new Attribute(tourattributes).save()

    if(req.body.tournamentType === 'Single Elimination'){
      await new Group({tournamentId : tournament._id}).save()
    } else if(req.body.tournamentType === 'Groups'){
      await new Group({tournamentId : tournament._id}).save()
      await new Group({tournamentId : tournament._id}).save()
    }

    return res.status(200).json({name:tournament.name});
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

const getStringArray = (Obj, type) => {
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

router.delete('/video/:tournamentId/:collectionId', async(req, res)=>{
  try {
    const tournament = await Tournament.updateOne(
      { _id: req.params.tournamentId },
      {
        $pull: { videosgallery: { _id: req.params.collectionId } },
      }
    );
    if (!tournament) {
      return res.status(404).json({ msg: "Collection not found" });
    }

    res.status(200).json({ msg: "Success" });
  } catch (err) {
    console.log(err)
    res.status(500).json({msg: "Server Error"})
  }
})

router.put('/room/:tournamentId', auth, async (req, res)=>{
  try {
    const tournament = await Tournament.updateOne({_id: req.params.tournamentId}, {$set:{
      'room.roomId': req.body.roomId,
      'room.roompwd': req.body.roompwd
    }})
    res.status(200).json(tournament)
  } catch (err) {
    console.log(err)
    res.status(500).json({msg: "Server Error At Room"})
  }
})

// Cover Photo Update for Tournament
router.put(
  "/coverPic/:tournamentId",
  Upload.single("coverPhoto"),
  async (req, res) => {
    try {
      const updatedUser = {};

      if (req.file && req.file.path) updatedUser.coverPhoto = req.file.path;
      await Tournament.findByIdAndUpdate(req.params.tournamentId, {$set: updatedUser});
      res.status(200).json({msg: "Cover Photo Updated Successfully"});
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Server error" });
    }
  }
);

router.put('/touredit/:tournamentId/:userId', async(req, res)=>{
  const {tourType, name, username, teamSize, eligibleCountries, startDate, startTime, endDate, endTime, location, address,organizer , description, games, category, registration, playout, elimination, website, facebook, instagram, twitch, youtube, discord, maps, mode, matchType } = req.body
  try {
    var gamesArr = getNumberArray(games, "gameId");
    var orgArr = getSponsorObjectArray(organizer, "organizerId");
    var eligibleList = getStringArray(eligibleCountries, 'TourEdit')
    var mapsArr = getObjectArray(maps, "mapId")

    const tournament = await Tournament.findByIdAndUpdate(req.params.tournamentId, {
      $set:{
        name: name.trim(),
        description,
        startDate,
        Type: tourType,
        endDate,
        startTime,
        endTime,
        tournamentType: elimination,
        games: gamesArr,
        organizers: orgArr,
        // seriesId: Number(series),
        teamSize,
        eligibleCountries: eligibleList,
        category,
        location,
        address,
        entranceFee: registration,
        playout,
        website,
        maps: mapsArr,
        mode,
        matchType,
        social:{
          facebook,
          instagram,
          twitch,
          youtube,
          discord
        }
      }
    })

    res.status(200).json(tournament)
  } catch (err) {
    console.log(err)
    res.status(500).json({msg: "Server Error"})
  }
})

function getNumberArray(Obj, keyId) {
  let Objarr
  
  if (keyId == 'mapId') {
    Objarr = Obj.split(",");
  }else{
    Objarr = Obj
  }
  // const Objarr = Obj.split(",")
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
  var array = [];

  var ObjArr = Obj
  if (ObjArr) {
    for (var i = 0, l = ObjArr.length; i < l; i++) {
      if (ObjArr[i]) {
        array.push({ [keyId]: ObjArr[i] });
      }
    }
  }
  return array;
}

function getSponsorObjectArray(Obj, keyId) {
  var array = [];
  var objArr = Obj.toString().split(",")
  if (objArr) {
    for (var i = 0, l = objArr.length; i < l; i++) {
      if (objArr[i]) {
        array.push({ [keyId]: mongoose.mongo.ObjectId(objArr[i]) });
      }
    }
  }
  return array;
}

// desc   Delete Tournament
router.delete("/:tournamentId/:username", auth, async (req, res) => {
  try {
    const userpersona = await UserPersona.findOne({ user: req.body.user });
    await userpersona.personas.pop({
      tournamentId: req.params.tournamentId,
      type: "tournament",
    });
    await userpersona.save();
    await Post.findOneAndDelete({username: req.params.username})
    await TournamentRules.findOneAndDelete({tournamentId: req.params.tournamentId})
    const tournament = await Tournament.findByIdAndDelete(
      req.params.tournamentId
    );
    if (!tournament) {
      res.status(500).json({ msg: "Tournament Not Found" });
    }
    res.status(200).json({ msg: "Deleted Successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server Error" });
  }
});

// Route  api/sponsor/:tournamentId
// desc   Tournament Sponsor
router.post("/sponsors/:tournamentId", async (req, res) => {
  try {
    var sponArray = getSponsorObjectArray(req.body.sponsor, "sponsorId");
    var tourId = req.params.tournamentId;

    if (sponArray.length > 0) {
      const tournament = await Tournament.findOneAndUpdate(
        { _id: tourId },
        { $push:{sponsors: sponArray}},
        { new: true }
      );
      return res.status(200).json(tournament);
    }
  } catch (err) {
    res.status(500).json({ msg: "Internal server error at sponsors" });
  }
});

// Tournament photo delete
router.delete("/images/:tournamentId/:collectionId", auth, async (req, res) => {
  console.log(req.params.collectionId);
  try {
    const team = await Tournament.updateOne(
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

// Tournament video delete
router.delete("/videos/:tournamentId/:collectionId", auth, async (req, res) => {
  console.log(req.params.collectionId);
  try {
    const team = await Tournament.updateOne(
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

// @route   PUT /api/tournaments/fav/:tournamentId
// @desc    add tournament to favs
router.put("/fav/:tournamentId", auth, async (req, res) => {
  console.log(req.params.tournamentId)
  try {
    let tournament = await Tournament.findById(req.params.tournamentId);
    if (!tournament) {
      return res.status(404).json({ msg: "Tournament not found" });
    }

    const isLiked =
      tournament.favourites.filter((fav) => fav.user.toString() === req.userId).length >
      0;
    if (isLiked) {
      // Unlike the tournament if already liked
      const index = tournament.favourites.findIndex(
        (fav) => fav.user.toString() === req.userId
      );
      tournament.favourites.splice(index, 1);
      tournament = await tournament.save();

      res.status(200).json(tournament);
    } else {
      // Like the tournament
      tournament.favourites.unshift({ user: req.userId });
      tournament = await tournament.save();

      res.status(200).json(tournament);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/favourites/tournament", auth,async (req, res) => {
  try {

    let tournamentfavs = await Tournament.find({"favourites.user":{ $in : req.userId }}).populate('games.gameId').populate('registered.user')
    res.status(200).json(tournamentfavs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
});

// @route   PUT /api/tournaments/follow/:tournamentId
// @desc    follow or unfollow a tournament
router.put("/follow/:tournamentId", auth, async (req, res) => {
  try {
    let tournament = await Tournament.findById(req.params.tournamentId);
    if (!tournament) {
      return res.status(404).json({ msg: "tournament not found" });
    }

    const isFollowing =
      tournament.followers.filter(
        (follower) => follower.user.toString() === req.userId
      ).length > 0;

    if (isFollowing) {
      // Unlike the tournament if already following
      const index = tournament.followers.findIndex(
        (follower) => follower.user.toString() === req.userId
      );
      tournament.followers.splice(index, 1);
      tournament = await tournament.save();

      res.status(200).json(tournament);
    } else {
      // Follow the tournament
      tournament.followers.unshift({ user: req.userId });
      tournament = await tournament.save();

      res.status(200).json(tournament);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error at follow tournament" });
  }
});

// @route   GET /api/tournaments/:tournamentId/followers
// @desc    Get tournament's followers info
router.get('/:tournamentId/followers', async (req, res) => {
  try {
    const tournament = await Tournament.findOne({
      "name": req.params.tournamentId,
    }).populate({
      path: "followers.user",
      model: "User",
      select: {"_id":1, "name": 1, "username": 1}
    }).select({"followers": 1})
    if (!tournament) {
      return res.status(404).json({ msg: 'Tournament not found' });
    }

    res.status(200).json(tournament);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   PUT /api/tournaments/register/:tournamentId/:userId
// @desc    register user in a tournament
router.put("/register/:tournamentId/:userId", async (req, res) => {
  try {
    let tournament = await Tournament.findById(req.params.tournamentId)
    const profile = await Profile.findOne({user: req.params.userId})
    console.log("tourrr", tournament.tournamentType)
    
    let isGamePlayer = false
    for(i = 0; i < profile.playergames.length; i++){
      if(profile.playergames[i].game === tournament.games[0].gameId){
        isGamePlayer = true
      }
    }

    if(tournament.registered.length === tournament.participants){
      return res.status(200).json({msg: "Slots Unavailable"})
    }

    if (!tournament) {
      return res.status(404).json({ msg: "tournament not found" });
    }
    switch (tournament.tournamentType) {
      case "SOLO":
        const tourGroup = await Group.find({tournamentId: req.params.tournamentId})

        // single elimination handler function for SOLO type
        if(isGamePlayer === true){
          singleEliminationSoloHandler(tournament, tourGroup, req.params.userId)
        }
        break;
    
      case "Groups":
        const tourGroups = await Group.find({tournamentId: req.params.tournamentId})
        // group handler function for GROUPS type
        if(isGamePlayer === true){
          groupSoloHandler(tournament,tourGroups, req.params.userId)
        }
        break
      default:
        break;
    }

    

    res.status(200).json(isGamePlayer)
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error at Register tournament" });
  }
});

// @route   PUT /api/tournaments/register/:tournamentId/:teamId
// @desc    register team in a tournament
router.put("/register/team/:tournamentId/new", async (req, res) => {
  const {teamId, type} = req.body.selectedTeam

  try {
    const tournament = await Tournament.findById(req.params.tournamentId).populate({
      path: 'games.gameId',
      model: 'Game',
      select: {"_id": 1, "name": 1}
    })
    const team = await Team.findById(teamId)
    const tourGroup = await Group.find({tournamentId: req.params.tournamentId})
    
    if (!tournament) {
      return res.status(404).json({ msg: "tournament not found" });
    }

    const isRegistered = tournament.teams.filter((team)=> team.teamId === Number(teamId) ).length > 0
    
    if(isRegistered && type === 'REG'){
      return res.status(200).json({msg: "Team Already Registered"})
    }

    if(tournament.teams.length === tournament.numberOfTeam){
      return res.status(200).json({msg: "Slots Unavailable"})
    }
    
    let squadId = ''
    const squadArray =
      team.squads?.length > 0
        ? team.squads.map((sqd) => sqd.squadId)
        : [];
        const squads = await Squad.find({ _id: { $in: squadArray }})
    
    for(i = 0; i < squads.length; i++){
      if(squads[i].game === tournament.games[0].gameId._id){
        squadId = squads[i]._id
      }
    }

    const isValid = team.employees.filter((x)=> x.employeeId == req.body.selectedTeam.user && (x.role === 'Captain' || x.role === 'Owner' ) ).length > 0

    if(!isValid){
      return res.status(200).json({msg: "Only Captain's and Owner's can register/unregister a tournament"})
    }

    if(squadId !== ''){
      singleEliminationTeamHandler(tournament, tourGroup, teamId, squadId, type)
      if(type === 'REG'){
        return res.status(200).json({msg: "Registered Successfully"})
      }else{
        return res.status(200).json({msg: "Left the Tournament"})
      }
    }else{
      return res.status(200).json({msg: `Please Add a Squad with ${tournament.games[0].gameId.name} Game`})
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error at Team Register tournament" });
  }
});

router.get('/matches/:tournamentId', async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.tournamentId)
    const group = await Group.find({tournamentId: tournament._id})
    let PLimit_Points = [2, 4, 8, 16, 32, 64, 128]
    console.log("GRP",group.length)
    if(tournament.tournamentType === "Single Elimination"){ 
      if(tournament.playType === "SOLO"){
        await participantsMatchHandler(tournament, PLimit_Points, group[0])
      } else {
        await teamsMatchHandler(tournament, PLimit_Points, group[0])
      }
    } else if(tournament.tournamentType === "Groups") {
      if(tournament.playType === "SOLO"){
          await participantsMatchGroupHandler(tournament, PLimit_Points, group[0])
          await participantsMatchGroupHandler(tournament, PLimit_Points, group[1])
      }

      var val = Math.floor(10000000 + Math.random() * 90000000);
      await new Match({_id:val, groupId : group[0]._id, instance:"Final", games:[{gameId: tournament.games[0].gameId}], }).save()

      tournament.isMatchSetting = true
      await tournament.save()
    }
    
    res.status(200).json("Success")
  } catch (err) {
    console.log(err)
    res.status(500).json({ msg: "Server Error"})
  }
})

router.put('/tourPrize/:tournamentId/:tier/:tournamentType', async (req, res) => {
  try {
    console.log("Reqqq",typeof(req.body), req.params.tournamentType)
    const tournament = await Tournament.findById(req.params.tournamentId)
    const uniqueIds = []
    req.body.reverse()

    const unique = req.body.filter(element => {
      console.log("SSS",element.prizeName)
      const isDuplicate = uniqueIds.includes(element.prizeName);
      console.log("SSS",isDuplicate)
      if (!isDuplicate && element.prizeName !== '') {
        uniqueIds.push(element.prizeName);
    
        return true;
      }
    
      return false;
    });
    console.log("S",typeof(unique), unique)

    for(i=0; i < unique.length; i++){
      unique[i].prize_sponsor = "638f5ecce2f8df1939a4862f"
    }
    console.log("Aff",unique)
    
    await Tournament.updateOne({_id: req.params.tournamentId}, {$set: {
        prizes: unique
      }})
      let teamNames = []
    if(req.params.tournamentType === 'TEAMS'){
        for (let i = 0; i < unique.length; i++) {
      if(unique[i].place === "1st"){
        if(!tournament.isClaimed){
          teamNames.push(await Team.findOne({"name": unique[i].prizeName}).select({name: 1}))
        }
        await Team.findOneAndUpdate({"name": unique[i].prizeName}, {$inc:{
        team_points: req.params.tier == 'tier1' ? 1500 : req.params.tier == "tier2" ? 500 : req.params.tier == "tier3" ? 125 : 15,
        team_winnings: unique[i].winnings
        }})
      } else if(unique[i].place === "2nd"){
        if(!tournament.isClaimed){
          teamNames.push(await Team.findOne({"name": unique[i].prizeName}).select({name: 1}))
        }
        await Team.findOneAndUpdate({"name": unique[i].prizeName}, {$inc:{
          team_points: req.params.tier == 'tier1' ? 1300 : req.params.tier == "tier2" ? 450 : req.params.tier == "tier3" ? 100 : 10,
          team_winnings: unique[i].winnings
        }})
      } else if(unique[i].place === "3rd"){
        if(!tournament.isClaimed){
          teamNames.push(await Team.findOne({"name": unique[i].prizeName}).select({name: 1}))
        }
        await Team.findOneAndUpdate({"name": unique[i].prizeName}, {$inc:{
          team_points: req.params.tier == 'tier1' ? 1200 : req.params.tier == "tier2" ? 400 : req.params.tier == "tier3" ? 80 : 50,
          team_winnings: unique[i].winnings
        }})
      } else if(unique[i].place === "4th"){
        if(!tournament.isClaimed){
          teamNames.push(await Team.findOne({"name": unique[i].prizeName}).select({name: 1}))
        }
        await Team.findOneAndUpdate({"name": unique[i].prizeName}, {$inc:{
          team_points: req.params.tier == 'tier1' ? 1100 : req.params.tier == "tier2" ? 380 : req.params.tier == "tier3" ? 60 : 2.5,
          team_winnings: unique[i].winnings
        }})
      } else {
        if(!tournament.isClaimed){
          teamNames.push(await Team.findOne({"name": unique[i].prizeName}).select({name: 1}))
        }
        await Team.updateOne({"name": unique[i].prizeName}, {$inc:{
          team_points: req.params.tier == 'tier1' ? 1000 : req.params.tier == "tier2" ? 360 : req.params.tier == "tier3" ? 50 : 1,
          team_winnings: unique[i].winnings
        }})
      }
    }

    for (let i = 0; i < teamNames.length; i++) {
      await Tournament.updateOne({_id: req.params.tournamentId},{$push:{
        teams: {teamId: teamNames[i]._id}
      }})
    }

  } else {
      for (let i = 0; i < unique.length; i++) {
      if(unique[i].place === "1st"){
        await User.findOneAndUpdate({"name": unique[i].prizeName}, {$inc:{
          user_points: req.params.tier == 'tier1' ? 1500 : req.params.tier == "tier2" ? 500 : req.params.tier == "tier3" ? 125 : 15,
        prize_winnings: unique[i].winnings
        }})
      } else if(unique[i].place === "2nd"){
        await User.findOneAndUpdate({"name": unique[i].prizeName}, {$inc:{
          user_points: req.params.tier == 'tier1' ? 1300 : req.params.tier == "tier2" ? 450 : req.params.tier == "tier3" ? 100 : 10,
          prize_winnings: unique[i].winnings
        }})

      } else if(unique[i].place === "3rd"){
        await User.findOneAndUpdate({"name": unique[i].prizeName}, {$inc:{
          user_points: req.params.tier == 'tier1' ? 1200 : req.params.tier == "tier2" ? 400 : req.params.tier == "tier3" ? 80 : 50,
          prize_winnings: unique[i].winnings
        }})
      } else if(unique[i].place === "4th"){
        await User.findOneAndUpdate({"name": unique[i].prizeName}, {$inc:{
          user_points: req.params.tier == 'tier1' ? 1100 : req.params.tier == "tier2" ? 380 : req.params.tier == "tier3" ? 60 : 2.5,
          prize_winnings: unique[i].winnings
        }})

      } else {
        await User.updateOne({"name": unique[i].prizeName}, {$inc:{
          user_points: req.params.tier == 'tier1' ? 1000 : req.params.tier == "tier2" ? 360 : req.params.tier == "tier3" ? 50 : 1,
          prize_winnings: unique[i].winnings
        }})
      }
    }
    }

    res.status(200).json({msg: "Prize Added Successfully"})
  } catch (err) {
    console.log(err)
    res.status(500).json({msg: "Server Error"})
  }
})

// Tournament Sponsor Delete
router.put('/sponsordelete/:tournamentId/:sponsorId', async(req, res)=>{
  try {
    await Tournament.updateOne({_id: req.params.tournamentId}, {$pull:{
      sponsors: {sponsorId: req.params.sponsorId}
    }})
    res.status(200).json({msg: 'Deleted Successfully'})
  } catch (err) {
    console.log(err)
    res.status(500).json({msg: "Server Error"})
  }
})

// Tournament Category
router.put('/category/:tournamentId', async(req, res)=>{
  try {

    let {value} = req.body

    await Tournament.findOneAndUpdate({_id: req.params.tournamentId}, {$set:{
      tournament_tier: value
    }})

    res.status(200).json({msg: "Success"})
  } catch (err) {
    res.status(500).json({msg: "Server Error"})
  }
})

//Tournament by user
router.get('/usertournament/:userId' , async(req, res)=>{
  try {
    const tournament = await Tournament.find({"user": req.params.userId}).select({"_id":1,
    "name":1,"imgUrl":1})
    const brand = await Brand.find({"user": req.params.userId}).select({"_id": 1, "name": 1, "logoUrl": 1})
    let pageData = tournament.concat(brand)
    res.status(200).json(pageData)
  } catch (err) {
    console.log(err)
    res.status(500).json({msg: 'Server Error'})
  }
})

const teamsMatchHandler = async (tournament, PLimits, group) => {
  let Byes, P_Point, matches
  const matches_num = tournament.numberOfTeam - 1

  for (i=0; i < PLimits.length; i++){
    if(PLimits[i] >= tournament.numberOfTeam){
      P_Point = PLimits[i]
      break
    }
  }

  Byes = P_Point - tournament.numberOfTeam
  matches = matches_num - 7
  for(i=0; i < matches; i++){
    var val = Math.floor(10000000 + Math.random() * 90000000);
    let NonByesPattern = [
    {isByes: false}, {isByes: false}
  ]
  await new Match({_id:val, groupId : group._id, instance:"Round1",opponents:NonByesPattern, games:[{gameId: tournament.games[0].gameId}] }).save()
  }
  var ByesPattern = []
  for (i=1; i <= Byes; i++){
    var x = [{isByes:true}]
    if(i > 4){
      x.splice(0,0,{isByes:true})
    }
    ByesPattern.push(x)
  }
  ByesPattern = ByesPattern.reverse().slice(0,4)

  if(ByesPattern.length > 0){

    for (i=0; i < 4; i++){
      var val = Math.floor(10000000 + Math.random() * 90000000);
      await new Match({_id:val, groupId : group._id, instance:"Round2",opponents:ByesPattern[i], games:[{gameId: tournament.games[0].gameId}] }).save()
    }
  }
  for(i=0; i < 2; i++){
    var val = Math.floor(10000000 + Math.random() * 90000000);
    let NonPlayerPattern = [
      {isPlayer: false}, {isPlayer: false}
    ]
    await new Match({_id:val, groupId : group._id, instance:"Semifinals", games:[{gameId: tournament.games[0].gameId}], opponents: NonPlayerPattern }).save()
  }

  var val = Math.floor(10000000 + Math.random() * 90000000);
  let NonPlayerPattern = [
    {isPlayer: false}, {isPlayer: false}
  ]
  await new Match({_id:val, groupId : group._id, instance:"Final", games:[{gameId: tournament.games[0].gameId}], opponents: NonPlayerPattern }).save()

tournament.isMatchSetting = true
await tournament.save()
}

const participantsMatchHandler = async (tournament,PLimit_Points, group ) => {
  let Byes, P_Point, matches
  const matches_num = tournament.participants - 1
    // participants = 8 -> matches_num = 7 P_Point = 8 Byes => 8-8 = 0 matches = 7-7 = 0
    // participants = 16 -> matches_num = 15 P_Point = 16 Byes => 16-16 = 0 matches = 15-7 = 8
    // participants = 15 -> matches_num = 14 P_Point = 16 Byes => 16-15 = 1 matches = 14-7 = 7
    
    for (i=0; i < PLimit_Points.length; i++){
      if(PLimit_Points[i] >= tournament.participants){
        P_Point = PLimit_Points[i]
        break
      }
    }
    // P_Point = 8
    Byes = P_Point - tournament.participants // Byes => 8-8 = 0
    matches = matches_num - 7 // matches = 0

    for (i=0; i < matches; i++){
      var val = Math.floor(10000000 + Math.random() * 90000000);
        let NonByesPattern = [
          {isByes: false}, {isByes: false}
        ]
        await new Match({_id:val, groupId : group._id, instance:"Round1",participants:NonByesPattern, games:[{gameId: tournament.games[0].gameId}] }).save()
      }
      var ByesPattern = []
      for (i=1; i <= Byes; i++){
        var x = [{isByes:true}]
        if(i > 4){
          x.splice(0,0,{isByes:true})
        }
        ByesPattern.push(x)
      }
      ByesPattern = ByesPattern.reverse().slice(0,4)
      
      if(ByesPattern.length > 0){

        for (i=0; i < 4; i++){
          var val = Math.floor(10000000 + Math.random() * 90000000);
          await new Match({_id:val, groupId : group._id, instance:"Round2",participants:ByesPattern[i], games:[{gameId: tournament.games[0].gameId}] }).save()
        }
      }
      for(i=0; i < 2; i++){
        var val = Math.floor(10000000 + Math.random() * 90000000);
        await new Match({_id:val, groupId : group._id, instance:"Semifinals", games:[{gameId: tournament.games[0].gameId}], }).save()
      }

      var val = Math.floor(10000000 + Math.random() * 90000000);
      await new Match({_id:val, groupId : group._id, instance:"Final", games:[{gameId: tournament.games[0].gameId}], }).save()

    tournament.isMatchSetting = true
    await tournament.save()
}
const participantsMatchGroupHandler = async (tournament,PLimit_Points, group ) => {
  let Byes, P_Point, matches
  
  const matches_num = (tournament.participants / 2) - 1
    // participants = 8 -> matches_num = 7 P_Point = 8 Byes => 8-8 = 0 matches = 7-7 = 0
    // participants = 16 -> matches_num = 15 P_Point = 16 Byes => 16-16 = 0 matches = 15-7 = 8
    // participants = 15 -> matches_num = 14 P_Point = 16 Byes => 16-15 = 1 matches = 14-7 = 7
    
    for (i=0; i < PLimit_Points.length; i++){
      if(PLimit_Points[i] >= tournament.participants){
        P_Point = PLimit_Points[i]
        break
      }
    }
    // P_Point = 8
    Byes = P_Point - tournament.participants // Byes => 8-8 = 0
    matches = matches_num - 7 // matches = 0

    for (i=0; i < matches; i++){
      var val = Math.floor(10000000 + Math.random() * 90000000);
        let NonByesPattern = [
          {isByes: false}, {isByes: false}
        ]
        await new Match({_id:val, groupId : group._id, instance:"Round1",participants:NonByesPattern, games:[{gameId: tournament.games[0].gameId}] }).save()
      }
      var ByesPattern = []
      for (i=1; i <= Byes; i++){
        var x = [{isByes:true}]
        if(i > 4){
          x.splice(0,0,{isByes:true})
        }
        ByesPattern.push(x)
      }
      ByesPattern = ByesPattern.reverse().slice(0,4)
      
      if(ByesPattern.length > 0){

        for (i=0; i < 4; i++){
          var val = Math.floor(10000000 + Math.random() * 90000000);
          await new Match({_id:val, groupId : group._id, instance:"Round2",participants:ByesPattern[i], games:[{gameId: tournament.games[0].gameId}] }).save()
        }
      }
      for(i=0; i < 2; i++){
        var val = Math.floor(10000000 + Math.random() * 90000000);
        await new Match({_id:val, groupId : group._id, instance:"Qualifiers", games:[{gameId: tournament.games[0].gameId}], }).save()
      }

      var val = Math.floor(10000000 + Math.random() * 90000000);
      await new Match({_id:val, groupId : group._id, instance:"Semifinals", games:[{gameId: tournament.games[0].gameId}], }).save()
}

module.exports = router;
