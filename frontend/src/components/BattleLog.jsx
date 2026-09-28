// src/components/BattleLog.jsx
import { useEffect, useRef } from 'react';
import { useBattleStore } from '../store/battleStore';

const COLORES = {
  turn: 'text-yellow-400 font-bold',
  switch: 'text-blue-400',
  move: 'text-slate-100',
  damage: 'text-red-400',
  heal: 'text-green-400',
  status: 'text-purple-400',
  faint: 'text-red-600 font-bold',
  win: 'text-yellow-300 font-bold text-lg',
  supereffective: 'text-orange-400',
  immune: 'text-slate-500',
  crit: 'text-orange-500 font-bold',
  miss: 'text-slate-400',
  boost: 'text-cyan-400',
  item: 'text-pink-400',
  cure: 'text-emerald-400',
};

export default function BattleLog() {
  const logEntries = useBattleStore((s) => s.logEntries);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logEntries]);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
      <div className="bg-slate-900 px-4 py-2 border-b border-slate-700 text-sm font-semibold text-yellow-400">
        📜 Registro de la batalla
      </div>
      <div
        ref={scrollRef}
        className="h-64 overflow-y-auto p-3 space-y-1 font-mono text-sm"
      >
        {logEntries.length === 0 ? (
          <p className="text-slate-500 italic">Esperando eventos...</p>
        ) : (
          logEntries.map((e, i) => (
            <div key={i} className={COLORES[e.cls] || 'text-slate-300'}>
              {e.icono && <span className="mr-2">{e.icono}</span>}
              {e.texto}
            </div>
          ))
        )}
      </div>
    </div>
  );
}