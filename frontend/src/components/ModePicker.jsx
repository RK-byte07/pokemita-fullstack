import { useBattleStore } from "../store/battleStore";

export default function ModePicker({ onAuto, onManual }) {
  const speed = useBattleStore((s) => s.speed);

  const setSpeed = useBattleStore((s) => s.setSpeed);

  return (
    <div
      className="
      max-w-3xl
      mx-auto
      space-y-6
    "
    >
      {/* Velocidad */}

      <div
        className="
          bg-card
          border border-white/10
          rounded-xl
          p-5
        "
      >
        <label
          className="
            flex
            items-center
            gap-3
            text-sm
            text-slate-300
          "
        >
          <span>Velocidad de eventos:</span>

          <input
            type="range"
            min="50"
            max="1500"
            step="50"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="
              flex-1
              accent-brand
              cursor-pointer
            "
          />

          <span
            className="
              text-brand
              font-mono
              w-16
            "
          >
            {speed}ms
          </span>
        </label>
      </div>

      {/* Modos */}

      <div
        className="
          grid
          md:grid-cols-2
          gap-4
        "
      >
        {/* IA VS IA */}

        <button
          onClick={onAuto}
          className="
            bg-card
            hover:bg-surface

            border-2
            border-white/10

            hover:border-brand

            rounded-xl

            p-8

            text-center

            transition

            group

          "
        >
          <div
            className="
              text-5xl
              mb-3
              group-hover:scale-110
              transition
            "
          >
            🤖
          </div>

          <div
            className="
              text-2xl
              font-bold
              text-slate-100
              mb-2
            "
          >
            IA vs IA
          </div>

          <div
            className="
              text-slate-400
              text-sm
            "
          >
            Observa una batalla automática
          </div>
        </button>

        {/* Jugador VS IA */}

        <button
          onClick={onManual}
          className="
            bg-card
            hover:bg-surface

            border-2
            border-brand

            rounded-xl

            p-8

            text-center

            transition

            group

          "
        >
          <div
            className="
              text-5xl
              mb-3
              group-hover:scale-110
              transition
            "
          >
            🎮
          </div>

          <div
            className="
              text-2xl
              font-bold
              text-brand
              mb-2
            "
          >
            Combatir vs IA
          </div>

          <div
            className="
              text-slate-400
              text-sm
            "
          >
            Construye tu equipo y compite
          </div>
        </button>
      </div>
    </div>
  );
}
