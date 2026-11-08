import { useBattleStore } from "../store/battleStore";

export default function ActionsPanel({ onAction }) {
  const lastRequest = useBattleStore((s) => s.lastRequest);
  const currentTab = useBattleStore((s) => s.currentTab);
  const setCurrentTab = useBattleStore((s) => s.setCurrentTab);

  const mochila = useBattleStore((s) => s.mochila);
  const teamState = useBattleStore((s) => s.teamState);

  if (!lastRequest || !lastRequest.options?.length) return null;

  const tabs = [
    {
      id: "moves",
      label: "⚔️ Movimientos",
    },
    {
      id: "switches",
      label: "🔄 Pokémon",
    },
    {
      id: "bag",
      label: "🎒 Mochila",
    },
  ];

  const renderTabs = () => (
    <div className="flex gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setCurrentTab(tab.id)}
          className={`
            px-3 py-1.5 rounded-lg text-sm font-medium transition
            ${
              currentTab === tab.id
                ? "bg-brand text-void"
                : "bg-surface hover:bg-white/10 text-slate-200"
            }
          `}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  // ======================
  // MOCHILA
  // ======================

  if (currentTab === "bag") {
    const hayDebilitados = teamState?.some((pokemon) => pokemon.fainted);

    const activoDebilitado = teamState?.some(
      (pokemon) => pokemon.active && pokemon.fainted,
    );

    return (
      <div
        className="
        bg-card
        border border-white/10
        rounded-xl
        p-4
        space-y-4
      "
      >
        {renderTabs()}

        <div
          className="
          grid
          grid-cols-1
          md:grid-cols-2
          gap-3
        "
        >
          {Object.entries(mochila).map(([id, item]) => {
            let habilitado = item.usos > 0;

            let razon = "";

            if (item.kind === "revive" && !hayDebilitados) {
              habilitado = false;
              razon = "No hay Pokémon debilitados";
            }

            if (
              (item.kind === "heal" || item.kind === "status") &&
              activoDebilitado
            ) {
              habilitado = false;
              razon = "El Pokémon activo está debilitado";
            }

            if (item.usos <= 0) {
              razon = "Sin usos";
            }

            return (
              <button
                key={id}
                disabled={!habilitado}
                onClick={() => onAction(`use-item ${id}`)}
                title={razon}
                className={`
                    flex items-center gap-3
                    p-3
                    rounded-lg
                    text-left
                    transition
                    border

                    ${
                      habilitado
                        ? `
                      bg-void
                      border-white/15
                      hover:border-brand
                      `
                        : `
                      bg-void/50
                      border-white/5
                      opacity-50
                      cursor-not-allowed
                      `
                    }
                  `}
              >
                <span className="text-2xl">{item.icono}</span>

                <div className="flex-1">
                  <div
                    className="
                      font-semibold
                      text-slate-100
                      text-sm
                    "
                  >
                    {item.label}
                  </div>

                  <div
                    className="
                      text-xs
                      text-slate-500
                    "
                  >
                    {habilitado ? item.desc : razon}
                  </div>
                </div>

                <span
                  className="
                    text-brand
                    font-mono
                    text-sm
                  "
                >
                  x{item.usos}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ======================
  // MOVIMIENTOS / CAMBIOS
  // ======================

  let opciones = lastRequest.options;

  if (currentTab === "moves") {
    opciones = opciones.filter((option) => option.kind === "move");
  } else if (currentTab === "switches") {
    opciones = opciones.filter((option) => option.kind === "switch");
  }

  if (opciones.length === 0) {
    opciones = lastRequest.options;
  }

  const titulo =
    lastRequest.type === "switch"
      ? "Elige a tu siguiente Pokémon"
      : currentTab === "moves"
        ? "Elige un movimiento"
        : "Cambia de Pokémon";

  return (
    <div
      className="
      bg-card
      border border-white/10
      rounded-xl
      p-4
      space-y-4
    "
    >
      <div
        className="
        text-sm
        font-semibold
        text-brand
      "
      >
        {titulo}
      </div>

      {renderTabs()}

      <div
        className="
        grid
        grid-cols-2
        md:grid-cols-4
        gap-3
      "
      >
        {opciones.map((option, index) => (
          <button
            key={index}
            disabled={option.disabled}
            onClick={() => onAction(option.action)}
            className={`
                p-3
                rounded-lg
                text-left
                transition
                border

                ${
                  option.disabled
                    ? `
                  bg-void/50
                  border-white/5
                  opacity-50
                  cursor-not-allowed
                  `
                    : `
                  bg-void
                  border-white/15
                  hover:border-brand
                  `
                }

              `}
          >
            <div
              className="
                text-xs
                text-slate-500
                mb-1
              "
            >
              {option.kind === "switch" ? "🔄" : "⚔️"}
            </div>

            <div
              className="
                font-semibold
                text-slate-100
                text-sm
                truncate
              "
            >
              {option.label}
            </div>

            {option.pp && (
              <div
                className="
                    text-xs
                    text-brand
                    font-mono
                  "
              >
                {option.pp}
              </div>
            )}

            {option.hp && (
              <div
                className="
                    text-xs
                    text-slate-400
                    font-mono
                  "
              >
                {option.hp}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
