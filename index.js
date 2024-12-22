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

        if (!files.image1 && !files.image2) {
            return res.status(400).json({ error: 'At least one image (image1 or image2) is required.' });
        }

        let result1 = null;
        let result2 = null;

        // If image1 is provided, compare it with captured_image
        if (files.image1) {
            if (!files.captured_image) {
                return res.status(400).json({ error: 'Captured image is required if image1 is provided.' });
            }
            result1 = await compareImages(files.image1[0].path, files.captured_image[0].path);
        }

        // If image2 is provided, compare it with captured_image or image1 (whichever is present)
        if (files.image2) {
            if (!files.captured_image && !files.image1) {
                return res.status(400).json({ error: 'Captured image or image1 must be provided if image2 is present.' });
            }
            if (files.image1) {
                result2 = await compareImages(files.image1[0].path, files.image2[0].path);
            } else if (files.captured_image) {
                result2 = await compareImages(files.captured_image[0].path, files.image2[0].path);
            }
        }

        let bestMatch = null;

        // Determine the best match based on similarity (if comparisons were made)
        if (result1 && result2) {
            if (result1.similarity > result2.similarity) {
                bestMatch = {
                    matchFound: true,
                    similarity: result1.similarity,
                    matchedImage: 'captured_image'
                };
            } else if (result2.similarity > result1.similarity) {
                bestMatch = {
                    matchFound: true,
                    similarity: result2.similarity,
                    matchedImage: 'image2'
                };
            } else {
                bestMatch = {
                    matchFound: false,
                    similarity: 0
                };
            }
        } else if (result1) {
            bestMatch = {
                matchFound: true,
                similarity: result1.similarity,
                matchedImage: 'captured_image'
            };
        } else if (result2) {
            bestMatch = {
                matchFound: true,
                similarity: result2.similarity,
                matchedImage: 'image2'
            };
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
