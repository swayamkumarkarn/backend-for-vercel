const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema(
  {
    _id:{
      type: Number,
    },
    levelId:{
      type:Number,
    },
    imgUrl: {
        type: String,
        default: "/assets/media/default/team.jpg",
    },
    name: {
        type: String,
    },
    isComplete : {
        type: Boolean,
        default:false,
    },
    type:{
      type:String,
      default:"free",
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Reward', rewardSchema);
