const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const ctrl = require('../controllers/collectionController');

router.get('/', verifyToken, ctrl.getAll);
router.post('/', verifyToken, ctrl.add);
router.patch('/:id/paid', verifyToken, ctrl.markPaid);
router.delete('/:id', verifyToken, ctrl.remove);
router.post('/analyze', verifyToken, ctrl.analyze);

module.exports = router;
