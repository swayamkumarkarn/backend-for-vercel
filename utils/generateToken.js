import jwt from 'jsonwebtoken'

const createAccessToken = (payload) => {
    console.log(process.env.JWT_SECRET);
    return jwt.sign(payload, process.env.JWT_SECRET)
}

const createRefreshToken = (payload) => {
        console.log(process.env.NEXT_PUBLIC_REFRESH_TOKEN_SECRET);
    return jwt.sign(payload, process.env.NEXT_PUBLIC_REFRESH_TOKEN_SECRET)
}

module.exports = { createAccessToken, createRefreshToken };
