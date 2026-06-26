const db = require('../config/db');
const { sendBookingConfirmation, sendCancellationEmail } = require('../utils/emailService');

// ============================================
// CREATE BOOKING
// ============================================
exports.createBooking = async (req, res) => {
    try {
        const userId = req.userId;
        
        if (!userId) {
            return res.status(401).json({ 
                success: false,
                message: 'You must be logged in to make a booking.' 
            });
        }
        
        const { barber_id, service_id, booking_date, booking_time, notes } = req.body;

        if (!barber_id || !service_id || !booking_date || !booking_time) {
            return res.status(400).json({ 
                success: false,
                message: 'Missing required fields' 
            });
        }

        // Check if barber exists
        const [barberExists] = await db.query('SELECT id FROM barbers WHERE id = ?', [barber_id]);
        if (barberExists.length === 0) {
            return res.status(400).json({ success: false, message: 'Barber not found' });
        }

        // Check if service exists
        const [serviceExists] = await db.query('SELECT id FROM services WHERE id = ?', [service_id]);
        if (serviceExists.length === 0) {
            return res.status(400).json({ success: false, message: 'Service not found' });
        }

        // Check for double-booking
        const [conflicts] = await db.query(
            `SELECT * FROM bookings 
             WHERE barber_id = ? AND booking_date = ? AND booking_time = ? 
             AND status NOT IN ('cancelled', 'completed')`,
            [barber_id, booking_date, booking_time]
        );

        if (conflicts.length > 0) {
            return res.status(409).json({ 
                success: false,
                message: 'This time slot is already booked. Please choose another time.' 
            });
        }

        const [result] = await db.query(
            `INSERT INTO bookings (user_id, barber_id, service_id, booking_date, booking_time, notes, status)
             VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
            [userId, barber_id, service_id, booking_date, booking_time, notes || null]
        );

        // Send email confirmation
        try {
            const [user] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
            const [barber] = await db.query('SELECT * FROM barbers WHERE id = ?', [barber_id]);
            const [service] = await db.query('SELECT * FROM services WHERE id = ?', [service_id]);
            
            if (user[0] && barber[0] && service[0]) {
                await sendBookingConfirmation(
                    { booking_date, booking_time, status: 'pending', notes }, 
                    user[0], 
                    barber[0], 
                    service[0]
                );
            }
        } catch (emailError) {
            console.error('Email error:', emailError);
        }

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            bookingId: result.insertId
        });

    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ============================================
// GET BOOKINGS
// ============================================
exports.getBookings = async (req, res) => {
    try {
        const userId = req.userId;
        
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Please log in' });
        }
        
        const [bookings] = await db.query(`
            SELECT 
                bookings.*,
                barbers.barber_name,
                services.service_name,
                services.price
            FROM bookings
            JOIN barbers ON bookings.barber_id = barbers.id
            JOIN services ON bookings.service_id = services.id
            WHERE bookings.user_id = ?
            ORDER BY bookings.booking_date DESC
        `, [userId]);

        res.json(bookings);

    } catch (error) {
        console.error('Get bookings error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ============================================
// UPDATE BOOKING - ✅ Handles Confirm, Cancel, Complete
// ============================================
exports.updateBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.userId;
        const userRole = req.userRole || 'user';

        console.log(`📝 Updating booking ${id} to status: ${status} by user ${userId} (role: ${userRole})`);

        // Valid status values
        const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid status value' 
            });
        }

        // Get booking details before update (for email and ownership check)
        let bookingQuery = 'SELECT * FROM bookings WHERE id = ?';
        let bookingParams = [id];
        
        // If not admin, check ownership
        if (userRole !== 'admin') {
            bookingQuery += ' AND user_id = ?';
            bookingParams.push(userId);
        }
        
        const [bookingDetails] = await db.query(bookingQuery, bookingParams);

        if (bookingDetails.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Booking not found or you do not have permission to update it.' 
            });
        }

        // Update the booking status
        await db.query(
            'UPDATE bookings SET status = ? WHERE id = ?',
            [status, id]
        );

        // Send email notifications for status changes
        try {
            const [user] = await db.query('SELECT * FROM users WHERE id = ?', [bookingDetails[0].user_id]);
            const [barber] = await db.query('SELECT * FROM barbers WHERE id = ?', [bookingDetails[0].barber_id]);
            const [service] = await db.query('SELECT * FROM services WHERE id = ?', [bookingDetails[0].service_id]);

            // Send cancellation email if status changed to cancelled
            if (status === 'cancelled' && user[0] && barber[0] && service[0]) {
                await sendCancellationEmail(bookingDetails[0], user[0], barber[0], service[0]);
            }
            
            // Send confirmation email if status changed to confirmed
            if (status === 'confirmed' && user[0] && barber[0] && service[0]) {
                await sendBookingConfirmation(bookingDetails[0], user[0], barber[0], service[0]);
            }
        } catch (emailError) {
            console.error('Email error:', emailError);
        }

        res.json({ 
            success: true, 
            message: `Booking ${status} successfully` 
        });

    } catch (error) {
        console.error('Update booking error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error. Could not update booking.' 
        });
    }
};

// ============================================
// DELETE BOOKING
// ============================================
exports.deleteBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const userRole = req.userRole || 'user';

        let query = 'DELETE FROM bookings WHERE id = ?';
        let params = [id];
        
        if (userRole !== 'admin') {
            query += ' AND user_id = ?';
            params.push(userId);
        }

        const [result] = await db.query(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Booking not found or you do not have permission to delete it.' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Booking deleted successfully' 
        });

    } catch (error) {
        console.error('Delete booking error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error. Could not delete booking.' 
        });
    }
};

// ============================================
// GET AVAILABLE TIME SLOTS
// ============================================
exports.getAvailableSlots = async (req, res) => {
    try {
        const { date, barber_id } = req.query;
        
        console.log('Getting slots for date:', date, 'barber:', barber_id);
        
        // Generate all time slots from 8am to 6pm
        const allSlots = [];
        for (let hour = 8; hour <= 18; hour++) {
            const hourStr = hour.toString().padStart(2, '0');
            allSlots.push(hourStr + ':00');
            if (hour !== 18) {
                allSlots.push(hourStr + ':30');
            }
        }
        
        // Get booked slots from database
        let bookedTimes = [];
        if (date && barber_id) {
            try {
                const [bookedSlots] = await db.query(
                    'SELECT booking_time FROM bookings WHERE barber_id = ? AND booking_date = ? AND status IN ("pending", "confirmed")',
                    [barber_id, date]
                );
                bookedTimes = bookedSlots.map(slot => slot.booking_time);
            } catch (dbError) {
                console.log('DB query error, using empty booked times');
            }
        }
        
        const slots = [];
        for (let i = 0; i < allSlots.length; i++) {
            slots.push({
                time: allSlots[i],
                available: !bookedTimes.includes(allSlots[i])
            });
        }
        
        res.json({ success: true, slots: slots });

    } catch (error) {
        console.error('Get available slots error:', error);
        res.json({ success: true, slots: [] });
    }
};

// ============================================
// RESCHEDULE BOOKING
// ============================================
exports.rescheduleBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const { booking_date, booking_time } = req.body;
        const userId = req.userId;
        const userRole = req.userRole || 'user';
        
        // Check if booking exists and belongs to user (or user is admin)
        let query = 'SELECT * FROM bookings WHERE id = ?';
        let params = [id];
        
        if (userRole !== 'admin') {
            query += ' AND user_id = ?';
            params.push(userId);
        }
        
        const [bookings] = await db.query(query, params);
        
        if (bookings.length === 0) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        
        // Check if new time slot is available
        const [conflicts] = await db.query(
            `SELECT * FROM bookings 
             WHERE barber_id = ? AND booking_date = ? AND booking_time = ? 
             AND id != ? AND status NOT IN ('cancelled', 'completed')`,
            [bookings[0].barber_id, booking_date, booking_time, id]
        );
        
        if (conflicts.length > 0) {
            return res.status(409).json({ success: false, message: 'Time slot not available' });
        }
        
        // Update booking
        await db.query(
            'UPDATE bookings SET booking_date = ?, booking_time = ? WHERE id = ?',
            [booking_date, booking_time, id]
        );
        
        res.json({ success: true, message: 'Booking rescheduled successfully' });
        
    } catch (error) {
        console.error('Reschedule error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};