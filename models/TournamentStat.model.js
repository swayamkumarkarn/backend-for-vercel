const mongoose = require("mongoose");

const tournamentStatSchema = new mongoose.Schema(
  {
    tournamentId: {
      type: Number,
    },
    place: {
      type: Number,
      default: 0,
    },
    mp: {
      type: Number,
    },
    wins: {
      type: Number,
    },
    loss: {
      type: Number,
    },
    w_streak: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("TournamentStat", tournamentStatSchema);
