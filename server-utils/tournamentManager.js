const Group = require("../models/Group.model")
const Tournament = require('../models/Tournament.model')

// SINGLE ELIMINATION FOR SOLO AND TEAM
const singleEliminationSoloHandler = async (tournament, tourGroup, userId) => {
    let group = tourGroup[0]
    const isRegistered = group.participants.filter((part) => part.participantId.toString() === userId ).length > 0
    const isUserRegistered = tournament.registered.filter((usr) => usr.user == userId).length > 0
    
    
          if(isRegistered === false && isUserRegistered === false){
            await Group.updateOne(
              {
                _id: group._id,
              },
              {
                $push: { 
                  participants: { participantId: userId, matches: 0, won: 0, loss: 0, draw: 0, points: 0 }
                },
              }
            );
            await Tournament.findOneAndUpdate({_id: tournament._id}, {$push:{
              registered: {user: userId}
            }})
          } else if(isUserRegistered === true){
            await Tournament.findOneAndUpdate({_id: tournament._id}, {$pull:{
              registered: {user: userId}
            }})
            await Group.updateOne(
              {
                _id: group._id,
              },
              {
                $pull: { 
                  participants: { participantId: userId }
                },
              }
            );
          }
}

const singleEliminationTeamHandler = async (tournament, tourGroup, teamId, squadId, type) => {
    let group = tourGroup[0]
    const isRegistered = group.teams.filter((tm) => tm.teamId === teamId).length > 0
    
    if(isRegistered === false && type === 'REG'){
        await Group.updateOne(
        {
          _id: group._id,
        },
        {
          $push: { 
            teams: { teamId: teamId, squadId:squadId, matches: 0, won: 0, loss: 0, draw: 0, points: 0 }
          },
        }
      );
      await tournament.teams.push({teamId: teamId})
      await tournament.save()
    } else if(type === 'UNREG'){
      await Tournament.findOneAndUpdate({_id: tournament._id}, {$pull:{
        teams: {teamId: teamId}
      }})
      await Group.updateOne(
        {
          _id: group._id,
        },
        {
          $pull: { 
            teams: { teamId: teamId}
          },
        }
      );
    }
}

// GROUPS HANDLER FOR SOLO AND TEAM
const groupSoloHandler = async (tournament, tourGroups, userId ) => {
    let group1 = tourGroups[0]
    let group2 = tourGroups[1]

    let isgroupLimitEven = tournament.participants % 2 != 0
    let groupLimit = isgroupLimitEven ? tournament.participants / 2 : Math.floor(tournament.participants / 2 ) + 1

        if( group1.participants.length < groupLimit - 1 ){
          const isRegistered = group1.participants.filter((part) => part.participantId.toString() === userId ).length > 0
          if(isRegistered === false){
            await Group.updateOne(
              {
                _id: group1._id,
              },
              {
                $push: { 
                  participants: { participantId: userId, matches: 0, won: 0, loss: 0, draw: 0, points: 0 }
                },
              }
            );
            await tournament.registered.push({
              user: userId
            })
            await tournament.save()
          }
        } else if(group2.participants.length <= groupLimit ){
          const isRegistered = group2.participants.filter((part) => part.participantId.toString() === userId ).length > 0
          
          if(isRegistered === false){
            await Group.updateOne(
              {
                _id: group2._id
              },
              {
                $push: { 
                  participants: { participantId: userId, matches: 0, won: 0, loss: 0, draw: 0, points: 0 }
                },
              }
            );
            await tournament.registered.push({
              user: userId
            })
            await tournament.save()
        }
        }

}

const groupTeamHandler = async ( tournament, tourGroup ) => {
    let group1 = tourGroup[0]
    let group2 = tourGroup[1]

    let isgroupLimitEven = tournament.numberOfTeam % 2 == 0
    let groupLimit = isgroupLimitEven ? tournament.numberOfTeam / 2 : Math.floor(tournament.numberOfTeam / 2 ) + 1

      if(squadId !== ''){
        if( group1.teams.length < groupLimit ){
          const isRegistered = group1.teams.filter((tm) => tm.teamId === team._id).length > 0
          
          if(isRegistered === false){
            await Group.updateOne(
              {
                _id: group1._id,
              },
              {
                $push: { 
                  teams: { teamId: req.params.teamId, squadId:squadId, matches: 0, won: 0, loss: 0, draw: 0, points: 0 }
                },
              }
            );
            await tournament.teams.push({teamId: req.params.teamId})
            await tournament.save()
          }
        } else if(group2.teams.length < groupLimit ){
          const isRegistered = group2.teams.filter((tm) => tm.teamId === req.params.teamId ).length > 0
          
          if(isRegistered === false)
            await Group.updateOne(
              {
                _id: group2._id
              },
              {
                $push: { 
                  teams: { teamId: req.params.teamId, squadId:squadId, matches: 0, won: 0, loss: 0, draw: 0, points: 0 }
                },
              }
            );
            await tournament.teams.push({teamId: req.params.teamId})
            await tournament.save()
        }
      }
} 

module.exports = {
    groupSoloHandler,
    groupTeamHandler,
    singleEliminationSoloHandler,
    singleEliminationTeamHandler,
}