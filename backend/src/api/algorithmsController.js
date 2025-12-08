import express from 'express';
import multer from 'multer';
import { encodeDCT, decodeDCT } from '../algorithms/dct.js';
import { encodeDWT, decodeDWT } from '../algorithms/dwt.js';
import { encodePVD, decodePVD } from '../algorithms/pvd.js';
import { preConvertImage } from '../utils/imageCompression.js';

const router = express.Router();
const upload = multer();

// ============ DCT Routes ============

// POST /api/dct/encode
router.post('/dct/encode', upload.single('image'), async (req, res) => {
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

    const { stegoBuffer, metrics } = await encodeDCT(imageBuffer, payloadBuffer, opts);
    
    // Merge pre-conversion metrics if available
    if (preConversionMetrics) {
      metrics.preConversion = preConversionMetrics;
    }
    
    // Determine MIME type based on output format
    let mimeType = 'image/png';
    if (metrics.outputFormat === 'avif') mimeType = 'image/avif';
    else if (metrics.outputFormat === 'webp') mimeType = 'image/webp';
    else if (metrics.outputFormat === 'jpeg') mimeType = 'image/jpeg';
    
    res.json({ imageBase64: stegoBuffer.toString('base64'), mime: mimeType, metrics });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/dct/decode
router.post('/dct/decode', upload.single('image'), async (req, res) => {
  try {
    const imageFile = req.file;
    const bitsPerChannel = parseInt(req.body.bitsPerChannel || '1', 10);
    const passphrase = req.body.passphrase || null;
    if (!imageFile) return res.status(400).json({ error: 'image required' });

    const { payload } = await decodeDCT(imageFile.buffer, { bitsPerChannel, channels: [0,1,2], passphrase });
    res.json({ payload: payload.toString('utf8') });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ============ DWT Routes ============

// POST /api/dwt/encode
router.post('/dwt/encode', upload.single('image'), async (req, res) => {
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
    const opts = { bitsPerChannel };
    if (encryptPass) opts.encrypt = { passphrase: encryptPass };

    const { stegoBuffer, metrics } = await encodeDWT(imageBuffer, payloadBuffer, opts);
    
    // Merge pre-conversion metrics if available
    if (preConversionMetrics) {
      metrics.preConversion = preConversionMetrics;
    }
    
    // Determine MIME type based on output format
    let mimeType = 'image/png';
    if (metrics.outputFormat === 'avif') mimeType = 'image/avif';
    else if (metrics.outputFormat === 'webp') mimeType = 'image/webp';
    else if (metrics.outputFormat === 'jpeg') mimeType = 'image/jpeg';
    
    res.json({ imageBase64: stegoBuffer.toString('base64'), mime: mimeType, metrics });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/dwt/decode
router.post('/dwt/decode', upload.single('image'), async (req, res) => {
  try {
    const imageFile = req.file;
    const bitsPerChannel = parseInt(req.body.bitsPerChannel || '1', 10);
    const passphrase = req.body.passphrase || null;
    if (!imageFile) return res.status(400).json({ error: 'image required' });

    const { payload } = await decodeDWT(imageFile.buffer, { bitsPerChannel, passphrase });
    res.json({ payload: payload.toString('utf8') });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ============ PVD Routes ============

// POST /api/pvd/encode
router.post('/pvd/encode', upload.single('image'), async (req, res) => {
  try {
    const imageFile = req.file;
    const payloadText = req.body.payload || '';
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
    const opts = {};
    if (encryptPass) opts.encrypt = { passphrase: encryptPass };

    const { stegoBuffer, metrics } = await encodePVD(imageBuffer, payloadBuffer, opts);
    
    // Merge pre-conversion metrics if available
    if (preConversionMetrics) {
      metrics.preConversion = preConversionMetrics;
    }
    
    // Determine MIME type based on output format
    let mimeType = 'image/png';
    if (metrics.outputFormat === 'avif') mimeType = 'image/avif';
    else if (metrics.outputFormat === 'webp') mimeType = 'image/webp';
    else if (metrics.outputFormat === 'jpeg') mimeType = 'image/jpeg';
    
    res.json({ imageBase64: stegoBuffer.toString('base64'), mime: mimeType, metrics });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/pvd/decode
router.post('/pvd/decode', upload.single('image'), async (req, res) => {
  try {
    const imageFile = req.file;
    const passphrase = req.body.passphrase || null;
    if (!imageFile) return res.status(400).json({ error: 'image required' });

    const { payload } = await decodePVD(imageFile.buffer, { passphrase });
    res.json({ payload: payload.toString('utf8') });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
