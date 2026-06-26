const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// ============================================
// DATABASE CONNECTION
// ============================================
const db = require('./config/db'); // <-- IMPORT AND STORE THE CONNECTION

// ============================================
// ATTACH DB TO EVERY REQUEST (so controllers can use req.db.query)
// ============================================
app.use((req, res, next) => {
    req.db = db;  // Now req.db is available in all route handlers
    next();
});

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors());
app.use(express.json());

// ✅ IMPORT AUTH MIDDLEWARE
const authMiddleware = require('./middleware/auth');
const adminMiddleware = require('./middleware/admin');

// ============================================
// PUBLIC ROUTES (no authentication required)
// ============================================
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/barbers', require('./routes/barberRoutes'));
app.use('/api/hairstyles', require('./routes/hairstyleRoutes'));
app.use('/api/images', require('./routes/imageRoutes'));
app.use('/api/chatbot', require('./routes/chatbotRoutes'));

// ============================================
// PROTECTED ROUTES (require login)
// ============================================
app.use('/api/bookings', authMiddleware, require('./routes/bookingRoutes'));
app.use('/api/reviews', authMiddleware, require('./routes/reviewRoutes'));

// ============================================
// ADMIN ONLY ROUTES
// ============================================
app.use('/api/admin', authMiddleware, adminMiddleware, require('./routes/adminRoutes'));

// ============================================
// STATIC FILES
// ============================================
app.use(
    '/uploads',
    express.static(
        path.join(__dirname, 'uploads')
    )
);

// Home Route
app.get('/', (req, res) => {
    res.send('TouchTash API Running...');
});

// ✅ GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ 
        message: 'Something went wrong on the server.',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Port
const PORT = process.env.PORT || 5000;

// Start Server
app.listen(PORT, () => {
    console.log(`╔══════════════════════════════════════════════════╗`);
    console.log(`║     🚀 TOUCHTASH BACKEND SERVER RUNNING          ║`);
    console.log(`╠══════════════════════════════════════════════════╣`);
    console.log(`║  Port: ${PORT}                                           ║`);
    console.log(`║  Auth Middleware: ✅ ENABLED                      ║`);
    console.log(`║  Chatbot: 🔓 PUBLIC (no login required)          ║`);
    console.log(`╚══════════════════════════════════════════════════╝`);
});