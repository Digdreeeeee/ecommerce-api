class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function notFound(req, res) {
  res.status(404).json({ message: 'Không tìm thấy đường dẫn' });
}

function errorHandler(err, req, res, next) {
  if (err.status) return res.status(err.status).json({ message: err.message });
  if (err.code === 'P2002') return res.status(409).json({ message: 'Dữ liệu bị trùng' });
  if (err.code === 'P2025') return res.status(404).json({ message: 'Không tìm thấy bản ghi' });
  if (err.code === 'P2003') return res.status(409).json({ message: 'Dữ liệu đang được liên kết, không thể thao tác' });
  console.error(err);
  res.status(500).json({ message: 'Lỗi hệ thống' });
}

module.exports = { HttpError, notFound, errorHandler };
