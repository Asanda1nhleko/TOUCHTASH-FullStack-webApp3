const db = require('../config/db');

exports.recommendHairstyle = async (req, res) => {

    try {

        const {
            face_shape,
            hair_type
        } = req.body;

        const [styles] = await db.query(
            `SELECT *
             FROM hairstyles
             WHERE face_shape = ?
             AND hair_type = ?`,
            [face_shape, hair_type]
        );

        if (styles.length === 0) {
            return res.json({
                message: 'No hairstyle found'
            });
        }

        res.json(styles);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: 'Server error'
        });

    }

};