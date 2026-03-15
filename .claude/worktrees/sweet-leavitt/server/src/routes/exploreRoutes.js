const express = require('express');
const { getCreators } = require('../controllers/exploreController');

const router = express.Router();

router.get('/', getCreators);

module.exports = router;
