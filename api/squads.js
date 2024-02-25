const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const imagesUpload = require("../middleware/imageUpload.middleware");
const Squad = require("../models/Squad.model");
const Team = require("../models/Team.model");

router.post(
  "/create",
  imagesUpload.single("imgUrl"),
  async (req, res) => {
    const { game, country, teamId } = req.body;

    try {
      const squadObj = {
        game: game[0],
        country: country[0], 
      };

      const squad = await new Squad(squadObj).save();

      await Squad.findByIdAndUpdate(squad._id, {$push:{
        players: req.body.playerData
      }})

      await Team.updateOne(
        { _id: teamId },
        {
          $push: {
            squads: {
              squadId: squad._id,
            },
          },
        }
      );

      res.status(201).json(squad);
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Server error" });
    }
  }
);

router.patch("/:squadId", async (req, res) => {
  const { game, country, teamId } = req.body;
  try {
    var playrArr = getNumberArray(req.body.players, "playerId");
    let squad = await Squad.findById(req.params.squadId);
    if (!squad) {
      return res.status(404).json({ msg: "Squad not found" });
    }
    const newObj = {
      game:game[0],
      country:country[0],
      players: playrArr,
    };
    squad = await Squad.findByIdAndUpdate(req.params.squadId, newObj, {
      new: true,
    });
    res.status(201).json(squad);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
});

// @route   DELETE /api/squads/:squadId
// @desc    Delete a squad by ID
router.delete('/:squadId', async (req, res) => {
  console.log(req.params.squadId)
  try {
    const squad = await Squad.findById(req.params.squadId);
    if (!squad) {
      return res.status(404).json({ msg: 'Squad not found' });
    }
    await squad.remove();
    res.status(200).json({ msg: 'Squad deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});


function getNumberArray(Obj, keyId) {
  let Objarr = Obj;
  if (!Obj instanceof Array) {
    Objarr = Obj.split(",");
  }
  var array = [];
  if (Objarr) {
    for (var i = 0, l = Objarr.length; i < l; i++) {
      if (Objarr[i]) {
        let game = Number(Objarr[i]);
        array.push({ [keyId]: game });
      }
    }
  }
  return array;
}

module.exports = router;
