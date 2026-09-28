// backend/server.js
require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('');
  console.log('===========================================');
  console.log('  🎮 Pokemita Backend');
  console.log('  Puerto: ' + PORT);
  console.log('  Entorno: ' + process.env.NODE_ENV);
  console.log('  URL: http://localhost:' + PORT);
  console.log('===========================================');
  console.log('');
});