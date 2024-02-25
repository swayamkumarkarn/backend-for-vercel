const express = require('express');
const router = express.Router();

const RigsData = require('../models/RigsData.model');

router.get('/', async (req, res) => {
    try {
        const rigsData = await RigsData.find() 
    
        if (!rigsData) {
          return res.status(404).json({ msg: 'No rigs data found' });
        }
         
        res.status(200).json(rigsData);
      } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
      }
})

// router.post('/create', async (req,res) => {
//     const {value} = req.body
//     const rigObj = {
//         keyboards : {
//             name: value
//         }
//     }
//     const rigData = await new RigsData(rigObj).save()
//     res.status(201).json(rigData)
// })

module.exports = router;