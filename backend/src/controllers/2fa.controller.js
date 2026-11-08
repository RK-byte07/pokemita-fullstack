// backend/src/controllers/2fa.controller.js
const authService = require('../services/auth.service');

async function generarQR(req, res) {
  try {
    const data = await authService.generar2FA(req.usuario.id);
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function activar(req, res) {
  try {
    const { codigo } = req.body;
    const data = await authService.activar2FA(req.usuario.id, codigo);
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

module.exports = { generarQR, activar };