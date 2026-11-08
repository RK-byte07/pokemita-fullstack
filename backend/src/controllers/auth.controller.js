// backend/src/controllers/auth.controller.js
const authService = require('../services/auth.service');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../services/auth.service');

async function register(req, res) {
  try {
    const { username, email, phone, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    const data = await authService.registrarUsuario({ username, email, phone, password });
    res.status(201).json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const data = await authService.loginUsuario(email, password);

    // SI TIENE 2FA ACTIVADO
    if (data.user.twofa_enabled) {
      const tokenTemporal = jwt.sign(
        { id: data.user.id, etapa: 'pendiente-2fa' },
        JWT_SECRET,
        { expiresIn: '5m' }
      );
      return res.json({ 
        requiere2FA: true, 
        tokenTemporal,
        user: data.user 
      });
    }

    // SI NO TIENE 2FA
    res.json(data);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
}

async function verificar2FALogin(req, res) {
  try {
    const { tokenTemporal, codigo } = req.body;
    
    // 1. Verificar que el token temporal sea válido
    const decoded = jwt.verify(tokenTemporal, JWT_SECRET);
    if (decoded.etapa !== 'pendiente-2fa') throw new Error('Token temporal inválido');
    
    // 2. Llamar al servicio. Si el código es incorrecto, lanzará un error y saltará al catch.
    const data = await authService.verificarLogin2FA(decoded.id, codigo);
    
    res.json(data);
  } catch (error) {
    console.error('[2FA Login Error]', error.message); // Verás el error en tu terminal
    // IMPORTANTE: Devolvemos 401 para que el frontend sepa que falló
    res.status(401).json({ error: error.message });
  }
}

module.exports = { register, login, verificar2FALogin };