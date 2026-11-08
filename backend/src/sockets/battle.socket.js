// backend/src/sockets/battle.socket.js
const { WebSocketServer } = require('ws');
const Sim = require('pokemon-showdown');
const battleService = require('../services/battle.service');

function inicializarWebSockets(server) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    console.log('🔌 Nuevo cliente WebSocket conectado');
    
    let battleStream = null;
    let session = null;

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);

        // EVENTO: Iniciar batalla (Manual o IA vs IA)
        if (data.type === 'start_battle') {
          console.log('⚔️ Iniciando batalla...');
          
          battleStream = new Sim.BattleStream();
          
          const sessionData = battleService.crearSesion();
          session = sessionData.session;
          
          // Si NO hay teamText, es porque es el modo IA vs IA
          const esAuto = !data.teamText; 

          // Enviamos el sessionId al cliente
          ws.send(JSON.stringify({ type: 'session_created', sessionId: sessionData.sessionId }));

          // Arrancamos el stream en segundo plano
          (async () => {
            try {
              await battleService.runBattleStreaming(
                battleStream,
                (event) => {
                  // Enviamos CADA evento de la batalla al cliente en tiempo real
                  ws.send(JSON.stringify({ type: 'battle_event', event }));
                },
                {
                  teamP1: data.teamText 
                    ? Sim.Teams.pack(Sim.Teams.import(data.teamText)) 
                    : battleService.equipoP1,
                  onRequest: async (datos, jugador) => {
                    // SI ES AUTO: Ambos jugadores (p1 y p2) los controla la IA
                    if (esAuto) {
                      return battleService.decidirAccion(datos, jugador);
                    }

                    // SI ES MANUAL: P1 es el jugador, P2 es la IA
                    if (jugador === 'p1') {
                      // Pausamos la batalla y pedimos acción al cliente
                      ws.send(JSON.stringify({ 
                        type: 'request_action', 
                        request: battleService.extractPlayerOptions(datos),
                        teamState: battleService.extractTeamState(battleStream.battle, 0),
                        mochila: session.mochila
                      }));

                      return new Promise((resolve) => {
                        session.pendingRequest = { datos, resolve };
                      });
                    }
                    
                    // P2 (IA) decide automáticamente
                    return battleService.decidirAccion(datos, jugador);
                  }
                }
              );
            } catch (e) {
              console.error('Error en batalla:', e);
              ws.send(JSON.stringify({ type: 'error', message: e.message }));
            }
          })();
        }

        // EVENTO: Acción del jugador
        if (data.type === 'player_action') {
          if (session && session.pendingRequest) {
            const resolve = session.pendingRequest.resolve;
            session.pendingRequest = null;
            resolve(data.action);
          }
        }

      } catch (error) {
        console.error('Error en WebSocket:', error.message);
      }
    });

    ws.on('close', () => {
      console.log('🔌 Cliente WebSocket desconectado');
      if (battleStream) {
        try { battleStream.pushEnd(); } catch (e) {}
      }
    });
  });
}

module.exports = { inicializarWebSockets };