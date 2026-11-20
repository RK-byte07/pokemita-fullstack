import { useEffect, useState } from 'react';
import { fetchPokemonList } from '../services/battleService';
import { iconUrl, TIPOS_COLORES } from '../utils/pokemon';
import Icon from '../components/ui/Icon';

export default function Pokedex() {
  const [pokemon, setPokemon] = useState([]); const [query, setQuery] = useState(''); const [loading, setLoading] = useState(true);
  useEffect(() => { fetchPokemonList().then(setPokemon).catch(() => setPokemon([])).finally(() => setLoading(false)); }, []);
  const filtered = pokemon.filter((item) => item.name.toLowerCase().includes(query.toLowerCase())).slice(0, 60);
  return <div className="page-container py-12"><span className="eyebrow">BASE DE DATOS COMPETITIVA</span><div className="mt-3 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><h1 className="text-4xl font-black text-white">Pokédex táctica</h1><p className="mt-2 text-slate-400">Explora especies, tipos y tiers disponibles.</p></div><label className="flex min-w-[280px] items-center gap-3 rounded-xl border border-white/10 bg-surface px-4"><Icon name="search" className="text-slate-500"/><input value={query} onChange={(e)=>setQuery(e.target.value)} className="w-full bg-transparent py-3 outline-none" placeholder="Buscar Pokémon…"/></label></div>{loading?<p className="py-24 text-center text-slate-400">Sincronizando Pokédex…</p>:<div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">{filtered.map((item)=><article key={item.id} className="rounded-2xl border border-white/10 bg-card p-4 transition hover:border-brand/40"><div className="mb-3 rounded-xl bg-surface p-3"><img src={iconUrl(item.name)} alt="" className="mx-auto h-16 w-16 object-contain"/></div><h2 className="truncate font-black text-white">{item.name}</h2><div className="mt-2 flex items-center justify-between"><div className="flex gap-1">{item.types.map((type)=><span key={type} title={type} className="h-2 w-2 rounded-full" style={{background:TIPOS_COLORES[type]}}/>)}</div><span className="text-xs font-black text-special">{item.tier}</span></div></article>)}</div>}</div>;
}
