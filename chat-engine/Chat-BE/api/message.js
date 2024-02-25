const express = require('express');
const router = express.Router();

const Chat = require('../models/Chat.model');
const User = require('../models/User.model');
const Message = require('../models/Message.model')
const auth = require('../middleware/auth.middleware');

router.get("/:chatId",auth, async(req,res) => {
    const { chatId } = req.params;

    const getMessage = await Message.find({ chat: chatId })
      .populate("sender", "username avatar email _id")
      .populate("chat");
  
    res.status(200).json(getMessage);
})

router.post("/",auth, async(req,res) => {
    const { message, chatId } = req.body;

  if (!message || !chatId) {
    return BadRequestError("Please Provide All Fields To send Message");
  }

  let newMessage = {
    sender: req.userId,
    message: message,
    chat: chatId,
  };

  let m = await Message.create(newMessage);

  m = await m.populate("sender", "username avatar");
  m = await m.populate("chat");
  m = await User.populate(m, {
    path: "chat.users",
    select: "username avatar email _id",
  });

  await Chat.findByIdAndUpdate(chatId, { latestMessage: m }, { new: true });
  console.log("MSG REC")
  res.status(200).json(m);
})

module.exports = router