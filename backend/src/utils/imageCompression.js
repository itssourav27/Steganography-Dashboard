import sharp from 'sharp';

// Compression notification messages
const COMPRESSION_MESSAGES = {
  FORMAT_CHANGED: (originalFormat, outputFormat, algorithm) => 
    `Image format changed from ${originalFormat} to ${outputFormat} (required for ${algorithm.toUpperCase()} algorithm). This may result in larger file size.`,
  OPTIMIZED: (outputFormat) => 
    `Optimized compression applied while maintaining ${outputFormat.toUpperCase()} format.`
};

/**
 * Detects the format of the input image buffer
 * @param {Buffer} imageBuffer - The input image buffer
 * @returns {Promise<Object>} - Object containing format and metadata
 */
async function detectImageFormat(imageBuffer) {
  const metadata = await sharp(imageBuffer).metadata();
  return {
    format: metadata.format,
    width: metadata.width,
    height: metadata.height,
    size: imageBuffer.length
  };
}

/**
 * Applies optimized compression to the output image to minimize file size
 * while preserving steganography data integrity.
 * 
 * Strategy:
 * - For LSB steganography: Use PNG with optimized compression (lossless required)
 * - For frequency domain methods (DCT/DWT): Can use JPEG with high quality if original was JPEG
 * - For PVD: Use PNG (lossless required for pixel value differences)
 * 
 * @param {Buffer} imageData - Raw image data buffer
 * @param {Object} rawInfo - Raw image info (width, height, channels)
 * @param {Object} options - Compression options
 * @param {string} options.originalFormat - Original image format (png, jpeg, etc.)
 * @param {string} options.algorithm - Steganography algorithm used (lsb, dct, dwt, pvd)
 * @param {number} options.originalSize - Original image file size in bytes
 * @returns {Promise<Object>} - Object containing compressed buffer and metrics
 */
async function compressEncodedImage(imageData, rawInfo, options = {}) {
  const { originalFormat = 'png', algorithm = 'lsb', originalSize = 0 } = options;
  const { width, height, channels } = rawInfo;

  const sharpInstance = sharp(imageData, {
    raw: { width, height, channels }
  });

  let outputBuffer;
  let outputFormat;
  let formatChanged = false;

  // Determine output format and compression strategy based on algorithm
  if (algorithm === 'dct' || algorithm === 'dwt') {
    // Frequency domain methods are more robust to JPEG compression
    if (originalFormat === 'jpeg' || originalFormat === 'jpg') {
      // Use JPEG with high quality to preserve embedded data
      outputBuffer = await sharpInstance
        .jpeg({
          quality: 95, // High quality to minimize data loss
          chromaSubsampling: '4:4:4', // No chroma subsampling for better preservation
          mozjpeg: true // Use mozjpeg for better compression
        })
        .toBuffer();
      outputFormat = 'jpeg';
    } else {
      // Use PNG with optimized compression
      outputBuffer = await sharpInstance
        .png({
          compressionLevel: 9, // Maximum compression
          adaptiveFiltering: true, // Better compression for photographic images
          palette: false // Don't use palette (maintain RGB)
        })
        .toBuffer();
      outputFormat = 'png';
    }
  } else {
    // LSB and PVD require lossless compression - always use PNG
    // Note: Converting from JPEG to PNG will increase file size significantly
    if (originalFormat === 'jpeg' || originalFormat === 'jpg') {
      formatChanged = true;
    }
    outputBuffer = await sharpInstance
      .png({
        compressionLevel: 9, // Maximum compression
        adaptiveFiltering: true,
        palette: false
      })
      .toBuffer();
    outputFormat = 'png';
  }

  // Calculate size metrics
  const outputSize = outputBuffer.length;
  const sizeIncrease = outputSize - originalSize;
  const sizeIncreasePercent = originalSize > 0 
    ? ((sizeIncrease / originalSize) * 100).toFixed(2) 
    : 0;

  return {
    buffer: outputBuffer,
    format: outputFormat,
    metrics: {
      originalSize,
      outputSize,
      sizeIncrease,
      sizeIncreasePercent: parseFloat(sizeIncreasePercent),
      compressionApplied: true,
      formatChanged,
      originalFormat,
      note: formatChanged 
        ? COMPRESSION_MESSAGES.FORMAT_CHANGED(originalFormat, outputFormat, algorithm)
        : COMPRESSION_MESSAGES.OPTIMIZED(outputFormat)
    }
  };
}

/**
 * Creates a standardized response with file size metrics
 * Note: Currently not used but kept for potential future use
 * @param {Buffer} stegoBuffer - The encoded image buffer
 * @param {Object} originalMetrics - Original image metrics
 * @param {Object} algorithmMetrics - Algorithm-specific metrics
 * @returns {Object} - Complete metrics object
 */
function createMetricsResponse(stegoBuffer, originalMetrics, algorithmMetrics) {
  const sizeIncrease = stegoBuffer.length - originalMetrics.size;
  const increasePercent = originalMetrics.size > 0
    ? ((sizeIncrease / originalMetrics.size) * 100).toFixed(2)
    : '0.00';
  
  return {
    ...algorithmMetrics,
    fileSize: {
      original: originalMetrics.size,
      encoded: stegoBuffer.length,
      increase: sizeIncrease,
      increasePercent: increasePercent
    }
  };
}

export {
  detectImageFormat,
  compressEncodedImage,
  createMetricsResponse
};
