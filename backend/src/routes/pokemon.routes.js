// backend/src/routes/pokemon.routes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/pokemon.controller');

router.get('/pokemon-list', controller.getPokemonList);
router.get('/items', controller.getItems);
router.get('/pokemon/:name', controller.getPokemonDetail);

module.exports = router;