
const express = require('express');
const router = express.Router();

const User = require('../models/User.model');
var path = require('path');
var async = require('async');
const auth = require('../middleware/auth.middleware');


// @route:  GET /api/friendrequests
// @desc:   Retreive user's friends
router.get('/list/:userId', async (req, res) => {
  try {
	var usrId = req.params.userId;

    const user = await User.findOne({ _id: usrId });

    const frdArray =
      user.friendsList.length > 0
        ? user.friendsList.map(friend => friend.friendId)
        : [];

    const users = await User.find({ _id : { $in : frdArray } } );

    const frdList =
      users.length > 0
        ? users.map((friend) => ({
            friendId: friend._id,
            friendUsername: friend.username,
            profilePicUrl: friend.profilePicUrl,
            friendName: friend.name
          }))
        : [];

    res.status(200).json(frdList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});


router.get('/friend/search', function(req, res){
	var sent =[];
	var friends= [];
	var received= [];
	received= req.user.request;
	sent= req.user.sentRequest;
	friends= req.user.friendsList;
	


	User.find({username: {$ne: req.user.username}}, function(err, result){
		if (err) throw err;
		
		res.render('search',{
			result: result,
			sent: sent,
			friends: friends,
			received: received
		});
	});
});


router.post('/search', async (req, res) => {


	  var searchfriend = req.body.searchfriend;
	  var currentUsr = req.body.user;


	if(searchfriend) {
	 	var mssg= '';
		if (searchfriend == 'RL: Add check to avoid searching logged user by his own name') {
			searchfriend= null;
		}

		  var sname = new RegExp([searchfriend].join(""), "i");


		 User.findOne({name: { $regex: sname }  }, function(err, result) {
			 if (err) return res.status(404).json({ mssg: 'User not found' });

			    res.status(200).json(result);
	   	});	
	}

 	async.parallel([
		function(callback) {
			if(req.body.receiverName) {
					User.updateOne({
						'email': req.body.receiverEmail,
						'request.userId': {$ne: currentUsr._id},
						'friendsList.friendId': {$ne: currentUsr._id}
					}, 
					{
						$push: {request: {
						userId: currentUsr._id,
						username: currentUsr.username
						}},
						$inc: {totalRequest: 1}
						},(err, count) =>  {
							console.log(err);
							callback(err, count);
						})
			}
		},
		function(callback) {
			if(req.body.receiverName){
					User.updateOne({
						'email': currentUsr.email,
						'sentRequest.username': {$ne: req.body.receiverName}
					},
					{
						$push: {sentRequest: {
						username: req.body.receiverName
						}}
						},(err, count) => {
						callback(err, count);
						})
			}
		}],
	(err, results)=>{
			    res.status(200).json({
			      results
			    });	
	});

			async.parallel([
				// this function is updated for the receiver of the friend request when it is accepted
				function(callback) {
					if (req.body.senderId) {
						console.log('updateing tin thee ere')
						console.log(currentUsr._id)
						User.updateOne({
							'_id': currentUsr._id,
							'friendsList.friendId': {$ne:req.body.senderId}
						},{
							$push: {friendsList: {
								friendId: req.body.senderId,
								friendName: req.body.senderName
							}},
							$pull: {request: {
								userId: req.body.senderId,
								username: req.body.senderName
							}},
							$inc: {totalRequest: -1}
						}, (err, count)=> {
							callback(err, count);
						});
					}
				},
				// this function is updated for the sender of the friend request when it is accepted by the receiver	
				function(callback) {
					if (req.body.senderId) {
						User.updateOne({
							'_id': req.body.senderId,
							'friendsList.friendId': {$ne:currentUsr._id}
						},{
							$push: {friendsList: {
								friendId: currentUsr._id,
								friendName: currentUsr.username
							}},
							$pull: {sentRequest: {
								username: currentUsr.username
							}}
						}, (err, count)=> {
							callback(err, count);
						});
					}
				},
				function(callback) {
					if (req.body.user_Id) {
						User.updateOne({
							'_id': req.user._id,
							'request.userId': {$eq: req.body.user_Id}
						},{
							$pull: {request: {
								userId: req.body.user_Id
							}},
							$inc: {totalRequest: -1}
						}, (err, count)=> {
							callback(err, count);
						});
					}
				},
				function(callback) {
					if (req.body.user_Id) {
						User.updateOne({
							'_id': req.body.user_Id,
							'sentRequest.username': {$eq: req.user.username}
						},{
							$pull: {sentRequest: {
								username: req.user.username
							}}
						}, (err, count)=> {
							callback(err, count);
						});
					}
				} 		
			],(err, results)=> {
				res.status(200).json({
			      results
			    });	
			});
});


router.get('/search/:searchText', async (req, res) => {


	var searchfriend = req.params.searchText;
	if(searchfriend) {
	 	var mssg= '';
		if (searchfriend == 'RL: Add check to avoid searching logged user by his own name') {
			searchfriend= null;
		}

		  var sname = new RegExp([searchfriend].join(""), "i");


		 User.find({name: { $regex: sname }  }, function(err, result) {
			 if (err) return res.status(404).json({ mssg: 'User not found' });

			    res.status(200).json(result);
	   	});	
	}
	 
});

module.exports = router;