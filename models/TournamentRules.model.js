const mongoose = require('mongoose');

const tournamentRulesSchema = new mongoose.Schema(
  {
    tournamentId:{
      type: Number,
      ref: 'Tournament'
    },
    check_in:{
      type: Number
    },
    forfeit:{
      type: Number
    },
    prizeRules:{
      type: String
    },
    general:{
      type: String
    },
    compete:{
      type: String 
    },
    matchSettings:{
      type: String
    },
    cusRuleHead:{
      type: String
    },
    cusRuleBody:{
      type: String
    },
    admins:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    contact:{
      type: String
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('TournamentRules', tournamentRulesSchema);
