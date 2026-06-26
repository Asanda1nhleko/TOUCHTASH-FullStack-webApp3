module.exports = (req, res, next) => {
    if (req.userRole !== 'admin') {
        return res.status(403).json({ 
            message: 'Admin access required. You do not have permission to view this page.' 
        });
    }
    next();
};