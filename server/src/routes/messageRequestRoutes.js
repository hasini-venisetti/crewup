const express = require('express');
const {
  sendRequest,
  getRequests,
  getSentRequests,
  acceptRequest,
  declineRequest,
  getStatus,
} = require('../controllers/messageRequestController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/',                       protect, sendRequest);    // send a request
router.get('/',                        protect, getRequests);    // incoming pending requests
router.get('/sent',                    protect, getSentRequests);// outgoing requests
router.get('/status/:userId',          protect, getStatus);     // check status with a user
router.patch('/:requestId/accept',     protect, acceptRequest);  // accept
router.patch('/:requestId/decline',    protect, declineRequest); // decline

module.exports = router;
