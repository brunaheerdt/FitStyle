const { verifyToken, extractTokenFromHeader } = require('../utils/jwt');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
    try {
        const token = extractTokenFromHeader(req.headers.authorization);

        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        const decoded = verifyToken(token);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

const requireAdmin = async (req, res, next) => {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId);

    if (!user) {
        return res.status(401).json({ error: 'User not found' });
    }

    if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = user;
    next();
};

const optionalAuth = async (req, res, next) => {
    try {
        const token = extractTokenFromHeader(req.headers.authorization);

        if (token) {
            const decoded = verifyToken(token);
            const user = await User.findById(decoded.userId);
            req.user = user;
        }

        next();
    } catch (error) {
        next();
    }
};

module.exports = {
    optionalAuth,
    authenticateToken,
    requireAdmin
};
