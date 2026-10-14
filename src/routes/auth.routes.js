const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const prisma = require('../lib/prisma');
const { HttpError } = require('../middlewares/error');
const { authenticate } = require('../middlewares/auth');

const sign = (user) =>
  jwt.sign({ uid: user.uid, role: user.role.rolename }, env.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: env.jwtExpiresIn,
  });

router.post('/register', async (req, res) => {
  const { username, fullname, password } = req.body || {};
  if (!username || !fullname || !password || password.length < 6) {
    throw new HttpError(400, 'Cần username, fullname và password (tối thiểu 6 ký tự)');
  }

  const role = await prisma.role.findUnique({ where: { rolename: 'normal' } });
  const membership = await prisma.membership.findUnique({ where: { mname: 'normal' } });
  if (!role || !membership) throw new HttpError(500, 'Chưa seed dữ liệu nền (chạy: npm run seed)');

  const user = await prisma.user.create({
    data: {
      username,
      fullname,
      password: await bcrypt.hash(password, env.saltRounds),
      roleid: role.roleid,
      mid: membership.mid,
    },
    select: { uid: true, username: true, fullname: true, role: true, membership: true },
  });
  res.status(201).json(user);
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) throw new HttpError(400, 'Cần username và password');

  const user = await prisma.user.findUnique({ where: { username }, include: { role: true } });
  const ok = user && (await bcrypt.compare(password, user.password));
  if (!ok) throw new HttpError(401, 'Sai tên đăng nhập hoặc mật khẩu');

  res.json({ token: sign(user), tokenType: 'Bearer' });
});

router.get('/me', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { uid: req.user.uid },
    select: { uid: true, username: true, fullname: true, role: true, membership: true },
  });
  res.json(user);
});

module.exports = router;
