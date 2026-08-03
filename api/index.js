const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'lp_elgin_maes-main', 'lp-dia_maes_elgin');

// MIME types
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
};

module.exports = (req, res) => {
  // Parse URL
  let pathname = decodeURIComponent(req.url || '/');
  // Remove query string
  pathname = pathname.split('?')[0];
  
  if (pathname === '/') {
    pathname = '/index.html';
  }

  // Prevent directory traversal
  if (pathname.includes('..') || pathname.match(/\/\//)) {
    res.status(400).end('Bad request');
    return;
  }

  // Construct file path
  const filePath = path.join(PUBLIC_DIR, pathname);
  const normalizedPath = path.normalize(filePath);

  // Ensure file is within PUBLIC_DIR
  if (!normalizedPath.startsWith(path.normalize(PUBLIC_DIR))) {
    res.status(403).end('Forbidden');
    return;
  }

  // Check if file exists
  fs.stat(normalizedPath, (err, stats) => {
    if (err) {
      // If not found, try index.html for SPA-like behavior
      const indexPath = path.join(PUBLIC_DIR, 'index.html');
      return fs.readFile(indexPath, (readErr, data) => {
        if (readErr) {
          res.status(404).end('Not found');
          return;
        }
        res.setHeader('Content-Type', MIME_TYPES['.html']);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.end(data);
      });
    }

    if (stats.isDirectory()) {
      const indexPath = path.join(normalizedPath, 'index.html');
      return fs.readFile(indexPath, (readErr, data) => {
        if (readErr) {
          res.status(404).end('Not found');
          return;
        }
        res.setHeader('Content-Type', MIME_TYPES['.html']);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.end(data);
      });
    }

    // Get MIME type
    const ext = path.extname(normalizedPath).toLowerCase();
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

    // Set cache headers based on file type
    const isStatic = ['.woff', '.woff2', '.ttf', '.otf', '.webp', '.jpg', '.png', '.gif', '.mp4'].includes(ext);
    const cacheControl = isStatic ? 'public, max-age=31536000, immutable' : 'public, max-age=3600';

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', cacheControl);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Read and send file
    fs.readFile(normalizedPath, (readErr, data) => {
      if (readErr) {
        res.status(500).end('Server error');
        return;
      }
      res.end(data);
    });
  });
};
