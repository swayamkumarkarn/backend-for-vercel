const mongoose = require("mongoose");

const supportadminSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    teams:[
        {
          teamId: {
            type: Number,
            ref: 'Team'
          },
          user:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          imageproof: [ { images: {type: [Object]} }],
          applyDate: {
            type: Date,
            default:Date.now()
          }
        }
      ],
      tournaments:[
        {
          tournamentId: {
            type: Number,
            ref: 'Tournament'
          },
          user:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          imageproof: [ { images: {type: [Object]} }],
          applyDate: {
            type: Date,
            default:Date.now()
          }
        }
      ],
      brands:[
        {
          brandId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Brand'
          },
          user:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          imageproof: [ { title:{type:String}, tag: {type: String}, images: {type: [Object]} , createdAt : {type: Date}} ],
          applyDate: {
            type: String,
            default:Date.now()
          }
        }
      ],
    date: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SupportAdmin", supportadminSchema);
