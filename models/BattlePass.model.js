const mongoose = require('mongoose');

const battlepassSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isBPUser: {
      type: Boolean,
      default: false,
    },
    title:{
      type:String,
    },
    xp_points:{
      type: Number,
    },
    level:{
      type:Number,
      ref:'Level'
    },
    completed_tasks:[
      {
        taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
      },
    ],
    completed_rewards:[
      {
        rewardId: { type: Number, ref:'Reward' }
      }
    ],
    endDate:{
      type:Date
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('BattlePass', battlepassSchema);
