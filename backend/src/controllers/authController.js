const authService = require('../services/authService');

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Ad, e-posta ve şifre zorunlu' });
    const result = await authService.register({ name, email, password });
    res.status(201).json(result);
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'E-posta ve şifre zorunlu' });
    const result = await authService.login({ email, password });
    res.json(result);
  } catch (err) { next(err); }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    res.json(user);
  } catch (err) { next(err); }
};

const updateMode = async (req, res, next) => {
  try {
    const { mode } = req.body;
    if (!['personal', 'business'].includes(mode))
      return res.status(400).json({ error: "Mod 'personal' veya 'business' olmalı" });
    const user = await authService.updateMode(req.user.id, mode);
    res.json(user);
  } catch (err) { next(err); }
};

module.exports = { register, login, getMe, updateMode };
