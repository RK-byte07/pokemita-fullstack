const {
  Dex,
  Teams,
  TeamValidator,
} = require('pokemon-showdown');

const { randomInt } = require('node:crypto');
const { OU_POOL } = require('./equipos.service');

const dex = Dex.mod('gen9');
const validator = new TeamValidator('gen9ou');

const keys = [
  'hp',
  'atk',
  'def',
  'spa',
  'spd',
  'spe',
];

function allowed(species) {
  return (
    species.exists &&
    species.num > 0 &&
    !species.isNonstandard &&
    !species.battleOnly &&
    !species.isCosmeticForme &&
    !species.placeholderFor &&
    !validator.ruleTable.isBannedSpecies(species)
  );
}

function abilities(species) {
  return Object.entries(species.abilities).map(
    ([slot, name]) => {
      const ability = dex.abilities.get(name);

      return {
        id: ability.id,
        name: ability.name,
        hidden: slot === 'H',
        banned:
          validator.ruleTable.isBanned(
            `ability:${ability.id}`,
          ) ||
          (
            slot === 'H' &&
            species.unreleasedHidden === true
          ),
        desc: ability.shortDesc || ability.desc,
      };
    },
  );
}

function vector(value, fallback) {
  if (typeof value === 'string') {
    value = value.split(',').map(Number);
  }

  return Object.fromEntries(
    keys.map((key, index) => [
      key,
      value?.[key] ?? value?.[index] ?? fallback,
    ]),
  );
}

function normalize(member) {
  const species = dex.species.get(
    member.species || member.name,
  );

  if (!allowed(species)) {
    throw new Error(
      `Especie no disponible en OU: ${
        member.species || member.name
      }`,
    );
  }

  return {
    name: species.name,
    species: species.name,
    ability:
      member.ability ||
      abilities(species).find(
        ability => !ability.banned,
      )?.name,
    item: member.item ?? 'Leftovers',
    moves: Array.isArray(member.moves)
      ? member.moves.map(
          move => dex.moves.get(move).name || move,
        )
      : [],
    nature: member.nature || 'Jolly',
    level: 100,
    evs: vector(member.evs, 0),
    ivs: vector(member.ivs, 31),
    teraType:
      member.teraType ||
      species.requiredTeraType ||
      species.types[0],
  };
}

const pool = OU_POOL
  .map(text => Teams.import(text)[0])
  .filter(
    set =>
      !validator.validateTeam([
        structuredClone(set),
      ]),
  );

if (pool.length < 6) {
  throw new Error(
    'No hay suficientes conjuntos legales en el pool OU.',
  );
}

function randomTeam() {
  const shuffled = structuredClone(pool);

  for (
    let index = shuffled.length - 1;
    index > 0;
    index--
  ) {
    const other = randomInt(index + 1);

    [shuffled[index], shuffled[other]] = [
      shuffled[other],
      shuffled[index],
    ];
  }

  const team = shuffled
    .slice(0, 6)
    .map(normalize);

  const errors = validator.validateTeam(
    structuredClone(team),
  );

  if (errors) {
    throw new Error(errors.join('\n'));
  }

  return team;
}

function validate(input) {
  try {
    if (typeof input === 'string') {
      input = Teams.import(input);
    }

    if (
      !Array.isArray(input) ||
      input.length !== 6
    ) {
      return {
        errors: [
          'El equipo debe tener exactamente seis Pokémon.',
        ],
      };
    }

    const team = input.map(normalize);

    for (const set of team) {
      for (const key of keys) {
        if (
          !Number.isInteger(set.evs[key]) ||
          set.evs[key] < 0 ||
          set.evs[key] > 252 ||
          !Number.isInteger(set.ivs[key]) ||
          set.ivs[key] < 0 ||
          set.ivs[key] > 31
        ) {
          throw new Error(
            `${set.species}: EVs o IVs inválidos.`,
          );
        }
      }
    }

    const errors = validator.validateTeam(
      structuredClone(team),
    );

    return errors
      ? { errors }
      : { team, errors: [] };
  } catch (error) {
    return {
      errors: [error.message],
    };
  }
}

const catalog = dex.species
  .all()
  .filter(allowed)
  .map(species => ({
    id: species.id,
    name: species.name,
    species: species.name,
    types: species.types,
    sprite: species.spriteid,
    num: species.num,
    tier: species.tier,
    bst: species.bst,
    baseStats: species.baseStats,
    abilityCount: abilities(species).filter(
      ability => !ability.banned,
    ).length,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

const editorCache = new Map();

function editor(name) {
  const species = dex.species.get(name);

  if (!allowed(species)) return null;

  if (editorCache.has(species.id)) {
    return editorCache.get(species.id);
  }

  const moves = [
    ...dex.species.getMovePool(species.id),
  ]
    .map(id => dex.moves.get(id))
    .filter(
      move =>
        move.exists &&
        !move.isNonstandard &&
        !move.isZ &&
        !move.isMax &&
        !validator.ruleTable.isBanned(
          `move:${move.id}`,
        ),
    )
    .map(move => ({
      id: move.id,
      name: move.name,
      type: move.type,
      category: move.category,
      power: move.basePower,
      pp: move.pp,
      accuracy: move.accuracy,
      desc: move.shortDesc || move.desc,
    }))
    .sort((a, b) =>
      a.name.localeCompare(b.name),
    );

  const recommended = pool.find(
    set =>
      dex.species.get(set.species).id ===
      species.id,
  );

  const defaults = recommended
    ? normalize(recommended)
    : normalize({
        species: species.name,
        moves: moves
          .slice(0, 4)
          .map(move => move.name),
        evs: {
          hp: 4,
          [
            species.baseStats.atk >=
            species.baseStats.spa
              ? 'atk'
              : 'spa'
          ]: 252,
          spe: 252,
        },
      });

  const result = {
    ...catalog.find(
      pokemon => pokemon.id === species.id,
    ),
    abilities: abilities(species),
    moves,
    defaults,
    requiredTeraType:
      species.requiredTeraType || null,
  };

  editorCache.set(species.id, result);

  return result;
}

const options = {
  types: dex.types
    .all()
    .map(type => type.name),

  natures: dex.natures
    .all()
    .map(nature => ({
      name: nature.name,
      plus: nature.plus,
      minus: nature.minus,
    })),

  items: dex.items
    .all()
    .filter(
      item =>
        !item.isNonstandard &&
        !validator.ruleTable.isBanned(
          `item:${item.id}`,
        ),
    )
    .map(item => ({
      name: item.name,
      desc: item.shortDesc || item.desc,
    })),
};

module.exports = {
  dex,
  catalog,
  options,
  editor,
  normalize,
  randomTeam,
  validate,
};