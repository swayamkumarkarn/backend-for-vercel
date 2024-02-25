const express = require('express');
const router = express.Router();

const Tournament = require('../models/Tournament.model');
const Team = require('../models/Team.model');
const User = require('../models/User.model');
const Arena = require('../models/Arena.model');
const Sponsor = require('../models/Sponsor.model');
const Organizer = require('../models/Organizer.model');
const Game = require("../models/Game.model");
const League = require('../models/League.model');
const Matches = require('../models/Match.model');

const Rank = require('../models/Rank.model');

const auth = require('../middleware/auth.middleware');

const functions = require('../middleware/functions.middleware');


router.get('/', async (req, res) => {
  try {
    const tournaments = await Tournament.find()
      .limit(5)
      .sort({ startDate: -1 });

    if (!tournaments) {
      return res.status(404).json({ msg: 'Tournaments not found' });
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
    res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/search', async (req, res) => {

  const { search, filters } = req.body;

  if(search) {
    var mssg= '';

      var sname = new RegExp([search].join(""), "i");

     Tournament.find({name: { $regex: sname }  }, function(err, result) {
       if (err) return res.status(404).json({ mssg: 'Tournaments not found' });

    const tournamentList =
      result.length > 0
        ? result.map((tournament) => ({
            tournament,
          }))
        : [];

          res.status(200).json(tournamentList);
      }); 
  }
   
});

router.get('/bywins/:gameId', async (req, res) => {
  try {
    const gameId = req.params.gameId;
    var search_text = req.query.searchText;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    let matchStage = {};
    if (Number(gameId)) {
      matchStage = { "games.gameId": Number(gameId) };
    }

    const teamsWithWinCounts = await Team.aggregate([
      { $match: matchStage },
      { $sort: { "team_points": -1, "createdAt": -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "tournaments",
          localField: "_id",
          foreignField: "teams.teamId",
          as: "tournamentsParticipated"
        }
      },
      {
        $lookup: {
          from: "tournaments",
          let: { teamId: "$_id" },
          pipeline: [
            { $unwind: "$teams" },
            { $match: { $expr: { $and: [ { $eq: [ "$teams.teamId", "$$teamId" ] }, { $eq: [ "$teams.result", "win" ] } ] } } },
            { $group: { _id: "$$teamId", count: { $sum: 1 } } }
          ],
          as: "wins"
        }
      },
      {
        $addFields: {
          winCount: { $ifNull: [ { $arrayElemAt: [ "$wins.count", 0 ] }, 0 ] },
          totalTournaments: { $size: "$tournamentsParticipated" }
        }
      },
      {
        $project: {
          team: "$$ROOT",
          totalTournaments: { $size: { $ifNull: ["$tournament_info", []] } }, // Ensure it's an array
        }
      }
    ]);

    // Adding rank based on pagination and sorting
    teamsWithWinCounts.forEach((team, index) => {
      team.rank = index + 1 + skip; // Adjust for pagination
    });
    const filters = {
      team_points: req.query.team_points,
      region: req.query.region,
    };
  
    if (Object.values(filters).some(value => value !== undefined)) {
      const filteredResults = filterTeams(teamsWithWinCounts, filters);
  
      if(search_text){
        const searchResults = searchByName(filteredResults, search_text);
        return res.status(200).json(searchResults);
      }
  
      return res.status(200).json(filteredResults);
    }
  
    if (search_text) {
      const searchResults = searchByName(teamsWithWinCounts, search_text);
      return res.status(200).json(searchResults);
    }
    res.status(200).json(teamsWithWinCounts);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server Error" });
  }
});

router.get('/bywinnings100/:gameId', async (req, res) => {
  try {
    var gameId = req.params.gameId;
    var search_text = req.query.searchText;

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    let matchQuery = {};
    if (Number(gameId)) {
      matchQuery = {"games.gameId": Number(gameId)};
    }

    // Fetch teams with pagination applied
    const results = await Team.find(matchQuery)
                              .sort({ "team_points": -1, "createdAt": -1 })
                              .skip(skip)
                              .limit(limit);

    const teamsData = await Promise.all(results.map(async (team) => {
    const tournaments = await Tournament.find({"teams.teamId": team._id});
    let teamWinCount = tournaments.reduce((count, tournament) => {
    // Ensure prizes exist and is an array
    if (Array.isArray(tournament.prizes)) {
    const wins = tournament.prizes.reduce((acc, prize) => {
    // Ensure winner_team_id exists and is an ObjectId
    if (prize.winner_team_id && prize.winner_team_id.equals && prize.winner_team_id.equals(team._id)) {
        return acc + 1; // Increment win count if winner_team_id equals team._id
    }
        return acc; // Return accumulated wins if no match
    }, 0);
        count += wins;
    }
      return count;
    }, 0);
                        
    return {
        team: team,
        points: team.team_points,
        totalTournaments: tournaments.length,
        teamWinCount
    };
    }));

    // Apply filters and search if necessary
    let filteredTeams = teamsData;
    // Other filters can be applied here similarly
    filteredTeams.forEach((team, index) => {
      team.rank = index + 1 + skip; // Adding 'skip' accounts for pagination
    });
    
    const filters = {
      team_points: req.query.team_points,
      region: req.query.region,
    };
  
    if (Object.values(filters).some(value => value !== undefined)) {
      const filteredResults = filterTeams(filteredTeams, filters);
  
      if(search_text){
        const searchResults = searchByName(filteredResults, search_text);
        return res.status(200).json(searchResults);
      }
  
      return res.status(200).json(filteredResults);
    }
  
    if (search_text) {
      const searchResults = searchByName(filteredTeams, search_text);
      return res.status(200).json(searchResults);
    }
    // Other filters can be applied here similarly

    res.status(200).json({
      teams: filteredTeams
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({msg: "Server Error"});
  }
});


function filterTeams(teams, {team_points, region}) {
  return teams.filter(({team}) => {
    // Filter by team_points
    const pointsCondition = team_points ? team.team_points >= parseInt(team_points, 10) : true;

    // Filter by region
    const regionCondition = region ? team.region.toLowerCase() === region.toLowerCase() : true;

    return pointsCondition && regionCondition;
  });
}

function searchByName(data, searchText) {
  // Convert the search text to lowercase for case-insensitive comparison
  const lowerCaseSearchText = searchText.toLowerCase();

  // Filter the data based on whether the team name includes the search text
  const filteredData = data.filter(item => {
      // Assuming 'item' represents the structure of your response and 'team' is a property of 'item'
      return item.team.name.toLowerCase().includes(lowerCaseSearchText);
  });

  return filteredData;
}


router.get('/filter/:gameId', async (req, res) => {
  try {
    const gameId = req.params.gameId;
    let page = parseInt(req.query.page, 10) || 1; // Default to page 1
    let limit = parseInt(req.query.limit, 10) || 10; // Default limit to 10 items per page
    let skip = (page - 1) * limit; // Calculate the number of documents to skip

    let query = {};

    if (!isNaN(Number(gameId))) {
      query["games.gameId"] = { $in: [Number(gameId)] };
    }

    // First, find the total count of documents that match the query to adjust pagination if needed
    const totalCount = await Team.countDocuments(query);

    if (totalCount <= skip) {
      page = 1;
      skip = 0;
    }

    const teams = await Team.find(query)
      .sort({ team_points: -1, createdAt: -1 })
      .limit(limit)
      .skip(skip);

    // Filtering logic remains the same
    const { team_points, role, region, achievements } = req.query;
    console.log(region);
    const filteredTeams = teams.filter(team => {
      const pointsCondition = team_points ? team.team_points >= parseInt(team_points, 10) : true;
      const regionCondition = region ? team.region.toLowerCase() === region : true;

      return pointsCondition && regionCondition;
    });

    // Return the filtered results along with pagination info
    res.status(200).json(filteredTeams);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
});


router.get('/search/:gameId/:search', async (req, res) => {
  try {
    const gameId = req.params.gameId;
    const search_text = req.params.search;
    const page = parseInt(req.query.page, 10) || 1; // Default to page 1
    const limit = parseInt(req.query.limit, 10) || 10; // Default limit to 10 items per page
    const skip = (page - 1) * limit; // Calculate the number of documents to skip

    // Start with an empty query that would fetch all documents
    let query = {};

    // If gameId is valid and can be converted to a number, refine the query to match the gameId
    if (!isNaN(Number(gameId))) {
      query["games.gameId"] = { $in: [Number(gameId)] };
    }

    // Execute the query with the constructed conditions, including sorting and pagination
    const teams = await Team.find(query)
      .sort({ team_points: -1, createdAt: -1 }) // Sort by team_points descending, then by createdAt
      .limit(limit)
      .skip(skip);

      const searchResults = teams.filter(team => {
          // Convert the search query to lowercase for case-insensitive comparison
          const lowerCaseQuery = search_text.toLowerCase();
  
          // Check if query matches the team's name or description (case-insensitive)
          const matchesName = team.name.toLowerCase().includes(lowerCaseQuery);
        
          return matchesName;
      });  

    res.status(200).json(searchResults); // Send the filtered results as the response
  } catch (err) {
    console.error(err); // Log the error
    res.status(500).json({ msg: "Server Error" }); // Send an error response
  }
});

router.get('/search/:search', async (req, res) => {
  try {
    const gameId = req.params.gameId;
    const search_text = req.params.search;
    const page = parseInt(req.query.page, 10) || 1; // Default to page 1
    const limit = parseInt(req.query.limit, 10) || 10; // Default limit to 10 items per page
    const skip = (page - 1) * limit; // Calculate the number of documents to skip

    // Start with an empty query that would fetch all documents
    let query = {};

    // If gameId is valid and can be converted to a number, refine the query to match the gameId
    if (!isNaN(Number(gameId))) {
      query["games.gameId"] = { $in: [Number(gameId)] };
    }

    // Execute the query with the constructed conditions, including sorting and pagination
    const teams = await Team.find(query)
      .sort({ team_points: -1, createdAt: -1 }) // Sort by team_points descending, then by createdAt
      .limit(limit)
      .skip(skip);

      const searchResults = teams.filter(team => {
          // Convert the search query to lowercase for case-insensitive comparison
          const lowerCaseQuery = search_text.toLowerCase();
  
          // Check if query matches the team's name or description (case-insensitive)
          const matchesName = team.name.toLowerCase().includes(lowerCaseQuery);
        
          return matchesName;
      });  

    res.status(200).json(searchResults); // Send the filtered results as the response
  } catch (err) {
    console.error(err); // Log the error
    res.status(500).json({ msg: "Server Error" }); // Send an error response
  }
});


router.get('/setRankings', async (req, res) => {
  const games = await Game.find()

  var results;
  for(var i=0; i < games.length; i++){

      results = await Matches.aggregate( [
       {$match : { "game._id": Number(games[i]._id)} },
       {
         $group: { _id: "$winner._id", total: { $sum: 1 } }
       }, { $sort : { total : -1 } }
     ] );
     if(results){
      for(j=0; j < results.length; j++){
        const teamId = results[j]._id
        const rank = j+1
        const team = await Team.findOneAndUpdate({ _id: teamId},{
          $set: { "teamrank.rank" : rank, "teamrank.winning": results[j].total }
        },{ new: false });

      }
     }
  }
 
  res.status(200).json({msg: "Ranking done"});
   
});

module.exports = router;
