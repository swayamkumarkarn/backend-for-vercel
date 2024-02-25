const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const Transaction = require("../models/Transactions.model");
const User = require("../models/User.model")
const BattlePass = require("../models/BattlePass.model")
const Razorpay = require("razorpay")

router.get("/:email", async (req, res) => {
  console.log(req.params.email);
  try {
    let transaction = await Transaction.find({ email: req.params.email });
    if (!transaction) {
      return res.status(404).json({ msg: "No Transcations found" });
    }
    res.status(200).json(transaction);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.post('/addTransaction', async (req, res) => {

  const trans = {
      public_key: req.body.public_key,
      date: Date.now(),
      amount: req.body.amount,
      external_payment_id: req.body.external_payment_id,
      email: req.body.email,
      currency:req.body.currency,
      status:req.body.status,
      payment_mode:req.body.payment_mode,
      trans_details:req.body.trans_details
  };
  await User.updateOne(
    {
      email: req.body.email,
    },
    {
      isPremiumPass: true
    }
  );

  Transaction.create(trans, (err, result) => {
      if (err) {
          console.log(err);
          res.status(400).json({ message: "MongoDB error" });
      } else {
          res.status(200).json({ message: "Sucess" });
      }
  });

});

// create subscriptions

router.post('/subscriptions/create', async (req, res) => {
  try{

  const { id, title, price } = req.body;

var instance = new Razorpay(
  { 
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
    key_secret: process.env.NEXT_PUBLIC_RAZORPAY_KEY_SECRET
  }
);

var subrespId = 'NOTSET';
var planId = "NA";
var days = 30;

  switch (Number(id)) {
      case 1:
          planId=process.env.REACT_APP_RAZOR_SUBSCRIPTION_QUARTERLY;
          break;
      case 2:
          planId=process.env.REACT_APP_RAZOR_SUBSCRIPTION_YEARLY;
          break;
      default:
          planId=process.env.REACT_APP_RAZOR_SUBSCRIPTION_1;
  }

instance.subscriptions.create({

   plan_id:planId, 
   total_count:1, quantity: 1, 
   start_at: Math.floor(new Date().getTime() / 1000) + (days * 24*60*60),
   customer_notify:1, 
   addons:[ 
      { 
         item:{ 
            name:"Multiplayer-Subscription charges - " + title, 
            amount: Number(price) * 100, 
            currency:"INR" 
         } 
      } 
   ],

}).then(subresponse => {
    // handle success
    subrespId = subresponse.id;
    console.log(subrespId)
    res.status(200).json({ razorpay_subscription_id: subrespId });
  })
  .catch(error => {
    // handle error
    console.log(error);
    res.status(400).json({ message: "Create subscriptions Error" });
  });

  }catch(err){
    console.log(err);
  }

});

// create a transcation of subscription for user
router.post('/payment/create', async (req, res) => {

  const trans = {
      public_key: req.body.public_key,
      date: Date.now(),
      amount: req.body.amount,
      external_payment_id: req.body.external_payment_id,
      email: req.body.email,
      currency:req.body.currency,
      status:req.body.status,
      payment_mode:req.body.payment_mode,
      trans_details:req.body.trans_details
  };
  const user = await User.find({email: req.body.email})
  await BattlePass.updateOne(
    {
      user: user[0]._id
    },
    {
      isBPUser: true
    }
  );

  Transaction.create(trans, (err, result) => {
      if (err) {
          console.log(err);
          res.status(400).json({ message: "MongoDB error" });
      } else {
          res.status(200).json({ message: "Sucess" });
      }
  });

});

module.exports = router;
