const express = require('express');
const multer = require('multer');
const fs = require('fs');
const AWS = require('aws-sdk');
const path = require('path');
require('dotenv').config();  // Load environment variables from .env file

// Configure AWS Rekognition
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,  // AWS Access Key from .env
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,  // AWS Secret Key from .env
    region: process.env.AWS_REGION  // AWS Region from .env
});

const rekognition = new AWS.Rekognition();

const app = express();
const port = 3000;

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Save uploads in 'uploads' folder
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

// Compare Images using AWS Rekognition
const compareImages = async (sourcePath, targetPath) => {
    try {
        const sourceImage = fs.readFileSync(sourcePath); // Read source image
        const targetImage = fs.readFileSync(targetPath); // Read target image

        const params = {
            SourceImage: { Bytes: sourceImage }, // Source image bytes
            TargetImage: { Bytes: targetImage }  // Target image bytes
        };

        const result = await rekognition.compareFaces(params).promise(); // AWS Rekognition call

        console.log('Rekognition Response:', JSON.stringify(result));

        // If face matches
        if (result.FaceMatches && result.FaceMatches.length > 0) {
            return {
                match: true,
                similarity: result.FaceMatches[0].Similarity
            };
        }

        return { match: false, similarity: 0 }; // No match found
    } catch (err) {
        console.error('Error comparing images:', err);
        throw err;
    }
};

// POST endpoint to upload and compare images
app.post('/compare', upload.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'captured_image', maxCount: 1 },
    { name: 'image2', maxCount: 1 }
]), async (req, res) => {
    try {
        const files = req.files;

        // Ensure both image1 and image2 are provided, and captured_image is mandatory
        if (!files.image1 || !files.image2) {
            return res.status(400).json({ error: 'Both image1 and image2 must be provided.' });
        }

        if (!files.captured_image) {
            return res.status(400).json({ error: 'Captured image is required.' });
        }

        // Compare image1 with captured_image
        const result1 = await compareImages(files.image1[0].path, files.captured_image[0].path);

        // Compare image2 with captured_image
        const result2 = await compareImages(files.image2[0].path, files.captured_image[0].path);

        // Determine the best match
        let bestMatch = null;

        // If both matches are found, compare their similarity and return the better match
        if (result1.match && result2.match) {
            if (result1.similarity > 80 && result2.similarity > 80) {
                bestMatch = {
                    matchFound: true,
                    similarity: result1.similarity > result2.similarity ? result1.similarity : result2.similarity,
                }
            } else {
                bestMatch = {
                    matchFound: false,
                    similarity: 0
                };
            }
        } else {
            bestMatch = {
                matchFound: false,
                similarity: 0
            };
        }

        // Send response with the best match
        res.json(bestMatch);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
