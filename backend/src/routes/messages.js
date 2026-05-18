const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const ctrl = require('../controllers/messagesController');

router.use(verifyToken);

router.post('/conversation', ctrl.startOrGetConversation);
router.get('/conversations', ctrl.getConversations);
router.get('/:conversationId', ctrl.getMessages);
router.post('/:conversationId', ctrl.sendMessage);
router.put('/:conversationId/read', ctrl.markRead);
router.delete('/:conversationId', ctrl.deleteConversation);

module.exports = router;
