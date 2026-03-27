const express = require('express');
const { getCreators } = require('../controllers/exploreController');
const { optionalProtect } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalProtect, getCreators);

module.exports = router;
