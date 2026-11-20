const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  timezone: 'Z',
  user: 'root',
  password: '',
  database: 'pokemita_db',
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