// backend/src/controllers/battle.controller.js
const Sim = require('pokemon-showdown');
const { Teams } = require('pokemon-showdown');
const battleService = require('../services/battle.service');

// ============================================================
// GET /api/battle — IA vs IA en streaming NDJSON
// ============================================================
exports.autoBattle = async (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'application/x-ndjson; charset=utf-8',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const stream = new Sim.BattleStream();
  try {
    await battleService.runBattleStreaming(stream, (event) => {
      res.write(JSON.stringify({ event }) + '\n');
    });
  } catch (e) {
    res.write(JSON.stringify({ error: e.message }) + '\n');
  }
  res.end();
};

// ============================================================
// POST /api/manual/start — Inicia batalla manual con equipo custom
// ============================================================
exports.manualStart = async (req, res) => {
  try {
    const payload = req.body || {};

    const { sessionId, session } = battleService.crearSesion();

    // Parsear equipo del jugador si viene
    let teamP1Packed = battleService.equipoP1;
    if (payload.teamText) {
      try {
        const parsed = Teams.import(payload.teamText);
        teamP1Packed = Teams.pack(parsed);
        console.log('[Sesion] Equipo: ' + parsed.length + ' Pokemon');
        parsed.forEach((p) => {
          console.log('  - ' + p.species + ' | moves: ' + (p.moves || []).join(', '));
        });
      } catch (e) {
        console.error('[Sesion] Error al parsear equipo:', e.message);
      }
    }

    // Arrancar batalla en background
    (async () => {
      try {
        await battleService.runBattleStreaming(
          session.stream,
          (event) => {
            session.events.push(event);
            if (session.stream.battle && !session.battle) {
              session.battle = session.stream.battle;
            }
          },
          {
            teamP1: teamP1Packed,
            onRequest: async (datos, jugador) => {
              if (session.stream.battle) session.battle = session.stream.battle;

              if (jugador === 'p1') {
                // Esperar acción del jugador
                return new Promise((resolve) => {
                  session.pendingRequest = { datos, resolve };
                });
              }
              // IA decide
              return battleService.decidirAccion(datos, jugador);
            },
          }
        );
      } catch (e) {
        session.events.push('|error|' + e.message);
      }
      session.done = true;
      if (session.pendingRequest) {
        session.pendingRequest.resolve(null);
        session.pendingRequest = null;
      }
    })();

    // Esperar a que haya un request pendiente o termine
    const maxWait = Date.now() + 8000;
    while (!session.pendingRequest && !session.done && Date.now() < maxWait) {
      await new Promise((r) => setTimeout(r, 15));
    }

    const eventsToSend = session.events.splice(0, session.events.length);
    let request = null;
    if (session.pendingRequest) {
      request = battleService.extractPlayerOptions(session.pendingRequest.datos);
    }

    res.json({
      sessionId,
      events: eventsToSend,
      awaiting: session.pendingRequest ? 'p1' : null,
      request,
      done: session.done,
      mochila: session.mochila,
      team: battleService.extractTeamState(session.battle, 0),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ============================================================
// POST /api/manual/action — Acción del jugador o uso de item
// ============================================================
exports.manualAction = async (req, res) => {
  try {
    const payload = req.body;

    if (!payload || !payload.sessionId) {
      return res.status(400).json({ error: 'sessionId requerido' });
    }

    const session = battleService.getSesion(payload.sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Sesion no encontrada' });
    }

    // ============================================================
    // USO DE ITEM
    // ============================================================
    if (payload.action && payload.action.indexOf('use-item ') === 0) {
      const itemId = payload.action.split(' ')[1];
      const item = session.mochila[itemId];

      if (!item || item.usos <= 0) {
        return res.status(400).json({ error: 'No te quedan usos' });
      }

      const battle = session.battle;
      if (!battle) {
        return res.status(400).json({ error: 'Batalla no lista' });
      }

      const nuevosEventos = [];

      if (item.kind === 'revive') {
        const r = battleService.aplicarRevive(battle, 0);
        if (r.error) return res.status(400).json({ error: r.error });
        nuevosEventos.push('|log|Usaste ' + item.label + '!');
        nuevosEventos.push(r.evento);
        item.usos--;
      } else {
        const r = battleService.aplicarHeal(battle, 0, item.heal, item.kind === 'status');
        if (r.error) return res.status(400).json({ error: r.error });
        nuevosEventos.push('|log|Usaste ' + item.label + '!');
        r.eventos.forEach((ev) => nuevosEventos.push(ev));
        item.usos--;
      }

      // Enviar un movimiento para cerrar el turno
      if (session.pendingRequest) {
        const resolve = session.pendingRequest.resolve;
        session.pendingRequest = null;
        resolve('move 1');
      }

      const maxWait = Date.now() + 5000;
      while (!session.pendingRequest && !session.done && Date.now() < maxWait) {
        await new Promise((r) => setTimeout(r, 15));
      }

      const eventsToSend = nuevosEventos.concat(session.events.splice(0, session.events.length));
      let request = null;
      if (session.pendingRequest) {
        request = battleService.extractPlayerOptions(session.pendingRequest.datos);
      }
      if (session.done) battleService.eliminarSesion(payload.sessionId);

      return res.json({
        events: eventsToSend,
        awaiting: session.pendingRequest ? 'p1' : null,
        request,
        done: session.done,
        mochila: session.mochila,
        team: battleService.extractTeamState(session.battle, 0),
      });
    }

    // ============================================================
    // ACCIÓN NORMAL (move/switch)
    // ============================================================
    if (session.pendingRequest) {
      const resolve = session.pendingRequest.resolve;
      session.pendingRequest = null;
      resolve(payload.action);
    }

    const maxWait = Date.now() + 5000;
    while (!session.pendingRequest && !session.done && Date.now() < maxWait) {
      await new Promise((r) => setTimeout(r, 15));
    }

    const eventsToSend = session.events.splice(0, session.events.length);
    let request = null;
    if (session.pendingRequest) {
      request = battleService.extractPlayerOptions(session.pendingRequest.datos);
    }
    if (session.done) battleService.eliminarSesion(payload.sessionId);

    return res.json({
      events: eventsToSend,
      awaiting: session.pendingRequest ? 'p1' : null,
      request,
      done: session.done,
      mochila: session.mochila,
      team: battleService.extractTeamState(session.battle, 0),
    });
  } catch (e) {
    console.error('[manualAction] Error:', e);
    res.status(500).json({ error: e.message });
  }
};