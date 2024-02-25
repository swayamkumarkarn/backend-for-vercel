const mongoose = require('mongoose');

const leagueSchema = new mongoose.Schema(
  {
    _id: {type: Number },    
    name: {
      type: String,
    },
    imgUrl: {
      type: String,
      default: '/assets/media/default/team.jpg'
    },      
    status:{type: String},
    slug:{type: String},
    leagueType: {type: String}   
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('League', leagueSchema);