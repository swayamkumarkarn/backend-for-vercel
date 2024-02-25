
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    external_payment_id: {
        type: String
    },
    public_key: {
        type: String,
        required: true,
    },
    email: {
        type: String
    },    
    currency: {
        type: String
    },    
    status: {
        type: String
    }, 
    payment_mode: {
        type: String
    },     
    amount: {
        type: Number,
        required: true,
    },
    date: {
      type: Date,
      default: Date.now()
      },
    trans_details : { type: Object}     
  }
);

module.exports = mongoose.model('Transactions', transactionSchema);
