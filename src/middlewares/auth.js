const jwt = require('jsonwebtoken');
const env = require('../config/env');

function authenticate(req, res, next) {
  const [type, token] = (req.headers.authorization || '').split(' ');
  if (type !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Thiếu token' });
  }
  try {
    req.user = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] }); // { uid, role }
    next();
  } catch {
    res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
}

function authorize(...roles) {
  return (req, res, next) =>
    roles.includes(req.user.role)
      ? next()
      : res.status(403).json({ message: 'Không đủ quyền truy cập' });
}

module.exports = { authenticate, authorize };
