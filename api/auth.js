const path = require('path');
const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const handlebars = require('handlebars');
const router = express.Router();

const User = require('../models/User.model');
const Profile = require('../models/Profile.model')
const Team = require('../models/Team.model');
const BattlePass = require("../models/BattlePass.model")

const auth = require('../middleware/auth.middleware');
const upload = require('../middleware/imageUpload.middleware');
const { bpTracker } = require("../server-utils/battlepassTracker")

const sendEmail = require('../server-utils/sendEmail');
const readHTML = require('../server-utils/readHTML');

// @route:  GET /api/auth
// @desc:   Get logged in user's info
router.get('/', auth, async (req, res) => {
  console.log("Something");
  try {

    let user = await User.findById(req.userId)
    if (!user) {
      return res.status(400).json({
        msg: 'Please verify your email and complete onboarding first',
      });
    }

    let profile = await Profile.findOne({user: req.userId}).populate({
      path:"playergames.game",
      model:"Game",
      select: {"_id": 1, "name": 1, "imgUrl": 1}
    }).populate({
      path: "playergames.player",
      model: "Player",
    })
    .populate('current_team')
    .populate({
      path:"request.teamId",
      select:{"_id":1, "name":1,"imgUrl":1}
    }).populate({
      path: "blockList.user",
      model: "User",
      select: {"_id": 1, "name": 1, "username": 1, "profilePicUrl": 1}
    })

    console.log('**************************');

    let teams =[];

    let pg = profile?.playergames;
    let playerList = [];
    for (let i = 0; i < pg?.length; i++) {
      var plyr = pg[i]?.player; 
      if (plyr) {
        playerList.push(plyr._id);
      }
    }

    console.log(playerList);
    if (playerList.length > 0) {
      teams = await Team.find({ "players.playerId": { $in: playerList } }).select({"_id": 1,
      "name":1, "imgUrl": 1, "coverPhoto": 1
      }).populate({
        path:"games.gameId"
      }).populate({
        path:"players.playerId"
      });
    }  

    console.log(' In Auth / teams length : ' + teams?.length + ' playerlist :' + playerList);

    res.status(200).json({ user , profile, teams});
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route:  GET /api/auth
// @desc:   Get logged in user's info
router.get('/dbuserinfo/:email', async (req, res) => {
  try {
    
    var email = req.params.email;
    const user = await User.findOne({ email: email});

    if (!user) {
      return res.status(400).json({
        msg: 'Please verify your email and complete onboarding first',
      });
    }
    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});


// @route:  POST /api/auth
// @desc:   Login user
router.post('/', async (req, res) => {

  const { email, password } = req.body;

  if (password.length < 6) {
    return res.status(400).json({ msg: 'Password must be atleast 8 characters long' });
  }

  try {
    // Check if user is registered
    const user = await User.findOne({
      $or: [
        { email: email  },
        { phone_number : email },
        {username: email}
      ] }).select('+password');
    if (!user) {
      return res.status(400).json({ msg: 'This user does not exist.' });
    }

    if (!user.isVerified) {
      return res.status(400).json({ msg: 'Please verify your email before trying to log in' });
    }

    // Check if password is correct
    const isCorrectPassword = await bcrypt.compare(password, user.password);
    if (!isCorrectPassword) return res.status(400).json({ msg: 'Invalid credentials' });
    
    const access_token = createAccessToken({id: user._id})
    const refresh_token = createRefreshToken({id: user._id})
    const token = access_token;
                
        res.json({
            msg: "Login Success!",
            token,
            refresh_token,
            access_token,
            user: {
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                root: user.root
            }
        });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route:  PUT /api/auth
// @desc:   Update user settings
router.post('/profilePic', auth, upload.single("profilePic"), async (req, res) => {

  try {
    const { name, username } = req.body;
    const updatedUser = {};
    if (req.file && req.file.path) updatedUser.profilePicUrl = req.file.path;

    const user = await User.findByIdAndUpdate(req.userId, updatedUser);
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});


// @route:  PUT /api/auth
// @desc:   Update user cover settings
router.put('/coverPic', auth, upload.single('coverPic'), async (req, res) => {

  try {
    const { name, username } = req.body;
    const updatedUser = {};

    if (req.file && req.file.path) updatedUser.coverPicUrl = req.file.path;

    const user = await User.findByIdAndUpdate(req.userId, updatedUser, { new: true });
    const bp = await BattlePass.findOne({user: req.userId})
    
    await bpTracker("Upload your profile and cover photo",bp._id)

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route:  PUT /api/auth/password
// @desc:   Update password
router.put('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.userId).select('+password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Check if current password matches
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ msg: 'Incorrect password' });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ msg: 'Password must be atleast 8 characters long' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ msg: 'Password updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route:  POST /api/auth/forgot-password
// @desc:   Send password reset email
router.post('/forgot-password', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000;

//    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;

     const resetUrl = process.env.FE_NEXT_API_URL + `/resetpassword/${resetToken}`;

    const htmlTemplate = await readHTML(
      path.join(__dirname, '..', 'emails', 'forgot-password.html')
    );
    const handlebarsTemplate = handlebars.compile(htmlTemplate);
    const replacements = { resetUrl };
    const html = handlebarsTemplate(replacements);

    try {
      await sendEmail({
        to: user.email,
        subject: 'Multiplayr - Reset Password',
        html,
      });
    } catch (err) {
      console.log(err);
      user.resetPasswordToken = undefined;
      await user.save();
      return res.status(500).json({ msg: 'Error sending verification email' });
    }

    await user.save();
    res.status(200).json({ msg: 'Email sent' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route:  PUT /api/auth/reset-password/:token
// @desc:   Reset password
router.put('/reset-password/:token', async (req, res) => {

  try {
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid or expired token' });
    }

    // Set new password
    user.password = await bcrypt.hash(req.body.password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ msg: 'Password reset complete' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

const createAccessToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET)
}

const createRefreshToken = (payload) => {
    return jwt.sign(payload, process.env.NEXT_PUBLIC_REFRESH_TOKEN_SECRET)
}

function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}

module.exports = router;
