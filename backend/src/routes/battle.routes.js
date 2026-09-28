// backend/src/routes/battle.routes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/battle.controller');

router.get('/battle', controller.autoBattle);
router.post('/manual/start', controller.manualStart);
router.post('/manual/action', controller.manualAction);

module.exports = router;