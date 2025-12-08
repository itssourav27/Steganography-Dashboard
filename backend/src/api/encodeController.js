import express from 'express';
import multer from 'multer';
import { encodeLSB, decodeLSB } from '../algorithms/lsb.js';
import { preConvertImage } from '../utils/imageCompression.js';
const router = express.Router();
const upload = multer();

// POST /api/encode
router.post('/encode', upload.single('image'), async (req, res) => {
  try {
    const imageFile = req.file;
    const payloadText = req.body.payload || '';
    const bitsPerChannel = parseInt(req.body.bitsPerChannel || '1', 10);
    const encryptPass = req.body.passphrase || null;
    const outputFormat = req.body.outputFormat || null; // 'avif' or 'webp' for pre-conversion

    if (!imageFile) return res.status(400).json({ error: 'image required' });
    
    let imageBuffer = imageFile.buffer;
    let preConversionMetrics = null;
    
    // Pre-convert to AVIF/WebP if requested
    if (outputFormat === 'avif' || outputFormat === 'webp') {
      const converted = await preConvertImage(imageBuffer, outputFormat, {
        quality: parseInt(req.body.quality || '80', 10)
      });
      imageBuffer = converted.buffer;
      preConversionMetrics = converted.metrics;
    }
    
    const payloadBuffer = Buffer.from(payloadText, 'utf8');
    const opts = { bitsPerChannel, channels: [0, 1, 2] };
    if (encryptPass) opts.encrypt = { passphrase: encryptPass };

    const { stegoBuffer, metrics } = await encodeLSB(imageBuffer, payloadBuffer, opts);
    
    // Merge pre-conversion metrics if available
    if (preConversionMetrics) {
      metrics.preConversion = preConversionMetrics;
    }
    
    // Determine MIME type based on output format
    let mimeType = 'image/png';
    if (metrics.outputFormat === 'avif') mimeType = 'image/avif';
    else if (metrics.outputFormat === 'webp') mimeType = 'image/webp';
    else if (metrics.outputFormat === 'jpeg') mimeType = 'image/jpeg';
    
    res.json({ 
      imageBase64: stegoBuffer.toString('base64'), 
      mime: mimeType, 
      metrics 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/decode
router.post('/decode', upload.single('image'), async (req, res) => {
  try {
    const imageFile = req.file;
    const bitsPerChannel = parseInt(req.body.bitsPerChannel || '1', 10);
    const passphrase = req.body.passphrase || null;
    if (!imageFile) return res.status(400).json({ error: 'image required' });

    const { payload } = await decodeLSB(imageFile.buffer, { bitsPerChannel, channels: [0,1,2], passphrase });
    res.json({ payload: payload.toString('utf8') });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;