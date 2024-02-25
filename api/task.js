const express = require("express");
const router = express.Router();

const Task = require("../models/Task.model");
const BattlePass = require("../models/BattlePass.model");
const auth = require("../middleware/auth.middleware");
const { bpTracker } = require("../server-utils/battlepassTracker");

router.get("/:week", async (req, res) => {
  try {
    const tasks = await Task.find({ week: req.params.week });

    if (!tasks) {
      return res.status(404).json({ msg: "No Tasks found." });
    }

    res.status(200).json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
});

// Only for BE Dev
router.get("/test/:week", auth, async (req, res) => {
  try {
    const bp = await BattlePass.findOne({ user: req.userId });
    await bpTracker("Like,comment and share a post", bp._id);

    res.status(200).json("tasks");
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
});

router.put("/collectreward/:taskId", auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    const bp = await BattlePass.findOne({ user: req.userId });

    await Task.updateOne(
      {
        _id: task._id,
      },
      {
        $push: { users: { userId: req.userId } },
      }
    );

    let points = bp.xp_points + task.reward_point;
    let isComplete = false;

    for (i = 0; i < bp.completed_tasks.length; i++) {
      if (bp.completed_tasks[i].taskId.toString() === req.params.taskId) {
        isComplete = true;
      }
    }

    if (isComplete === true) {
      await BattlePass.findByIdAndUpdate(
        bp._id,
        {
          xp_points: points,
        },
        { new: true }
      );
    }
    res.status(200).json(bp);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/", async (req, res) => {
  const { desc, reward_point, week } = req.body;

  try {
    const postObj = {
      desc,
      reward_point,
      week,
    };

    const task = await new Task(postObj).save();

    res.status(200).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
