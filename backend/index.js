const archiver = require('archiver');
const unzipper = require('unzipper');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
if (!fs.existsSync('outputs')) fs.mkdirSync('outputs');

const COMPRESSOR = path.join(__dirname, '..', 'compressor');

function zipFile(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', () => resolve());
    archive.on('error', (err) => reject(err));
    archive.pipe(output);
    archive.file(inputPath, { name: path.basename(inputPath) });
    archive.finalize();
  });
}

// Ghostscript PDF compression
// quality 1-100 maps to Ghostscript presets
function compressPDF(inputPath, outputPath, quality) {
  return new Promise((resolve, reject) => {
    let setting = '/ebook'; // balanced default
    if (quality >= 80) setting = '/printer';      // high quality, larger
    else if (quality >= 50) setting = '/ebook';    // balanced
    else setting = '/screen';                      // smallest, lower quality

    const cmd = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=${setting} -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outputPath}" "${inputPath}"`;

    try {
      execSync(cmd);
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

// ==================== COMPRESS ====================
app.post('/compress', upload.single('file'), async (req, res) => {
  try {
    const inputPath = path.resolve(req.file.path);
    const ext = path.extname(req.file.originalname).toLowerCase();
    const originalSize = fs.statSync(inputPath).size;

    // Quality slider from frontend (1-100), default 70
    const quality = parseInt(req.body.quality) || 70;
    // Max dimension from frontend (optional), e.g. 1920
    const maxDimension = req.body.maxDimension ? parseInt(req.body.maxDimension) : null;

    // ── TXT → Huffman ──
    if (ext === '.txt') {
      const outputName = req.file.originalname + '.bin';
      const outputPath = path.join(__dirname, 'outputs', outputName);
      execSync(`"${COMPRESSOR}" compress "${inputPath}" "${outputPath}"`);
      const compressedSize = fs.statSync(outputPath).size;
      const saved = Math.max(0, Math.round((1 - compressedSize / originalSize) * 100));
      return res.json({ success: true, originalSize, compressedSize, saved, outputFile: outputName, method: 'Huffman Encoding' });
    }

    // ── JPG / JPEG → Sharp (quality + resize) ──
    if (ext === '.jpg' || ext === '.jpeg') {
      const outputName = 'compressed_' + req.file.originalname;
      const outputPath = path.join(__dirname, 'outputs', outputName);

      let pipeline = sharp(inputPath);
      if (maxDimension) {
        pipeline = pipeline.resize(maxDimension, maxDimension, { fit: 'inside', withoutEnlargement: true });
      }
      await pipeline.jpeg({ quality, mozjpeg: true }).toFile(outputPath);

      const compressedSize = fs.statSync(outputPath).size;
      const saved = Math.max(0, Math.round((1 - compressedSize / originalSize) * 100));
      return res.json({ success: true, originalSize, compressedSize, saved, outputFile: outputName, method: 'JPEG Optimization' });
    }

    // ── PNG → Sharp (quality + resize) ──
    if (ext === '.png') {
      const outputName = 'compressed_' + req.file.originalname;
      const outputPath = path.join(__dirname, 'outputs', outputName);

      let pipeline = sharp(inputPath);
      if (maxDimension) {
        pipeline = pipeline.resize(maxDimension, maxDimension, { fit: 'inside', withoutEnlargement: true });
      }
      const compressionLevel = Math.round((100 - quality) / 11);
      await pipeline.png({ compressionLevel, quality, palette: quality < 70 }).toFile(outputPath);

      const compressedSize = fs.statSync(outputPath).size;
      const saved = Math.max(0, Math.round((1 - compressedSize / originalSize) * 100));
      return res.json({ success: true, originalSize, compressedSize, saved, outputFile: outputName, method: 'PNG Optimization' });
    }

    // ── WEBP → Sharp (quality + resize) ──
    if (ext === '.webp') {
      const outputName = 'compressed_' + req.file.originalname;
      const outputPath = path.join(__dirname, 'outputs', outputName);

      let pipeline = sharp(inputPath);
      if (maxDimension) {
        pipeline = pipeline.resize(maxDimension, maxDimension, { fit: 'inside', withoutEnlargement: true });
      }
      await pipeline.webp({ quality }).toFile(outputPath);

      const compressedSize = fs.statSync(outputPath).size;
      const saved = Math.max(0, Math.round((1 - compressedSize / originalSize) * 100));
      return res.json({ success: true, originalSize, compressedSize, saved, outputFile: outputName, method: 'WebP Optimization' });
    }

    // ── PDF → Ghostscript ──
    if (ext === '.pdf') {
      const outputName = 'compressed_' + req.file.originalname;
      const outputPath = path.join(__dirname, 'outputs', outputName);

      await compressPDF(inputPath, outputPath, quality);

      const compressedSize = fs.statSync(outputPath).size;
      const saved = Math.max(0, Math.round((1 - compressedSize / originalSize) * 100));
      return res.json({ success: true, originalSize, compressedSize, saved, outputFile: outputName, method: 'Ghostscript PDF Compression' });
    }

    // ── DOCX / DOC → ZIP (fallback, no good native compressor) ──
    const outputName = req.file.originalname + '.zip';
    const outputPath = path.join(__dirname, 'outputs', outputName);
    await zipFile(inputPath, outputPath);
    const compressedSize = fs.statSync(outputPath).size;
    const saved = Math.max(0, Math.round((1 - compressedSize / originalSize) * 100));
    return res.json({ success: true, originalSize, compressedSize, saved, outputFile: outputName, method: 'ZIP Compression' });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== DECOMPRESS ====================
app.post('/decompress', upload.single('file'), async (req, res) => {
  try {
    const inputPath = path.resolve(req.file.path);

    // ZIP file
    if (req.file.originalname.endsWith('.zip')) {
      const extractDir = path.join(__dirname, 'outputs', Date.now().toString());
      fs.mkdirSync(extractDir, { recursive: true });
      await fs.createReadStream(inputPath).pipe(unzipper.Extract({ path: extractDir })).promise();
      const files = fs.readdirSync(extractDir);
      if (!files.length) throw new Error('ZIP is empty');
      const recoveredFile = path.join(extractDir, files[0]);
      return res.json({
        success: true,
        outputFile: `${path.basename(extractDir)}/${files[0]}`,
        recoveredSize: fs.statSync(recoveredFile).size
      });
    }

    // BIN file (Huffman)
    const originalName = req.file.originalname.replace('.bin', '');
    const outputName = 'recovered_' + originalName;
    const outputPath = path.join(__dirname, 'outputs', outputName);
    execSync(`"${COMPRESSOR}" decompress "${inputPath}" "${outputPath}"`);
    return res.json({ success: true, outputFile: outputName });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== DOWNLOAD ====================
app.get('/download/*filepath', (req, res) => {
  let fileParam = req.params.filepath;
  if (Array.isArray(fileParam)) fileParam = fileParam.join('/');
  const filePath = path.join(__dirname, 'outputs', fileParam);
  if (fs.existsSync(filePath)) return res.download(filePath);
  res.status(404).json({ error: 'File not found' });
});

app.listen(process.env.PORT || 5001, () => {
  console.log('✅ Backend running');
});