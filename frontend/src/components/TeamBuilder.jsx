// frontend/src/components/TeamBuilder.jsx

import { useState, useEffect } from "react";

import { useBattleStore } from "../store/battleStore";

import { iconUrl, TIPOS_COLORES } from "../utils/pokemon";

import {
  fetchPokemonList,
  fetchItems,
  fetchPokemonDetail,
} from "../services/battleService";

import PokemonModal from "./PokemonModal";

export default function TeamBuilder({ onConfirm, onCancel }) {
  const allPokemon = useBattleStore((s) => s.allPokemon);

  const setAllPokemon = useBattleStore((s) => s.setAllPokemon);

  const itemsCache = useBattleStore((s) => s.itemsCache);

  const setItemsCache = useBattleStore((s) => s.setItemsCache);

  const selectedTeam = useBattleStore((s) => s.selectedTeam);

  const addToTeam = useBattleStore((s) => s.addToTeam);

  const removeFromTeam = useBattleStore((s) => s.removeFromTeam);

  const clearTeam = useBattleStore((s) => s.clearTeam);

  const [search, setSearch] = useState("");

  const [tierFilter, setTierFilter] = useState("");

  const [typeFilter, setTypeFilter] = useState("");

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
      } catch (error) {
        console.error(error);
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
      alert("Máximo 6 Pokémon");

      return;
    }

    let metaMoves = null;
    let allMoves = [];

    try {
      const detail = await fetchPokemonDetail(p.name);

      allMoves = detail.moves || [];

      metaMoves = detail.metaMoves || null;
    } catch (error) {
      console.error(error);
    }

    const moves =
      metaMoves && metaMoves.length >= 4
        ? metaMoves.slice(0, 4)
        : allMoves.slice(0, 4).map((m) => m.name);

    addToTeam({
      name: p.name,

      types: p.types,

      ability: Object.values(p.abilities || {})[0] || "",

      item: "Leftovers",

      moves,

      evs: "252,0,0,252,4,0",

      nature: "Jolly",

      teraType: p.types[0] || "Normal",

      allMoves,

      metaMoves,
    });
  }

  async function handleRandomTeam() {
    const OU = allPokemon.filter((p) => p.tier === "OU");

    const shuffled = [...OU].sort(() => Math.random() - 0.5).slice(0, 6);

    clearTeam();

    for (const pokemon of shuffled) {
      await handleAddPokemon(pokemon);
    }
  }

  let filtered = allPokemon;

  if (search) {
    filtered = filtered.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()),
    );
  }

  if (tierFilter) {
    filtered = filtered.filter((p) => p.tier === tierFilter);
  }

  if (typeFilter) {
    filtered = filtered.filter((p) => p.types.includes(typeFilter));
  }

  filtered = filtered.slice(0, 150);

  if (loading) {
    return (
      <div
        className="
          text-center
          py-12
          text-slate-400
        "
      >
        Cargando Pokédex...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* HEADER EQUIPO */}

      <div
        className="
flex
flex-wrap
items-center
gap-3

bg-card

border
border-white/10

rounded-xl

p-4
"
      >
        <h2
          className="
text-lg
font-bold
text-brand
"
        >
          Tu equipo
        </h2>

        <span className="text-slate-400">{selectedTeam.length}/6</span>

        <div className="flex-1" />

        <button
          onClick={handleRandomTeam}
          className="
bg-surface
hover:bg-white/10
px-3
py-1.5
rounded-lg
text-sm
"
        >
          🎲 Aleatorio
        </button>

        <button
          disabled={selectedTeam.length !== 6}
          onClick={onConfirm}
          className="
bg-brand
hover:bg-brand-light

disabled:bg-surface

text-void

font-bold

px-4
py-1.5

rounded-lg

text-sm
"
        >
          ✅ Confirmar equipo
        </button>

        <button
          onClick={onCancel}
          className="
bg-error
hover:bg-red-500

px-3

py-1.5

rounded-lg

text-sm

text-white
"
        >
          ✕ Cancelar
        </button>
      </div>

      {/* EQUIPO SELECCIONADO */}

      {selectedTeam.length > 0 && (
        <div
          className="
grid
grid-cols-2
md:grid-cols-3
lg:grid-cols-6

gap-2

bg-card

border
border-white/10

rounded-xl

p-3
"
        >
          {selectedTeam.map((pokemon, index) => (
            <div
              key={pokemon.name}
              onClick={() => setEditingIndex(index)}
              className="
relative

bg-void

border
border-white/15

hover:border-brand

rounded-lg

p-2

cursor-pointer

text-center
"
            >
              <img
                src={iconUrl(pokemon.name)}
                alt={pokemon.name}
                className="
mx-auto
w-12
h-12
"
              />

              <div
                className="
text-xs
font-bold
text-slate-200
truncate
"
              >
                {pokemon.name}
              </div>

              <div
                className="
text-[10px]
text-slate-500
"
              >
                {pokemon.moves.length} movs
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();

                  removeFromTeam(pokemon.name);
                }}
                className="
absolute
top-1
right-1

text-red-400

text-xs
"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* FILTROS */}

      <div
        className="
flex
flex-wrap
gap-2
"
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Buscar Pokémon..."
          className="
flex-1
min-w-[200px]

bg-void

border
border-white/15

rounded-lg

px-3

py-2

text-sm

focus:border-brand

outline-none
"
        />

        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="
bg-void
border
border-white/15
rounded-lg
px-3
py-2
text-sm
"
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
          className="
bg-void
border
border-white/15
rounded-lg
px-3
py-2
text-sm
"
        >
          <option value="">Todos los tipos</option>

          {Object.keys(TIPOS_COLORES).map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* GRID POKEMON */}

      <div
        className="
grid
grid-cols-3
md:grid-cols-5
lg:grid-cols-7
xl:grid-cols-8

gap-2

max-h-[500px]

overflow-y-auto

bg-void

border
border-white/10

rounded-xl

p-3
"
      >
        {filtered.map((pokemon) => (
          <div
            key={pokemon.id}
            onClick={() => handleAddPokemon(pokemon)}
            className={`

cursor-pointer

rounded-lg

p-2

text-center

border

transition


${
  selectedTeam.find((s) => s.name === pokemon.name)
    ? "bg-brand/20 border-brand"
    : "bg-card border-white/10 hover:border-brand"
}

`}
          >
            <img
              src={iconUrl(pokemon.name)}
              alt={pokemon.name}
              loading="lazy"
              className="
mx-auto
w-12
h-12
"
            />

            <div
              className="
text-xs
font-semibold
text-slate-200
truncate
"
            >
              {pokemon.name}
            </div>

            <div
              className="
text-[10px]
text-brand
"
            >
              {pokemon.tier}
            </div>

            <div
              className="
flex
justify-center
gap-1
mt-1
"
            >
              {pokemon.types.map((type) => (
                <div
                  key={type}
                  className="
w-2
h-2
rounded-full
"
                  style={{
                    background: TIPOS_COLORES[type] || "#666",
                  }}
                />
              ))}
            </div>
          </div>
        ))}
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
