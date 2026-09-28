// backend/src/app.js
const express = require('express');
const cors = require('cors');

const pokemonRoutes = require('./routes/pokemon.routes');
const battleRoutes = require('./routes/battle.routes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ ok: true, service: 'Pokemita API', version: '1.0.0' });
});

// Rutas
app.use('/api', pokemonRoutes);
app.use('/api', battleRoutes);

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({ error: err.message });
});

module.exports = app;