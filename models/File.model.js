const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    name: {
      type: String
    },
    path: {
      type: String
    },
    createdAt :{
    	type: Date,
    	default: Date.now,
    }
    
  }
);

module.exports = mongoose.model('File', fileSchema);
