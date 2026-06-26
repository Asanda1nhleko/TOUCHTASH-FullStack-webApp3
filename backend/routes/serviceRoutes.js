const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

// ===== GET ALL SERVICES (public) =====
router.get('/', async (req, res) => {
  try {
    const db = req.db;
    const [services] = await db.query(`
      SELECT 
        id,
        service_name as name,
        price,
        duration_minutes as duration,
        description
      FROM services
      ORDER BY id
    `);
    res.json({ services });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== GET SINGLE SERVICE (public) =====
router.get('/:id', async (req, res) => {
  try {
    const db = req.db;
    const [services] = await db.query(`
      SELECT 
        id,
        service_name as name,
        price,
        duration_minutes as duration,
        description
      FROM services
      WHERE id = ?
    `, [req.params.id]);
    if (services.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }
    res.json({ service: services[0] });
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== CREATE SERVICE (Admin only) =====
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, price, duration, description } = req.body;  // frontend sends name, price, duration
    const db = req.db;

    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Service name and price are required' });
    }

    const [result] = await db.query(`
      INSERT INTO services (service_name, price, duration_minutes, description)
      VALUES (?, ?, ?, ?)
    `, [name, price, duration || null, description || null]);

    const [newService] = await db.query(`
      SELECT 
        id,
        service_name as name,
        price,
        duration_minutes as duration,
        description
      FROM services
      WHERE id = ?
    `, [result.insertId]);

    res.status(201).json({ message: 'Service created successfully', service: newService[0] });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== UPDATE SERVICE (Admin only) =====
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, price, duration, description } = req.body;
    const serviceId = req.params.id;
    const db = req.db;

    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Service name and price are required' });
    }

    const [existing] = await db.query('SELECT * FROM services WHERE id = ?', [serviceId]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    await db.query(`
      UPDATE services
      SET service_name = ?, price = ?, duration_minutes = ?, description = ?
      WHERE id = ?
    `, [name, price, duration || null, description || null, serviceId]);

    const [updated] = await db.query(`
      SELECT 
        id,
        service_name as name,
        price,
        duration_minutes as duration,
        description
      FROM services
      WHERE id = ?
    `, [serviceId]);

    res.json({ message: 'Service updated successfully', service: updated[0] });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== DELETE SERVICE (Admin only) =====
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const serviceId = req.params.id;
    const db = req.db;

    const [existing] = await db.query('SELECT * FROM services WHERE id = ?', [serviceId]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    await db.query('DELETE FROM services WHERE id = ?', [serviceId]);
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;