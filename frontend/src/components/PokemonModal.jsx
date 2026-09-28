// src/components/PokemonModal.jsx
import { useState } from 'react';
import { useBattleStore } from '../store/battleStore';
import { fetchPokemonDetail } from '../services/battleService';
import { TIPOS_COLORES } from '../utils/pokemon';

const ITEMS_COMUNES = [
  'Leftovers', 'Choice Band', 'Choice Specs', 'Choice Scarf', 'Life Orb',
  'Focus Sash', 'Heavy-Duty Boots', 'Assault Vest', 'Rocky Helmet',
  'Black Sludge', 'Air Balloon', 'Booster Energy', 'Sitrus Berry',
  'Lum Berry', 'Loaded Dice', 'Weakness Policy', 'Throat Spray',
];

export default function PokemonModal({ index, onClose }) {
  const selectedTeam = useBattleStore((s) => s.selectedTeam);
  const updateTeamMember = useBattleStore((s) => s.updateTeamMember);
  const itemsCache = useBattleStore((s) => s.itemsCache);

  const member = selectedTeam[index];
  const [ability, setAbility] = useState(member.ability);
  const [item, setItem] = useState(member.item);
  const [moves, setMoves] = useState(member.moves || []);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [abilities, setAbilities] = useState([]);

  // Cargar abilities y movimientos
  useState(() => {
    (async () => {
      try {
        const detail = await fetchPokemonDetail(member.name);
        setAbilities(detail.abilities || []);
        if (!member.allMoves || member.allMoves.length === 0) {
          updateTeamMember(index, {
            allMoves: detail.moves || [],
            metaMoves: detail.metaMoves || null,
          });
        }
      } catch (e) {
        console.error(e);
      }
    })();
  });

  const allMoves = member.allMoves || [];
  let filteredMoves = allMoves;
  if (search) filteredMoves = filteredMoves.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));
  if (typeFilter) filteredMoves = filteredMoves.filter((m) => m.type === typeFilter);

  function toggleMove(moveName) {
    if (moves.includes(moveName)) {
      setMoves(moves.filter((m) => m !== moveName));
    } else {
      if (moves.length >= 4) {
        alert('Máximo 4 movimientos');
        return;
      }
      setMoves([...moves, moveName]);
    }
  }

  function handleSave() {
    if (moves.length === 0) {
      alert('Debes elegir al menos 1 movimiento');
      return;
    }
    updateTeamMember(index, { ability, item, moves });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 border border-slate-700 rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-5 py-3 border-b border-slate-700">
          <h3 className="text-lg font-bold text-yellow-400">
            ⚙️ Configurar: {member.name}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-red-400 text-xl"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Habilidad
            </label>
            <select
              value={ability}
              onChange={(e) => setAbility(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-slate-100"
            >
              {abilities.map((a) => (
                <option key={a.name} value={a.name}>
                  {a.name} {a.desc ? `— ${a.desc.slice(0, 60)}...` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Objeto equipado
            </label>
            <select
              value={item}
              onChange={(e) => setItem(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-slate-100"
            >
              <optgroup label="⭐ Comunes">
                {ITEMS_COMUNES.map((n) => (
                  <option key={n} value={n}>⭐ {n}</option>
                ))}
              </optgroup>
              <optgroup label="Todos">
                {itemsCache.slice(0, 300).map((it) => (
                  <option key={it.id} value={it.name}>{it.name}</option>
                ))}
              </optgroup>
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-slate-300">
                Movimientos
              </label>
              <span className={`text-xs font-bold ${moves.length === 4 ? 'text-green-400' : 'text-yellow-400'}`}>
                {moves.length} / 4
              </span>
            </div>

            <div className="flex gap-2 mb-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="🔍 Buscar movimiento..."
                className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-sm text-slate-100"
              />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-sm text-slate-100"
              >
                <option value="">Todos</option>
                {Object.keys(TIPOS_COLORES).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-72 overflow-y-auto bg-slate-900 border border-slate-700 rounded p-2">
              {filteredMoves.length === 0 ? (
                <p className="col-span-full text-center text-slate-500 py-4 text-sm">
                  Sin resultados
                </p>
              ) : (
                filteredMoves.map((m) => {
                  const isSelected = moves.includes(m.name);
                  const isMeta = member.metaMoves?.includes(m.name);
                  return (
                    <label
                      key={m.name}
                      className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer text-sm border transition ${
                        isSelected
                          ? 'bg-yellow-400/20 border-yellow-400'
                          : 'bg-slate-800 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleMove(m.name)}
                        className="accent-yellow-400"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-slate-100">{m.name}</div>
                        <div className="text-xs text-slate-500">
                          {m.type} · {m.category} {m.basePower > 0 ? `· ${m.basePower} BP` : ''}
                        </div>
                      </div>
                      {isMeta && <span title="Recomendado">⭐</span>}
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-slate-700 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-sm bg-slate-700 hover:bg-slate-600 text-slate-200"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded text-sm bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}