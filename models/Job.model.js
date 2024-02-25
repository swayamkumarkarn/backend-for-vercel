const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    title: {type: String},
    experience:{type: Number},
    job_owner: { type: Number, ref: 'Team' },
    startDate: {type: String},
    endDate: {type: String},
    location : {
      name: {type: String},
      iso: {type: String}
    },
    status :{
    	type: Boolean,
    	default: true
    },    
    job_type:{
      type: String, 
    },
    job_category:{
      type: String
    },
    currency:{type: String, default: "Rs"},
    salary: {type: Number},
    description: {type: String},
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Job', jobSchema);


