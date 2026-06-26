const express = require('express');
const router = express.Router();
const { chatbot } = require('../controllers/chatbotController');

// ✅ Public route - no authentication required
router.post('/', chatbot);

module.exports = router;