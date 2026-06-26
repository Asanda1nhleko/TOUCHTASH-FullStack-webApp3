const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;
    console.log('🔐 Auth header received:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('❌ No Bearer token found');
        return res.status(401).json({ 
            message: 'No token provided. Please log in.' 
        });
    }
    
    const token = authHeader.split(' ')[1];
    console.log('🔑 Token extracted:', token.substring(0, 20) + '...'); // log first 20 chars only
    
    try {
        // Use the secret from .env – if missing, log a warning
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.warn('⚠️ JWT_SECRET is not set in .env! Using fallback "touchtashsecret".');
        }
        const decoded = jwt.verify(token, secret || 'touchtashsecret');
        console.log('✅ Token verified successfully for user:', decoded.id);
        req.userId = decoded.id;
        req.userRole = decoded.role || 'user';
        next();
    } catch (error) {
        console.error('❌ JWT verification error:', error.name, error.message);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                message: 'Token expired. Please log in again.' 
            });
        }
        return res.status(401).json({ 
            message: 'Invalid token. Please log in again.' 
        });
    }
};