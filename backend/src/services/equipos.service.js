// backend/src/services/equipos.service.js
const { Teams } = require('pokemon-showdown');

// ============================================================
// Pool de Pokémon del meta Gen 9 OU para la IA
// Cada set incluye su habilidad, objeto y movimientos competitivos
// ============================================================
const OU_POOL = [
  `Great Tusk @ Heavy-Duty Boots
Ability: Protosynthesis
EVs: 252 Atk / 4 SpD / 252 Spe
Jolly Nature
- Headlong Rush
- Close Combat
- Ice Spinner
- Rapid Spin`,

  `Kingambit @ Leftovers
Ability: Supreme Overlord
EVs: 252 HP / 252 Atk / 4 SpD
Adamant Nature
- Kowtow Cleave
- Sucker Punch
- Iron Head
- Swords Dance`,

  `Gholdengo @ Air Balloon
Ability: Good as Gold
EVs: 252 SpA / 4 SpD / 252 Spe
Timid Nature
- Make It Rain
- Shadow Ball
- Recover
- Nasty Plot`,

  `Dragapult @ Choice Specs
Ability: Infiltrator
EVs: 252 SpA / 4 SpD / 252 Spe
Timid Nature
- Shadow Ball
- Draco Meteor
- Fire Blast
- U-turn`,

  `Garchomp @ Rocky Helmet
Ability: Rough Skin
EVs: 252 Atk / 4 SpD / 252 Spe
Jolly Nature
- Earthquake
- Outrage
- Stone Edge
- Swords Dance`,

  `Corviknight @ Leftovers
Ability: Pressure
EVs: 252 HP / 252 Def / 4 SpD
Impish Nature
- Body Press
- Iron Defense
- Roost
- U-turn`,

  `Iron Valiant @ Booster Energy
Ability: Quark Drive
EVs: 252 Atk / 4 SpD / 252 Spe
Jolly Nature
- Moonblast
- Close Combat
- Knock Off
- Encore`,

  `Slowking-Galar @ Assault Vest
Ability: Regenerator
EVs: 252 HP / 4 SpA / 252 SpD
Calm Nature
- Future Sight
- Sludge Bomb
- Flamethrower
- Ice Beam`,

  `Rillaboom @ Choice Band
Ability: Grassy Surge
EVs: 252 Atk / 4 SpD / 252 Spe
Adamant Nature
- Grassy Glide
- Knock Off
- U-turn
- Wood Hammer`,

  `Heatran @ Air Balloon
Ability: Flash Fire
EVs: 252 SpA / 4 SpD / 252 Spe
Modest Nature
- Magma Storm
- Earth Power
- Stealth Rock
- Taunt`,

  `Dragonite @ Heavy-Duty Boots
Ability: Multiscale
EVs: 252 Atk / 4 SpD / 252 Spe
Adamant Nature
- Dragon Dance
- Earthquake
- Extreme Speed
- Roost`,

  `Toxapex @ Black Sludge
Ability: Regenerator
EVs: 252 HP / 252 Def / 4 SpD
Bold Nature
- Scald
- Recover
- Haze
- Toxic`,

  `Meowscarada @ Choice Band
Ability: Protean
EVs: 252 Atk / 4 SpD / 252 Spe
Jolly Nature
- Flower Trick
- Knock Off
- U-turn
- Triple Axel`,

  `Skeledirge @ Heavy-Duty Boots
Ability: Unaware
EVs: 252 HP / 252 Def / 4 SpD
Bold Nature
- Torch Song
- Shadow Ball
- Slack Off
- Will-O-Wisp`,

  `Iron Treads @ Booster Energy
Ability: Quark Drive
EVs: 252 Atk / 4 SpD / 252 Spe
Jolly Nature
- Earthquake
- Iron Head
- Knock Off
- Rapid Spin`,

  `Garganacl @ Leftovers
Ability: Salt Cure
EVs: 252 HP / 4 Def / 252 SpD
Careful Nature
- Salt Cure
- Stealth Rock
- Recover
- Protect`,

  `Clodsire @ Leftovers
Ability: Water Absorb
EVs: 248 HP / 8 Def / 252 SpD
Careful Nature
- Earthquake
- Toxic
- Recover
- Stealth Rock`,

  `Sandy Shocks @ Booster Energy
Ability: Protosynthesis
EVs: 252 SpA / 4 SpD / 252 Spe
Timid Nature
- Thunderbolt
- Earth Power
- Stealth Rock
- Volt Switch`,

  `Walking Wake @ Choice Specs
Ability: Protosynthesis
EVs: 252 SpA / 4 SpD / 252 Spe
Timid Nature
- Hydro Steam
- Draco Meteor
- Flamethrower
- Scald`,

  `Zapdos @ Heavy-Duty Boots
Ability: Static
EVs: 252 SpA / 4 SpD / 252 Spe
Timid Nature
- Thunderbolt
- Hurricane
- Volt Switch
- Roost`,

  `Volcarona @ Heavy-Duty Boots
Ability: Flame Body
EVs: 252 SpA / 4 SpD / 252 Spe
Timid Nature
- Fiery Dance
- Bug Buzz
- Quiver Dance
- Giga Drain`,

  `Cinderace @ Heavy-Duty Boots
Ability: Libero
EVs: 252 Atk / 4 SpD / 252 Spe
Jolly Nature
- Pyro Ball
- U-turn
- Sucker Punch
- Court Change`,

  `Ogerpon-Wellspring @ Wellspring Mask
Ability: Water Absorb
EVs: 252 Atk / 4 SpD / 252 Spe
Jolly Nature
- Ivy Cudgel
- Horn Leech
- Knock Off
- Swords Dance`,

  `Hatterene @ Leftovers
Ability: Magic Bounce
EVs: 252 HP / 4 Def / 252 SpD
Calm Nature
- Psychic
- Dazzling Gleam
- Calm Mind
- Healing Wish`,
];

// ============================================================
// Generar equipo aleatorio de 6 Pokémon del pool OU
// ============================================================
function generarEquipoAleatorio() {
  const shuffled = OU_POOL.slice().sort(() => Math.random() - 0.5);
  const seleccionados = shuffled.slice(0, 6);
  const texto = seleccionados.join('\n\n');
  return Teams.pack(Teams.import(texto));
}

// ============================================================
// Equipo por defecto del jugador (se puede sobrescribir)
// ============================================================
const teamP1Text = `
Garchomp @ Choice Scarf
Ability: Rough Skin
EVs: 252 Atk / 4 SpD / 252 Spe
Jolly Nature
- Earthquake
- Outrage
- Stone Edge
- Fire Fang

Corviknight @ Leftovers
Ability: Pressure
EVs: 252 HP / 252 Def / 4 SpD
Impish Nature
- Body Press
- Iron Defense
- Roost
- U-turn

Dragapult @ Choice Specs
Ability: Infiltrator
EVs: 252 SpA / 4 SpD / 252 Spe
Timid Nature
- Shadow Ball
- Draco Meteor
- Fire Blast
- U-turn

Kingambit @ Leftovers
Ability: Supreme Overlord
EVs: 252 HP / 252 Atk / 4 SpD
Adamant Nature
- Kowtow Cleave
- Sucker Punch
- Iron Head
- Swords Dance

Great Tusk @ Heavy-Duty Boots
Ability: Protosynthesis
EVs: 252 Atk / 4 SpD / 252 Spe
Jolly Nature
- Headlong Rush
- Close Combat
- Ice Spinner
- Rapid Spin

Gholdengo @ Air Balloon
Ability: Good as Gold
EVs: 252 SpA / 4 SpD / 252 Spe
Timid Nature
- Make It Rain
- Shadow Ball
- Recover
- Nasty Plot
`;

const equipoP1 = Teams.pack(Teams.import(teamP1Text));

module.exports = {
  equipoP1,
  generarEquipoAleatorio,
  OU_POOL,
  teamP1Text,
};