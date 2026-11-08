// backend/server.js
require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const { inicializarWebSockets } = require('./src/sockets/battle.socket');

const PORT = process.env.PORT || 3000;

// Creamos el servidor HTTP a partir de Express
const server = http.createServer(app);

// Inicializamos WebSockets sobre el mismo servidor
inicializarWebSockets(server);

server.listen(PORT, () => {
  console.log('');
  console.log('===========================================');
  console.log('  🎮 Pokemita Backend + WebSockets');
  console.log('  Puerto: ' + PORT);
  console.log('  Entorno: ' + process.env.NODE_ENV);
  console.log('  URL: http://localhost:' + PORT);
  console.log('===========================================');
  console.log('');
});