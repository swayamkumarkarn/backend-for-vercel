const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const router = express.Router();
var axios = require('axios');

const User = require('../models/User.model');
const Profile = require('../models/Profile.model');
const Follower = require('../models/Follower.model');
const Notification = require('../models/Notification.model');
const Chat = require('../models/Chat.model');
const Player = require('../models/Player.model')
const imageUpload = require('../middleware/imageUpload.middleware');
const Address = require("../models/Address.model")
const UserPersona = require("../models/UserPersona.model")
const BattlePass = require("../models/BattlePass.model")
const { bpTracker } = require("../server-utils/battlepassTracker")


// @route:  POST /api/onboarding/:token
// @desc:   Verify email and complete onboarding
router.post('/:token', imageUpload.single('profilePic'), async (req, res) => {
  const { token } = req.params;
  const { bio, techStack, social } = req.body;
  //const { github, linkedin, website, twitter, instagram, youtube } = JSON.parse(social);

  const verificationToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  try {
    // Find user with specific verification token
    const user = await User.findOne({ verificationToken });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid or expired token' });
    }

    // Set user verified to true
    user.isVerified = true;
    user.verificationToken = undefined;
    if (req.file) user.profilePicUrl = req.file.path;
    await user.save();

    // Initailise player
    // let playerFields = {}
    // var val = Math.floor(10000000 + Math.random() * 90000000);
    // playerFields.user = user._id
    // playerFields._id = val

    // const player = await new Player(playerFields).save()

    const prof = await Profile.findOne({user: user._id});
    if(!prof) {
      return res.status(400).json({ msg: 'Profile Sync up error. Please retry profile sync.' });
    }

    let pg = prof.playergames;

    for(let i=0;i<pg.length;i++) {
      var gameId = pg[i].game;
      var userign = pg[i].userign;

        // Initailise player
        let playerFields = {}
        playerFields.user = user._id;
        var val = Math.floor(10000000 + Math.random() * 90000000);    
        playerFields._id = val;
        var playerId = val;
        const respon = await getPlayerInfo(gameId, userign);
        playerFields.game = gameId

            if (respon) {

                console.log('Got the player info ****************')
                console.log(respon);
                console.log('Check if we really got the player info ****************')
                if(gameId === 20){
                  playerFields.apidata = respon?.stat.data?.attributes
                  playerFields.name = respon.data[0]?.attributes.name
                }else if(gameId === 26){
                  playerFields.apidata = respon.data
                  playerFields.name = respon.name
                } else if(gameId === 32){
                  userign = respon.data.name
                  playerFields.apidata = respon.data
                  playerFields.name = respon.data.name
                } else if(gameId === 3){
                  userign = respon.data.data.platformInfo?.platformUserHandle
                  playerFields.apidata = respon.data
                  playerFields.name = respon.data.data.platformInfo?.platformUserHandle
                  playerFields.imgUrl = respon.data?.data.platformInfo?.avatarUrl;
                } else {
                  playerFields.apidata = respon.data;
                  playerFields.imgUrl = respon.data?.data.platformInfo?.avatarUrl;
                }

                //Check if the player user is already in our DB
                if(respon.data) {
                  let pname = 'undefined'
                  if(gameId === 4){
                    pname = respon.data.profile.name;
                    console.log('Got the player NAMMMMMMMM ****************' + pname);
                  }else if(gameId === 1 && gameId === 25) {
                    pname = respon.data.data.platformInfo.platformUserIdentifier;
                  }else if(gameId === 3){
                    pname = respon.data.data.platformInfo.platformUserHandle;
                  }else if(gameId === 20){
                    pname = respon.data[0]?.attributes?.name
                  }else if(gameId === 26){
                    pname = respon.name
                  }else if(gameId === 32){
                    pname = respon.data.name
                  }

                 const pexist = await Player.findOneAndUpdate(
                 { name: pname},{$set:{
                  apidata: respon.data,
                  user: user._id,
                 }},
                 { new: true }
                ); 

                 console.log('AAAAAA : ' + pexist);

                  if (pexist != null){
                    playerId = pexist._id;
                  } else {
                     await new Player(playerFields).save() ;      
                  }

                }

              const profile = await Profile.findOneAndUpdate(
              { user: user._id, 'playergames.game' : { $in : [gameId] }, 'playergames.userign' : { $in : [userign.toString()] } },
                { $set: { playergames: [ { game : gameId,  userign:userign, player:playerId } ] } },
                { upsert:false, returnNewDocument: true }
            );

            }

    } 
    
    // Initialise followers and following
    await new Follower({ user: user._id, followers: [], following: [] }).save();

    // Initialise UserPersona
    await new UserPersona({user:user._id, personas:[]}).save()

    // Initialise notifications
    await new Notification({ user: user._id, notifications: [] }).save();

    // Initialise battlepass
    let bpFields = {}
    bpFields.user = user._id
    bpFields.title = "SEASON 1"
    bpFields.xp_points = 0
    bpFields.levels = 1
    const bp = await new BattlePass(bpFields).save()

    await bpTracker("Connect a game account",bp._id)

    //Temp commeting the create chat user for now in DEV.

    //createChatUser(user);
    
    const access_token = createAccessToken({id: user._id})
    const refresh_token = createRefreshToken({id: user._id})
    const token = access_token;
                
    res.json({
        msg: "Success!",
        token,
        refresh_token,
        access_token,
        user: {
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            root: user.root
        }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});


function createChatUser(user){

    var data = {
    "username": user.email,
    "secret": user.email,
    "email": user.email,
    "first_name": user.firstName,
    "last_name": user.lastName
    //"avatar": user.profilePicUrl
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
     // console.log(JSON.stringify(response.data));
    })
    .catch(function (error) {
      console.log(error);
    });

}

const getPlayerInfo = async (gam, userign) => {
  try {

    let apiurl = process.env.API_URI_DOTA2;
    const gameId = Number(gam);

    switch(gameId) {
      case 1:
        apiurl = process.env.API_URI_LOL + `/${userign}?TRN-Api-Key=eaf274a8-855c-4d57-b83c-94392c2cd987`;
        break;
      case 4:
        apiurl = process.env.API_URI_DOTA2 + `/players/${userign}`;
        break;
      case 3:
        apiurl = process.env.API_URI_CSGO +  `/${userign}?TRN-Api-Key=eaf274a8-855c-4d57-b83c-94392c2cd987`
        break;
      case 20:
        apiurl = process.env.API_URI_PUBG + `?filter[playerNames]=${userign}`
        break;
      case 25:
        apiurl = process.env.API_URI_APEX + `${userign}?TRN-Api-Key=eaf274a8-855c-4d57-b83c-94392c2cd987`
        break;
      case 14:
        apiurl = process.env.PANDA_OW;
        break;
      case 26:
        let valNames = userign.split('#')
        apiurl = process.env.API_URI_VALORANT + `/${valNames[0]}/${valNames[1]}`
        break;
      case 32:
        if(userign.split('#').length > 1){
          let x = userign.split('#')
          userign = x[1]
        }
        apiurl = process.env.API_URI_CLASH_ROYALE + `/%23${userign}`
        break;
      default:
        apiurl = process.env.PANDA_CSGO;
    } 

    console.log(apiurl);

    if(gameId === 20){
      const { data } = await axios.get(apiurl, { headers: {
        'Authorization': 'Bearer ' + `${process.env.PUBG_API_KEY}`,
        'Accept': 'application/vnd.api+json'
      } 
    
    });
      const stat = await axios.get(`${process.env.API_URI_PUBG}/${data.data[0].id}/seasons/lifetime?filter[gamepad]=false`, { headers: {
        'Authorization': 'Bearer ' + `${process.env.PUBG_API_KEY}`,
        'Accept': 'application/vnd.api+json'
      } 
    }).then((res)=> res.data)
    return {stat, data: data.data};
  }else if(gameId === 26){
      // ========== The Below section is for valorent match data from 3rd party
      const { data } = await axios.get(apiurl)

      const stat = await axios.get(`${process.env.API_URI_VALORANT_MATCHES}/${data.data.region}/${data.data.puuid}`)

      return {data: stat.data, name: userign}
      // ==========
    } else
    if(gameId === 32){
      // Clash Royale API useing official documentation.
      const {data} = await axios.get(apiurl,
        { headers: {
          'Authorization': 'Bearer ' + `${process.env.CLASH_ROYALE_API_KEY}`,
          'Accept': 'application/json'
        } 
      })
      // console.log("DATAAAAAA", data)
      return { data }
    } else {
      const { data } = await axios.get(apiurl, { headers: { } });
      // console.log(data);
      return { data };
    }
  } catch (error) {
    console.error(error);
  }
};





const createAccessToken = (payload) => {
    console.log(process.env.JWT_SECRET);
    return jwt.sign(payload, process.env.JWT_SECRET)
}

const createRefreshToken = (payload) => {
        console.log(process.env.NEXT_PUBLIC_REFRESH_TOKEN_SECRET);
    return jwt.sign(payload, process.env.NEXT_PUBLIC_REFRESH_TOKEN_SECRET)
}


module.exports = router;
