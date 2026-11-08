// backend/src/middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../services/auth.service');

function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado: no hay token' });
  }

  try {
    const verificado = jwt.verify(token, JWT_SECRET);
    req.usuario = verificado; // Guardamos los datos del usuario en la request
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

module.exports = { verificarToken };