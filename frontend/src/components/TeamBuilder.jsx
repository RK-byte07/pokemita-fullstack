// src/components/TeamBuilder.jsx
import { useState, useEffect } from 'react';
import { useBattleStore } from '../store/battleStore';
import { iconUrl, TIPOS_COLORES } from '../utils/pokemon';
import { fetchPokemonList, fetchItems, fetchPokemonDetail } from '../services/battleService';
import PokemonModal from './PokemonModal';

export default function TeamBuilder({ onConfirm, onCancel }) {
  const allPokemon = useBattleStore((s) => s.allPokemon);
  const setAllPokemon = useBattleStore((s) => s.setAllPokemon);
  const itemsCache = useBattleStore((s) => s.itemsCache);
  const setItemsCache = useBattleStore((s) => s.setItemsCache);
  const selectedTeam = useBattleStore((s) => s.selectedTeam);
  const addToTeam = useBattleStore((s) => s.addToTeam);
  const removeFromTeam = useBattleStore((s) => s.removeFromTeam);
  const clearTeam = useBattleStore((s) => s.clearTeam);

  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingIndex, setEditingIndex] = useState(-1);

  useEffect(() => {
    (async () => {
      try {
        if (allPokemon.length === 0) {
          const list = await fetchPokemonList();
          setAllPokemon(list);
        }
        if (itemsCache.length === 0) {
          const items = await fetchItems();
          setItemsCache(items);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleAddPokemon(p) {
    if (selectedTeam.find((s) => s.name === p.name)) {
      removeFromTeam(p.name);
      return;
    }
    if (selectedTeam.length >= 6) {
      alert('Máximo 6 Pokémon');
      return;
    }

    let metaMoves = null;
    let allMoves = [];
    try {
      const detail = await fetchPokemonDetail(p.name);
      allMoves = detail.moves || [];
      metaMoves = detail.metaMoves || null;
    } catch (e) {
      console.error(e);
    }

    const moves = metaMoves && metaMoves.length >= 4
      ? metaMoves.slice(0, 4)
      : allMoves.slice(0, 4).map((m) => m.name);

    addToTeam({
      name: p.name,
      types: p.types,
      ability: Object.values(p.abilities || {})[0] || '',
      item: 'Leftovers',
      moves,
      evs: '252,0,0,252,4,0',
      nature: 'Jolly',
      teraType: p.types[0] || 'Normal',
      allMoves,
      metaMoves,
    });
  }

  async function handleRandomTeam() {
    const OU = allPokemon.filter((p) => p.tier === 'OU');
    const shuffled = [...OU].sort(() => Math.random() - 0.5).slice(0, 6);
    clearTeam();
    for (const p of shuffled) {
      await handleAddPokemon(p);
    }
  }

  let filtered = allPokemon;
  if (search) filtered = filtered.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  if (tierFilter) filtered = filtered.filter((p) => p.tier === tierFilter);
  if (typeFilter) filtered = filtered.filter((p) => p.types.includes(typeFilter));
  filtered = filtered.slice(0, 150);

  if (loading) {
    return <div className="text-center py-12 text-slate-400">Cargando Pokédex...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 bg-slate-800 border border-slate-700 rounded-lg p-4">
        <h2 className="text-lg font-bold text-yellow-400">Tu equipo</h2>
        <span className="text-slate-400">{selectedTeam.length} / 6</span>
        <div className="flex-1" />
        <button
          onClick={handleRandomTeam}
          className="bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded text-sm"
        >
          🎲 Aleatorio
        </button>
        <button
          disabled={selectedTeam.length !== 6}
          onClick={onConfirm}
          className="bg-yellow-400 hover:bg-yellow-500 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 font-bold px-4 py-1.5 rounded text-sm"
        >
          ✅ Confirmar equipo
        </button>
        <button
          onClick={onCancel}
          className="bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded text-sm text-white"
        >
          ✕ Cancelar
        </button>
      </div>

      {selectedTeam.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 bg-slate-800 border border-slate-700 rounded-lg p-3">
          {selectedTeam.map((s, i) => (
            <div
              key={s.name}
              onClick={() => setEditingIndex(i)}
              className="relative bg-slate-900 border border-slate-600 hover:border-yellow-400 rounded p-2 cursor-pointer text-center"
            >
              <img src={iconUrl(s.name)} alt={s.name} className="mx-auto w-12 h-12" />
              <div className="text-xs font-bold text-slate-200 truncate">{s.name}</div>
              <div className="text-[10px] text-slate-500 truncate">
                {s.moves.length} movs
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeFromTeam(s.name); }}
                className="absolute top-1 right-1 text-red-400 hover:text-red-300 text-xs"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Buscar Pokémon..."
          className="flex-1 min-w-[200px] bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-yellow-400"
        />
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-yellow-400"
        >
          <option value="">Todos los tiers</option>
          <option value="OU">OU</option>
          <option value="UU">UU</option>
          <option value="RU">RU</option>
          <option value="NU">NU</option>
          <option value="PU">PU</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-yellow-400"
        >
          <option value="">Todos los tipos</option>
          {Object.keys(TIPOS_COLORES).map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-2 max-h-[500px] overflow-y-auto bg-slate-900 border border-slate-700 rounded-lg p-3">
        {filtered.map((p) => {
          const isSelected = !!selectedTeam.find((s) => s.name === p.name);
          return (
            <div
              key={p.id}
              onClick={() => handleAddPokemon(p)}
              className={`cursor-pointer rounded p-2 text-center border transition ${
                isSelected
                  ? 'bg-yellow-400/20 border-yellow-400'
                  : 'bg-slate-800 border-slate-700 hover:border-slate-500'
              }`}
            >
              <img src={iconUrl(p.name)} alt={p.name} loading="lazy" className="mx-auto w-12 h-12" />
              <div className="text-xs font-semibold text-slate-200 truncate">{p.name}</div>
              <div className="text-[10px] text-yellow-400">{p.tier}</div>
              <div className="flex justify-center gap-0.5 mt-1">
                {p.types.map((t) => (
                  <div
                    key={t}
                    className="w-2 h-2 rounded-full"
                    style={{ background: TIPOS_COLORES[t] || '#666' }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {editingIndex >= 0 && (
        <PokemonModal
          index={editingIndex}
          onClose={() => setEditingIndex(-1)}
        />
      )}
    </div>
  );
}