const express = require('express');
const router = express.Router();

// Import all controller functions once
const {
    createBooking,
    getBookings,
    updateBooking,
    deleteBooking,
    getAvailableSlots,
    rescheduleBooking
} = require('../controllers/bookingController');

// Routes
router.post('/', createBooking);
router.get('/', getBookings);
router.put('/:id', updateBooking);
router.delete('/:id', deleteBooking);
router.get('/available-slots', getAvailableSlots);
router.put('/:id/reschedule', rescheduleBooking);

module.exports = router;