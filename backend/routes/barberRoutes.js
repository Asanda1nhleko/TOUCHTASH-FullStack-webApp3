const express = require('express');
const router = express.Router();
const barberController = require('../controllers/barberController');
const upload = require('../middleware/upload');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

// GET all barbers (public)
router.get('/', barberController.getAllBarbers);

// GET single barber (public)
router.get('/:id', barberController.getBarberById);

// CREATE barber with image (admin only)
router.post(
  '/', 
  authMiddleware, 
  adminMiddleware, 
  upload.single('image'), 
  barberController.createBarber
);

// UPDATE barber with image (admin only)
router.put(
  '/:id', 
  authMiddleware, 
  adminMiddleware, 
  upload.single('image'), 
  barberController.updateBarber
);

// DELETE barber (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, barberController.deleteBarber);

module.exports = router;