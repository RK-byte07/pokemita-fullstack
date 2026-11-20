const express = require('express');
const router = express.Router();

const controller = require('../controllers/pokemon.controller');
const stats = require('../services/pokedex-stats.service');

router.get('/pokedex/meta', (req, res) => {
  res.json(stats.getReport());
});

router.get('/pokedex', (req, res) => {
  res.json(stats.getCatalog());
});

router.get('/pokedex/:name', (req, res, next) => {
  try {
    const data = stats.getDetail(req.params.name);

    if (!data) {
      return res.status(404).json({
        error: 'Pokémon no encontrado.',
      });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get(
  '/pokemon-list',
  controller.getPokemonList,
);

router.get('/items', controller.getItems);

router.get(
  '/pokemon/:name',
  controller.getPokemonDetail,
);

module.exports = router;