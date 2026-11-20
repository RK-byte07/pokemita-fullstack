export const TIPOS_COLORES = {
  Normal: '#a8a878', Fire: '#f08030', Water: '#6890f0', Electric: '#f8d030',
  Grass: '#78c850', Ice: '#98d8d8', Fighting: '#c03028', Poison: '#a040a0',
  Ground: '#e0c068', Flying: '#a890f0', Psychic: '#f85888', Bug: '#a8b820',
  Rock: '#b8a038', Ghost: '#705898', Dragon: '#7038f8', Dark: '#705848',
  Steel: '#b8b8d0', Fairy: '#ee99ac',
};

export const idFromName = (n) =>
  n.toLowerCase().replace(/[^a-z0-9]/g, '');

export const spriteUrl = (n) =>
  `https://play.pokemonshowdown.com/sprites/ani/${idFromName(n)}.gif`;

export const iconUrl = (n) =>
  `https://play.pokemonshowdown.com/sprites/gen5/${idFromName(n)}.png`;

export function parseHP(str) {
  const clean = (str || '').replace(/[^0-9/]/g, '');
  const parts = clean.split('/').map(Number);
  return {
    cur: parts[0] || 0,
    max: parts[1] || 100,
    pct: parts[1] ? (parts[0] / parts[1]) * 100 : 0,
  };
}