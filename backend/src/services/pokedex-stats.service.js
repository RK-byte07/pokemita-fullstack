const fs = require('node:fs');
const path = require('node:path');
const { Dex } = require('pokemon-showdown');

const dex = Dex.mod('gen9');
const MONTH = '2026-10';

const file = path.resolve(
  __dirname,
  '../data/gen9ou-1695.json',
);

const sum = values =>
  Object.values(values || {}).reduce((a, b) => a + b, 0);

let report;
let entries = new Map();
let ranking = [];

try {
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));

  if (
    json.info?.metagame !== 'gen9ou' ||
    json.info?.cutoff !== 1695 ||
    !json.data
  ) {
    throw new Error(
      'El reporte debe ser Gen 9 OU, corte 1695.',
    );
  }

  for (const [name, value] of Object.entries(json.data)) {
    const species = dex.species.get(name);

    if (
      !species.exists ||
      !Number.isFinite(value.usage) ||
      value.usage < 0 ||
      value.usage > 1
    ) {
      throw new Error(`Entrada inválida: ${name}`);
    }

    for (const key of [
      'Abilities',
      'Items',
      'Moves',
      'Spreads',
      'Tera Types',
      'Teammates',
    ]) {
      if (
        !value[key] ||
        Object.values(value[key]).some(
          n => !Number.isFinite(n) || n < 0,
        )
      ) {
        throw new Error(
          `Pesos inválidos: ${name} / ${key}`,
        );
      }
    }

    if (
      sum(value.Abilities) <= 0 ||
      entries.has(species.id)
    ) {
      throw new Error(
        `Entrada duplicada o vacía: ${name}`,
      );
    }

    entries.set(species.id, {
      ...value,
      reportName: name,
    });
  }

  ranking = [...entries]
    .sort((a, b) => b[1].usage - a[1].usage)
    .map(([id, value], index) => ({
      id,
      name: value.reportName,
      sprite: dex.species.get(id).spriteid,
      usage: value.usage * 100,
      rank: index + 1,
    }));

  ranking.forEach(row => {
    entries.get(row.id).rank = row.rank;
  });

  report = {
    available: true,
    month: MONTH,
    label: 'Octubre de 2026',
    format: 'gen9ou',
    cutoff: 1695,
    battles: json.info['number of battles'],
    total: entries.size,
    top: ranking.slice(0, 10),
  };
} catch (error) {
  console.error('[Pokédex / Smogon]', error.message);

  entries = new Map();

  report = {
    available: false,
    month: MONTH,
    label: 'Octubre de 2026',
    format: 'gen9ou',
    cutoff: 1695,
    battles: 0,
    total: 0,
    top: [],
    message:
      'Reporte no disponible. Revisa backend/data/gen9ou-1695.json y reinicia el backend.',
  };
}

function entryFor(species) {
  // Este reporte agrupa ambas formas de Toxtricity.
  // No aplicar esta agrupación a otras especies.
  const id =
    species.id === 'toxtricitylowkey'
      ? 'toxtricity'
      : species.id;

  return entries.get(id);
}

function basic(species) {
  const entry = entryFor(species);

  return {
    id: species.id,
    name: species.name,
    sprite: species.spriteid,
    num: species.num,
    types: species.types,
    baseStats: species.baseStats,
    bst: species.bst,
    tier: species.tier || 'Sin clasificar',
    gen: species.gen,
    battleOnly: Boolean(species.battleOnly),
    usage: entry ? entry.usage * 100 : null,
    rank: entry?.rank ?? null,
    grouped:
      species.baseSpecies === 'Toxtricity' &&
      Boolean(entry),
  };
}

const catalog = dex.species
  .all()
  .filter(
    species =>
      species.exists &&
      species.num > 0 &&
      !species.isNonstandard &&
      !species.isCosmeticForme &&
      !species.placeholderFor,
  )
  .map(basic)
  .sort(
    (a, b) =>
      a.num - b.num || a.name.localeCompare(b.name),
  );

function distribution(
  values,
  total,
  kind,
  limit = 6,
) {
  return Object.entries(values || {})
    .filter(
      ([id, weight]) =>
        weight > 0 && id !== 'empty' && id !== '',
    )
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, weight]) => ({
      id: kind ? dex[kind].get(id).id || id : id,
      name:
        id === 'nothing'
          ? 'Sin objeto'
          : kind
            ? dex[kind].get(id).name || id
            : id,
      percent: (weight / total) * 100,
    }));
}

function competitive(species) {
  const data = entryFor(species);

  if (!data) return null;

  const total = sum(data.Abilities);

  const counters = Object.entries(
    data['Checks and Counters'] || {},
  )
    .filter(
      ([, value]) =>
        Number.isFinite(value.n) &&
        value.n >= 20 &&
        Number.isFinite(value.p) &&
        Number.isFinite(value.d) &&
        value.p - 4 * value.d >= 0.5,
    )
    .sort(
      (a, b) =>
        b[1].p -
        4 * b[1].d -
        (a[1].p - 4 * a[1].d),
    )
    .slice(0, 6)
    .map(([name, value]) => ({
      id: dex.species.get(name).id,
      name,
      encounters: value.n,
      percent: value.p * 100,
      error: value.d * 100,
    }));

  return {
    usage: data.usage * 100,
    rank: data.rank,
    rawCount: data['Raw count'],
    reportName: data.reportName,
    grouped: species.baseSpecies === 'Toxtricity',
    abilities: distribution(
      data.Abilities,
      total,
      'abilities',
    ),
    items: distribution(data.Items, total, 'items'),
    moves: distribution(data.Moves, total, 'moves', 8),
    teraTypes: distribution(
      data['Tera Types'],
      total,
      'types',
    ),
    teammates: distribution(
      data.Teammates,
      total,
      'species',
    ),
    spreads: distribution(
      data.Spreads,
      total,
      null,
      4,
    ).map(row => {
      const [nature, values] = row.id.split(':');

      return {
        ...row,
        nature,
        evs: values.split('/').map(Number),
      };
    }),
    counters,
  };
}

const details = new Map();

function getDetail(name) {
  const species = dex.species.get(name);

  if (!catalog.some(row => row.id === species.id)) {
    return null;
  }

  if (details.has(species.id)) {
    return details.get(species.id);
  }

  const base = dex.species.get(species.baseSpecies);

  const forms = [
    ...new Set([
      base.name,
      ...(base.otherFormes || []),
      species.name,
    ]),
  ]
    .map(form => dex.species.get(form))
    .filter(form =>
      catalog.some(row => row.id === form.id),
    )
    .map(form => ({
      id: form.id,
      name: form.name,
    }));

  const moves = [
    ...dex.species.getMovePool(species.id),
  ]
    .map(id => dex.moves.get(id))
    .filter(
      move =>
        move.exists &&
        !move.isNonstandard &&
        !move.isZ &&
        !move.isMax,
    )
    .map(move => ({
      id: move.id,
      name: move.name,
      type: move.type,
      category: move.category,
      power: move.basePower,
      accuracy: move.accuracy,
      pp: move.pp,
      desc: move.shortDesc || move.desc,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const result = {
    ...basic(species),
    height: species.heightm,
    weight: species.weightkg,
    forms,
    moves,
    abilities: Object.entries(species.abilities).map(
      ([slot, name]) => {
        const ability = dex.abilities.get(name);

        return {
          id: ability.id,
          name: ability.name,
          hidden: slot === 'H',
          desc: ability.shortDesc || ability.desc,
        };
      },
    ),
    matchups: dex.types.all().map(type => ({
      type: type.name,
      multiplier: dex.getImmunity(type.name, species)
        ? 2 ** dex.getEffectiveness(type.name, species)
        : 0,
    })),
    competitive: competitive(species),
    report,
  };

  details.set(species.id, result);

  return result;
}

module.exports = {
  getCatalog: () => catalog,
  getReport: () => report,
  getDetail,
};