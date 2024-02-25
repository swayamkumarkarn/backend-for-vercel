const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    desc: {
      type: String,
    },
    reward_point: {
      type: Number,
    },
    week: {
      type: String,
    },
    users: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Task", taskSchema);
