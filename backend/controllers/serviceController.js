const db = require('../config/db');

// GET all services (matches route: GET /)
exports.getAllServices = async (req, res) => {
    try {
        const [services] = await db.query(
            'SELECT id, service_name, price, duration_minutes, description FROM services ORDER BY id'
        );
        res.json(services);
    } catch (error) {
        console.error('Get all services error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET a single service by ID (matches route: GET /:id)
exports.getServiceById = async (req, res) => {
    try {
        const { id } = req.params;
        const [services] = await db.query(
            'SELECT id, service_name, price, duration_minutes, description FROM services WHERE id = ?',
            [id]
        );

        if (services.length === 0) {
            return res.status(404).json({ message: 'Service not found' });
        }

        res.json(services[0]);
    } catch (error) {
        console.error('Get service by ID error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// POST create a new service (matches route: POST /)
exports.createService = async (req, res) => {
    try {
        const { service_name, price, duration_minutes, description } = req.body;

        // Basic validation
        if (!service_name || price === undefined) {
            return res.status(400).json({ message: 'Service name and price are required' });
        }

        const [result] = await db.query(
            'INSERT INTO services (service_name, price, duration_minutes, description) VALUES (?, ?, ?, ?)',
            [service_name, price, duration_minutes, description || null]
        );

        const [newService] = await db.query(
            'SELECT id, service_name, price, duration_minutes, description FROM services WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json(newService[0]);
    } catch (error) {
        console.error('Create service error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// PUT update an existing service (matches route: PUT /:id)
exports.updateService = async (req, res) => {
    try {
        const { id } = req.params;
        const { service_name, price, duration_minutes, description } = req.body;

        // Check if service exists
        const [existing] = await db.query('SELECT id FROM services WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Service not found' });
        }

        await db.query(
            'UPDATE services SET service_name = ?, price = ?, duration_minutes = ?, description = ? WHERE id = ?',
            [service_name, price, duration_minutes, description, id]
        );

        const [updated] = await db.query(
            'SELECT id, service_name, price, duration_minutes, description FROM services WHERE id = ?',
            [id]
        );

        res.json(updated[0]);
    } catch (error) {
        console.error('Update service error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// DELETE a service (matches route: DELETE /:id)
exports.deleteService = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if service exists
        const [existing] = await db.query('SELECT id FROM services WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Service not found' });
        }

        await db.query('DELETE FROM services WHERE id = ?', [id]);

        res.status(204).send(); // No content, successful delete
    } catch (error) {
        console.error('Delete service error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};