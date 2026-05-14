const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const { getEvents } = require('../controllers/calendarController');

router.get('/', verifyToken, getEvents);

module.exports = router;
