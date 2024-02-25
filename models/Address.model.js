const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    line1: {
      type: String,
    },
    line2: {
      type: String,
    },
    city: {
      type: String,
    },  
    state: {
      type: String,
    },           
    country: {  
      type: String,
    }, 
    zipcode: {
      type: String,
    }     
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Address', addressSchema);
