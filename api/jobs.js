const express = require("express");
const router = express.Router();
const { getName } = require('country-list')

const Job = require("../models/Job.model")
const auth = require('../middleware/auth.middleware');

router.post('/create', async (req, res) => {
    const { name, role, owner, location, startDate, endDate, salary, experience, description, currency, category} = req.body
    
    try {
        const newObj = {
          title: name,
          experience,
          job_owner: owner,
          startDate,
          endDate,
          location:{
            name: getName(location),
            iso: location
          },
          job_type: role,
          salary,
          description,
          currency,
          category
        }
        const job = await new Job(newObj).save();
        res.status(200).json(job);
      } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Server error" });
      }
})

router.get('/:jobId', async(req, res)=>{
  try {
    const job = await Job.findById(req.params.jobId)
    res.status(200).json(job)
  } catch (err) {
    res.status(500).json({msg: "Server Error"})
  }
})

router.post("/search", async (req, res) => {
  const { search, filters } = req.body;

  if (search) {
    var mssg = "";

    var sname = new RegExp([search].join(""), "i");
    let teamList = []

    const jobs = await Job.find({ title: { $regex: sname } }).populate({
      path: 'job_owner',
      model: 'Team',
      select: { '_id': 1,'name':1,"imgUrl":1},
    })
      
    res.status(200).json(jobs);
  }
});

module.exports = router;