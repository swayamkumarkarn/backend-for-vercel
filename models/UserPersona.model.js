const mongoose = require('mongoose')

const userpersonaSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    personas:[{
      type: {
        type: 'String',
        enum: ['team', 'brand','tournament','company','community'],
      },
      teamId: {
        type: Number,
        ref: 'Team',
      },
      tournamentId: {
        type: Number,
        ref: 'Tournament',
      },
      brandId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand',
      },
      companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
      },
      communityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community',
      },
    }
    ]
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('UserPersona', userpersonaSchema)