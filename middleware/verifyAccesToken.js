const jwt = require('jsonwebtoken');
const verifyAccessToken = (req, res, next) => {
    const authorization = req.headers.authorization;
    const token = authorization && authorization.split(' ')[1];
    if (!token) {
        res.sendStatus(401);
    } else {
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
            if (err) res.sendStatus(403);
            else {
                req.profile = decoded;
                next();
            }
        });
    }
};
module.exports = verifyAccessToken;
