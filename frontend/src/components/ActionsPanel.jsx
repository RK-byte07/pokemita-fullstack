// src/components/ActionsPanel.jsx
import { useBattleStore } from '../store/battleStore';

export default function ActionsPanel({ onAction }) {
  const lastRequest = useBattleStore((s) => s.lastRequest);
  const currentTab = useBattleStore((s) => s.currentTab);
  const setCurrentTab = useBattleStore((s) => s.setCurrentTab);
  const mochila = useBattleStore((s) => s.mochila);
  const teamState = useBattleStore((s) => s.teamState);

  if (!lastRequest || !lastRequest.options?.length) return null;

  const tabs = [
    { id: 'moves', label: '⚔️ Movimientos' },
    { id: 'switches', label: '🔄 Pokémon' },
    { id: 'bag', label: '🎒 Mochila' },
  ];

  // --- Mochila ---
  if (currentTab === 'bag') {
    const hayDebilitados = teamState?.some((p) => p.fainted);
    const activoDebilitado = teamState?.some((p) => p.active && p.fainted);

    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-3">
        <div className="flex gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setCurrentTab(t.id)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                currentTab === t.id
                  ? 'bg-yellow-400 text-slate-900'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {Object.entries(mochila).map(([id, item]) => {
            let habilitado = item.usos > 0;
            let razon = '';
            if (item.kind === 'revive' && !hayDebilitados) { habilitado = false; razon = 'No hay Pokémon debilitados'; }
            if ((item.kind === 'heal' || item.kind === 'status') && activoDebilitado) { habilitado = false; razon = 'El Pokémon activo está debilitado'; }
            if (item.usos <= 0) razon = 'Sin usos';

            return (
              <button
                key={id}
                disabled={!habilitado}
                onClick={() => onAction(`use-item ${id}`)}
                title={razon}
                className={`flex items-center gap-3 p-3 rounded text-left transition border ${
                  habilitado
                    ? 'bg-slate-900 border-slate-600 hover:border-yellow-400'
                    : 'bg-slate-900/50 border-slate-800 opacity-50 cursor-not-allowed'
                }`}
              >
                <span className="text-2xl">{item.icono}</span>
                <div className="flex-1">
                  <div className="font-semibold text-slate-100 text-sm">{item.label}</div>
                  <div className="text-xs text-slate-500">{habilitado ? item.desc : razon}</div>
                </div>
                <span className="text-yellow-400 text-sm font-mono">x{item.usos}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // --- Movimientos / Cambios ---
  let opts = lastRequest.options;
  if (currentTab === 'moves') opts = opts.filter((o) => o.kind === 'move');
  else if (currentTab === 'switches') opts = opts.filter((o) => o.kind === 'switch');
  if (opts.length === 0) opts = lastRequest.options;

  const titulo = lastRequest.type === 'switch'
    ? 'Elige a tu siguiente Pokémon'
    : currentTab === 'moves'
    ? 'Elige un movimiento'
    : 'Cambia de Pokémon';

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-3">
      <div className="text-sm font-semibold text-yellow-400">{titulo}</div>

      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setCurrentTab(t.id)}
            className={`px-3 py-1.5 rounded text-sm font-medium transition ${
              currentTab === t.id
                ? 'bg-yellow-400 text-slate-900'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {opts.map((opt, i) => (
          <button
            key={i}
            disabled={opt.disabled}
            onClick={() => onAction(opt.action)}
            className={`p-3 rounded text-left transition border ${
              opt.disabled
                ? 'bg-slate-900/50 border-slate-800 opacity-50 cursor-not-allowed'
                : 'bg-slate-900 border-slate-600 hover:border-yellow-400'
            }`}
          >
            <div className="text-xs text-slate-500 mb-1">
              {opt.kind === 'switch' ? '🔄' : '⚔️'}
            </div>
            <div className="font-semibold text-slate-100 text-sm truncate">
              {opt.label}
            </div>
            {opt.pp && <div className="text-xs text-yellow-400 font-mono">{opt.pp}</div>}
            {opt.hp && <div className="text-xs text-slate-400 font-mono">{opt.hp}</div>}
          </button>
        ))}
      </div>
    </div>
  );
}