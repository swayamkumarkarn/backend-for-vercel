const express = require('express')
const router = express.Router()

const Brand = require('../models/Brand.model')
const imagesUpload = require('../middleware/imageUpload.middleware');
const auth = require('../middleware/auth.middleware')
const UserPersona = require('../models/UserPersona.model')
const Sponsor = require('../models/Sponsor.model')
const Post = require('../models/Post.model')
const Organiser = require('../models/Organizer.model')

router.get('/:brandId', async(req, res) => {
  try {
    const brand = await Brand.findById(req.params.brandId)
    const brandPosts = await Post.find({'post_type': 'brand', 'username': brand.name})
    .populate({
      path: "shares.user",
      model: "User",
      select: {"_id": 1, "name": 1, "username": 1, "profilePicUrl": 1}
    })
    .populate({
      path: "user",
      model: "User",
      select: {"_id": 1, "name": 1, "username": 1, "profilePicUrl": 1}
    })
      res.status(200).json({brand, brandPosts})
  } catch (err) {
    res.status(500).json({msg:"server error"})
  }
})

// @route   POST api/brand/create
// @desc    post new brands
router.post('/create', auth, imagesUpload.single('logoUrl'), async(req, res) => {
  try {
    const { isClaim } = req.body
    
    const brand = new Brand({
      user: isClaim === "true" ? req.userId : null,
      name : req.body.name,
      description : req.body.description,
        social: {
          facebook : req.body.facebook,
          instagram : req.body.instagram,
          twitch : req.body.twitch,
          youtube : req.body.youtube,
          discord : req.body.discord,
          website : req.body.website
        },
        isClaimed:isClaim,
      })
      
      if(req.file) brand.logoUrl = req.file.path
      
      await brand.save()
      
      const sponsor = await new Sponsor({
        name : req.body.name,
        description : req.body.description,
        user: isClaim === "true" ? req.userId : null,
        brand: brand._id
      })
      if(req.file) sponsor.imgUrl = req.file.path
      
      await sponsor.save()

      const organiser = await new Organiser({
        name : req.body.name,
        description : req.body.description,
        user: isClaim === "true" ? req.userId : null,
        brand: brand._id
      })
      if(req.file) organiser.imgUrl = req.file.path
      
      await organiser.save()

      if(isClaim === "true"){
        const userpersona =await UserPersona.findOne({user:req.userId})
        await userpersona.personas.push({brandId: brand._id,type:'brand'})
        await  userpersona.save()
      }
      
      res.status(201).json({_id:brand._id})
    } catch (err) {
      res.status(500).json({msg:"Server error"})
    }
})

router.put("/follow/:brandId", auth, async (req, res) => {
  try {
    let brand = await Brand.findById(req.params.brandId);
    if (!brand) {
      return res.status(404).json({ msg: "Brand not found" });
    }

    const isFollowing =
      brand.followers.filter(
        (follower) => follower.user.toString() === req.userId
      ).length > 0;

    if (isFollowing) {
      // Unlike the brand if already following
      const index = brand.followers.findIndex(
        (follower) => follower.user.toString() === req.userId
      );
      brand.followers.splice(index, 1);
      brand = await brand.save();

      res.status(200).json(brand);
    } else {
      // Follow the game
      brand.followers.unshift({ user: req.userId });
      brand = await brand.save();

      res.status(200).json(brand);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error at follow brand" });
  }
});

// @route   GET /api/brand/:brandId/followers
// @desc    Get brands's followers info
router.get('/:brandId/followers', async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.brandId,).populate({
      path: "followers.user",
      model: "User",
      select: {"_id":1, "name": 1, "username": 1}
    }).select({"followers": 1})
    if (!brand) {
      return res.status(404).json({ msg: 'Brand not found' });
    }

    res.status(200).json(brand);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router