const mongoose = require('mongoose');

const organizerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    description: {
      type: String,
    },
    imgUrl: {
      type: String,
      default: '/assets/media/default/organizer.jpg',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
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

module.exports = mongoose.model('Organizer', organizerSchema);
