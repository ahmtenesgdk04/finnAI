const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const ctrl = require('../controllers/ordersController');

router.use(verifyToken);

router.get('/', ctrl.getOrders);
router.post('/', ctrl.create);
router.patch('/:id/status', ctrl.updateStatus);
router.delete('/:id', ctrl.deleteOrder);

module.exports = router;
