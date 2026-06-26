const db = require('../config/db');

// GET all reviews (matches route: GET /reviews)
exports.getReviews = async (req, res) => {
  try {
    res.json({ 
      reviews: [
        { id: 1, user_name: 'Alice', barber_name: 'John Doe', rating: 5, comment: 'Great service!', created_at: new Date() }
      ]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// (Optional) DELETE a review – if you want to add this route later
exports.deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM reviews WHERE id = ?', [id]);
        res.json({ success: true, message: 'Review deleted successfully' });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};