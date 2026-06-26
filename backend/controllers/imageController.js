exports.uploadImage = (req, res) => {

    try {

        if (!req.file) {
            return res.status(400).json({
                message: 'No image uploaded'
            });
        }

        res.json({
            message: 'Image uploaded successfully',
            filename: req.file.filename,
            path: `/uploads/${req.file.filename}`
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: 'Server error'
        });

    }

};