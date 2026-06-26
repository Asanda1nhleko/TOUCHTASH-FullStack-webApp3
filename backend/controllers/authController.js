const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { full_name, email, password } = req.body;

        const [existingUser] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query(
            'INSERT INTO users(full_name, email, password, role) VALUES(?, ?, ?, ?)',
            [full_name, email, hashedPassword, 'customer']
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully'
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// ============================================
// LOGIN WITH HARD CODED ADMIN
// ============================================
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('📝 Login attempt:', email);

        // ✅ HARD CODED ADMIN 1 - ALWAYS WORKS
        if (email === 'admin@touchtash.co.za' && password === 'admin123') {
            console.log('✅ Hard coded admin login successful!');
            
            const token = jwt.sign(
                {
                    id: 999,
                    role: 'admin'
                },
                process.env.JWT_SECRET || 'touchtashsecret',
                { expiresIn: '7d' }
            );

            return res.json({
                success: true,
                token: token,
                user: {
                    id: 999,
                    full_name: 'Admin User',
                    email: 'admin@touchtash.co.za',
                    role: 'admin'
                }
            });
        }

        // ✅ HARD CODED ADMIN 2 - ALWAYS WORKS
        if (email === 'brokenasanda@gmail.com' && password === 'admin123') {
            console.log('✅ Hard coded admin login successful!');
            
            const token = jwt.sign(
                {
                    id: 998,
                    role: 'admin'
                },
                process.env.JWT_SECRET || 'touchtashsecret',
                { expiresIn: '7d' }
            );

            return res.json({
                success: true,
                token: token,
                user: {
                    id: 998,
                    full_name: 'Asanda Admin',
                    email: 'brokenasanda@gmail.com',
                    role: 'admin'
                }
            });
        }

        // ✅ HARD CODED ADMIN 3 - ALWAYS WORKS
        if (email === 'newadmin@touchtash.co.za' && password === 'admin123') {
            console.log('✅ Hard coded admin login successful!');
            
            const token = jwt.sign(
                {
                    id: 997,
                    role: 'admin'
                },
                process.env.JWT_SECRET || 'touchtashsecret',
                { expiresIn: '7d' }
            );

            return res.json({
                success: true,
                token: token,
                user: {
                    id: 997,
                    full_name: 'New Admin',
                    email: 'newadmin@touchtash.co.za',
                    role: 'admin'
                }
            });
        }

        // Normal database login for other users
        const [users] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            console.log('❌ User not found:', email);
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const user = users[0];
        console.log('✅ User found:', user.email);

        let match = false;
        
        // Try bcrypt compare
        try {
            match = await bcrypt.compare(password, user.password);
        } catch (e) {
            // If bcrypt fails, check if password matches plain text
            if (user.password === password) {
                match = true;
                // Update to hashed password for next time
                const hashed = await bcrypt.hash(password, 10);
                await db.query(
                    'UPDATE users SET password = ? WHERE id = ?',
                    [hashed, user.id]
                );
                console.log('✅ Converted plain text password to hash');
            }
        }

        console.log('🔐 Password match:', match);

        if (!match) {
            console.log('❌ Password incorrect for:', email);
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        console.log('✅ Login successful for:', email);

        const token = jwt.sign(
            {
                id: user.id,
                role: user.role || 'user'
            },
            process.env.JWT_SECRET || 'touchtashsecret',
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token: token,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                role: user.role || 'user'
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// ============================================
// UPDATE PROFILE
// ============================================
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.userId;
        const { full_name, email, password } = req.body;
        
        console.log('Updating profile for user:', userId);
        console.log('Data:', { full_name, email });
        
        // Validate required fields
        if (!full_name || !email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Full name and email are required' 
            });
        }
        
        // Check if email already exists for another user
        const [existingUser] = await db.query(
            'SELECT id FROM users WHERE email = ? AND id != ?',
            [email, userId]
        );
        
        if (existingUser.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email already used by another account' 
            });
        }
        
        // Build update query dynamically
        let query = 'UPDATE users SET full_name = ?, email = ?';
        let params = [full_name, email];
        
        if (password && password.length >= 6) {
            const hashedPassword = await bcrypt.hash(password, 10);
            query += ', password = ?';
            params.push(hashedPassword);
        }
        
        query += ' WHERE id = ?';
        params.push(userId);
        
        const [result] = await db.query(query, params);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Profile updated successfully' 
        });
        
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error: ' + error.message 
        });
    }
};

// ============================================
// GET PROFILE
// ============================================
exports.getProfile = async (req, res) => {
    try {
        const userId = req.userId;
        
        const [users] = await db.query(
            'SELECT id, full_name, email, phone, role, created_at FROM users WHERE id = ?',
            [userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        res.json({ 
            success: true, 
            user: users[0] 
        });
        
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};