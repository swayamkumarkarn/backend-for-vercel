const mongoose = require('mongoose');

const teamroleSchema = new mongoose.Schema(
  {
    role: {
        type: [String]        
      },
  },
    {
        timestamps: true, 
      }
    );
    
module.exports = mongoose.model('TeamRole', teamroleSchema);
    