const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err.code === '23505') {
    return res.status(409).json({ success: false, message: 'Bu kayıt zaten mevcut' });
  }
  if (err.code === '23503') {
    return res.status(400).json({ success: false, message: 'İlgili kayıt bulunamadı' });
  }

  const status = err.status || err.statusCode || 500;
  const message = status < 500 ? err.message : 'Sunucu hatası';
  res.status(status).json({ success: false, message });
};

const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `${req.path} bulunamadı` });
};

module.exports = { errorHandler, notFound };
