const Sim = require('pokemon-showdown');

// ============================================================
// MOVESETS DEL META Gen 9 OU
// ============================================================
const META_MOVES = {
  'Garchomp':           ['Earthquake', 'Outrage', 'Stone Edge', 'Swords Dance', 'Fire Fang', 'Dragon Claw'],
  'Great Tusk':         ['Headlong Rush', 'Close Combat', 'Ice Spinner', 'Rapid Spin', 'Knock Off', 'Stealth Rock'],
  'Kingambit':          ['Kowtow Cleave', 'Sucker Punch', 'Iron Head', 'Swords Dance', 'Low Kick'],
  'Gholdengo':          ['Make It Rain', 'Shadow Ball', 'Recover', 'Nasty Plot', 'Thunder Wave'],
  'Dragapult':          ['Shadow Ball', 'Draco Meteor', 'Fire Blast', 'U-turn', 'Thunderbolt', 'Will-O-Wisp'],
  'Corviknight':        ['Body Press', 'Iron Defense', 'Roost', 'U-turn', 'Brave Bird', 'Defog'],
  'Iron Valiant':       ['Moonblast', 'Close Combat', 'Knock Off', 'Encore', 'Swords Dance', 'Thunderbolt'],
  'Dragonite':          ['Dragon Dance', 'Earthquake', 'Extreme Speed', 'Roost', 'Fire Punch', 'Ice Spinner'],
  'Heatran':            ['Magma Storm', 'Earth Power', 'Stealth Rock', 'Taunt', 'Flash Cannon'],
  'Rillaboom':          ['Grassy Glide', 'Knock Off', 'U-turn', 'Wood Hammer', 'Drain Punch'],
  'Slowking-Galar':     ['Future Sight', 'Sludge Bomb', 'Flamethrower', 'Ice Beam', 'Thunder Wave'],
  'Toxapex':            ['Scald', 'Recover', 'Haze', 'Toxic', 'Toxic Spikes'],
  'Meowscarada':        ['Flower Trick', 'Knock Off', 'U-turn', 'Triple Axel', 'Play Rough'],
  'Skeledirge':         ['Torch Song', 'Shadow Ball', 'Slack Off', 'Will-O-Wisp', 'Earth Power'],
  'Iron Treads':        ['Earthquake', 'Iron Head', 'Knock Off', 'Rapid Spin', 'Volt Switch'],
  'Garganacl':          ['Salt Cure', 'Stealth Rock', 'Recover', 'Protect', 'Earthquake'],
  'Clodsire':           ['Earthquake', 'Toxic', 'Recover', 'Stealth Rock', 'Toxic Spikes'],
  'Sandy Shocks':       ['Thunderbolt', 'Earth Power', 'Stealth Rock', 'Volt Switch', 'Spikes'],
  'Walking Wake':       ['Hydro Steam', 'Draco Meteor', 'Flamethrower', 'Scald', 'Dragon Pulse'],
  'Zapdos':             ['Thunderbolt', 'Hurricane', 'Volt Switch', 'Roost', 'Discharge'],
  'Volcarona':          ['Fiery Dance', 'Bug Buzz', 'Quiver Dance', 'Giga Drain', 'Psychic'],
  'Cinderace':          ['Pyro Ball', 'U-turn', 'Sucker Punch', 'Court Change', 'High Jump Kick'],
  'Ogerpon-Wellspring': ['Ivy Cudgel', 'Horn Leech', 'Knock Off', 'Swords Dance', 'Play Rough'],
  'Hatterene':          ['Psychic', 'Dazzling Gleam', 'Calm Mind', 'Healing Wish', 'Mystical Fire'],
  'Enamorus':           ['Moonblast', 'Earth Power', 'Calm Mind', 'Mystical Fire', 'Superpower'],
  'Kyurem':             ['Freeze-Dry', 'Earth Power', 'Ice Beam', 'Dragon Dance', 'Icicle Spear'],
  'Weavile':            ['Triple Axel', 'Knock Off', 'Ice Shard', 'Low Kick', 'Swords Dance'],
  'Landorus-Therian':   ['Earthquake', 'U-turn', 'Stone Edge', 'Stealth Rock', 'Earth Power'],
  'Rotom-Wash':         ['Volt Switch', 'Hydro Pump', 'Will-O-Wisp', 'Thunder Wave', 'Pain Split'],
  'Slowking':           ['Scald', 'Future Sight', 'Slack Off', 'Thunder Wave', 'Teleport'],
  'Urshifu-Rapid-Strike': ['Surging Strikes', 'Close Combat', 'U-turn', 'Aqua Jet', 'Thunder Punch'],
  'Samurott-Hisui':     ['Ceaseless Edge', 'Razor Shell', 'Aqua Cutter', 'Sucker Punch', 'Sacred Sword'],
  'Greninja':           ['Hydro Pump', 'Dark Pulse', 'Ice Beam', 'U-turn', 'Water Shuriken'],
  'Ting-Lu':            ['Earthquake', 'Ruination', 'Stealth Rock', 'Whirlwind', 'Spikes'],
  'Chien-Pao':          ['Icicle Crash', 'Crunch', 'Sacred Sword', 'Sucker Punch', 'Ice Shard'],
  'Baxcalibur':         ['Glaive Rush', 'Icicle Crash', 'Dragon Dance', 'Earthquake', 'Ice Shard'],
  'Pelipper':           ['Hurricane', 'Hydro Pump', 'U-turn', 'Roost', 'Tailwind'],
  'Barraskewda':        ['Liquidation', 'Close Combat', 'Aqua Jet', 'Flip Turn', 'Crunch'],
  'Raging Bolt':        ['Thunderclap', 'Draco Meteor', 'Thunderbolt', 'Dragon Pulse', 'Calm Mind'],
  'Gouging Fire':       ['Flare Blitz', 'Dragon Dance', 'Morning Sun', 'Earthquake', 'Burning Bulwark'],
};

function getMetaMovesFor(name) {
  return META_MOVES[name] || null;
}

// ============================================================
// POKÉDEX
// ============================================================
function getPokemonList() {
  const Dex = Sim.Dex;
  const list = [];
  const seen = new Set();

  for (const species of Dex.species.all()) {
    if (!species.exists) continue;
    if (species.isNonstandard && species.isNonstandard !== 'Past') continue;
    if (species.tier === 'Illegal' || species.tier === 'Unreleased') continue;
    if (seen.has(species.name)) continue;
    seen.add(species.name);

    list.push({
      name: species.name,
      id: species.id,
      num: species.num,
      types: species.types,
      baseStats: species.baseStats,
      abilities: species.abilities,
      tier: species.tier || 'OU',
      gen: species.gen,
      metaMoves: getMetaMovesFor(species.name),
    });
  }

  const tierOrder = { 'OU': 1, 'UU': 2, 'RU': 3, 'NU': 4, 'PU': 5, 'Uber': 6 };
  list.sort((a, b) => {
    const ta = tierOrder[a.tier] || 99;
    const tb = tierOrder[b.tier] || 99;
    if (ta !== tb) return ta - tb;
    return a.name.localeCompare(b.name);
  });

  return list;
}

function getItemsList() {
  const Dex = Sim.Dex;
  const list = [];

  for (const item of Dex.items.all()) {
    if (!item.exists) continue;
    if (item.isNonstandard && item.isNonstandard !== 'Past') continue;
    if (!item.name) continue;

    list.push({
      name: item.name,
      id: item.id,
      desc: item.desc || item.shortDesc || '',
      isBerry: item.isBerry || false,
      isChoice: item.isChoice || false,
    });
  }

  list.sort((a, b) => a.name.localeCompare(b.name));
  return list;
}

function getMovesForPokemon(name) {
  const Dex = Sim.Dex;
  const species = Dex.species.get(name);
  if (!species.exists) return [];

  const learnset = Dex.species.getLearnsetData(species.id);
  if (!learnset || !learnset.learnset) return [];

  const moves = [];
  for (const moveId in learnset.learnset) {
    const move = Dex.moves.get(moveId);
    if (move.exists) {
      moves.push({
        name: move.name,
        id: move.id,
        type: move.type,
        category: move.category,
        basePower: move.basePower || 0,
        accuracy: move.accuracy === true ? 101 : (move.accuracy || 0),
        pp: move.pp || 0,
        desc: move.shortDesc || move.desc || '',
      });
    }
  }

  moves.sort((a, b) => a.name.localeCompare(b.name));
  return moves;
}

function getAbilitiesForPokemon(name) {
  const Dex = Sim.Dex;
  const species = Dex.species.get(name);
  if (!species.exists) return [];

  const result = [];
  for (const slot in species.abilities) {
    const ability = Dex.abilities.get(species.abilities[slot]);
    if (ability.exists) {
      result.push({
        name: ability.name,
        id: ability.id,
        slot: slot,
        desc: ability.shortDesc || ability.desc || '',
      });
    }
  }
  return result;
}

module.exports = {
  getPokemonList,
  getItemsList,
  getMovesForPokemon,
  getAbilitiesForPokemon,
  getMetaMovesFor,
  META_MOVES,
};