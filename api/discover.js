const express = require('express');
const router = express.Router();
var mongoose = require('mongoose');

const Team = require('../models/Team.model');
const Tournament = require('../models/Tournament.model');
const Player = require('../models/Player.model');
const Coach = require('../models/Coach.model');
const Review = require('../models/Review.model')
const Arena = require('../models/Arena.model');
const Job = require('../models/Job.model');
const Game = require("../models/Game.model");
const Attribute = require('../models/Attribute.model')


// @desc    Post the filters to get the search data

router.post('/teams', async (req, res) => {
  try {

   const { mapFilters , selectedGame } = req.body;

    var conditions = {};     
    var and_clauses = [];

    for(let i=0;i<mapFilters.length;i++) {
		let field_name = mapFilters[i].key.toLowerCase();
	    let val = new RegExp(mapFilters[i].values.toString(), "i");
	    and_clauses.push({[field_name]: val });
    } 

    if (Number(selectedGame)) {
      let v = { $in : [ selectedGame ] };
      and_clauses.push({["games.gameId"]: v });
    }

    conditions['$and'] = and_clauses;

    const attributes = await Attribute.find(conditions)
    
    let teamList = []
    for(let j=0; j<attributes.length; j++){
      if(attributes[j].attributeType === "TEAM")
      {       
        const team = await Team.findOne({_id:attributes[j].attributeId}).limit(Number(process.env.TEAM_THRESHOLD_COUNT)).populate("games.gameId")
        teamList.push({team:team,attribute:attributes[j]})
      }
    }

    console.log("TML",teamList.length);
    res.status(200).json(teamList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});


router.post('/players', async (req, res) => {
  try {

   const { mapFilters , selectedGame } = req.body;


    var conditions = {};     
    var and_clauses = [];

    for(let i=0;i<mapFilters.length;i++) {
		let field_name = mapFilters[i].key.toLowerCase();
	    let val = new RegExp(mapFilters[i].values.toString(), "i");
	    and_clauses.push({['attributes.'+field_name]: val });
    } 

    if (selectedGame != 'undefined' ) {
      let v = { $in : [ selectedGame ] };
      and_clauses.push({["games.gameId"]: v });
    }

    conditions['$and'] = and_clauses;


    const plyrs = await Player.find(conditions);

     var playerList = [];


     for(let i=0;i<plyrs?.length;i++) {
     	playerList.push({players:plyrs[i]});
     }
     console.log(playerList.length);
    res.status(200).json(playerList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});


router.post('/coaches', async (req, res) => {
  try {

   const { mapFilters , name } = req.body;

    var conditions = {};     
    var and_clauses = [];

    for(let i=0;i<mapFilters.length;i++) {
		let field_name = mapFilters[i].key.toLowerCase();
	    let val = new RegExp(mapFilters[i].values.toString(), "i");
	    and_clauses.push({['attributes.'+field_name]: val });
    } 

    conditions['$and'] = and_clauses;

    const coaches = await Coach.find(conditions);

     var coachesList = [];

    for(let i=0; i < coaches?.length; i++){
      const reviewArray = coaches[i].reviews.length > 0 ? coaches[i].reviews.map(rew => rew.reviewId) : []
      const reviews = await Review.find({_id: {$in :reviewArray}}).populate('reviewer')

      const teamArray = coaches[i].teams_coached.length > 0 ? coaches[i].teams_coached.map(team => team.teamId) : []
      const teams = await Team.find({_id: {$in: teamArray}}).populate('team')

      const team1Array = coaches[i].current_teams.length > 0 ? coaches[i].current_teams.map(team => team.teamId) : []
      const teams1 = await Team.find({_id: {$in: team1Array}}).populate('team')

      coachesList.push({coaches: coaches[i], reviews: reviews, teams: teams, teams1: teams1})
    }

     console.log(coachesList.length);
    res.status(200).json(coachesList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/arenas', async (req, res) => {
  try {

   const { mapFilters , name } = req.body;

    var conditions = {};     
    var and_clauses = [];

    for(let i=0;i<mapFilters.length;i++) {
		let field_name = mapFilters[i].key.toLowerCase();
	    let val = new RegExp(mapFilters[i].values.toString(), "i");
	    and_clauses.push({['attributes.'+field_name]: val });
    } 

    conditions['$and'] = and_clauses;

    const arenas = await Arena.find(conditions);

     console.log(arenas?.length);
    res.status(200).json(arenas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});


// @desc    Post the filters to get the search data

// router.post('/tournaments', async (req, res) => {
//   try {
//     console.log(req.body);

//   const { mapFilters , selectedGame } = req.body;

//     var conditions = {};     
//     var and_clauses = [];   

//     for(let i=0;i<mapFilters.length;i++) {
//       let field_name = mapFilters[i].key.toLowerCase();
//       let val = new RegExp(mapFilters[i].values.toString(), "i");
//       and_clauses.push({[field_name]: val });
//     } 

//     if (Number(selectedGame ) ) {
//       let v = { $in : [ selectedGame ] };
//       and_clauses.push({["games.gameId"]: v });
//     }

//     conditions['$and'] = and_clauses;
//     console.log(selectedGame)
//     console.log(conditions);
//     const attribute = await Attribute.find(conditions);

//     //console.log("AT",attribute)
//      var tourList = [];
//      for(let j=0; j<attribute.length; j++){
//       if(attribute[j].attributeType === "TOURNAMENT")
//       {       
//         const tour = await Tournament.findOne({_id:attribute[j].attributeId})
//        // console.log("AA",tour)
//         if (tour !== null) {
//           tourList.push({tournament:tour});
//         }
//       }
//     }
//     console.log("==========================================");
//     console.log(tourList);
//     console.log("==========================================");
//     console.log(tourList.length);
//     res.status(200).json(tourList);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ msg: 'Server error' });
//   }
// });

router.post('/tournaments', async (req, res) => {
  try {
    const { mapFilters, selectedGame } = req.body;

    // Construct the initial match conditions from mapFilters
    let matchConditions = {};
    mapFilters.forEach(filter => {
      console.log(filter.key);
      if(filter.key.toLowerCase()==='format') {
        matchConditions['playType'] = { $regex: filter.values.toString().toUpperCase(), $options: "i" };
      }else{
        matchConditions[filter.key.toLowerCase()] = { $regex: filter.values.toString(), $options: "i" };
      }
    });
    console.log(matchConditions);

    if (Number(selectedGame)) {
      matchConditions["games.gameId"] = Number(selectedGame);
    }

    let tours = [];
    tours = await Tournament.find(matchConditions)
                  .sort({ createdAt: -1 })
                  .populate('registered.user')
                  .populate('teams.teamId')
                  .populate({
                    path: 'games.gameId',
                    model: 'Game',
                    select: {"_id": 1, "name": 1}
                  })

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
    // console.log(tourList)
    // res.status(200).json(tourList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/jobs', async (req, res) => {
  try {

   const { mapFilters , name } = req.body;

    var conditions = {};     
    var and_clauses = [];

    for(let i=0;i<mapFilters.length;i++) {
		let field_name = mapFilters[i].key.toLowerCase();
	    let val = new RegExp(mapFilters[i].values.toString(), "i");
	    and_clauses.push({['attributes.'+field_name]: val });
    } 

    conditions['$and'] = and_clauses;

    const jobs = await Job.find(conditions);

     console.log(jobs?.length);
    res.status(200).json(jobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router