const express = require('express');
const router = express.Router();

const Chat = require('../models/Chat.model');
const User = require('../models/User.model');
const auth = require('../middleware/auth.middleware');
var axios = require('axios');

// @route:  GET /api/chats
// @desc:   Retreive user's chats
router.get('/', auth, async (req, res) => {
  try {
    const user = await Chat.findOne({ user: req.userId }).populate(
      'chats.messagesWith'
    );

    if (!user) {
      return res.status(404).json({ msg: 'No Chats not found' });
    }


    const chatsToSend =
      user.chats.length > 0
        ? user.chats.map((chat) => ({
            messagesWith: chat.messagesWith._id,
            name: chat.messagesWith.name,
            profilePicUrl: chat.messagesWith.profilePicUrl,
            lastMessage: chat.messages[chat.messages.length - 1].message,
            date: chat.messages[chat.messages.length - 1].date,
          }))
        : [];

    res.status(200).json(chatsToSend);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route:  GET /api/chats/user/:userId
// @desc:   Retrieve user info
router.get('/user/:userId', auth, async (req, res) => {
  try {

    if (req.params.userId == undefined) {
        const user = await User.findById(req.params.userId);
        if (!user) {
          return res.status(200).json({ msg: 'User not found' });
        }

        res
          .status(200)
          .json({ name: user.name, profilePicUrl: user.profilePicUrl });
        } else {
            return res.status(404).json({ msg: 'User not found' });
        }
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});


// New ChatEngine IO API. Please do not remove

// @route:  GET /api/chats/user/:userId
// @desc:   Retrieve user info
router.get('/user/chats/latestactivity/:username', async (req, res) => {
        try {


      var username = req.params.username 
      console.log(username);   
      var config = {
        method: 'get',
        url: 'https://api.chatengine.io/chats/latest/4/',
        headers: { 
          'Project-ID': '36d1075b-c7da-4bd1-9cf0-244b339ab0d0', 
          'User-Name': username, 
          'User-Secret': username
        }
      };

      axios(config)
      .then(function (response) {
        var data = response.data;
        res.status(200).json({ data : data });
      })
      .catch(function (error) {
        res.status(500).json(error);
      });

  } catch (error) {
    //console.error(error);
    //res.status(500).json({ msg: 'Server error' });
  }
});



module.exports = router;
