const mongoose = require('mongoose');

const coachSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    experience : {type: Number},
    teams_coached: [
      {
        teamId: {type: Number, ref: 'Team'}
      },
    ],
    current_teams: [
      {
        teamId: {type: Number, ref: 'Team'}
      },
    ],    
    region : {type :String},
    players_coached : {type : Number},
    tier_level : {type: String},
    reviews: [
	    {
	   		reviewId: { type: mongoose.Schema.Types.ObjectId, ref: "Review" },
	    }
    ],
    coach_rating:{type : Number,         
      enum: [1, 2, 3, 4, 5]},
    attributes: {
      coachtype: {
      type: String,
    }, 
    experience: {
      type: Number,
    }, 
    regions: {
      type: String,
    }, 
    paid: {
      type: String,
    }, 
    language: {
      type: [String],
    }, 
    platform: {
      type: String,
    }, 
    ratings: {
      type: Number,
    }, 
    session: {
      type: String,
    }, 
    tier: {
      type: String,
    }, 

    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Coach', coachSchema);
