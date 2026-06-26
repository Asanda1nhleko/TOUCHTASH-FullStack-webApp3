const db = require('../config/db');

// ============================================
// GET DASHBOARD STATS
// ============================================
exports.getDashboardStats = async (req, res) => {
    try {
        const [[users]] = await db.query('SELECT COUNT(*) AS totalUsers FROM users');
        const [[bookings]] = await db.query('SELECT COUNT(*) AS totalBookings FROM bookings');
        const [[reviews]] = await db.query('SELECT COUNT(*) AS totalReviews FROM reviews');
        const [[barbers]] = await db.query('SELECT COUNT(*) AS totalBarbers FROM barbers');

        res.json({
            totalUsers: users.totalUsers,
            totalBookings: bookings.totalBookings,
            totalReviews: reviews.totalReviews,
            totalBarbers: barbers.totalBarbers
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ============================================
// GET ALL BOOKINGS
// ============================================
exports.getAllBookings = async (req, res) => {
    try {
        const [bookings] = await db.query(`
            SELECT 
                bookings.*,
                users.full_name as user_name,
                users.email as user_email,
                barbers.barber_name,
                services.service_name,
                services.price
            FROM bookings
            JOIN users ON bookings.user_id = users.id
            JOIN barbers ON bookings.barber_id = barbers.id
            JOIN services ON bookings.service_id = services.id
            ORDER BY bookings.created_at DESC
        `);
        res.json({ success: true, bookings });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ============================================
// ADD BARBER
// ============================================
exports.addBarber = async (req, res) => {
    try {
        const { barber_name, specialty, rating } = req.body;
        if (!barber_name) {
            return res.status(400).json({ success: false, message: 'Barber name is required' });
        }
        await db.query(
            'INSERT INTO barbers (barber_name, specialty, rating) VALUES (?, ?, ?)',
            [barber_name, specialty || null, rating || 4.5]
        );
        res.json({ success: true, message: 'Barber added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ============================================
// DELETE BARBER
// ============================================
exports.deleteBarber = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM barbers WHERE id = ?', [id]);
        res.json({ success: true, message: 'Barber deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ============================================
// ADD SERVICE
// ============================================
exports.addService = async (req, res) => {
    try {
        const { service_name, price, duration_minutes } = req.body;
        if (!service_name || !price) {
            return res.status(400).json({ success: false, message: 'Service name and price required' });
        }
        await db.query(
            'INSERT INTO services (service_name, price, duration_minutes) VALUES (?, ?, ?)',
            [service_name, price, duration_minutes || 30]
        );
        res.json({ success: true, message: 'Service added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ============================================
// DELETE SERVICE
// ============================================
exports.deleteService = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM services WHERE id = ?', [id]);
        res.json({ success: true, message: 'Service deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ============================================
// DELETE BOOKING
// ============================================
exports.deleteBooking = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM bookings WHERE id = ?', [id]);
        res.json({ success: true, message: 'Booking deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};