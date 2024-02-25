const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    post_type: {
      type: String,
    },
    profilepic: {
      type: String,
    },
    username: {
      type: String,
    },
    description: {
      type: String,
      required: true,
    },
    game_tag: [{
      name: {
        type: String,
        default: ''
      },
      gameId: {
        type: Number,
        default: null
      }
  }],
    images: {
      type: [String],
    },
    likes: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    saves: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    shares: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    views: {
      type: Number,
      default: 0,
    },
    date: {
      type: Date,
      default: Date.now(),
    },
    teamId:{type: Number, ref: "Team"}
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Post", postSchema);
