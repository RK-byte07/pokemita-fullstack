import { useState } from 'react';

const SECCIONES = [
  {
    id: 'equipo',
    titulo: '🛡️ ¿Cómo armar mi equipo?',
    sprite: 'garchomp',
    contenido: (
      <>
        <p className="mb-2">Elige 6 Pokémon del meta Gen 9 OU. Cada uno debe llevar movimientos, habilidad y objeto equipado. Recuerda cubrir sus debilidades.</p>
        <p>Puedes usar el botón 🎲 <strong>Aleatorio</strong> en el simulador para generar un equipo al instante o guardar tus propios equipos en tu perfil. Un equipo balanceado suele tener: 2 atacantes físicos, 2 especiales, 1 defensivo y 1 de soporte.</p>
      </>
    ),
  },
  {
    id: 'tiers',
    titulo: '🏆 Tiers (OU/UU/RU)',
    sprite: 'charizard',
    contenido: (
      <>
        <p className="mb-2">Son niveles de uso en el competitivo: <strong>OU</strong> (OverUsed) es el más alto, seguido de UU, RU, NU y PU.</p>
        <p>Los Pokémon de OU son los más fuertes del meta actual. Usar Pokémon de tiers más bajos suele ser un reto de estrategia y un orgullo para el entrenador.</p>
      </>
    ),
  },
  {
    id: 'stats',
    titulo: '📊 EVs, IVs y Naturalezas',
    sprite: 'pikachu',
    contenido: (
      <>
        <p className="mb-2"><strong>EVs (Puntos de Esfuerzo):</strong> Son los stats que entrenas (máx. 508 en total, 252 en un solo stat).</p>
        <p className="mb-2"><strong>IVs (Valores Individuales):</strong> Van del 0 al 31. 31 es el máximo (lo ideal competitivo).</p>
        <p><strong>Naturalezas:</strong> Suben un stat un 10% y bajan otro 10% (ej: Jolly sube Velocidad, baja Ataque Especial).</p>
      </>
    ),
  },
  {
    id: 'objetos',
    titulo: '🎒 Objetos Meta',
    sprite: 'slowking-galar',
    contenido: (
      <ul className="list-disc pl-4 space-y-1">
        <li><strong>Restos (Leftovers):</strong> Cura un 6% de HP cada turno. Esencial en Pokémon defensivos.</li>
        <li><strong>Pañuelo Elección (Choice Scarf):</strong> Aumenta 1.5x la Velocidad, pero te bloquea en un movimiento.</li>
        <li><strong>Banda Focus (Focus Sash):</strong> Evita ser noqueado de un golpe si tienes 100% de HP.</li>
        <li><strong>Botas Gruesas (Heavy-Duty Boots):</strong> Ignora las Trampas (Stealth Rock, Spikes). Muy usado en Pokémon voladores o frágiles.</li>
        <li><strong>Globo Helio (Air Balloon):</strong> Te hace inmune a movimientos de tipo Tierra hasta que recibas daño.</li>
      </ul>
    ),
  },
  {
    id: 'estrategias',
    titulo: '♟️ Estrategias comunes',
    sprite: 'heatran',
    contenido: (
      <ul className="list-disc pl-4 space-y-2">
        <li><strong>Hazards (Trampas):</strong> Usar Trampa Rocas (Stealth Rock) o Púas (Spikes) al inicio para dañar a los rivales que entren.</li>
        <li><strong>Pivoting:</strong> Usar movimientos como U-Turn o Volt Switch para atacar y cambiar de Pokémon al mismo tiempo, manteniendo la ventaja.</li>
        <li><strong>Setup Sweeper:</strong> Pokémon que usan Danza Espada (Swords Dance) o Danza Dragón (Dragon Dance) para aumentar su ataque y luego barrer con el equipo rival.</li>
        <li><strong>Stall:</strong> Estrategia defensiva basada en envenenar, quemar y curarse constantemente hasta que el rival se debilite por el desgaste.</li>
      </ul>
    ),
  },
  {
    id: 'estados',
    titulo: '☠️ Estados alterados',
    sprite: 'toxapex',
    contenido: (
      <ul className="list-disc pl-4 space-y-1">
        <li><strong>Parálisis (⚡):</strong> Reduce velocidad un 50% y puede evitar ataques.</li>
        <li><strong>Quemadura (🔥):</strong> Daño gradual y reduce a la mitad el ataque físico.</li>
        <li><strong>Veneno (☠️):</strong> Daño gradual al final de cada turno.</li>
        <li><strong>Sueño (💤):</strong> El Pokémon no puede atacar de 1 a 3 turnos.</li>
        <li><strong>Congelación (❄️):</strong> No puede atacar hasta descongelarse (suele ser permanente).</li>
      </ul>
    ),
  },
  {
    id: 'ia',
    titulo: '🤖 ¿Cómo funciona la IA?',
    sprite: 'porygon2',
    contenido: (
      <p>La IA evalúa su HP, su habilidad activa y los movimientos disponibles para decidir si atacar, curarse, hacer setup o cambiar de Pokémon. Es un rival desafiante, pero predecible si sabes identificar sus patrones de ataque. ¡Aprovecha sus errores para ganar!</p>
    ),
  },
  {
    id: 'faq',
    titulo: '❓ Preguntas Frecuentes (FAQ)',
    sprite: 'mrmime',
    contenido: (
      <div className="space-y-3">
        <div>
          <strong className="text-brand">¿Puedo jugar sin registrarme?</strong>
          <p className="text-sm">No, necesitas una cuenta para guardar tus equipos y tu historial de batallas. El registro es rápido y seguro.</p>
        </div>
        <div>
          <strong className="text-brand">¿Por qué mi Pokémon es más lento?</strong>
          <p className="text-sm">Revisa su stat de Velocidad, su Naturaleza y si lleva el objeto Pañuelo Elección. La Velocidad es clave en el competitivo.</p>
        </div>
        <div>
          <strong className="text-brand">¿Los objetos de la mochila son infinitos?</strong>
          <p className="text-sm">No, tienes un límite de pociones, restauradores y revives por batalla. Úsalos sabiamente.</p>
        </div>
      </div>
    ),
  },
];

export default function Wiki() {
  const [abierta, setAbierta] = useState(SECCIONES[0].id);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Encabezado Profesional */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-black text-brand mb-4 tracking-tight drop-shadow-md">
          📖 Wiki Pokemita
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          Domina el meta competitivo de Gen 9 OU. Aprende sobre estadísticas, 
          objetos, estrategias avanzadas y conviértete en el mejor entrenador.
        </p>
      </div>

      {/* Grid de Contenido */}
      <div className="grid md:grid-cols-2 gap-5">
        {SECCIONES.map((s) => {
          const isOpen = abierta === s.id;

          return (
            <div
              key={s.id}
              className={`bg-card border rounded-2xl overflow-hidden transition-all duration-300 ${
                isOpen ? 'border-brand shadow-[0_0_20px_rgba(234,179,8,0.15)]' : 'border-white/10 hover:border-white/30'
              }`}
            >
              <button
                onClick={() => setAbierta(isOpen ? null : s.id)}
                className="w-full flex items-center px-5 py-4 text-left group"
              >
                {/* Sprite del Pokémon */}
                <div className="w-12 h-12 mr-4 flex-shrink-0 bg-surface/50 rounded-full flex items-center justify-center p-1">
                  <img 
                    src={`https://play.pokemonshowdown.com/sprites/gen5/${s.sprite}.png`} 
                    alt={s.sprite}
                    className={`w-10 h-10 object-contain transition-transform duration-300 ${isOpen ? 'scale-125' : 'grayscale group-hover:grayscale-0'}`}
                    onError={(e) => { 
                      // Si falla, intenta con la versión normal de Showdown
                      e.target.src = `https://play.pokemonshowdown.com/sprites/dex/${s.sprite}.png`; 
                    }}
                  />
                </div>

                <div className="flex-1">
                  <span className={`font-bold text-lg block ${isOpen ? 'text-brand' : 'text-slate-200 group-hover:text-white'}`}>
                    {s.titulo}
                  </span>
                </div>

                <span className={`text-2xl font-light transition-transform duration-300 ${isOpen ? 'rotate-180 text-brand' : 'text-slate-500'}`}>
                  {isOpen ? '−' : '+'}
                </span>
              </button>

              {/* Contenido Desplegable */}
              <div 
                className={`px-5 text-slate-300 transition-all duration-300 ease-in-out ${
                  isOpen ? 'pb-5 pt-2 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                }`}
              >
                <div className="border-t border-white/10 pt-4 text-sm leading-relaxed">
                  {s.contenido}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer de la Wiki */}
      <div className="mt-12 text-center p-6 bg-surface/30 border border-white/5 rounded-xl">
        <p className="text-slate-400 text-sm">
          ¿Listo para poner a prueba tus conocimientos? Ve al 
          <a href="/simulador" className="text-brand font-bold ml-1 hover:underline">
            Simulador
          </a> y demuestra tu estrategia.
        </p>
      </div>
    </div>
  );
}