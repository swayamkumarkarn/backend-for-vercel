const path = require('path');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const handlebars = require('handlebars');
const router = express.Router();

const sendEmail = require('../server-utils/sendEmail');
const readHTML = require('../server-utils/readHTML');

const User = require('../models/User.model');
const Profile = require('../models/Profile.model');
const Follower = require('../models/Follower.model');
const Post = require('../models/Post.model');
const Notification = require('../models/Notification.model');

const Player = require('../models/Player.model')
const imageUpload = require('../middleware/imageUpload.middleware');
const Address = require("../models/Address.model")
const UserPersona = require("../models/UserPersona.model")

const usernameRegex = /^(?!.*\.\.)(?!.*\.$)[^\W][\w.]{0,29}$/;


// @route:  GET /api/signup
// @desc:   Check if the username is taken or not
router.get('/:username', async (req, res) => {
  const { username } = req.params;

  try {
    //Invalid if username is less than 1 char
    if (username.length < 1) {
      return res.status(400).json({ msg: 'Invalid username' });
    }

    // Check if username matches regex conditions
    if (!usernameRegex.test(username)) {
      return res.status(400).json({ msg: 'Invalid username' });
    }

    // Check if username is taken
    const user = await User.findOne({ username: username.toLowerCase() });
    if (user) {
      return res.status(400).json({ msg: 'Username is already taken' });
    }

    res.status(200).json({ msg: 'Username available' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route:  POST /api/signup
// @desc:   Register a new user
router.post('/', imageUpload.single('coverPic'), async (req, res) => {
  const { name, username, email, password, phone_number,
    userign, gameId , avatarImage, country, coverPic, gender } = req.body;

  const { bio, techStack, social } = req.body;
  
  if (password.length < 6) {
    return res
      .status(400)
      .json({ msg: 'Password must be atleast 8 characters long' });
  }

  try {
    // Check if user is already registered
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      return res.status(400).json({ msg: 'You are already registered' });
    }

    // Check if username is already taken
    user = await User.findOne({ username: username.toLowerCase() });
    if (user) {
      return res.status(400).json({ msg: 'Username is already taken' });
    }

    user = new User({
      name,
      email: email.toLowerCase(),
      username: username,
      password,
      phone_number,
      country
    });

    // Hash the password
    user.password = await bcrypt.hash(password, 10);

    // Send verification email
    let vt = crypto.randomBytes(3).toString('hex')
    const verificationToken = parseInt(vt.toString('hex'),16).toString().substr(0,6)

    user.verificationToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

   // const verificationUrl = `${req.protocol}://${req.get('host')}/onboarding/${verificationToken}`;
     const verificationUrl = process.env.FE_NEXT_API_URL + `/confirm/${verificationToken}`;

    const htmlTemplate = await readHTML(
      path.join(__dirname, '..', 'emails', 'verify-email.html')
    );
    const handlebarsTemplate = handlebars.compile(htmlTemplate);
    const replacements = { verificationToken };
    const html = handlebarsTemplate(replacements);

    try {
        await sendEmail({
          to: user.email,
          subject: 'Multiplayr - Account Verification',
          html,
        });
    } catch (err) {
      console.log(err);
      user.verificationToken = undefined;
      await user.save();
      return res.status(500).json({ msg: 'Error sending verification email' });
    }

    if (req.file) {
      user.profilePicUrl = req.file?.path
    }else{
      user.profilePicUrl = avatarImage
    }

    await user.save();

    // Initailise Address (Check if we need this or we can remove)
    // let addressFields = {}
    // const address = await new Address(addressFields).save()
    
    // Create profile
    let profileFields = {};
    profileFields.user = user._id;
    // profileFields.address = address._id
    profileFields.bio = bio;
    profileFields.techStack = []; //JSON.parse(techStack);
    profileFields.badges = [];

    profileFields.social = {};
    profileFields.gender = gender

    if(userign !== ''){
      let pgs = [];
      pgs.push({game : gameId, userign:userign});
      profileFields.playergames = pgs;
    }

    await new Profile(profileFields).save();

    // Sign JWT and return token
    jwt.sign({ userId: user._id }, process.env.JWT_SECRET, (err, token) => {
      if (err) throw err;
      res.status(200).json({
        msg: 'Please check your email to verify your registration',
        token,
        verificationToken
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});



module.exports = router;
