const router = require('express').Router();
const prisma = require('../lib/prisma');
const { HttpError } = require('../middlewares/error');
const { authenticate } = require('../middlewares/auth');
const parseId = require('../utils/parseId');

router.use(authenticate);

// Tạo đơn: body { "items": [ { "pid": 1, "qty": 2 } ] }
router.post('/', async (req, res) => {
  const { items } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    throw new HttpError(400, 'items phải là mảng không rỗng');
  }
  const seen = new Set();
  for (const it of items) {
    if (!it || !Number.isInteger(it.pid) || !Number.isInteger(it.qty) || it.qty <= 0) {
      throw new HttpError(400, 'Mỗi item cần pid và qty là số nguyên dương');
    }
    if (seen.has(it.pid)) throw new HttpError(400, `Sản phẩm ${it.pid} bị lặp trong đơn`);
    seen.add(it.pid);
  }

  const order = await prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({
      where: { pid: { in: items.map((i) => i.pid) } },
    });
    if (products.length !== items.length) throw new HttpError(404, 'Có sản phẩm không tồn tại');
    const priceOf = new Map(products.map((p) => [p.pid, p.price]));

    for (const it of items) {
      // Trừ kho có điều kiện: chỉ thành công khi còn đủ hàng
      const r = await tx.product.updateMany({
        where: { pid: it.pid, quantity: { gte: it.qty } },
        data: { quantity: { decrement: it.qty } },
      });
      if (r.count === 0) throw new HttpError(409, `Sản phẩm ${it.pid} không đủ tồn kho`);
    }

    return tx.order.create({
      data: {
        uid: req.user.uid,
        details: {
          create: items.map((it) => ({
            pid: it.pid,
            qty: it.qty,
            unit_price: priceOf.get(it.pid), // chốt giá tại thời điểm đặt
          })),
        },
        shipments: { create: { status: 'PENDING' } },
      },
      include: { details: true, shipments: true },
    });
  });

  res.status(201).json(order);
});

// USER chỉ thấy đơn của mình, ADMIN thấy tất cả
router.get('/', async (req, res) => {
  const where = req.user.role === 'ADMIN' ? {} : { uid: req.user.uid };
  res.json(
    await prisma.order.findMany({
      where,
      include: { details: true, shipments: true },
      orderBy: { oid: 'desc' },
    })
  );
});

router.get('/:id', async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { oid: parseId(req.params.id) },
    include: { details: { include: { product: true } }, shipments: true },
  });
  if (!order || (req.user.role !== 'ADMIN' && order.uid !== req.user.uid)) {
    throw new HttpError(404, 'Không tìm thấy đơn hàng');
  }
  res.json(order);
});

module.exports = router;
