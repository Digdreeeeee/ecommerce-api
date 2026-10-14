const { HttpError } = require('../middlewares/error');

module.exports = function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0 || id > 2147483647) {
    throw new HttpError(400, 'ID không hợp lệ');
  }
  return id;
};
