const express = require("express");
const router = express.Router();

const BattlePass = require("../models/BattlePass.model");
const Reward = require("../models/Reward.model");
const Level = require("../models/Level.model");
const auth = require("../middleware/auth.middleware");

router.get("/", auth, async (req, res) => {
  try {
    const battlepass = await BattlePass.findOne({ user: req.userId }).populate(
      "user"
    );

    let n = 300;
    if (n * battlepass.level < battlepass.xp_points) {
      battlepass.level++;
      battlepass.save();
    }

    if (!battlepass) {
      return res.status(404).json({ msg: "No Battle Pass found" });
    }
    const levelOne = await Level.find().populate("reward.rewardId");
    const levelTwo = await Level.find().populate("reward.rewardId");

    let fl = [];
    let pl = [];
    // free levels
    for (i = 0; i < levelOne.length; i++) {
      for (j = 0; j < levelOne[i].reward.length; j++) {
        let x = levelOne[i].reward;
        if (x.length > 1) {
          if (x[j].rewardId.type === "paid") {
            x.splice(1, 1);
          }
        }
      }
      fl.push(levelOne[i]);
    }

    // paid levels
    for (i = 0; i < levelTwo.length; i++) {
      for (j = 0; j < levelTwo[i].reward.length; j++) {
        let x = levelTwo[i].reward;
        if (x.length > 1) {
          if (x[j].rewardId.type === "free") {
            console.log(x[j].rewardId);
            x.splice(0, 1);
          }
        }
        pl.push(levelTwo[i]);
      }
    }

    res.status(200).json({ battlepass, freelevels: fl, paidlevels: pl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
});

router.put("/claimreward/:rewardId", auth, async (req, res) => {
  try {
    const reward = await Reward.findById(req.params.rewardId);

    await BattlePass.updateOne(
      {
        user: req.userId,
      },
      {
        $push: { completed_rewards: { rewardId: reward._id } },
      }
    );

    res.status(200).json(battlepass);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
