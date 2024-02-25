const express = require('express')
const router = express.Router()

const Company = require('../models/Company.model')
const imagesUpload = require('../middleware/imageUpload.middleware');
const auth = require('../middleware/auth.middleware')
const UserPersona = require('../models/UserPersona.model')

// @route   GET api/company   
// @desc    get all companies
router.get('/', async(req, res) => {
  try {
    const company = await Company.find()
      res.status(200).json(company)
  } catch (err) {
    res.status(500).json({msg:"server error"})
  }
})

// @route   POST api/company/create
// @desc    create a company
router.post('/create', auth, imagesUpload.single('logoUrl'), async(req, res) => {
    try {
      const userpersona =await UserPersona.findOne({user:req.userId})

      const company = new Company({
        user:req.userId,
        'name': req.body.name,
        'description':req.body.description,
        'location':req.body.location,
        'founded':req.body.founded
      })

      if(req.file) company.logoUrl = req.file.path

      await company.save()

      await userpersona.personas.push({companyId: company._id,type:'company'})
      await  userpersona.save()

      res.status(201).json(company)
    } catch (err) {
      res.status(500).json({msg:"Server error"})
    }
})

module.exports = router