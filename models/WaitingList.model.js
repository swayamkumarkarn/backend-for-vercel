const mongoose = require('mongoose');

const waitinglistSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique:true
    }   
  }
)

module.exports = mongoose.model('Waitinglist', waitinglistSchema);
