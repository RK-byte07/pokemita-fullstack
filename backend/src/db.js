const mysql = require('mysql2/promise');

// Configuracion via variables de entorno (Render). Con valores por defecto
// para desarrollo local con XAMPP.
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  timezone: 'Z',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pokemita_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

pool.on('connection', connection => {
  connection.query("SET time_zone = '+00:00'");
});

pool
  .getConnection()
  .then(conn => {
    console.log(
      '✅ Conectado a la base de datos MySQL (pokemita_db)',
    );
    conn.release();
  })
  .catch(err => {
    console.error(
      '❌ Error conectando a MySQL:',
      err.message,
    );
  });

module.exports = pool;