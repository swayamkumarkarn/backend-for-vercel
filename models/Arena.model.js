const mongoose = require('mongoose');

const arenaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
    },
    description: {
      type: String,
    },
    logoUrl: {
      type: String,
      default: '/assets/media/discover/lxg.png',
    },
    address: {
      type: String,
    },    
    location: {
      type: String,
    },    
    attributes: {
      city: {
      type: String,
    }, 
    platform: {
      type: String,
    }, 
    price: {
      type: Number,
    }, 
    capacity: {
      type: Number,
    }, 
    sitting: {
      type: Number,
    }, 
    bandwidth: {
      type: Number,
    }, 
    rating: {
      type: Number,
    }, 
    offers: {
      type: String,
    }, 

    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Arena', arenaSchema);
