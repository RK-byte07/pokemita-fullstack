const express = require('express');
const router = express.Router();
const controller = require('../controllers/2fa.controller');
const { verificarToken } = require('../middlewares/auth.middleware');

router.use(verificarToken); // Protegemos las rutas
router.post('/generar', controller.generarQR);
router.post('/activar', controller.activar);

module.exports = router;