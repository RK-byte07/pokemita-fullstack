
const express = require('express');
const router = express.Router();
const controller = require('../controllers/equipos.controller');
const { verificarToken } = require('../middlewares/auth.middleware');

// Todas estas rutas requieren estar logueado
router.use(verificarToken);

router.post('/', controller.guardarEquipo);
router.get('/', controller.listarEquipos);
router.delete('/:id', controller.eliminarEquipo);

module.exports = router;