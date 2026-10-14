const router = require('express').Router();
const prisma = require('../lib/prisma');
const { HttpError } = require('../middlewares/error');
const { authenticate, authorize } = require('../middlewares/auth');
const parseId = require('../utils/parseId');

const STATUSES = ['PENDING', 'SHIPPING', 'DELIVERED', 'CANCELLED'];

// Xem shipment: chủ đơn hoặc ADMIN
router.get('/:id', authenticate, async (req, res) => {
  const shipment = await prisma.shipment.findUnique({
    where: { shipid: parseId(req.params.id) },
    include: { order: true },
  });
  if (!shipment || (req.user.role !== 'ADMIN' && shipment.order.uid !== req.user.uid)) {
    throw new HttpError(404, 'Không tìm thấy shipment');
  }
  res.json(shipment);
});

router.patch('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  const { status } = req.body || {};
  if (!STATUSES.includes(status)) {
    throw new HttpError(400, `status phải thuộc: ${STATUSES.join(', ')}`);
  }
  res.json(
    await prisma.shipment.update({ where: { shipid: parseId(req.params.id) }, data: { status } })
  );
});

module.exports = router;
