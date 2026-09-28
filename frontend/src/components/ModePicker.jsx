// src/components/ModePicker.jsx
import { useBattleStore } from '../store/battleStore';

export default function ModePicker({ onAuto, onManual }) {
  const speed = useBattleStore((s) => s.speed);
  const setSpeed = useBattleStore((s) => s.setSpeed);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <label className="flex items-center gap-3 text-sm text-slate-300">
          <span>Velocidad de eventos:</span>
          <input
            type="range"
            min="50"
            max="1500"
            step="50"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="flex-1 accent-yellow-400"
          />
          <span className="text-yellow-400 font-mono w-16">{speed}ms</span>
        </label>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <button
          onClick={onAuto}
          className="bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 hover:border-yellow-400 rounded-xl p-8 text-center transition group"
        >
          <div className="text-5xl mb-3">🤖</div>
          <div className="text-2xl font-bold text-slate-100 mb-1">IA vs IA</div>
          <div className="text-slate-400 text-sm">Ver una batalla automática</div>
        </button>

        <button
          onClick={onManual}
          className="bg-slate-800 hover:bg-slate-700 border-2 border-yellow-400 rounded-xl p-8 text-center transition"
        >
          <div className="text-5xl mb-3">🎮</div>
          <div className="text-2xl font-bold text-yellow-400 mb-1">Combatir vs IA</div>
          <div className="text-slate-400 text-sm">Elige tu equipo y pelea</div>
        </button>
      </div>
    </div>
  );
}