const {
  WebSocketServer,
  WebSocket,
} = require('ws');

const jwt = require('jsonwebtoken');

const {
  JWT_SECRET,
} = require('../services/auth.service');

const {
  Session,
} = require('../services/battle.service');

const history = require('../services/profile.service');

function inicializarWebSockets(server) {
  const wss = new WebSocketServer({
    server,
    maxPayload: 128 * 1024,
  });

  const sessions = new Map();

  const authenticate = token => {
    const user = jwt.verify(token, JWT_SECRET);

    if (!user.id || user.etapa) {
      throw new Error(
        'Completa el inicio de sesión.',
      );
    }

    return user.id;
  };

  async function finish(record, reason) {
    await history.finish(
      record.dbId,
      record.session,
      reason,
    );

    clearTimeout(record.expiry);
    clearTimeout(record.timer);

    sessions.delete(record.session.id);
    record.session.destroy();
  }

  function expire(record, reason) {
    record.expiry = setTimeout(() => {
      record.expiring = true;

      finish(record, reason).catch(error => {
        console.error(
          '[Historial]',
          error.message,
        );

        expire(record, reason);
      });
    }, 60000);

    record.expiry.unref();
  }

  wss.on('connection', ws => {
    let record;
    let chain = Promise.resolve();

    const send = value => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(value));
      }
    };

    async function publish() {
      if (!record.session.battle.ended) {
        await history.touch(record.dbId);
      }

      const snapshot = record.session.snapshot();

      if (snapshot.done && !record.saved) {
        await history.finish(
          record.dbId,
          record.session,
          record.reason || 'normal',
        );

        record.saved = true;
      }

      send({
        type: 'state',
        state: snapshot,
      });
    }

    async function detach(reason, grace = false) {
      if (!record) return;

      const previous = record;
      record = null;

      clearTimeout(previous.timer);
      previous.ws = null;

      if (
        previous.session.mode === 'auto' ||
        previous.saved
      ) {
        sessions.delete(previous.session.id);
        previous.session.destroy();
      } else if (grace) {
        expire(previous, reason);
      } else {
        try {
          await finish(previous, reason);
        } catch (error) {
          expire(previous, reason);
          throw error;
        }
      }
    }

    async function tick() {
      if (
        !record ||
        record.session.battle.ended
      ) {
        return;
      }

      try {
        record.session.step();
        await publish();

        if (!record.session.battle.ended) {
          record.timer = setTimeout(
            tick,
            ws.speed,
          );
        }
      } catch (error) {
        send({
          type: 'error',
          message: error.message,
        });

        await detach('error_servidor');
      }
    }

    ws.on('message', raw => {
      chain = chain
        .then(async () => {
          const data = JSON.parse(raw);

          if (data.type === 'start_battle') {
            const owner = authenticate(data.token);

            await detach('salida');

            const session = new Session({
              mode: data.mode,
              rules: data.rules,
              team: data.team,
              teamText: data.teamText,
            });

            record = {
              session,
              owner,
              ws,
              saved: false,
            };

            try {
              if (session.mode === 'manual') {
                record.dbId = await history.begin(
                  owner,
                  session,
                );
              }
            } catch {
              session.destroy();
              record = null;

              throw new Error(
                'No se pudo registrar la batalla. ' +
                'Revisa MySQL y backend/sql/perfil.sql.',
              );
            }

            sessions.set(session.id, record);

            ws.speed = Math.max(
              150,
              Math.min(
                2000,
                Number(data.speed) || 700,
              ),
            );

            await publish();

            if (session.mode === 'auto') {
              record.timer = setTimeout(
                tick,
                ws.speed,
              );
            }
          } else if (
            data.type === 'resume_battle'
          ) {
            const owner = authenticate(data.token);
            const previous = sessions.get(
              data.sessionId,
            );

            if (
              !previous ||
              previous.owner !== owner ||
              previous.ws ||
              previous.saved ||
              previous.expiring
            ) {
              throw new Error(
                'La batalla ya no se puede retomar.',
              );
            }

            await detach('salida');

            record = previous;
            record.ws = ws;

            clearTimeout(record.expiry);

            ws.speed = 700;
            record.session.lastUsed = Date.now();

            await publish();
          } else if (
            data.type === 'player_action' ||
            data.type === 'surrender'
          ) {
            if (
              !record ||
              data.sessionId !== record.session.id
            ) {
              throw new Error(
                'La sesión no está disponible.',
              );
            }

            if (data.type === 'surrender') {
              if (
                record.session.mode !== 'manual' ||
                record.session.battle.ended
              ) {
                throw new Error(
                  'La batalla no acepta rendición.',
                );
              }

              record.reason = 'rendicion';
              record.session.battle.win('p2');
            } else {
              record.session.act(data);
            }

            await publish();
          } else if (data.type === 'speed') {
            ws.speed = Math.max(
              150,
              Math.min(
                2000,
                Number(data.speed) || 700,
              ),
            );
          } else if (data.type === 'stop') {
            await detach('salida');
          }
        })
        .catch(error => {
          send({
            type: 'error',
            message: error.message,
          });
        });
    });

    const idle = setInterval(() => {
      chain = chain
        .then(async () => {
          if (
            record?.session.mode === 'manual' &&
            Date.now() -
              record.session.lastUsed >
              30 * 60 * 1000
          ) {
            send({
              type: 'error',
              message:
                'Sesión cerrada por inactividad.',
            });

            await detach('inactividad');
          }
        })
        .catch(error => {
          console.error(
            '[Historial]',
            error.message,
          );
        });
    }, 60000);

    idle.unref();

    ws.on('close', () => {
      clearInterval(idle);

      chain = chain
        .then(() =>
          detach('desconexion', true),
        )
        .catch(error => {
          console.error(
            '[Historial]',
            error.message,
          );
        });
    });

    ws.on('error', () => ws.close());
  });

  return wss;
}

module.exports = {
  inicializarWebSockets,
};