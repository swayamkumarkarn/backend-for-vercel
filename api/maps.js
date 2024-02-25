const express = require('express')
const router = express.Router()

const Map = require('../models/Map.model')

router.get('/', async(req, res)=>{
  try {
    const maps = await Map.find()
    res.status(200).json(maps)
  } catch (err) {
    console.log(err)
    res.status(500)
  }
})

router.get('/:gameId', async(req, res)=>{
  try {
    let maps = []
    if(req.params.gameId !== 'undefined'){
      maps = await Map.find({"game": Number(req.params.gameId)})
      return res.status(200).json(maps)
    }
    res.status(200).json(maps)
  } catch (err) {
    console.log(err)
    res.status(500).json({msg: "Server Error"})
  }
})

module.exports = router