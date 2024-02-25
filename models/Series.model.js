const mongoose = require('mongoose');

const seriesSchema = new mongoose.Schema(
  {
    _id: {type: Number },
    startDate: {type: Date} ,
    endDate: {type : Date},
    fullName:{type: String},
    leagueId: { type: Number, ref: 'League'},
    slug: { type: String },          	
    tier: { type: String },          	
    year: { type: Number }          
  }
);

module.exports = mongoose.model('Series', seriesSchema);
