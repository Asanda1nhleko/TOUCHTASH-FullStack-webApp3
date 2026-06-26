const db = require('../config/db');
const path = require('path');
const fs = require('fs');

exports.getAllBarbers = async (req, res) => {
  try {
    const [barbers] = await db.query(`
      SELECT id, barber_name as name, speciality as specialty, 
             phone, availability, image_url, created_at
      FROM barbers ORDER BY id
    `);
    res.json({ barbers });
  } catch (error) {
    console.error('Get all barbers error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getBarberById = async (req, res) => {
  try {
    const [barbers] = await db.query(`
      SELECT id, barber_name as name, speciality as specialty, 
             phone, availability, image_url, created_at
      FROM barbers WHERE id = ?
    `, [req.params.id]);
    if (barbers.length === 0) return res.status(404).json({ error: 'Barber not found' });
    res.json({ barber: barbers[0] });
  } catch (error) {
    console.error('Get barber error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.createBarber = async (req, res) => {
  try {
    const { name, specialty, phone, availability } = req.body;
    if (!name) return res.status(400).json({ error: 'Barber name is required' });
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const [result] = await db.query(`
      INSERT INTO barbers (barber_name, speciality, phone, availability, image_url)
      VALUES (?, ?, ?, ?, ?)
    `, [name, specialty || 'General', phone || null, availability !== undefined ? availability : 1, imageUrl]);

    const [newBarber] = await db.query(`
      SELECT id, barber_name as name, speciality as specialty, 
             phone, availability, image_url, created_at
      FROM barbers WHERE id = ?
    `, [result.insertId]);

    res.status(201).json({ message: 'Barber created successfully', barber: newBarber[0] });
  } catch (error) {
    console.error('Create barber error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateBarber = async (req, res) => {
  try {
    const { name, specialty, phone, availability } = req.body;
    const barberId = req.params.id;
    if (!name) return res.status(400).json({ error: 'Barber name is required' });

    const [existing] = await db.query('SELECT * FROM barbers WHERE id = ?', [barberId]);
    if (existing.length === 0) return res.status(404).json({ error: 'Barber not found' });

    let imageUrl = existing[0].image_url;
    if (req.file) {
      if (imageUrl) {
        const oldPath = path.join(__dirname, '..', imageUrl);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      imageUrl = `/uploads/${req.file.filename}`;
    }

    await db.query(`
      UPDATE barbers 
      SET barber_name = ?, speciality = ?, phone = ?, availability = ?, image_url = ?
      WHERE id = ?
    `, [name, specialty || 'General', phone || null, availability !== undefined ? availability : 1, imageUrl, barberId]);

    const [updated] = await db.query(`
      SELECT id, barber_name as name, speciality as specialty, 
             phone, availability, image_url, created_at
      FROM barbers WHERE id = ?
    `, [barberId]);

    res.json({ message: 'Barber updated successfully', barber: updated[0] });
  } catch (error) {
    console.error('Update barber error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteBarber = async (req, res) => {
  try {
    const barberId = req.params.id;
    const [barber] = await db.query('SELECT * FROM barbers WHERE id = ?', [barberId]);
    if (barber.length === 0) return res.status(404).json({ error: 'Barber not found' });

    if (barber[0].image_url) {
      const imagePath = path.join(__dirname, '..', barber[0].image_url);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    await db.query('DELETE FROM barbers WHERE id = ?', [barberId]);
    res.json({ message: 'Barber deleted successfully' });
  } catch (error) {
    console.error('Delete barber error:', error);
    res.status(500).json({ error: error.message });
  }
};