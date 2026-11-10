const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/analytics/dashboard - Dashboard stats
router.get('/dashboard', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;

    // Total QR codes
    const totalQRCodes = db.prepare('SELECT COUNT(*) as count FROM qr_codes WHERE user_id = ?').get(userId).count;

    // Active QR codes
    const activeQRCodes = db.prepare('SELECT COUNT(*) as count FROM qr_codes WHERE user_id = ? AND is_active = 1').get(userId).count;

    // Total scans
    const totalScans = db.prepare(`
      SELECT COUNT(*) as count FROM scans s
      JOIN qr_codes q ON s.qr_code_id = q.id
      WHERE q.user_id = ?
    `).get(userId).count;

    // Scans today
    const scansToday = db.prepare(`
      SELECT COUNT(*) as count FROM scans s
      JOIN qr_codes q ON s.qr_code_id = q.id
      WHERE q.user_id = ? AND DATE(s.scanned_at) = DATE('now')
    `).get(userId).count;

    // Scans this month
    const scansThisMonth = db.prepare(`
      SELECT COUNT(*) as count FROM scans s
      JOIN qr_codes q ON s.qr_code_id = q.id
      WHERE q.user_id = ? AND strftime('%Y-%m', s.scanned_at) = strftime('%Y-%m', 'now')
    `).get(userId).count;

    // Daily scans last 30 days
    const dailyScans = db.prepare(`
      SELECT DATE(s.scanned_at) as date, COUNT(*) as scans
      FROM scans s
      JOIN qr_codes q ON s.qr_code_id = q.id
      WHERE q.user_id = ? AND s.scanned_at >= DATE('now', '-30 days')
      GROUP BY DATE(s.scanned_at)
      ORDER BY date ASC
    `).all(userId);

    // Top QR codes by scans
    const topQRCodes = db.prepare(`
      SELECT q.id, q.name, q.short_id, q.type, q.is_active, COUNT(s.id) as scan_count
      FROM qr_codes q
      LEFT JOIN scans s ON q.id = s.qr_code_id
      WHERE q.user_id = ?
      GROUP BY q.id
      ORDER BY scan_count DESC
      LIMIT 5
    `).all(userId);

    // Recent activity (last 10 scans)
    const recentActivity = db.prepare(`
      SELECT s.*, q.name as qr_name, q.short_id
      FROM scans s
      JOIN qr_codes q ON s.qr_code_id = q.id
      WHERE q.user_id = ?
      ORDER BY s.scanned_at DESC
      LIMIT 10
    `).all(userId);

    // Device breakdown
    const deviceBreakdown = db.prepare(`
      SELECT s.device_type, COUNT(*) as count
      FROM scans s
      JOIN qr_codes q ON s.qr_code_id = q.id
      WHERE q.user_id = ?
      GROUP BY s.device_type
    `).all(userId);

    // Monthly scans last 6 months
    const monthlyScans = db.prepare(`
      SELECT strftime('%Y-%m', s.scanned_at) as month, COUNT(*) as scans
      FROM scans s
      JOIN qr_codes q ON s.qr_code_id = q.id
      WHERE q.user_id = ? AND s.scanned_at >= DATE('now', '-6 months')
      GROUP BY strftime('%Y-%m', s.scanned_at)
      ORDER BY month ASC
    `).all(userId);

    res.json({
      stats: {
        totalQRCodes,
        activeQRCodes,
        totalScans,
        scansToday,
        scansThisMonth,
      },
      dailyScans,
      monthlyScans,
      topQRCodes: topQRCodes.map((q) => ({
        ...q,
        isActive: q.is_active === 1,
        scanCount: q.scan_count,
      })),
      recentActivity,
      deviceBreakdown,
    });
  } catch (err) {
    console.error('Dashboard analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
