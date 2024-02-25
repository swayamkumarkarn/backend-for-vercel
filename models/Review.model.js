const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    review : {type : String},
    rating : {type : Number,         
    		  enum: [1, 2, 3, 4, 5]},
    featured: { type: Boolean},
    reviewdate: { type: Date, default: Date.now },
    status :{
    	type: Boolean,
    	default: true
    }    
  }
);

module.exports = mongoose.model('Review', reviewSchema);
