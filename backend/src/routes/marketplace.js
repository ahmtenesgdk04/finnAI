const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/marketplaceController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', ctrl.getAll);
router.get('/mine', ctrl.getMine);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.patch('/:id/status', ctrl.updateStatus);
router.delete('/:id', ctrl.remove);

module.exports = router;
