const router = require('express').Router();
const prisma = require('../lib/prisma');

// Liveness: tiến trình còn sống không (không đụng DB)
router.get('/', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Readiness: app có sẵn sàng phục vụ không (kiểm tra DB)
router.get('/ready', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'up' });
  } catch (err) {
    res.status(503).json({ status: 'error', database: 'down' });
  }
});

module.exports = router;
