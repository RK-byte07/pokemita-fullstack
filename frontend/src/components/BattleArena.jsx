import { useBattleStore } from "../store/battleStore";
import { spriteUrl, TIPOS_COLORES } from "../utils/pokemon";

function Side({ side }) {
  const data = useBattleStore((s) => s[side]);

  const label = side === "p1" ? "P1 — Tú" : "P2 — IA (Gen 9 OU)";

  const hpColor =
    data.hpPct <= 20
      ? "bg-error"
      : data.hpPct <= 50
        ? "bg-yellow-500"
        : "bg-green-500";

  return (
    <div className="flex-1 bg-card border border-white/10 rounded-xl p-4">
      <div className="text-sm text-slate-400 mb-2">{label}</div>

      <div className="flex gap-4">
        {/* Renderizamos la imagen SOLO si el nombre es válido */}
        {data.name !== "---" ? (
          <img
            src={spriteUrl(data.name)}
            alt={data.name}
            className={`
              w-24
              h-24
              object-contain
              transition
              ${data.fainted ? "opacity-30 grayscale" : ""}
            `}
            // Si la imagen falla (ej. el Pokémon no tiene sprite en esa URL), 
            // mostramos un placeholder en lugar de ocultarla.
            onError={(e) => {
              e.target.src = "https://play.pokemonshowdown.com/sprites/xyani/0.png"; 
            }}
          />
        ) : (
          // Placeholder mientras carga el Pokémon
          <div className="w-24 h-24 flex items-center justify-center text-4xl opacity-20">
            ❓
          </div>
        )}

        <div className="flex-1">
          <div className="font-bold text-lg text-slate-100 mb-1">
            {data.name !== "---" ? data.name : "Esperando..."}
          </div>

          <div className="flex gap-1 mb-2">
            {data.types?.map((type) => (
              <span
                key={type}
                className="text-xs px-2 py-0.5 rounded text-white font-semibold"
                style={{ background: TIPOS_COLORES[type] || "#666" }}
              >
                {type}
              </span>
            ))}
          </div>

          {/* Barra de vida */}
          <div className="w-full h-3 bg-void rounded-full overflow-hidden border border-white/10">
            <div
              className={`h-full transition-all duration-500 ${hpColor}`}
              style={{ width: `${Math.max(0, data.hpPct)}%` }}
            />
          </div>

          <div className="text-xs text-slate-400 mt-1">
            {data.fainted
              ? "DEBILITADO"
              : `${Math.round(data.hpCur)} / ${Math.round(data.hpMax)} (${data.hpPct.toFixed(1)}%)`}
          </div>

          {data.status && (
            <div className="text-xs text-purple-400 mt-1 font-semibold">
              {data.status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BattleArena() {
  const turno = useBattleStore((s) => s.turno);

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row gap-4 items-stretch">
        <Side side="p1" />

        <div className="flex items-center justify-center text-2xl font-bold text-brand">
          VS
        </div>

        <Side side="p2" />
      </div>

      <div className="text-center">
        <span className="inline-block bg-card border border-white/10 px-4 py-1 rounded-full text-sm">
          <span className="text-slate-400 mr-2">TURNO</span>
          <span className="text-brand font-bold">{turno}</span>
        </span>
      </div>
    </div>
  );
}