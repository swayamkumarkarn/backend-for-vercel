const express = require("express");
const router = express.Router();
const axios = require("axios");

const options = { method: "GET", headers: { Accept: "application/json" } };

// @route   GET api/all/games
// @desc    get all the games
router.get("/player/pandastats/:gameId/:playerid", async (req, res) => {
  try {
    const gameId = req.params.gameId;
    const playerid = req.params.playerid;
    console.log(gameId);

    let apiurl = process.env.PANDA_CSGO;

    switch (gameId) {
      case 1:
        apiurl = process.env.PANDA_LOL;
        break;
      case 4:
        apiurl = process.env.PANDA_DOTA2;
        break;
      case 14:
        apiurl = process.env.PANDA_OW;
        break;
      case 26:
        apiurl = process.env.PANDA_VOLRANT;
        break;
      default:
        apiurl = process.env.PANDA_CSGO;
    }

    var url =
      apiurl +
      `/players/${playerid}/stats?token=FIyc727qzOXkhETLwJ-uXVTVrm6_FJZR2qDmpqCCZHqoAxNgUZs`;
    console.log(url);
    fetch(url, options)
      .then((response) => response.json())
      .then((response) => {
        console.log(response);

        if (!response) {
          return res.status(404).json({ msg: "Player stats not found" });
        } else {
          res.status(200).json(response);
        }
      })
      .catch((err) => console.error(err));
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
});

// @route   GET Stats
// @desc    get all the games
router.get("/player/stats/:gameId/:userign/:qstat", async (req, res) => {
  const gam = req.params.gameId;
  const userign = req.params.userign;
  const qstat = req.params.qstat;

  const gameId = Number(gam);

  try {
    let apiurl = process.env.API_URI_DOTA2;

    switch (gameId) {
      case 1:
        apiurl =
          process.env.API_URI_LOL + `/${userign}?TRN-Api-Key=eaf274a8-855c-4d57-b83c-94392c2cd987`;
        break;
      case 4:
        {
          apiurl = process.env.API_URI_DOTA2 + `/players/${userign}`;
          if (qstat) {
            apiurl = process.env.API_URI_DOTA2 + `/players/${userign}/${qstat}`;
          }
        }
        break;
      case 3:
        apiurl = process.env.API_URI_CSGO + `/${userign}?TRN-Api-Key=eaf274a8-855c-4d57-b83c-94392c2cd987`
        break;
      case 20:
        apiurl = process.env.API_URI_PUBG + `/${userign}?TRN-Api-Key=eaf274a8-855c-4d57-b83c-94392c2cd987`
        break;
      case 25:
        apiurl = process.env.API_URI_APEX + `/${userign}?TRN-Api-Key=eaf274a8-855c-4d57-b83c-94392c2cd987`
        break;
      case 14:
        apiurl = process.env.PANDA_OW;
        break;
      case 26:
        apiurl = process.env.PANDA_VOLRANT;
        break;
    }

    console.log(apiurl);

    //As results are varied from different APIs, set the standard output for the frontend here.
    switch (gameId) {
      case 1:
        console.log("Trying to set LOL Data......");
        axios.get(apiurl, { headers: {} }).then((resp) => {
          let result = resp.data.data;
          let output = {};
          let sum =
            (result.segments[0].stats.kills.value +
              result.segments[0].stats.assists.value) /
            result.segments[0].stats.deaths.value;

          output.kills = result.segments[0].stats.kills.value;
          output.deaths = result.segments[0].stats.deaths.value;
          output.kda = Number(sum.toFixed(2));
          output.loss = result.segments[0].stats.losses.value;
          output.slug = "league-of-legends";
          res.status(200).json(output);
          return;
        });

        break;
        case 3:
          console.log("Trying to set CSGO Data......");
          axios.get(apiurl,{ headers: {} }).then((resp) => {
            let result = resp.data.data;
            let output = {};
  
            output.kills = result.segments[0].stats.kills.value;
            output.deaths = result.segments[0].stats.deaths.value;
            output.kda = result.segments[0].stats.kd.value.toFixed(2);
            output.loss = result.segments[0].stats.losses.value;
            output.slug = "cs-go";
            res.status(200).json(output);
            return;
          });
          break;
        case 20:
          console.log("Trying to set PUBG Data......");
          axios.get(apiurl,{ headers: {} }).then((resp) => {
            let result = resp.data.data;
            let output = {};
            output.kills = result.segments[0].stats.kills.value;
            output.deaths = '--'
            output.kda = result.segments[0].stats.kdaRatio.value.toFixed(2);
            output.loss = result.segments[0].stats.losses.value;
            output.slug = "pubg";
            res.status(200).json(output);
            return;
          });
          break;
      case 4:
        {
          console.log("Trying to set DOTA2 Data......");
          axios.get(apiurl, { headers: {} }).then((resp) => {
            let result = resp.data;
            let output = {};
            output.kills = result[0].sum;
            output.deaths = result[1].sum;
            output.kda = result[2].sum;
            output.loss = result[27].sum;
            output.slug = "dota-2";
            console.log(output);
            res.status(200).json(output);
            return;
          });
        }
        break;
      case 25:
        console.log("Trying to set Apex Legends Data......");
          axios.get(apiurl,{ headers: {} }).then((resp) => {
            let result = resp.data.data;
            let output = {};
            output.kills = result.segments[0].stats.kills.value;
            output.deaths = '--'
            output.kda = '--'
            output.loss = '--'
            output.slug = "apex-legends";
            res.status(200).json(output);
            return;
          });
        break;
      case 14:
        break;
      case 26:
        break;
    }
  } catch (error) {}
});

module.exports = router;
