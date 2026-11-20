const HABILIDADES_OFENSIVAS = {
  'sheerforce': 1.3, 'adaptability': 1.3, 'toughclaws': 1.3,
  'strongjaw': 1.3, 'ironfist': 1.2, 'technician': 1.2,
  'hugepower': 2.0, 'purepower': 2.0, 'pixilate': 1.3,
  'refrigerate': 1.3, 'aerilate': 1.3, 'galvanize': 1.3,
  'supremeoverlord': 1.1, 'protosynthesis': 1.3, 'quarkdrive': 1.3,
  'sharpness': 1.5, 'steelyspirit': 1.5, 'dragonmaw': 1.5,
  'transistor': 1.5, 'rockypayload': 1.5,
};

const MOVS_RECUPERACION = [
  'recover', 'roost', 'softboiled', 'synthesis', 'moonlight',
  'morningsun', 'slackoff', 'shoresup', 'strengthsap', 'healingwish',
];

const MOVS_PRIORITARIOS = [
  'earthquake', 'closecombat', 'headlongrush', 'outrage', 'dracometeor',
  'shadowball', 'makeitrain', 'woodhammer', 'grassyglide', 'suckerpunch',
  'extremespeed', 'moonblast', 'knockoff', 'flamethrower', 'icebeam',
  'sludgebomb', 'scald', 'magmastorm', 'fireblast', 'stoneedge',
  'hydropump', 'thunderbolt', 'hurricane', 'ivycudgel', 'flowerrick',
  'torchsong', 'bugbuzz', 'fierydance', 'tripleaxel', 'ironhead',
  'saltcure', 'psyshock', 'dazzlinggleam',
];

const MOVS_UTILIDAD = [
  'swordsdance', 'nastyplot', 'dragondance', 'calmmind', 'quiverdance',
  'irondefense', 'bulkup', 'shellsmash',
];

function decidirAccion(datos, jugador) {
  if (datos.forceSwitch) {
    const disponibles = datos.side.pokemon;
    let mejorIdx = -1;
    let mejorPct = -1;
    for (let i = 1; i < disponibles.length; i++) {
      const p = disponibles[i];
      if (p && !p.condition.includes('faint')) {
        const m = p.condition.match(/(\d+)\/(\d+)/);
        const pct = m ? parseInt(m[1]) / parseInt(m[2]) : 0;
        if (pct > mejorPct) { mejorPct = pct; mejorIdx = i; }
      }
    }
    return mejorIdx >= 0 ? 'switch ' + (mejorIdx + 1) : 'switch 1';
  }

  if (datos.active && datos.active[0]) {
    const activo = datos.active[0];
    if (!activo.moves) return 'switch 1';

    const movsDisponibles = activo.moves
      .map((m, i) => ({ ...m, index: i }))
      .filter((m) => !m.disabled && m.pp !== 0);

    if (movsDisponibles.length === 0) return 'move 1';

    const pokemonActivo = datos.side.pokemon[0];
    let porcentajeHP = 100;
    if (pokemonActivo && pokemonActivo.condition) {
      const match = pokemonActivo.condition.match(/(\d+)\/(\d+)/);
      if (match) porcentajeHP = (parseInt(match[1]) / parseInt(match[2])) * 100;
    }

    const habilidad = (activo.baseAbility || '').toLowerCase().replace(/[^a-z]/g, '');

    const movRecuperacion = movsDisponibles.find((m) =>
      MOVS_RECUPERACION.includes(m.move.toLowerCase().replace(/[^a-z]/g, ''))
    );
    if (porcentajeHP < 35 && movRecuperacion) {
      return 'move ' + (movRecuperacion.index + 1);
    }

    const esOfensivo = HABILIDADES_OFENSIVAS[habilidad] !== undefined;

    if (porcentajeHP > 70 && !esOfensivo) {
      const movSetup = movsDisponibles.find((m) =>
        MOVS_UTILIDAD.includes(m.move.toLowerCase().replace(/[^a-z]/g, ''))
      );
      if (movSetup && Math.random() < 0.3) {
        return 'move ' + (movSetup.index + 1);
      }
    }

    const movDanio = movsDisponibles.filter((m) =>
      MOVS_PRIORITARIOS.includes(m.move.toLowerCase().replace(/[^a-z]/g, ''))
    );

    if (movDanio.length > 0) {
      const elegido = movDanio[Math.floor(Math.random() * movDanio.length)];
      return 'move ' + (elegido.index + 1);
    }

    return 'move ' + (movsDisponibles[0].index + 1);
  }

  return 'move 1';
}

module.exports = { decidirAccion };