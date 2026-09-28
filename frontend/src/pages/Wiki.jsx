// src/pages/Wiki.jsx
import { useState } from 'react';

const SECCIONES = [
  {
    id: 'equipo',
    titulo: '¿Cómo armar mi equipo?',
    contenido:
      'Elige 6 Pokémon del meta Gen 9 OU. Cada uno debe llevar movimientos, habilidad y objeto equipado. Puedes usar el botón 🎲 Aleatorio para generar un equipo competitivo al instante.',
  },
  {
    id: 'tiers',
    titulo: '¿Qué son los tiers OU/UU/RU?',
    contenido:
      'Son niveles de uso en el competitivo: OU (OverUsed) es el más alto, seguido de UU, RU, NU y PU. Los Pokémon de OU son los más fuertes y usados del meta actual.',
  },
  {
    id: 'ia',
    titulo: '¿Cómo funciona la IA?',
    contenido:
      'La IA evalúa su HP, su habilidad activa y los movimientos disponibles para decidir si atacar, curarse, hacer setup o cambiar de Pokémon. Es un rival desafiante pero predecible.',
  },
  {
    id: 'mochila',
    titulo: '¿Qué hay en la mochila?',
    contenido:
      'Durante la batalla tienes pociones (recuperan HP), restaurador (cura estados alterados) y revivir (trae de vuelta un Pokémon debilitado con 50% HP). Úsalos con estrategia.',
  },
  {
    id: 'estados',
    titulo: 'Estados alterados',
    contenido:
      'Parálisis (⚡ reduce velocidad), Quemadura (🔥 daño gradual y reduce ataque), Veneno (☠️ daño gradual), Sueño (💤 no puede atacar), Congelación (❄️ no puede atacar hasta descongelarse).',
  },
  {
    id: 'movimientos',
    titulo: 'Tipos de movimientos',
    contenido:
      'Físico (usa Ataque vs Defensa), Especial (usa Ataque Especial vs Defensa Especial) y Estado (no hace daño directo, aplica efectos). Elige según los stats de tu Pokémon.',
  },
];

export default function Wiki() {
  const [abierta, setAbierta] = useState(SECCIONES[0].id);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-yellow-400 mb-2">📖 Wiki Pokemita</h1>
        <p className="text-slate-400">
          Guía rápida para aprovechar al máximo el simulador
        </p>
      </div>

      <div className="space-y-3">
        {SECCIONES.map((s) => {
          const isOpen = abierta === s.id;
          return (
            <div
              key={s.id}
              className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setAbierta(isOpen ? null : s.id)}
                className="w-full flex justify-between items-center px-5 py-4 text-left hover:bg-slate-700/50 transition"
              >
                <span className="font-semibold text-slate-100">{s.titulo}</span>
                <span className="text-yellow-400 text-xl">
                  {isOpen ? '−' : '+'}
                </span>
              </button>
              {isOpen && (
                <div className="px-5 pb-4 text-slate-300 border-t border-slate-700 pt-3">
                  {s.contenido}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}