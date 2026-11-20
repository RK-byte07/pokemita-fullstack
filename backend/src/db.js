// backend/src/db.js
const mysql = require('mysql2/promise');

// En local (XAMPP) mantiene los valores por defecto; en Vercel se
// sobrescriben con variables de entorno del servicio backend.
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',   // Por defecto en XAMPP es root
  password: process.env.DB_PASSWORD || '', // Por defecto en XAMPP está vacío
  database: process.env.DB_NAME || 'pokemita_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Probamos la conexión al arrancar
pool.getConnection()
  .then(conn => {
    console.log('✅ Conectado a la base de datos MySQL (pokemita_db)');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Error conectando a MySQL:', err.message);
  });

module.exports = pool;