import Icon from "./ui/Icon";

export default function AuthVisual() {
  return (
    <aside className="auth-visual">
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="battle-orbit" aria-hidden="true">
        <div className="battle-core">
          <Icon name="sword" size={62} />
        </div>
        <span className="orbit-dot orbit-dot-one" />
        <span className="orbit-dot orbit-dot-two" />
      </div>
      <div className="relative z-10 mt-auto max-w-xl p-10 lg:p-16">
        <span className="eyebrow">POKEMITA // COMPETITIVE HUB</span>
        <h2 className="mt-5 text-4xl font-black leading-tight text-white lg:text-6xl">
          Domina el competitivo <span className="text-brand">Pokémon</span>
        </h2>
        <p className="mt-5 max-w-lg text-lg leading-relaxed text-slate-300">
          Construye equipos, analiza estrategias y enfréntate a simulaciones
          inteligentes.
        </p>
        <div className="mt-8 flex gap-3">
          <span className="stat-pill">
            <b>GEN 9</b> OU
          </span>
          <span className="stat-pill">
            <b>6V6</b> Singles
          </span>
          <span className="stat-pill">
            <b>LIVE</b> Engine
          </span>
        </div>
      </div>
    </aside>
  );
}
