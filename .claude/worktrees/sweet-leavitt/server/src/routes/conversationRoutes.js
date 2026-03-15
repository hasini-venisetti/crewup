const express = require('express');
const {
  getConversations,
  startConversation,
  getMessages,
  sendMessage,
  getProjectChat,
  getProjectChatMessages,
} = require('../controllers/conversationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

/* Private conversations */
router.get('/conversations',             protect, getConversations);
router.post('/conversations',            protect, startConversation);

/* Messages (REST fallback — Socket.io is primary) */
router.get('/messages/:conversationId',  protect, getMessages);
router.post('/messages',                 protect, sendMessage);

/* Project group chat */
router.get('/project-chat/:projectId',            protect, getProjectChat);
router.get('/project-chat/:projectId/messages',   protect, getProjectChatMessages);

module.exports = router;
