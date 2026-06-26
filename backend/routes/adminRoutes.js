const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

// ===== GET ALL BOOKINGS =====
router.get('/bookings', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = req.db;
    const [bookings] = await db.query(`
      SELECT 
        b.*,
        u.full_name as user_name,
        s.service_name as service_name,   -- ✅ changed s.name → s.service_name
        bar.barber_name
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN services s ON b.service_id = s.id
      LEFT JOIN barbers bar ON b.barber_id = bar.id
      ORDER BY b.id DESC
    `);
    res.json({ bookings });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== GET SINGLE BOOKING =====
router.get('/bookings/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = req.db;
    const [bookings] = await db.query(`
      SELECT 
        b.*,
        u.full_name as user_name,
        s.service_name as service_name,   -- ✅ changed
        bar.barber_name
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN services s ON b.service_id = s.id
      LEFT JOIN barbers bar ON b.barber_id = bar.id
      WHERE b.id = ?
    `, [req.params.id]);
    
    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json({ booking: bookings[0] });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== UPDATE BOOKING =====
router.put('/bookings/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status, service_id, barber_id, booking_date, booking_time } = req.body;
    const bookingId = req.params.id;
    const db = req.db;

    let updates = [];
    let values = [];

    if (status) {
      updates.push('status = ?');
      values.push(status);
    }
    if (service_id) {
      updates.push('service_id = ?');
      values.push(service_id);
    }
    if (barber_id) {
      updates.push('barber_id = ?');
      values.push(barber_id);
    }
    if (booking_date) {
      updates.push('booking_date = ?');
      values.push(booking_date);
    }
    if (booking_time) {
      updates.push('booking_time = ?');
      values.push(booking_time);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(bookingId);
    await db.query(`UPDATE bookings SET ${updates.join(', ')} WHERE id = ?`, values);

    const [updated] = await db.query(`
      SELECT 
        b.*,
        u.full_name as user_name,
        s.service_name as service_name,   -- ✅ changed
        bar.barber_name
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN services s ON b.service_id = s.id
      LEFT JOIN barbers bar ON b.barber_id = bar.id
      WHERE b.id = ?
    `, [bookingId]);

    res.json({ message: 'Booking updated successfully', booking: updated[0] });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== DELETE BOOKING =====
router.delete('/bookings/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const db = req.db;

    const [existing] = await db.query('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    await db.query('DELETE FROM bookings WHERE id = ?', [bookingId]);
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== GET STATS =====
router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = req.db;
    const [bookings] = await db.query('SELECT COUNT(*) as count FROM bookings');
    const [users] = await db.query('SELECT COUNT(*) as count FROM users');
    const [barbers] = await db.query('SELECT COUNT(*) as count FROM barbers');
    const [reviews] = await db.query('SELECT COUNT(*) as count FROM reviews');
    
    res.json({
      totalBookings: bookings[0].count,
      totalUsers: users[0].count,
      totalBarbers: barbers[0].count,
      totalReviews: reviews[0].count
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== GET ALL REVIEWS =====
router.get('/reviews', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = req.db;
    const [reviews] = await db.query(`
      SELECT 
        r.*,
        u.full_name as user_name,
        bar.barber_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN barbers bar ON r.barber_id = bar.id
      ORDER BY r.created_at DESC
    `);
    res.json({ reviews });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;