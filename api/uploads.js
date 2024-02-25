const path = require("path");
const express = require("express");

const handlebars = require("handlebars");
const router = express.Router();

const User = require("../models/User.model");
const Profile = require("../models/Profile.model");
const File = require("../models/File.model");
const Team = require("../models/Team.model");
const Game = require("../models/Game.model");
const Tournament = require("../models/Tournament.model");

const imagesUpload = require("../middleware/imageUpload.middleware")
const videoUpload = require("../middleware/videoUpload.middleware")
const uploadLocal = require("../middleware/fileUpload.middleware")
const { bpTracker } = require("../server-utils/battlepassTracker")
const BattlePass = require("../models/BattlePass.model")

var mongoose = require("mongoose");
const auth = require("../middleware/auth.middleware");
const fs = require("fs");

// @route:  PUT /api/auth
// @desc:   Update user settings
router.put("/", imagesUpload.single("profilePic"), async (req, res) => {
  try {
    const { name, username } = req.body;
    const updatedUser = {};

    console.log(req.body);

    if (req.file && req.file.path) updatedUser.profilePicUrl = req.file.path;

    user = await User.findByIdAndUpdate(req.userId, updatedUser, { new: true });

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
});

// @route:  PUT /api/auth
// @desc:   Update user settings
router.put(
  "/uploadImages",
  auth,
  imagesUpload.array("images", 5),
  async (req, res) => {
    const { title, model, id } = req.body;

    try {
      var path = [];

      for (let i = 0; i < req.files.length; i++) {
        path.push(req.files[i]);
      }

      if (model === "PROFILE") {
        var _id = mongoose.mongo.ObjectId(id);

        var prof = await Profile.findOneAndUpdate(
          { user: _id },
          {
            $push: {
              imagesgallery: {
                title,
                tag: Date.now(),
                images: path,
                createdAt: Date(),
              },
            },
          },
          { upsert: true, returnNewDocument: true }
        );
        res.status(200).json(prof);
      } else if (model === "TEAM") {
        var team = await Team.findOneAndUpdate(
          { _id: id },
          {
            $push: {
              imagesgallery: {
                title,
                tag: Date.now(),
                images: path,
                createdAt: Date(),
              },
            },
          },
          { upsert: true, returnNewDocument: true }
        );
        res.status(200).json(team);
      } else if (model === "TOURNAMENT") {
        var tour = await Tournament.findOneAndUpdate(
          { _id: id },
          {
            $push: {
              imagesgallery: {
                title,
                tag: Date.now(),
                images: path,
                createdAt: Date(),
              },
            },
          },
          { upsert: true, returnNewDocument: true }
        );
        res.status(200).json(tour);
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Server error" });
    }
  }
);

// @route:  PUT /api/auth
// @desc:   Update user settings
router.put(
  "/uploadVideos",
  auth,
  videoUpload.array("videos", 5),
  async (req, res) => {
    const { videodisc, model, id } = req.body;

    try {
      var path = [];

      for (let i = 0; i < req.files.length; i++) {
        path.push(req.files[i]);
      }

      if (model === "PROFILE") {
        var _id = mongoose.mongo.ObjectId(id);

        var prof = await Profile.findOneAndUpdate(
          { user: _id },
          {
            $push: {
              videosgallery: {
                videodisc,
                tag: Date.now(),
                videos: path,
                createdAt: Date(),
              },
            },
          },
          { upsert: true, returnNewDocument: true }
        );

        const bp = await BattlePass.findOne({user: _id})
        await bpTracker("Upload a video",bp._id)

        res.status(200).json(prof);
      } else if (model === "TEAM") {
        var team = await Team.findOneAndUpdate(
          { _id: id },
          {
            $push: {
              videosgallery: {
                videodisc,
                tag: Date.now(),
                videos: path,
                createdAt: Date(),
              },
            },
          },
          { upsert: true, returnNewDocument: true }
        );
        res.status(200).json(team);
      } else if (model === "GAME") {
        var game = await Game.findOneAndUpdate(
          { _id: id },
          {
            $push: {
              videosgallery: {
                videodisc,
                tag: Date.now(),
                videos: path,
                createdAt: Date(),
              },
            },
          },
          { upsert: true, returnNewDocument: true }
        );
        res.status(200).json(game);
      } else if (model === "TOURNAMENT") {
        var tour = await Tournament.findOneAndUpdate(
          { _id: id },
          {
            $push: {
              videosgallery: {
                videodisc,
                tag: Date.now(),
                videos: path,
                createdAt: Date(),
              },
            },
          },
          { upsert: true, returnNewDocument: true }
        );
        res.status(200).json(tour);
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Server error" });
    }
  }
);

// @route:  PUT /api/product images
// @desc:   Update user settings
router.put(
  "/products/uploadImages",
  imagesUpload.array("images", 5),
  async (req, res) => {
    try {
      var path = [];

      for (let i = 0; i < req.files.length; i++) {
        path.push({
          public_id: process.env.CLOUDINARY_CLOUD_NAME,
          url: req.files[i].path,
        });
      }
      res.status(200).json(path);
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Server error" });
    }
  }
);

// @route:  POST /api/uploads
// @desc:   Update user settings
router.post(
  "/uploadfile",
  auth,
  uploadLocal.single("file"),
  async (req, res) => {
    try {
      const newFile = await File.create({
        name: req.file.originalname,
        path: req.file.path,
      });
      res.status(200).json({ msg: "File uploaded successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Server error" });
    }
  }
);

module.exports = router;
