const express = require('express');
const router = express.Router();

const Filter = require('../models/Filter.model');

router.get('/:filterType', async (req, res) => {
  try {


    const filter = await Filter.findOne({
      filterType: req.params.filterType,
    });
    if (!filter) {
      return res.status(404).json({ msg: 'No Filters are set' });
    }

    res.status(200).json({
      filter
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});


module.exports = router;
