const express = require("express");
const router = express.Router();
var axios = require('axios');

const User = require("../models/User.model");

// @route   GET api/arenas
// @desc    get all the arenas
router.post("/", async (req, res) => {


let newUsers = [];
let failedUsers = [];

const users = await User.find().limit(Number(10))
;

users.map(user => {
	response = createChatUser(user);
	//console.log(response)
});

console.log('New users', newUsers);
console.log('Failed users', failedUsers);


});


function createChatUser(user){

      var data = {
      "username": user.email,
      "secret": user.email,
      "email": user.email,
      "first_name": user.firstName,
      "last_name": user.lastName
    };

    var config = {
      method: 'post',
      url: process.env.CHATENGINE_IO_API_URL,
      headers: {
        'PRIVATE-KEY': '7d91694c-21f0-4edd-a8e6-baacd84cfb09',
         'Content-Type': 'application/json'
      },
      data : data
    };

    axios(config)
    .then(function (response) {
      return response;
    })
    .catch(function (error) {
      console.log(error);
    });

}


module.exports = router;
