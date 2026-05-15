// Takvim endpoint'i — ileride abonelik/taksit/borç verilerini birleştirir
const getEvents = async (req, res, next) => {
  try {
    // Şimdilik boş dizi; Dev1 + Dev2 verileriyle doldurulacak
    res.json({ success: true, events: [] });
  } catch (err) {
    next(err);
  }
};

module.exports = { getEvents };
