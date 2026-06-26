const express = require('express');

const router = express.Router();

const {
    recommendHairstyle
} = require('../controllers/hairstyleController');

router.post('/recommend', recommendHairstyle);

module.exports = router;