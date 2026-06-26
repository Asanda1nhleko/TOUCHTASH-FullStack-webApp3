const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

// Use getReviews (not getAllReviews)
router.get('/', reviewController.getReviews);   // ✅ matches controller export

module.exports = router;