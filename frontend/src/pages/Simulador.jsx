// src/pages/Simulador.jsx
import { useState } from 'react';
import { useBattleStore } from '../store/battleStore';
import { spriteUrl, parseHP, TIPOS_COLORES } from '../utils/pokemon';
import {
  startManualBattle,
  sendAction,
  streamAutoBattle,
} from '../services/battleService';

import ModePicker from '../components/ModePicker';
import TeamBuilder from '../components/TeamBuilder';
import BattleArena from '../components/BattleArena';
import BattleLog from '../components/BattleLog';
import ActionsPanel from '../components/ActionsPanel';

export default function Simulador() {
  const mode = useBattleStore((s) => s.mode);
  const setMode = useBattleStore((s) => s.setMode);

  const selectedTeam = useBattleStore((s) => s.selectedTeam);
  const setSessionId = useBattleStore((s) => s.setSessionId);
  const setAwaitingInput = useBattleStore((s) => s.setAwaitingInput);
  const setLastRequest = useBattleStore((s) => s.setLastRequest);
  const setMochila = useBattleStore((s) => s.setMochila);
  const setTeamState = useBattleStore((s) => s.setTeamState);
  const addLog = useBattleStore((s) => s.addLog);
  const clearLog = useBattleStore((s) => s.clearLog);
  const setTurno = useBattleStore((s) => s.setTurno);
  const updateSide = useBattleStore((s) => s.updateSide);
  const resetBattle = useBattleStore((s) => s.resetBattle);
  const speed = useBattleStore((s) => s.speed);
  const awaitingInput = useBattleStore((s) => s.awaitingInput);

  // ---- Procesar evento del stream ----
  function procesarEvento(linea) {
    const p = linea.split('|');
    const tipo = p[1];

    switch (tipo) {
      case 'turn':
        setTurno(p[2]);
        addLog({ texto: `TURNO ${p[2]}`, cls: 'turn', icono: '' });
        break;

      case 'switch': {
        const side = p[2].startsWith('p1') ? 'p1' : 'p2';
        const nombre = p[2].split(': ')[1];
        const hp = parseHP(p[4]);
        updateSide(side, {
          name: nombre, hpPct: hp.pct, hpCur: hp.cur, hpMax: hp.max, status: '', fainted: false,
        });
        addLog({ texto: `${side === 'p1' ? 'Tu' : 'IA'} envía a ${nombre}!`, cls: 'switch', icono: '▶️' });
        break;
      }

      case 'move':
        addLog({ texto: `${p[2].split(': ')[1]} usa ${p[3]}!`, cls: 'move', icono: '⚔️' });
        break;

      case '-damage': {
        const side = p[2].startsWith('p1') ? 'p1' : 'p2';
        const nombre = p[2].split(': ')[1];
        const hp = parseHP(p[3]);
        updateSide(side, { hpPct: hp.pct, hpCur: hp.cur, hpMax: hp.max, fainted: hp.pct <= 0 });
        addLog({ texto: `${nombre} recibe daño (${hp.cur}/${hp.max})`, cls: 'damage', icono: '💥' });
        break;
      }

      case '-heal': {
        const side = p[2].startsWith('p1') ? 'p1' : 'p2';
        const nombre = p[2].split(': ')[1];
        const hp = parseHP(p[3]);
        updateSide(side, { hpPct: hp.pct, hpCur: hp.cur, hpMax: hp.max });
        addLog({ texto: `${nombre} recupera HP (${hp.cur}/${hp.max})`, cls: 'heal', icono: '💚' });
        break;
      }

      case 'heal':
        addLog({ texto: `${p[2]} recupera ${p[3]} HP`, cls: 'heal', icono: '💚' });
        break;
      case 'revive':
        addLog({ texto: `${p[2]} vuelve al combate!`, cls: 'heal', icono: '💎' });
        break;
      case 'cure':
        addLog({ texto: `${p[2]} se cura de su estado.`, cls: 'cure', icono: '🌟' });
        break;
      case 'log':
        addLog({ texto: p.slice(2).join('|'), cls: 'item', icono: '🎒' });
        break;
      case '-boost':
        addLog({ texto: `${p[2].split(': ')[1]}: ${p[3]} +${p[4]}`, cls: 'boost', icono: '⬆️' });
        break;
      case '-unboost':
        addLog({ texto: `${p[2].split(': ')[1]}: ${p[3]} -${p[4]}`, cls: 'boost', icono: '⬇️' });
        break;

      case '-status': {
        const side = p[2].startsWith('p1') ? 'p1' : 'p2';
        const mapa = {
          par: { txt: 'paralizado', icono: '⚡' },
          brn: { txt: 'quemado', icono: '🔥' },
          psn: { txt: 'envenenado', icono: '☠️' },
          tox: { txt: 'gravemente envenenado', icono: '💀' },
          slp: { txt: 'dormido', icono: '💤' },
          frz: { txt: 'congelado', icono: '❄️' },
        };
        const info = mapa[p[3]] || { txt: p[3], icono: '✨' };
        updateSide(side, { status: info.txt });
        addLog({ texto: `${p[2].split(': ')[1]} está ${info.txt}!`, cls: 'status', icono: info.icono });
        break;
      }

      case '-curestatus': {
        const side = p[2].startsWith('p1') ? 'p1' : 'p2';
        updateSide(side, { status: '' });
        addLog({ texto: `${p[2].split(': ')[1]} se cura.`, cls: 'cure', icono: '🌟' });
        break;
      }

      case '-supereffective': addLog({ texto: '¡Es súper efectivo!', cls: 'supereffective', icono: '⚡' }); break;
      case '-resisted': addLog({ texto: 'No es muy efectivo...', cls: 'supereffective', icono: '🛡️' }); break;
      case '-immune': addLog({ texto: 'No afecta al objetivo...', cls: 'immune', icono: '🚫' }); break;
      case '-crit': addLog({ texto: '¡Golpe crítico!', cls: 'crit', icono: '🎯' }); break;
      case '-miss': addLog({ texto: '¡Falló!', cls: 'miss', icono: '💨' }); break;
      case '-item': addLog({ texto: `${p[2].split(': ')[1]} activa ${p[3]}!`, cls: 'item', icono: '✨' }); break;

      case 'faint': {
        const side = p[2].startsWith('p1') ? 'p1' : 'p2';
        const nombre = p[2].split(': ')[1];
        updateSide(side, { fainted: true, hpPct: 0 });
        addLog({ texto: `${nombre} se ha debilitado!`, cls: 'faint', icono: '💀' });
        break;
      }

      case 'win':
        addLog({ texto: `GANADOR: ${p[2]}!`, cls: 'win', icono: '🏆' });
        break;
      case 'error':
        addLog({ texto: `Error: ${p[2]}`, cls: 'faint', icono: '⚠️' });
        break;
    }
  }

  // ---- Simular IA vs IA ----
  async function handleAuto() {
    resetBattle();
    clearLog();
    setMode('battle');

    try {
      await streamAutoBattle(
        async (event) => {
          procesarEvento(event);
          await new Promise((r) => setTimeout(r, speed));
        },
        (err) => addLog({ texto: `Error: ${err}`, cls: 'faint', icono: '⚠️' })
      );
    } catch (e) {
      addLog({ texto: `Error: ${e.message}`, cls: 'faint', icono: '⚠️' });
    }
  }

  // ---- Armar equipo ----
  function handleManualClick() {
    resetBattle();
    setMode('building');
  }

  // ---- Confirmar equipo y arrancar batalla ----
  async function handleConfirmTeam() {
    const teamText = selectedTeam
      .map((s) => {
        const moves = s.moves?.length > 0 ? s.moves : ['Tackle'];
        return [
          `${s.name} @ ${s.item || 'Leftovers'}`,
          `Ability: ${s.ability || 'Pressure'}`,
          `Tera Type: ${s.teraType || 'Normal'}`,
          `EVs: ${s.evs || '252 HP / 252 Atk / 4 Def'}`,
          `${s.nature || 'Jolly'} Nature`,
          ...moves.map((m) => `- ${m}`),
        ].join('\n');
      })
      .join('\n\n');

    setMode('battle');
    clearLog();

    try {
      const data = await startManualBattle(teamText);
      if (data.error) {
        addLog({ texto: `Error: ${data.error}`, cls: 'faint', icono: '⚠️' });
        return;
      }
      setSessionId(data.sessionId);
      if (data.mochila) setMochila(data.mochila);
      if (data.team) setTeamState(data.team);

      for (const ev of data.events) procesarEvento(ev);

      if (data.done) return;
      if (data.awaiting === 'p1' && data.request) {
        setAwaitingInput(true);
        setLastRequest(data.request);
      }
    } catch (e) {
      addLog({ texto: `Error: ${e.message}`, cls: 'faint', icono: '⚠️' });
    }
  }

  // ---- Enviar acción del jugador ----
  async function handleAction(action) {
    const sessionId = useBattleStore.getState().sessionId;
    if (!sessionId) return;
    setAwaitingInput(false);
    setLastRequest(null);

    try {
      const data = await sendAction(sessionId, action);
      if (data.error) {
        addLog({ texto: `Error: ${data.error}`, cls: 'faint', icono: '⚠️' });
        return;
      }
      if (data.mochila) setMochila(data.mochila);
      if (data.team) setTeamState(data.team);

      for (const ev of data.events) {
        procesarEvento(ev);
        await new Promise((r) => setTimeout(r, speed));
      }

      if (data.done) return;
      if (data.awaiting === 'p1' && data.request) {
        setAwaitingInput(true);
        setLastRequest(data.request);
      }
    } catch (e) {
      addLog({ texto: `Error: ${e.message}`, cls: 'faint', icono: '⚠️' });
    }
  }

  // ---- Volver al menú ----
  function handleBackToMenu() {
    resetBattle();
    setMode('menu');
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-yellow-400">🎮 Simulador</h1>
        {mode !== 'menu' && (
          <button
            onClick={handleBackToMenu}
            className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded text-sm"
          >
            ← Volver al menú
          </button>
        )}
      </div>

      {mode === 'menu' && (
        <ModePicker onAuto={handleAuto} onManual={handleManualClick} />
      )}

      {mode === 'building' && (
        <TeamBuilder
          onConfirm={handleConfirmTeam}
          onCancel={handleBackToMenu}
        />
      )}

      {mode === 'battle' && (
  <>
    <BattleArena />
    <BattleLog />
    {awaitingInput && (
      <ActionsPanel onAction={handleAction} />
    )}
  </>
)}
    </div>
  );
}