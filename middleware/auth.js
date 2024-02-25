const jwt = require('jsonwebtoken');
const Users = require('@models/User.model');

const auth = async (req, res) => {
    const token = req.headers.authorization;
    console.log('CAlling auth PPP.............' + token )
    if(!token) return res.status(400).json({err: 'Invalid Authentication.'})

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if(!decoded) return res.status(400).json({err: 'Invalid Authentication.'})
            console.log('CAlling auth end********** .............' + decoded.id )

    const user = await Users.findOne({_id: decoded.id})

    return {id: user._id, role: user.role, root: user.root};
}


export default auth