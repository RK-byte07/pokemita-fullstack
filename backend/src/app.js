// backend/src/app.js
const express = require('express');
const cors = require('cors');

const pokemonRoutes = require('./routes/pokemon.routes');
const battleRoutes = require('./routes/battle.routes');
const authRoutes = require('./routes/auth.routes');
const equiposRoutes = require('./routes/equipos.routes');
const dosfaRoutes = require('./routes/2fa.routes'); // <-- NUEVO

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/', (req, res) => {
  res.json({ ok: true, service: 'Pokemita API', version: '1.0.0' });
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/equipos', equiposRoutes);
app.use('/api/2fa', dosfaRoutes); // <-- NUEVO
app.use('/api', pokemonRoutes);
app.use('/api', battleRoutes);

app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({ error: err.message });
});

module.exports = app;