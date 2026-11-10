const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const router = express.Router();

function parseUserAgent(ua) {
  if (!ua) return 'Unknown';
  if (/mobile|android|iphone|ipad|tablet/i.test(ua)) return 'Mobile';
  if (/windows|mac|linux/i.test(ua)) return 'Desktop';
  return 'Other';
}

// GET /r/:shortId - Public redirect endpoint
router.get('/:shortId', (req, res) => {
  try {
    const { shortId } = req.params;
    console.log(`🔍 Redirect request for shortId: ${shortId}`);
    
    const qr = db.prepare('SELECT * FROM qr_codes WHERE short_id = ?').get(shortId);
    
    if (!qr) {
      console.log(`❌ QR code not found: ${shortId}`);
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head><title>QR Code Not Found</title></head>
        <body style="font-family: system-ui; text-align: center; padding: 50px;">
          <h1>QR Code Not Found</h1>
          <p>This QR code does not exist or has been deleted.</p>
          <p>Short ID: ${shortId}</p>
        </body>
        </html>
      `);
    }

    console.log(`✅ Found QR code: ${qr.name}, Type: ${qr.type}, Active: ${qr.is_active}, Destination: ${qr.destination_url}`);

    if (qr.is_active !== 1) {
      console.log(`⏸️ QR code inactive: ${shortId}`);
      return res.status(410).send(`
        <!DOCTYPE html>
        <html>
        <head><title>QR Code Inactive</title></head>
        <body style="font-family: system-ui; text-align: center; padding: 50px;">
          <h1>QR Code Inactive</h1>
          <p>This QR code has been deactivated by the owner.</p>
        </body>
        </html>
      `);
    }

    // Track the scan
    const scanId = uuidv4();
    const userAgent = req.headers['user-agent'] || '';
    const deviceType = parseUserAgent(userAgent);
    const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';

    const destinationUrl = qr.destination_url;

    db.prepare(`
      INSERT INTO scans (id, qr_code_id, ip_address, user_agent, device_type, destination_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(scanId, qr.id, ipAddress, userAgent, deviceType, destinationUrl);

    db.prepare(`
      UPDATE qr_codes SET total_scans = total_scans + 1 WHERE id = ?
    `).run(qr.id);

    console.log(`📊 Scan tracked. Total scans: ${qr.total_scans + 1}`);

    // Single redirect
    if (qr.type === 'single' && destinationUrl) {
      console.log(`🔗 Redirecting to: ${destinationUrl}`);
      return res.redirect(302, destinationUrl);
    }

    // Multi-link landing page
    if (qr.type === 'multi') {
      console.log(`📋 Rendering multi-link page`);
      const links = db.prepare('SELECT * FROM multi_links WHERE qr_code_id = ? ORDER BY sort_order').all(qr.id);
      const user = db.prepare('SELECT name, restaurant_name FROM users WHERE id = ?').get(qr.user_id);

      return res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${qr.name}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              padding: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .container {
              max-width: 480px;
              width: 100%;
              background: white;
              border-radius: 20px;
              padding: 40px 30px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              width: 80px;
              height: 80px;
              border-radius: 50%;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 15px;
              font-size: 36px;
              color: white;
            }
            h1 {
              font-size: 24px;
              color: #1a202c;
              margin-bottom: 8px;
            }
            .subtitle {
              color: #718096;
              font-size: 14px;
            }
            .links {
              display: flex;
              flex-direction: column;
              gap: 12px;
            }
            .link-item {
              display: flex;
              align-items: center;
              padding: 16px 20px;
              background: #f7fafc;
              border-radius: 12px;
              text-decoration: none;
              color: #1a202c;
              transition: all 0.2s;
              border: 2px solid transparent;
            }
            .link-item:hover {
              background: #edf2f7;
              border-color: #667eea;
              transform: translateY(-2px);
            }
            .link-icon {
              width: 40px;
              height: 40px;
              border-radius: 10px;
              background: white;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-right: 15px;
              font-size: 20px;
            }
            .link-label {
              flex: 1;
              font-weight: 500;
              font-size: 15px;
            }
            .link-arrow {
              color: #a0aec0;
              font-size: 18px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e2e8f0;
              color: #a0aec0;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🍽️</div>
              <h1>${user.restaurant_name || qr.name}</h1>
              <p class="subtitle">Tap any link below</p>
            </div>
            <div class="links">
              ${links.map(link => `
                <a href="${link.url}" class="link-item" target="_blank" rel="noopener noreferrer">
                  <div class="link-icon">${getIconEmoji(link.icon)}</div>
                  <div class="link-label">${link.label}</div>
                  <div class="link-arrow">→</div>
                </a>
              `).join('')}
            </div>
            <div class="footer">
              Powered by QResto
            </div>
          </div>
        </body>
        </html>
      `);
    }

    // Fallback
    console.log(`⚠️ Invalid QR configuration: Type=${qr.type}, DestinationUrl=${destinationUrl}`);
    res.status(400).send('Invalid QR code configuration');

  } catch (err) {
    console.error('❌ Redirect error:', err);
    res.status(500).send('Server error');
  }
});

function getIconEmoji(icon) {
  const icons = {
    menu: '📋',
    zomato: '🍕',
    swiggy: '🛵',
    website: '🌐',
    ordering: '🛒',
    instagram: '📸',
    facebook: '👥',
    google: '⭐',
    phone: '📞',
    location: '📍',
    link: '🔗',
  };
  return icons[icon] || '🔗';
}

module.exports = router;
