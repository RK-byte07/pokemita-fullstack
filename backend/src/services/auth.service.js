// backend/src/services/auth.service.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const QRCode = require('qrcode');
const crypto = require('crypto'); // Importante para validación manual

const JWT_SECRET = process.env.JWT_SECRET || 'pokemita-secreto-super-seguro-2026';

// --- FUNCIÓN AUXILIAR PARA GENERAR TOTP ---
function generarTOTP(secret, offset = 0) {
  // Decodificar Base32
  const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (let i = 0; i < secret.length; i++) {
    const val = base32chars.indexOf(secret.charAt(i).toUpperCase());
    if (val < 0) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substr(i, 8), 2));
  }
  const key = Buffer.from(bytes);

  // Contador de tiempo (ventana de 30 segundos) + offset para tolerancia
  const counter = Math.floor(Date.now() / 1000 / 30) + offset;
  const buffer = Buffer.alloc(8);
  buffer.writeUInt32BE(0, 0);
  buffer.writeUInt32BE(counter, 4);

  const hmac = crypto.createHmac('sha1', key).update(buffer).digest();
  const offsetHmac = hmac[hmac.length - 1] & 0xf;
  const code = ((hmac[offsetHmac] & 0x7f) << 24 |
                hmac[offsetHmac + 1] << 16 |
                hmac[offsetHmac + 2] << 8 |
                hmac[offsetHmac + 3]) % 1000000;
  return code.toString().padStart(6, '0');
}

// --- REGISTRO Y LOGIN ---
async function registrarUsuario({ username, email, phone, password }) {
  const [existing] = await db.query('SELECT id FROM usuarios WHERE email = ?', [email]);
  if (existing.length > 0) throw new Error('El correo ya está registrado');

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const [result] = await db.query(
    'INSERT INTO usuarios (username, email, phone, password_hash) VALUES (?, ?, ?, ?)',
    [username, email, phone, passwordHash]
  );

  const token = jwt.sign(
    { id: result.insertId, email, username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { token, user: { id: result.insertId, username, email, phone, twofa_enabled: false } };
}

async function loginUsuario(email, password) {
  const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
  if (rows.length === 0) throw new Error('Credenciales inválidas');

  const usuario = rows[0];
  const esValida = await bcrypt.compare(password, usuario.password_hash);
  if (!esValida) throw new Error('Credenciales inválidas');

  const token = jwt.sign(
    { id: usuario.id, email: usuario.email, username: usuario.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    token,
    user: { 
      id: usuario.id, 
      username: usuario.username, 
      email: usuario.email, 
      phone: usuario.phone,
      twofa_enabled: usuario.twofa_enabled 
    }
  };
}

// --- 2FA (TOTP) ---
async function generar2FA(usuarioId) {
  const [rows] = await db.query('SELECT email, twofa_secret FROM usuarios WHERE id = ?', [usuarioId]);
  if (rows.length === 0) throw new Error('Usuario no encontrado');

  const email = rows[0].email;
  let secret = rows[0].twofa_secret;

  if (!secret) {
    // Generamos un secreto aleatorio de 32 caracteres Base32
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    secret = '';
    for (let i = 0; i < 32; i++) {
        secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    await db.query('UPDATE usuarios SET twofa_secret = ? WHERE id = ?', [secret, usuarioId]);
  }

  const issuer = 'Pokemita';
  const otpauth = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
  
  const qrImage = await QRCode.toDataURL(otpauth);

  return { secret, qrImage };
}

async function activar2FA(usuarioId, codigo) {
  const [rows] = await db.query('SELECT twofa_secret FROM usuarios WHERE id = ?', [usuarioId]);
  if (rows.length === 0 || !rows[0].twofa_secret) throw new Error('Primero genera el código QR');

  const secret = rows[0].twofa_secret;
  
  // Validar con nuestra función manual (probamos la ventana actual, anterior y siguiente)
  const valido = codigo === generarTOTP(secret, 0) || 
                 codigo === generarTOTP(secret, -1) || 
                 codigo === generarTOTP(secret, 1);

  if (!valido) throw new Error('Código incorrecto');

  await db.query('UPDATE usuarios SET twofa_enabled = TRUE WHERE id = ?', [usuarioId]);
  return { mensaje: '2FA activado correctamente' };
}

async function verificarLogin2FA(usuarioId, codigo) {
  if (!codigo || typeof codigo !== 'string' || !/^\d{6}$/.test(codigo)) {
    throw new Error('El código debe ser de 6 dígitos numéricos');
  }

  const [rows] = await db.query('SELECT * FROM usuarios WHERE id = ?', [usuarioId]);
  if (rows.length === 0) throw new Error('Usuario no encontrado');
  
  const usuario = rows[0];
  if (!usuario.twofa_secret) throw new Error('El 2FA no está configurado para este usuario');

  // VALIDACIÓN ESTRICTA:
  // Solo aceptamos el código de la ventana actual (offset 0) 
  // y, como máximo, el de la ventana inmediatamente anterior (offset -1) 
  // para evitar problemas de latencia.
  // NO aceptamos el offset +1 (códigos futuros).
  const valido = codigo === generarTOTP(usuario.twofa_secret, 0) || 
                 codigo === generarTOTP(usuario.twofa_secret, -1);

  if (!valido) {
    console.log(`[2FA] Código incorrecto. Esperado: ${generarTOTP(usuario.twofa_secret, 0)}, Recibido: ${codigo}`);
    throw new Error('Código 2FA incorrecto o expirado');
  }
  
  const token = jwt.sign(
    { id: usuario.id, email: usuario.email, username: usuario.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    token,
    user: { 
      id: usuario.id, 
      username: usuario.username, 
      email: usuario.email, 
      phone: usuario.phone, 
      twofa_enabled: true 
    }
  };
}

module.exports = {
  registrarUsuario,
  loginUsuario,
  generar2FA,
  activar2FA,
  verificarLogin2FA,
  JWT_SECRET
};