const mongoose = require('mongoose');

const sponsorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    description: {
      type: String,
    },
    imgUrl: {
      type: String,
      default: '/assets/media/default/sponsor.jpg',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: ''
    },
    brand:{
      type: mongoose.Schema.Types.ObjectId,
      ref:"Brand"
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Sponsor', sponsorSchema);
