const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema(
  {
    scores: {
      type: String,
    },
    points: {
      type: Number,
    },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team'},
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Score', scoreSchema);
