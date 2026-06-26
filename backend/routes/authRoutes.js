const express = require('express');
const router = express.Router();

// Import the auth middleware
const authMiddleware = require('../middleware/auth');

// Import controller functions
const {
    register,
    login,
    updateProfile,
    getProfile
} = require('../controllers/authController');

// ============================================
// PUBLIC ROUTES (no authentication required)
// ============================================
router.post('/register', register);
router.post('/login', login);

// ============================================
// PROTECTED ROUTES (require login)
// ============================================
router.put('/profile', authMiddleware, updateProfile);
router.get('/profile', authMiddleware, getProfile);

module.exports = router;