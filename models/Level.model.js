const mongoose = require('mongoose');

const levelSchema = new mongoose.Schema(
  {
    _id:{
      type: Number,
    },
    reward:[
      {
        rewardId:{
          type:Number,
          ref:'Reward'
        }
      }
    ]
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Level', levelSchema);
