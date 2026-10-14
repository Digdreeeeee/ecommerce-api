const router = require('express').Router();
const prisma = require('../lib/prisma');
const { HttpError } = require('../middlewares/error');
const { authenticate, authorize } = require('../middlewares/auth');
const parseId = require('../utils/parseId');

const validate = ({ pname, price, quantity }, partial = false) => {
  if (!partial || pname !== undefined) {
    if (typeof pname !== 'string' || !pname.trim()) throw new HttpError(400, 'pname không hợp lệ');
  }
  if (!partial || price !== undefined) {
    if (typeof price !== 'number' || price < 0) throw new HttpError(400, 'price không hợp lệ');
  }
  if (!partial || quantity !== undefined) {
    if (!Number.isInteger(quantity) || quantity < 0) throw new HttpError(400, 'quantity không hợp lệ');
  }
};

router.get('/', async (req, res) => {
  res.json(await prisma.product.findMany({ orderBy: { pid: 'asc' } }));
});

router.get('/:id', async (req, res) => {
  const product = await prisma.product.findUnique({ where: { pid: parseId(req.params.id) } });
  if (!product) throw new HttpError(404, 'Không tìm thấy sản phẩm');
  res.json(product);
});

router.post('/', authenticate, authorize('ADMIN'), async (req, res) => {
  const body = req.body || {};
  validate(body);
  const { pname, price, quantity } = body;
  res.status(201).json(await prisma.product.create({ data: { pname, price, quantity } }));
});

router.put('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  const body = req.body || {};
  validate(body, true);
  const { pname, price, quantity } = body;
  res.json(
    await prisma.product.update({
      where: { pid: parseId(req.params.id) },
      data: { pname, price, quantity },
    })
  );
});

router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  await prisma.product.delete({ where: { pid: parseId(req.params.id) } });
  res.status(204).end();
});

module.exports = router;
