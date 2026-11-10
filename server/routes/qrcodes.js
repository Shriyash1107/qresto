const express = require('express');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

function generateShortId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getUniqueShortId() {
  let shortId = generateShortId();
  while (db.prepare('SELECT id FROM qr_codes WHERE short_id = ?').get(shortId)) {
    shortId = generateShortId();
  }
  return shortId;
}

function validateUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// GET /api/qrcodes - List all QR codes for authenticated user
router.get('/', authenticateToken, (req, res) => {
  try {
    const { search, type, active } = req.query;
    let query = 'SELECT * FROM qr_codes WHERE user_id = ?';
    const params = [req.user.id];

    if (search) {
      query += ' AND name LIKE ?';
      params.push(`%${search}%`);
    }
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    if (active !== undefined) {
      query += ' AND is_active = ?';
      params.push(active === 'true' ? 1 : 0);
    }

    query += ' ORDER BY created_at DESC';
    const qrCodes = db.prepare(query).all(...params);

    // Attach multi_links for multi-type QR codes
    const result = qrCodes.map((qr) => {
      const links = db.prepare('SELECT * FROM multi_links WHERE qr_code_id = ? ORDER BY sort_order').all(qr.id);
      return {
        ...qr,
        isActive: qr.is_active === 1,
        fgColor: qr.fg_color,
        bgColor: qr.bg_color,
        logoUrl: qr.logo_url,
        destinationUrl: qr.destination_url,
        totalScans: qr.total_scans,
        shortId: qr.short_id,
        userId: qr.user_id,
        createdAt: qr.created_at,
        updatedAt: qr.updated_at,
        multiLinks: links,
      };
    });

    res.json(result);
  } catch (err) {
    console.error('List QR error:', err);
    res.status(500).json({ error: 'Failed to fetch QR codes' });
  }
});

// POST /api/qrcodes - Create new QR code
router.post('/', authenticateToken, (req, res) => {
  try {
    const { name, type, destinationUrl, fgColor, bgColor, logoUrl, multiLinks } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'QR code name is required' });
    }

    if (type === 'single') {
      if (!destinationUrl) {
        return res.status(400).json({ error: 'Destination URL is required for single redirect QR codes' });
      }
      if (!validateUrl(destinationUrl)) {
        return res.status(400).json({ error: 'Invalid destination URL. Must start with http:// or https://' });
      }
    }

    const id = uuidv4();
    const shortId = getUniqueShortId();

    db.prepare(`
      INSERT INTO qr_codes (id, user_id, name, short_id, type, destination_url, fg_color, bg_color, logo_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, req.user.id, name.trim(), shortId,
      type || 'single',
      destinationUrl || null,
      fgColor || '#000000',
      bgColor || '#FFFFFF',
      logoUrl || null
    );

    // Insert multi-links if provided
    if (type === 'multi' && Array.isArray(multiLinks)) {
      const insertLink = db.prepare(`
        INSERT INTO multi_links (id, qr_code_id, label, url, icon, sort_order)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      multiLinks.forEach((link, index) => {
        if (link.label && link.url) {
          insertLink.run(uuidv4(), id, link.label, link.url, link.icon || 'link', index);
        }
      });
    }

    const qr = db.prepare('SELECT * FROM qr_codes WHERE id = ?').get(id);
    const links = db.prepare('SELECT * FROM multi_links WHERE qr_code_id = ? ORDER BY sort_order').all(id);

    res.status(201).json({
      ...qr,
      isActive: qr.is_active === 1,
      fgColor: qr.fg_color,
      bgColor: qr.bg_color,
      logoUrl: qr.logo_url,
      destinationUrl: qr.destination_url,
      totalScans: qr.total_scans,
      shortId: qr.short_id,
      userId: qr.user_id,
      createdAt: qr.created_at,
      updatedAt: qr.updated_at,
      multiLinks: links,
    });
  } catch (err) {
    console.error('Create QR error:', err);
    res.status(500).json({ error: 'Failed to create QR code' });
  }
});

// GET /api/qrcodes/:id - Get single QR code
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const qr = db.prepare('SELECT * FROM qr_codes WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!qr) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    const links = db.prepare('SELECT * FROM multi_links WHERE qr_code_id = ? ORDER BY sort_order').all(qr.id);

    res.json({
      ...qr,
      isActive: qr.is_active === 1,
      fgColor: qr.fg_color,
      bgColor: qr.bg_color,
      logoUrl: qr.logo_url,
      destinationUrl: qr.destination_url,
      totalScans: qr.total_scans,
      shortId: qr.short_id,
      userId: qr.user_id,
      createdAt: qr.created_at,
      updatedAt: qr.updated_at,
      multiLinks: links,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch QR code' });
  }
});

// PUT /api/qrcodes/:id - Update QR code
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const qr = db.prepare('SELECT * FROM qr_codes WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!qr) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    const { name, destinationUrl, isActive, fgColor, bgColor, logoUrl, multiLinks } = req.body;

    if (destinationUrl !== undefined && destinationUrl !== null && destinationUrl !== '') {
      if (!validateUrl(destinationUrl)) {
        return res.status(400).json({ error: 'Invalid destination URL' });
      }
    }

    db.prepare(`
      UPDATE qr_codes SET
        name = COALESCE(?, name),
        destination_url = ?,
        is_active = ?,
        fg_color = COALESCE(?, fg_color),
        bg_color = COALESCE(?, bg_color),
        logo_url = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(
      name || null,
      destinationUrl !== undefined ? destinationUrl : qr.destination_url,
      isActive !== undefined ? (isActive ? 1 : 0) : qr.is_active,
      fgColor || null,
      bgColor || null,
      logoUrl !== undefined ? logoUrl : qr.logo_url,
      req.params.id,
      req.user.id
    );

    // Update multi-links if provided
    if (Array.isArray(multiLinks)) {
      db.prepare('DELETE FROM multi_links WHERE qr_code_id = ?').run(req.params.id);
      const insertLink = db.prepare(`
        INSERT INTO multi_links (id, qr_code_id, label, url, icon, sort_order)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      multiLinks.forEach((link, index) => {
        if (link.label && link.url) {
          insertLink.run(uuidv4(), req.params.id, link.label, link.url, link.icon || 'link', index);
        }
      });
    }

    const updated = db.prepare('SELECT * FROM qr_codes WHERE id = ?').get(req.params.id);
    const links = db.prepare('SELECT * FROM multi_links WHERE qr_code_id = ? ORDER BY sort_order').all(req.params.id);

    res.json({
      ...updated,
      isActive: updated.is_active === 1,
      fgColor: updated.fg_color,
      bgColor: updated.bg_color,
      logoUrl: updated.logo_url,
      destinationUrl: updated.destination_url,
      totalScans: updated.total_scans,
      shortId: updated.short_id,
      userId: updated.user_id,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
      multiLinks: links,
    });
  } catch (err) {
    console.error('Update QR error:', err);
    res.status(500).json({ error: 'Failed to update QR code' });
  }
});

// DELETE /api/qrcodes/:id
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const qr = db.prepare('SELECT id FROM qr_codes WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!qr) {
      return res.status(404).json({ error: 'QR code not found' });
    }
    db.prepare('DELETE FROM qr_codes WHERE id = ?').run(req.params.id);
    res.json({ message: 'QR code deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete QR code' });
  }
});

// GET /api/qrcodes/:id/image - Generate QR code image
router.get('/:id/image', authenticateToken, async (req, res) => {
  try {
    const qr = db.prepare('SELECT * FROM qr_codes WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!qr) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const redirectUrl = `${baseUrl}/r/${qr.short_id}`;

    const { format = 'png' } = req.query;

    const options = {
      errorCorrectionLevel: 'M',
      type: format === 'svg' ? 'svg' : 'image/png',
      width: 400,
      margin: 2,
      color: {
        dark: qr.fg_color || '#000000',
        light: qr.bg_color || '#FFFFFF',
      },
    };

    if (format === 'svg') {
      const svgString = await QRCode.toString(redirectUrl, { ...options, type: 'svg' });
      res.set('Content-Type', 'image/svg+xml');
      res.send(svgString);
    } else {
      const buffer = await QRCode.toBuffer(redirectUrl, options);
      res.set('Content-Type', 'image/png');
      res.set('Content-Disposition', `attachment; filename="${qr.name.replace(/[^a-z0-9]/gi, '_')}_qr.png"`);
      res.send(buffer);
    }
  } catch (err) {
    console.error('QR image error:', err);
    res.status(500).json({ error: 'Failed to generate QR image' });
  }
});

// GET /api/qrcodes/:id/analytics - Get scan analytics
router.get('/:id/analytics', authenticateToken, (req, res) => {
  try {
    const qr = db.prepare('SELECT * FROM qr_codes WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!qr) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    // Total scans
    const totalScans = db.prepare('SELECT COUNT(*) as count FROM scans WHERE qr_code_id = ?').get(qr.id).count;

    // Daily scans (last 30 days)
    const dailyScans = db.prepare(`
      SELECT DATE(scanned_at) as date, COUNT(*) as scans
      FROM scans
      WHERE qr_code_id = ? AND scanned_at >= DATE('now', '-30 days')
      GROUP BY DATE(scanned_at)
      ORDER BY date ASC
    `).all(qr.id);

    // Device breakdown
    const deviceBreakdown = db.prepare(`
      SELECT device_type, COUNT(*) as count
      FROM scans
      WHERE qr_code_id = ?
      GROUP BY device_type
    `).all(qr.id);

    // Recent scans
    const recentScans = db.prepare(`
      SELECT * FROM scans WHERE qr_code_id = ? ORDER BY scanned_at DESC LIMIT 20
    `).all(qr.id);

    // Unique visitors (by IP)
    const uniqueVisitors = db.prepare(`
      SELECT COUNT(DISTINCT ip_address) as count FROM scans WHERE qr_code_id = ?
    `).get(qr.id).count;

    res.json({
      totalScans,
      uniqueVisitors,
      dailyScans,
      deviceBreakdown,
      recentScans,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
