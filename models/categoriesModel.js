const mongoose = require('mongoose')

const CategoriesSchema = new mongoose.Schema( {
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'user'
    },
    name: {
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true
})

let Dataset = mongoose.models.categories || mongoose.model('categories', CategoriesSchema)
module.exports = Dataset
