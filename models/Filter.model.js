const mongoose = require('mongoose');


const filterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    filterType: {
      type: String
    },
	metadata:[
	{
    key: {
      type: String,
      required: true
    },
    value: {
		type: [String],
		required: true 
	}
	}	]
  }
);


module.exports = mongoose.model('Filter', filterSchema);
