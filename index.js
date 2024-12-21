const express = require('express');
const multer = require('multer');
const { imageHash } = require('image-hash');
const path = require('path');

const app = express();
const port = 3000;
app.use(express.json()); // Add this line if you're handling JSON requests
app.use(express.urlencoded({ extended: true })); // Add this line for form data (optional)
// Multer setup for multiple file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Save uploads in 'uploads' folder
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

// Utility function to compute image hash
const computeHash = (filePath) => {
    return new Promise((resolve, reject) => {
        imageHash(filePath, 16, true, (error, hash) => {
            if (error) reject(error);
            resolve(hash);
        });
    });
};

// POST endpoint to upload and compare images
app.post('/compare', upload.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'captured_image', maxCount: 1 }
]), async (req, res) => {
    try {
        const files = req.files;

        if (!files.image1 || !files.image2 || !files.captured_image) {
            return res.status(400).json({ error: 'Missing required images.' });
        }

        // Compute hashes
        const hash1 = await computeHash(files.image1[0].path);
        const hash2 = await computeHash(files.image2[0].path);
        const capturedHash = await computeHash(files.captured_image[0].path);

        // Compare hashes
        if (capturedHash === hash1) {
            res.json({ match: files.image1[0].originalname, matchFound: true });
        } else if (capturedHash === hash2) {
            res.json({ match: files.image2[0].originalname, matchFound: true });
        } else {
            res.status(400).json({ error: 'No match found', matchFound: false });
        }

    } catch (error) {
        res.status(500).json({ error: error.message, matchFound: false });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
