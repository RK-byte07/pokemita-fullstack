// backend/src/services/battle.service.js
const Sim = require('pokemon-showdown');
const { Teams } = require('pokemon-showdown');
const { equipoP1, generarEquipoAleatorio } = require('./equipos.service');
const { decidirAccion } = require('./ia.service');

const sessions = new Map();

// ============================================================
// MOCHILA
// ============================================================
function mochilaInicial() {
  return {
    potion:      { label: 'Pocion',        heal: 20,  usos: 3, icono: '🧪', desc: 'Recupera 20 HP', kind: 'heal' },
    superpotion: { label: 'Super Pocion',  heal: 50,  usos: 2, icono: '🧴', desc: 'Recupera 50 HP', kind: 'heal' },
    hyperpotion: { label: 'Hiper Pocion',  heal: 120, usos: 1, icono: '💊', desc: 'Recupera 120 HP', kind: 'heal' },
    maxpotion:   { label: 'Pocion Maxima', heal: 999, usos: 1, icono: '⚗️', desc: 'HP completo', kind: 'heal' },
    fullheal:    { label: 'Restaurador',   heal: 0,   usos: 1, icono: '🌟', desc: 'Cura estado', kind: 'status' },
    revive:      { label: 'Revivir',       heal: 0,   usos: 1, icono: '💎', desc: 'Revive con 50% HP', kind: 'revive' },
  };
}

function cerrarStream(stream) {
  try {
    if (typeof stream.pushEnd === 'function') stream.pushEnd();
    else if (typeof stream.stop === 'function') stream.stop();
    else if (typeof stream.end === 'function') stream.end();
  } catch (e) {}
}

// ============================================================
// CURACION
// ============================================================
function getActivePokemon(battle, sideIdx) {
  if (!battle) return null;
  const side = battle.sides[sideIdx];
  if (!side || !side.active || !side.active[0]) return null;
  return side.active[0];
}

function aplicarHeal(battle, sideIdx, heal, curarEstado) {
  const poke = getActivePokemon(battle, sideIdx);
  if (!poke) return { error: 'No hay Pokemon activo' };
  if (poke.hp <= 0) return { error: 'El Pokemon esta debilitado. Usa Revivir' };

  const eventos = [];
  let aplicado = false;

  if (heal > 0 && poke.hp < poke.maxhp) {
    const cantidad = heal >= 999 ? poke.maxhp : Math.min(heal, poke.maxhp - poke.hp);
    const hpAntes = poke.hp;
    poke.sethp(poke.hp + cantidad);
    const delta = poke.hp - hpAntes;
    battle.add('-heal', poke, poke.hp, poke.maxhp, '[silent]');
    eventos.push('|heal|' + poke.species.name + '|+' + delta);
    aplicado = true;
  }

  if (curarEstado && poke.status) {
    const st = poke.status;
    poke.clearVolatile();
    poke.setStatus('');
    battle.add('-curestatus', poke, st, '[silent]');
    eventos.push('|cure|' + poke.species.name);
    aplicado = true;
  }

  if (!aplicado) return { error: 'No hay nada que curar (HP al maximo)' };
  return { eventos };
}

function aplicarRevive(battle, sideIdx) {
  if (!battle) return { error: 'Batalla no lista' };
  const side = battle.sides[sideIdx];
  if (!side) return { error: 'Lado no encontrado' };

  for (let i = 0; i < side.pokemon.length; i++) {
    const p = side.pokemon[i];
    if (p.hp <= 0) {
      p.sethp(Math.floor(p.maxhp / 2));
      battle.add('-heal', p, p.hp, p.maxhp, '[silent]');
      return { evento: '|revive|' + p.species.name + '|' + p.hp + '/' + p.maxhp };
    }
  }
  return { error: 'No hay Pokemon debilitados para revivir' };
}

// ============================================================
// MOTOR DE BATALLA
// ============================================================
async function runBattleStreaming(stream, onEvent, options) {
  options = options || {};
  const onRequest = options.onRequest;

  stream.write('>start ' + JSON.stringify({ formatid: 'gen9ou' }));
  stream.write('>player p1 ' + JSON.stringify({ name: 'Tu', team: options.teamP1 || equipoP1 }));
  stream.write('>player p2 ' + JSON.stringify({ name: 'IA', team: options.teamP2 || generarEquipoAleatorio() }));

  for await (const output of stream) {
    for (const linea of output.split('\n')) {
      if (!linea || linea.charAt(0) !== '|') continue;
      const partes = linea.split('|');
      const tipo = partes[1];

      if (tipo !== 'request') onEvent(linea);

      if (tipo === 'request') {
        let datos;
        try { datos = JSON.parse(linea.slice(9)); } catch (e) { continue; }
        const jugador = datos.side.id;
        if (datos.teamPreview) { stream.write('>' + jugador + ' team 123456'); continue; }
        if (datos.wait) continue;
        if (onRequest) {
          const decision = await onRequest(datos, jugador);
          if (decision === null) return { done: true, reason: 'aborted' };
          stream.write('>' + jugador + ' ' + decision);
        } else {
          stream.write('>' + jugador + ' ' + decidirAccion(datos, jugador));
        }
      }
      if (tipo === 'win') { cerrarStream(stream); return { done: true, reason: 'win' }; }
    }
  }
  return { done: true, reason: 'eof' };
}

// ============================================================
// EXTRACCION DE DATOS
// ============================================================
function extractPlayerOptions(datos) {
  if (datos.forceSwitch) {
    const options = [];
    datos.side.pokemon.forEach(function (p, i) {
      if (i === 0) return;
      if (p && p.condition.indexOf('faint') === -1) {
        options.push({
          action: 'switch ' + (i + 1),
          label: p.ident.split(': ')[1],
          hp: p.condition, kind: 'switch',
        });
      }
    });
    return { type: 'switch', options };
  }
  if (datos.active && datos.active[0]) {
    const activo = datos.active[0];
    const options = [];
    if (activo.moves) {
      activo.moves.forEach(function (m, i) {
        options.push({
          action: 'move ' + (i + 1),
          label: m.move, pp: m.pp + '/' + m.maxpp,
          disabled: m.disabled || m.pp === 0, kind: 'move',
        });
      });
    }
    datos.side.pokemon.forEach(function (p, i) {
      if (i === 0) return;
      if (p && p.condition.indexOf('faint') === -1) {
        options.push({
          action: 'switch ' + (i + 1),
          label: p.ident.split(': ')[1],
          hp: p.condition, kind: 'switch',
        });
      }
    });
    return { type: 'move', options };
  }
  return null;
}

function extractTeamState(battle, sideIdx) {
  if (!battle) return null;
  const side = battle.sides[sideIdx];
  if (!side) return null;
  return side.pokemon.map(function (p) {
    return {
      name: p.species.name,
      hp: p.hp,
      maxhp: p.maxhp,
      fainted: p.hp <= 0,
      active: side.active.indexOf(p) !== -1,
    };
  });
}

// ============================================================
// SESIONES
// ============================================================
function crearSesion() {
  const sessionId = 'ses_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  const stream = new Sim.BattleStream();
  const session = {
    stream,
    events: [],
    pendingRequest: null,
    done: false,
    mochila: mochilaInicial(),
    battle: null,
  };
  sessions.set(sessionId, session);
  return { sessionId, session };
}

function getSesion(id) {
  return sessions.get(id);
}

function eliminarSesion(id) {
  sessions.delete(id);
}

module.exports = {
  sessions,
  crearSesion,
  getSesion,
  eliminarSesion,
  runBattleStreaming,
  extractPlayerOptions,
  extractTeamState,
  aplicarHeal,
  aplicarRevive,
  mochilaInicial,
  decidirAccion,
  equipoP1,
  generarEquipoAleatorio,
};