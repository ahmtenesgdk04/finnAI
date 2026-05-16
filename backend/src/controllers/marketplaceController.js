const marketplaceModel = require('../models/marketplaceModel');

exports.create = async (req, res, next) => {
  try {
    const {
      title, category, description, unitPrice, currency,
      minOrderQty, unit, totalStock, deliveryTime,
      deliveryMethod, paymentTerms, contactPreference, city,
    } = req.body;

    if (!title || !category || !unitPrice || !minOrderQty || !unit || !city) {
      return res.status(400).json({ error: 'Zorunlu alanlar eksik.' });
    }
    if (!Array.isArray(contactPreference) || contactPreference.length === 0) {
      return res.status(400).json({ error: 'En az bir iletişim tercihi gerekli.' });
    }

    const listing = await marketplaceModel.create(req.user.id, {
      title, category, description, unitPrice, currency: currency || 'TL',
      minOrderQty, unit, totalStock, deliveryTime,
      deliveryMethod, paymentTerms, contactPreference, city,
    });

    res.status(201).json(listing);
  } catch (err) {
    next(err);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const { category, city, search } = req.query;
    const listings = await marketplaceModel.getAll({ category, city, search });
    res.json(listings);
  } catch (err) {
    next(err);
  }
};

exports.getMine = async (req, res, next) => {
  try {
    const listings = await marketplaceModel.getMine(req.user.id);
    res.json(listings);
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const listing = await marketplaceModel.getById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'İlan bulunamadı.' });
    res.json(listing);
  } catch (err) {
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'passive', 'sold'].includes(status)) {
      return res.status(400).json({ error: 'Geçersiz durum.' });
    }
    const listing = await marketplaceModel.updateStatus(req.user.id, req.params.id, status);
    if (!listing) return res.status(404).json({ error: 'İlan bulunamadı.' });
    res.json(listing);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await marketplaceModel.remove(req.user.id, req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
