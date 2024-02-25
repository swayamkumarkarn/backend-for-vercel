const Tournament = require('../models/Tournament.model');
const Team = require('../models/Team.model');
const User = require('../models/User.model');
const Arena = require('../models/Arena.model');
const Sponsor = require('../models/Sponsor.model');
const Organizer = require('../models/Organizer.model');
const League = require('../models/League.model');


module.exports = {

	getOrganizers: async function (tournament) {
            //Getting Organizers  
          const orgArray =
            tournament.organizers.length > 0
              ? tournament.organizers.map(org => org.organizerId)
              : [];  
              
          const organizers = await Organizer.find({ _id : { $in : orgArray } });
          return organizers;
	},

	getSponsors: async function (tournament) {
          //Getting Sponsors  
          const sponArray =
            tournament.sponsors.length > 0
              ? tournament.sponsors.map(spon => spon.sponsorId)
              : [];  

          const sponsors = await Sponsor.find({ _id : { $in : sponArray } });
          return sponsors;
	},

 	getLeagues: async function (tournament) {
          //Getting Leagues  
          const leagArray =
            tournament.leagues.length > 0
              ? tournament.leagues.map(leag => leag.leagueId)
              : [];  

          const leagues = await League.find({ _id : { $in : leagArray } });
          return leagues;
	},

};