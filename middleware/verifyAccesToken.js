const jwt = require('jsonwebtoken');
const verifyAccessToken = (req, res, next) => {
    const authorization = req.headers.authorization;
    const token = authorization && authorization.split(' ')[1];
    if (!token) {
        res.status(401).json({ message: 'Tidak terdapat token' });
    } else {
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
            if (err) res.status(403).json({ message: 'Verifikasi token failed' });
            else {
                req.profile = decoded;
                next();
            }
        });
    }
};
module.exports = verifyAccessToken;
