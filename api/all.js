const express = require('express');
const router = express.Router();

const Game = require('../models/Game.model');
const Arena = require('../models/Arena.model');
const Brand = require('../models/Brand.model')
const Sponsor = require('../models/Sponsor.model');
const Organizer = require('../models/Organizer.model');
const Coach = require('../models/Coach.model')
const Review = require('../models/Review.model')
const Team = require('../models/Team.model')
const Job = require('../models/Job.model');
const UserPersona = require('../models/UserPersona.model')
const Player = require('../models/Player.model')
const Avatar = require('../models/Avatar.model')
const Series = require('../models/Series.model')
const TeamRole = require('../models/TeamRole.model')
const WaitingList = require('../models/WaitingList.model')
const User = require('../models/User.model')
const BattlePass = require('../models/BattlePass.model')
const Tournament = require('../models/Tournament.model')


const auth = require('../middleware/auth.middleware');
const sendEmail = require('../server-utils/sendEmail');
const { bpTracker } = require("../server-utils/battlepassTracker")

// @route   GET api/all/personas
// @desc    get current user personas
router.get('/personas',auth,async (req,res) => {
  try{
    const personas = await UserPersona.findOne({user:req.userId}).populate({
      path: 'personas.teamId',
      model: 'Team',
      select: { '_id': 1, "imgUrl":1, "name":1},
   }).populate({
    path: 'personas.brandId',
    model: 'Brand',
    select: { '_id': 1, "logoUrl":1, "name":1},
 }).populate({
  path: 'personas.tournamentId',
  model: 'Tournament',
  select: { '_id': 1, "imgUrl":1, "name":1},
})

    if(!personas){
      return res.status(404).json({msg : 'No data'})
    }

    res.status(200).json(personas)
  } catch(error){
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
})

// @route   GET api/all/games
// @desc    get all the games
router.get('/games', async (req, res) => {
  try {
    const games = await Game.find()
      .limit(Number(15))
      .sort({ createdAt: 1 });

    if (!games) {
      return res.status(404).json({ msg: 'Games not found' });
    }
     
    res.status(200).json(games);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET api/all/organizers
// @desc    get all the organizers
router.get('/organizers', async (req, res) => {
  try {
    const organizers = await Organizer.find().limit(10)
      .sort({ createdAt: -1 });

    if (!organizers) {
      return res.status(404).json({ msg: 'Organizers not found' });
    }
     
    res.status(200).json(organizers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET api/all/sponsors
// @desc    get all the sponsors
router.get('/sponsors', async (req, res) => {
  try {
    const sponsors = await Sponsor.find()
      .sort({ createdAt: -1 });

    if (!sponsors) {
      return res.status(404).json({ msg: 'Sponsors not found' });
    }
     
    res.status(200).json(sponsors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET api/all/arenas
// @desc    get all the arenas
router.get('/arenas', async (req, res) => {
  try {
    const arenas = await Arena.find()
      .sort({ createdAt: -1 });

    if (!arenas) {
      return res.status(404).json({ msg: 'Arenas not found' });
    }
     
    res.status(200).json(arenas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET api/all/coaches
// @desc    get all the coaches
router.get('/coaches', async (req, res) => {
  try {
    const coaches = await Coach.find({})
    .populate('user')

    if(!coaches){
      return res.status(404).json({msg: "Coach Not Found"})
    }

    let coachesList = []

    for(let i=0; i < coaches?.length; i++){
      const reviewArray = coaches[i].reviews.length > 0 ? coaches[i].reviews.map(rew => rew.reviewId) : []
      const reviews = await Review.find({_id: {$in :reviewArray}}).populate('reviewer')

      const teamArray = coaches[i].teams_coached.length > 0 ? coaches[i].teams_coached.map(team => team.teamId) : []
      const teams = await Team.find({_id: {$in: teamArray}}).populate('team')

      const team1Array = coaches[i].current_teams.length > 0 ? coaches[i].current_teams.map(team => team.teamId) : []
      const teams1 = await Team.find({_id: {$in: team1Array}}).populate('team')

      coachesList.push({coaches: coaches[i], reviews: reviews, teams: teams, teams1: teams1})
    }

    res.status(200).json(coachesList)
  } catch (err) {
    console.log(err)
    res.status(500).json({msg: "this is coming from all Api/coaches"})
  }

})

// @route   GET api/all/reviews
// @desc    get all the reviews
router.get('/reviews', async (req, res)=>{
  try {
    const reviews = await Review.find({}).populate('reviewer')

     if(!reviews){
      return res.status(404).json({msg: "Review Not Found"})
    }

    res.status(200).json(reviews)
  } catch (err) {
    console.log(err)
    res.status(500).json({msg:"error in review api"})
  }
})


router.get('/jobs', async (req, res) => {
  try {
    const jobs = await Job.find({ status: true })
      .populate({
        path: 'job_owner',
        model: 'Team',
        select: { '_id': 1,'name':1,"imgUrl":1},
      })
      .sort({ createdAt: -1 });

    if (!jobs) {
      return res.status(404).json({ msg: 'Jobs not found' });
    }
    res.status(200).json(jobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.get('/players', async (req, res) => {
  try {
    const players = await Player.find({})
      .limit(60)

    if (!players) {
      return res.status(404).json({ msg: 'Players not found' });
    }
    res.status(200).json(players);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.get('/avatars', async (req, res) => {
      
    try {
        const gender = req.body
        const avatars = await Avatar.find(gender)
        res.status(200).json(avatars)
    } catch (err) {
        res.status(500).json({msg: 'Server error'})
    }
})


// Bulk update avatars' genders ////////////////////////////for testing (remove if needed)/////////////////////


router.patch('/avatars/bulkUpdate', async (req, res) => {
  const updates = req.body; // Expecting an array of objects with title and gender

  console.log("data from postman at all.js :", updates)

  try {
      const bulkOps = updates.map(update => ({
          updateOne: {
              filter: { title: update.title },
              update: { $set: { gender: update.gender } }
          }
      }));

      const result = await Avatar.bulkWrite(bulkOps);

      res.status(200).json({ msg: 'Bulk update successful', result });
  } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
  }
});

////////////////////////////////////////////////////////////


// All Series
router.get('/series', async(req, res)=>{
  try {
    const series = await Series.find({}).limit(50)
    res.status(200).json(series)
  } catch (err) {
    console.log(err)
    res.status(500).json({msg: "Server Error"})
  }
})

router.get('/paginated-teams', async(req, res)=>{
  try {
    // Retrieve the page number and limit from query parameters (with defaults if not provided)
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10; // Default limit to 10 if not provided

    // Calculate the skip value for pagination
    const skip = (page - 1) * limit;

    // Fetch teams with pagination
    const teams = await Team.find({ }) // Filter only unclaimed teams directly
      .select({"_id": 1, "name": 1, "imgUrl": 1, "founded": 1, "isClaimed": 1})
      .skip(skip) // Apply skip for pagination
      .limit(limit) // Apply limit for pagination
      .populate("games.gameId") // Assuming you want to keep populating this
      .sort({ createdAt: -1 });

    // Calculate total number of unclaimed teams for pagination metadata
    const totalUnclaimedTeams = await Team.countDocuments({ isClaimed: false });

    // Prepare pagination metadata
    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(totalUnclaimedTeams),
      totalItems: teams.length,
      limit: limit
    };

    // Return paginated list of unclaimed teams along with pagination details
    res.status(200).json(teams);
  } catch (err) {
    console.log(err);
    res.status(500).json({msg: "Server Error"});
  }
})

// All Teams
router.get('/teams', async(req, res)=>{
  try {
    const teams = await Team.find({}).select({"_id":1, "name":1, "imgUrl":1, "founded":1, "isClaimed":1})
    .limit(Number(process.env.TOURNAMENTS_THRESHOLD_COUNT)).populate("games.gameId")
    .sort({ createdAt: -1 });

    let claimableTeams = []
    
    for (i=0; i < teams.length; i++){
      claimableTeams.push(teams[i])
    }

    res.status(200).json(claimableTeams)
  } catch (err) {
    console.log(err)
    res.status(500).json({msg: "Server Error"})
  }
})

// All Teams without claimable
router.get('/allteams', async(req, res)=>{
  try {
    const teams = await Team.find().select({"_id":1, "name":1, "imgUrl":1, "founded":1, "isClaimed":1, "games": 1})
    .limit(500)
    // .limit(Number(process.env.TOURNAMENTS_THRESHOLD_COUNT))
    .sort({ createdAt: -1 });

    let newTeams = []
    for (i=0; i < teams.length; i++){
        newTeams.push({teamId: teams[i]})
    }
    res.status(200).json(newTeams)
  } catch (err) {
    console.log(err)
    res.status(500).json({msg: "Server Error"})
  }
})

// All tournaments
router.get('/tournaments', async(req, res)=>{
  try {
    const tournaments = await Tournament.find({}).select({"_id":1, "name":1, "imgUrl":1,"isClaimed":1})
    .limit(Number(process.env.TOURNAMENTS_THRESHOLD_COUNT))
    .sort({ createdAt: -1 });
    let claimableTournaments = []
    
    for (i=0; i < tournaments.length; i++){
      if(tournaments[i].isClaimed === false){
        claimableTournaments.push(tournaments[i])
      }
    }
    res.status(200).json(claimableTournaments)
  } catch (err) {
    console.log(err)
    res.status(500).json({msg: "Server Error"})
  }
})

// All Brands
router.get('/brands', async(req, res)=>{
  try {
    const brands = await Brand.find({}).select({"_id":1, "name":1, "logoUrl":1,"isClaimed":1})
    .sort({ createdAt: -1 });
    let claimableBrands = []
    
    for (i=0; i < brands.length; i++){
      if(brands[i].isClaimed === false){
        claimableBrands.push(brands[i])
      }
    }
    res.status(200).json(claimableBrands)
  } catch (err) {
    console.log(err)
    res.status(500).json({msg: "Server Error"})
  }
})


// All users
router.get('/users', async(req, res)=>{
  try {
    const users = await User.find({})
    .limit(Number(process.env.TOURNAMENTS_THRESHOLD_COUNT))
    .sort({ createdAt: -1 });
    res.status(200).json(users)
  } catch (err) {
    console.log(err)
    res.status(500).json({msg: "Server Error"})
  }
})

router.put('/attribute/:playerId',auth , async(req, res)=> {
  try {
    const attr = await Player.updateOne({_id: req.params.playerId}, 
      {$set: {
        "attributes.roles": req.body.roles,
        "attributes.regions": req.body.regions,
        "attributes.playertype": req.body.playertype,
        "attributes.platform": req.body.platform,
        "attributes.language": req.body.language,
        "attributes.paid": req.body.paid,
        "attributes.mic": req.body.mic,
        "attributes.streamer": req.body.streamer
    }
  }
)
    res.status(200).json("Successfully Updated!")
  } catch (err) {
    console.log(err)
    res.status(500).json({msg: "Server Error"})
  }
})

router.put('/teamattribute/:teamId',auth , async(req, res)=> {
  try {
    const attr = await Team.updateOne({_id: req.params.teamId}, 
      {$set: {
        "attributes.roles": req.body.roles,
        "attributes.regions": req.body.regions,
        "attributes.teamtype": req.body.teamtype,
        "attributes.platform": req.body.platform,
        "attributes.language": req.body.language,
        "attributes.paid": req.body.paid,
        "attributes.mic": req.body.mic
    }
  }
)
    res.status(200).json("Successfully Updated!")
  } catch (err) {
    console.log(err)
    res.status(500).json({msg: "Server Error"})
  }
})

// All team about roles
router.get('/teamroles', async (req, res) => {
  try {
    const teamroles = await TeamRole.find() 

    if (!teamroles) {
      return res.status(404).json({ msg: 'Roles not found' });
    }
     
    let roles = teamroles[0].role
    res.status(200).json(roles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Waiting List
router.post('/waitinglist', async (req, res) => {
  try {
    const { waitingMail } = req.body

    const alreadyWaiting = await WaitingList.findOne({"email": waitingMail})
    const registered = await User.findOne({"email": waitingMail})

    const newObj = {
      email: waitingMail
    }
    if( alreadyWaiting || registered ){
      res.status(200).json({msg: "Mail Already Exists"})
    }else if(!registered || !alreadyWaiting ){
      await new WaitingList(newObj).save()
      res.status(200).json({msg: "Thank You for the support!"})
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/refer',auth, async(req, res)=>{
  try {
    await sendEmail({
      to: req.body.email,
      subject: 'Multiplayr - Invite',
      text: `${req.body.sender} has invited you to join the revolution in eSports gaming - https://multiplayr.gg `,
      type: 'REFER'
    })
    
    const bp = await BattlePass.findOne({user:req.userId})
    await bpTracker("Invite A Friend",bp._id)

    res.status(200).json({msg: "Success"})
  } catch (err) {
    console.log(err)
    res.status(500).json({msg: 'Server Error'})
  }
})

router.get('/:type/:username',async (req,res) => {
  try {
    const { type, username } = req.params
    
    switch (type) {
      case "team":
        const team = await Team.findOne({"name": username})
        res.status(200).json(team.followers)
        break;

      case "tour":
        const tournament = await Tournament.findOne({"name": username})
        res.status(200).json(tournament.followers)
        break;

      case "brand":
        const brand = await Brand.findOne({"name": username})
        res.status(200).json(brand.followers)
        break;

      default:
        break;
    }

  } catch (err) {
    console.log(err)
    res.status(500)
  }
})

router.put('/follow/:type/:username', auth, async (req,res) => {
  try {
    const { type, username } = req.params
    switch (type) {
      case "tour":
        let tournament = await Tournament.findOne({"name": username});
        if (!tournament) {
          return res.status(404).json({ msg: "tournament not found" });
        }

        const isTourFollowing =
          tournament.followers.filter(
            (follower) => follower.user.toString() === req.userId
          ).length > 0;

        if (isTourFollowing) {
          // Unlike the tournament if already following
          const index = tournament.followers.findIndex(
            (follower) => follower.user.toString() === req.userId
          );
          tournament.followers.splice(index, 1);
          tournament = await tournament.save();

          res.status(200).json("Success");
        } else {
          // Follow the tournament
          tournament.followers.unshift({ user: req.userId });
          tournament = await tournament.save();

          res.status(200).json("Success");
        }
      break;
        
      case "team":
        let team = await Team.findOne({"name": username})
        if (!team) {
          return res.status(404).json({ msg: "team not found" });
        }
        const isTeamFollowing =
          team.followers.filter(
            (follower) => follower.user.toString() === req.userId
          ).length > 0;

          if (isTeamFollowing) {
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
      break;
      
      case "brand":
        let brand = await Brand.findOne({"name": username});
        if(!brand){
            return res.status(404).json({ msg: "Brand not found" });
          }

          const isFollowing =
            brand.followers.filter(
              (follower) => follower.user.toString() === req.userId
            ).length > 0;

          if (isFollowing) {
            // Unlike the brand if already following
            const index = brand.followers.findIndex(
              (follower) => follower.user.toString() === req.userId
            );
            brand.followers.splice(index, 1);
            brand = await brand.save();

            res.status(200).json(brand);
          } else {
            // Follow the game
            brand.followers.unshift({ user: req.userId });
            brand = await brand.save();

            res.status(200).json(brand);
          }
        break;
      
      default:
        break;
    }
  } catch (err) {
    console.log(err)
    res.status(500).json(err)
  }
})

module.exports = router;
