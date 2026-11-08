// backend/src/db.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',       // Por defecto en XAMPP es root
  password: '',       // Por defecto en XAMPP está vacío
  database: 'pokemita_db',
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