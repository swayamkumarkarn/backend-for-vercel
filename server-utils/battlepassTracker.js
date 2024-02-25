const BattlePass = require("../models/BattlePass.model")
const Task = require("../models/Task.model")

const bpTracker = async (desc, battlepassId) => {
    try {
        const task = await Task.findOne({desc:desc})
        const bp = await BattlePass.findOne({_id:battlepassId})
        let isComplete = false

        for (i=0; i<bp.completed_tasks.length; i++){
            if( bp.completed_tasks[i].taskId.toString() === task._id.toString() ){
                isComplete = true
            }
        }
        
        if(isComplete === false){
            await BattlePass.findByIdAndUpdate(
                battlepassId,
                {
                        $push:{
                            completed_tasks: { taskId: task._id}
                            }
                        },
                        { new: true }
                        );
                    }
    } catch (err) {
        console.log(err)
    }
}

module.exports = {
    bpTracker
}