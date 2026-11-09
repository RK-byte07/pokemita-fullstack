const router = require('express').Router();
const db = require('../db');

const {
  verificarToken,
} = require('../middlewares/auth.middleware');

const {
  dex,
} = require('../services/simulator-teams');

const service = require('../services/profile.service');

router.use(verificarToken);

router.use((req, res, next) => {
  if (req.usuario.etapa || !req.usuario.id) {
    return res.status(401).json({
      error: 'Completa tu autenticación.',
    });
  }

  next();
});

router.get('/', async (req, res) => {
  if (!['strict', 'bag'].includes(req.query.rules)) {
    return res.status(400).json({
      error: 'Selecciona las reglas.',
    });
  }

  const page = Number(req.query.page || 1);

  if (
    !Number.isSafeInteger(page) ||
    page < 1 ||
    page > 100000
  ) {
    return res.status(400).json({
      error: 'Página inválida.',
    });
  }

  try {
    const data = await service.profile(
      req.usuario.id,
      req.query.rules,
      page,
    );

    res.json(data);
  } catch (error) {
    console.error('[Perfil]', error.message);

    res.status(503).json({
      error:
        'No se pudo consultar el perfil. ' +
        'Comprueba MySQL y ejecuta backend/sql/perfil.sql.',
    });
  }
});

router.patch('/', async (req, res) => {
  const { bio, avatar_pokemon } = req.body;

  const species =
    typeof avatar_pokemon === 'string' &&
    dex.species.get(avatar_pokemon);

  if (
    typeof bio !== 'string' ||
    bio.length > 250 ||
    !species?.exists ||
    species.num < 1
  ) {
    return res.status(400).json({
      error:
        'Biografía de hasta 250 caracteres y Pokémon válido.',
    });
  }

  try {
    await db.execute(
      `UPDATE usuarios
       SET bio = ?, avatar_pokemon = ?
       WHERE id = ?`,
      [
        bio.trim(),
        species.spriteid,
        req.usuario.id,
      ],
    );

    res.json({ ok: true });
  } catch (error) {
    console.error('[Perfil]', error.message);

    res.status(503).json({
      error: 'No se pudieron guardar los cambios.',
    });
  }
});

module.exports = router;