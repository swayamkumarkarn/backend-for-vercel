const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema(
  {
    tournamentId: {
      type: Number,
      ref: "Tournament",
    },
    participants: [
        {
            participantId: {
                type: mongoose.Schema.Types.ObjectId,
                ref:"User"
            },
            matches:{
                type: Number
            },
            won:{
                type:Number
            },
            loss:{
                type:Number
            },
            draw:{
                type:Number
            },
            points:{
                type:Number
            }
        },
    ],
    teams: [
        {
            teamId: {
                type: Number,
                ref:"Team"
            },
            squadId:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"Squad"
            },
            matches:{
                type: Number
            },
            won:{
                type:Number
            },
            loss:{
                type:Number
            },
            draw:{
                type:Number
            },
            points:{
                type:Number
            }
        },
    ],
    date: {
      type: Date,
      default: Date.now(),
    },
    isMatchPlayersSet: {
        type: Boolean,
        default: false
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Group", groupSchema);
