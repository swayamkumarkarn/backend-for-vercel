const express = require('express');
const router = express.Router();

const User = require('../models/User.model');
const Profile = require('../models/Profile.model');
const Badge = require('../models/Badge.model')

const auth = require('../middleware/auth.middleware');
const { newBadgeNotification } = require('../server-utils/notifications');

router.get('/:userId', auth, async(req, res)=>{
  try{
    const profile = await Profile.findOne({ user: req.params.userId })

    const badgeArray = profile.badges.length > 0 ? profile.badges.map(bdg => bdg.badgeId) : []

    const badge = await Badge.find({_id : {$in : badgeArray}}).populate('badge')

    res.status(200).json([badge, profile])
  }catch(err){
    res.status(500).json({msg: "heavy error on badges [GET]"})
  }
})

// @route:  POST /api/badges/:userId
// @desc:   Add a badge to user's profile
router.post('/:userId', auth, async (req, res) => {
  const { title, image, description } = req.body;

  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(401).json({ msg: 'Unauthorized' });
    }

    if (user.role !== 'root') {
      return res.status(401).json({ msg: 'Unauthorized' });
    }

    let profile = await Profile.findOne({ user: req.params.userId });
    if (!profile) {
      return res.status(404).json({ msg: 'Profile not found' });
    }

    profile.badges.push({ title, image, description });
    profile = await profile.save();

    await newBadgeNotification(req.params.userId, title);
    
    res.status(200).json(profile.badges);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
