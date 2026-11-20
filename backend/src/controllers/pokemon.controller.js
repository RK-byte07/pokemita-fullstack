const pokedex = require('../services/pokedex.service');

function getPokemonList(req, res) {
  res.json(pokedex.getPokemonList());
}

function getItems(req, res) {
  res.json(pokedex.getItemsList());
}

function getPokemonDetail(req, res) {
  const nombre = decodeURIComponent(req.params.name);
  res.json({
    moves: pokedex.getMovesForPokemon(nombre),
    abilities: pokedex.getAbilitiesForPokemon(nombre),
    metaMoves: pokedex.getMetaMovesFor(nombre),
  });
}

module.exports = {
  getPokemonList,
  getItems,
  getPokemonDetail,
};