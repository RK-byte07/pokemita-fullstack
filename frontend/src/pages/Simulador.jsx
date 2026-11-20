import { useEffect, useRef, useState } from 'react';
import api from '../services/api';
import {
  listarEquiposAPI,
  guardarEquipoAPI,
  eliminarEquipoAPI,
} from '../services/equiposService';
import {
  PokemonImage,
  TypeBadge,
  Radar,
} from '../components/pokedex/PokemonVisuals';
import { TIPOS_COLORES } from '../utils/pokemon';
import './pokedex.css';
import './simulador.css';

const KEYS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];

const LABELS = [
  'PS',
  'Ataque',
  'Defensa',
  'At. especial',
  'Def. especial',
  'Velocidad',
];

const STATUS = {
  brn: 'Quemado',
  par: 'Paralizado',
  slp: 'Dormido',
  frz: 'Congelado',
  psn: 'Envenenado',
  tox: 'Intoxicado',
};

const BATTLE_TYPES = {
  Normal: ['Normal', '⚪'],
  Fire: ['Fuego', '🔥'],
  Water: ['Agua', '💧'],
  Electric: ['Eléctrico', '⚡'],
  Grass: ['Planta', '🌿'],
  Ice: ['Hielo', '❄️'],
  Fighting: ['Lucha', '🥊'],
  Poison: ['Veneno', '☠️'],
  Ground: ['Tierra', '🏜️'],
  Flying: ['Volador', '🪽'],
  Psychic: ['Psíquico', '🔮'],
  Bug: ['Bicho', '🐛'],
  Rock: ['Roca', '🪨'],
  Ghost: ['Fantasma', '👻'],
  Dragon: ['Dragón', '🐉'],
  Dark: ['Siniestro', '🌙'],
  Steel: ['Acero', '⚙️'],
  Fairy: ['Hada', '✨'],
};

const hpText = p =>
  p
    ? p.exact
      ? `${p.hp} / ${p.maxhp} PS`
      : `${p.hp} % PS aprox.`
    : 'Preparando…';

const percent = p =>
  p
    ? Math.max(
        0,
        Math.min(100, (p.hp / p.maxhp) * 100),
      )
    : 0;

function Editor({ member, options, onSave, onClose }) {
  const ref = useRef(null);
  const [detail, setDetail] = useState(null);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const dialog = ref.current;
    const focused = document.activeElement;
    const overflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';
    dialog.showModal();

    api
      .get(
        `/simulator/pokemon/${encodeURIComponent(
          member.species || member.name,
        )}`,
        { signal: controller.signal },
      )
      .then(({ data }) => {
        setDetail(data);

        const numeric = (value, fallback) =>
          Object.fromEntries(
            KEYS.map((key, i) => [
              key,
              typeof value === 'string'
                ? Number(value.split(',')[i] || 0)
                : value?.[key] ?? fallback,
            ]),
          );

        setDraft({
          ...data.defaults,
          ...member,
          species: data.name,
          name: data.name,
          evs: member.evs
            ? numeric(member.evs, 0)
            : data.defaults.evs,
          ivs: numeric(member.ivs, 31),
          teraType:
            data.requiredTeraType ||
            member.teraType ||
            data.defaults.teraType,
          moves: (
            member.moves || data.defaults.moves
          ).map(
            move =>
              data.moves.find(
                m =>
                  m.id ===
                    move
                      .toLowerCase()
                      .replace(/[^a-z0-9]/g, '') ||
                  m.name === move,
              )?.name || move,
          ),
        });
      })
      .catch(err => {
        if (!controller.signal.aborted) {
          setError(
            err.response?.data?.error ||
              'No se pudo cargar el Pokémon.',
          );
        }
      });

    return () => {
      controller.abort();
      dialog.close();
      document.body.style.overflow = overflow;

      if (focused?.isConnected) {
        focused.focus();
      }
    };
  }, [member]);

  const total = draft
    ? Object.values(draft.evs).reduce(
        (a, b) => a + Number(b),
        0,
      )
    : 0;

  const nature = options.natures.find(
    n => n.name === draft?.nature,
  );

  function stat(key) {
    const base = detail.baseStats[key];
    const iv = Number(draft.ivs[key]);
    const ev = Number(draft.evs[key]);

    if (key === 'hp' && base === 1) return 1;

    const raw = 2 * base + iv + Math.floor(ev / 4);

    return key === 'hp'
      ? raw + 110
      : Math.floor(
          (raw + 5) *
            (nature?.plus === key
              ? 1.1
              : nature?.minus === key
                ? 0.9
                : 1),
        );
  }

  function toggle(name) {
    if (draft.moves.includes(name)) {
      setDraft({
        ...draft,
        moves: draft.moves.filter(m => m !== name),
      });
    } else if (draft.moves.length < 4) {
      setDraft({
        ...draft,
        moves: [...draft.moves, name],
      });
    }
  }

  function save() {
    if (total > 510) {
      return setError(
        'El límite es 510 EVs en total.',
      );
    }

    if (
      !draft.moves.length ||
      draft.moves.length > 4
    ) {
      return setError(
        'Selecciona entre uno y cuatro movimientos.',
      );
    }

    if (
      !detail.abilities.some(
        a =>
          a.name === draft.ability &&
          !a.banned,
      )
    ) {
      return setError(
        'Selecciona una habilidad permitida de esta forma.',
      );
    }

    if (
      draft.moves.some(
        move =>
          !detail.moves.some(
            m => m.name === move,
          ),
      )
    ) {
      return setError(
        'Retira los movimientos antiguos que no pertenecen a esta lista de Gen 9.',
      );
    }

    if (
      draft.item &&
      !options.items.some(
        i => i.name === draft.item,
      )
    ) {
      return setError(
        'Selecciona un objeto permitido.',
      );
    }

    onSave(draft);
  }

  return (
    <dialog
      ref={ref}
      className="sim-dialog"
      aria-labelledby="editor-title"
      onCancel={e => {
        e.preventDefault();
        onClose();
      }}
      onClick={e => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <header className="sim-dialog-head">
        <span className="sim-kicker">
          LABORATORIO DE EQUIPOS / NIVEL 100
        </span>

        <button
          autoFocus
          className="sim-icon"
          onClick={onClose}
          aria-label="Cerrar editor"
        >
          ✕
        </button>
      </header>

      <div className="sim-dialog-body">
        <h2 id="editor-title">
          {detail?.name ||
            member.species ||
            member.name}
        </h2>

        {!draft ? (
          <p role="status">
            {error ||
              'Consultando atributos y movimientos…'}
          </p>
        ) : (
          <>
            <div className="sim-editor-hero">
              <div className="sim-editor-art">
                <PokemonImage
                  name={detail.name}
                  sprite={detail.sprite}
                />
              </div>

              <div>
                <div className="sim-type-list">
                  {detail.types.map(type => (
                    <TypeBadge
                      key={type}
                      type={type}
                    />
                  ))}
                </div>

                <p className="sim-muted">
                  #{detail.num} · {detail.tier}
                  {' · '}Total base {detail.bst}
                </p>

                <p>
                  Configura una forma real, sus
                  habilidades y su estrategia.
                </p>
              </div>
            </div>

            <div className="sim-two">
              <section className="sim-panel">
                <h3>Perfil base</h3>

                <Radar
                  stats={detail.baseStats}
                  name={detail.name}
                />
              </section>

              <section className="sim-panel">
                <h3>Habilidad</h3>

                <p className="sim-muted">
                  {detail.abilities.length === 1
                    ? 'Esta especie tiene una sola habilidad oficial. No se añaden habilidades de otras formas.'
                    : 'Incluye habilidades normales y ocultas de esta forma.'}
                </p>

                <div className="sim-ability-list">
                  {detail.abilities.map(ability => (
                    <button
                      key={ability.id}
                      disabled={ability.banned}
                      aria-pressed={
                        draft.ability ===
                        ability.name
                      }
                      onClick={() =>
                        setDraft({
                          ...draft,
                          ability: ability.name,
                        })
                      }
                    >
                      <b>
                        {ability.name}{' '}
                        {ability.hidden
                          ? '· Oculta'
                          : ''}{' '}
                        {ability.banned
                          ? '· Prohibida en OU'
                          : ''}
                      </b>

                      <span>
                        {ability.desc}
                      </span>
                    </button>
                  ))}
                </div>

                <label className="sim-label">
                  Objeto equipado
                  <select
                    value={draft.item}
                    onChange={e =>
                      setDraft({
                        ...draft,
                        item: e.target.value,
                      })
                    }
                  >
                    <option value="">
                      Sin objeto
                    </option>

                    {options.items.map(item => (
                      <option key={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="sim-label">
                  Naturaleza
                  <select
                    value={draft.nature}
                    onChange={e =>
                      setDraft({
                        ...draft,
                        nature: e.target.value,
                      })
                    }
                  >
                    {options.natures.map(item => (
                      <option
                        key={item.name}
                        value={item.name}
                      >
                        {item.name}
                        {item.plus
                          ? ` (+${item.plus} / −${item.minus})`
                          : ' (neutra)'}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="sim-label">
                  Teratipo
                  <select
                    disabled={Boolean(
                      detail.requiredTeraType,
                    )}
                    value={draft.teraType}
                    onChange={e =>
                      setDraft({
                        ...draft,
                        teraType: e.target.value,
                      })
                    }
                  >
                    {options.types.map(type => (
                      <option key={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>
              </section>
            </div>

            <section className="sim-panel">
              <div className="sim-heading">
                <h3>Entrenamiento</h3>

                <span
                  className={
                    total > 510
                      ? 'sim-error-text'
                      : 'sim-gold'
                  }
                >
                  {total} / 510 EVs
                </span>
              </div>

              <div className="sim-table-wrap">
                <table className="sim-table">
                  <thead>
                    <tr>
                      <th>Atributo</th>
                      <th>Base</th>
                      <th>EVs · 0–252</th>
                      <th>IVs · 0–31</th>
                      <th>Final · Nv. 100</th>
                    </tr>
                  </thead>

                  <tbody>
                    {KEYS.map((key, i) => (
                      <tr key={key}>
                        <td>{LABELS[i]}</td>
                        <td>
                          {detail.baseStats[key]}
                        </td>

                        <td>
                          <input
                            aria-label={
                              `EVs ${LABELS[i]}`
                            }
                            type="number"
                            min="0"
                            max="252"
                            value={draft.evs[key]}
                            onChange={e =>
                              setDraft({
                                ...draft,
                                evs: {
                                  ...draft.evs,
                                  [key]: Math.max(
                                    0,
                                    Math.min(
                                      252,
                                      Math.floor(
                                        Number(
                                          e.target
                                            .value,
                                        ),
                                      ),
                                    ),
                                  ),
                                },
                              })
                            }
                          />
                        </td>

                        <td>
                          <input
                            aria-label={
                              `IVs ${LABELS[i]}`
                            }
                            type="number"
                            min="0"
                            max="31"
                            value={draft.ivs[key]}
                            onChange={e =>
                              setDraft({
                                ...draft,
                                ivs: {
                                  ...draft.ivs,
                                  [key]: Math.max(
                                    0,
                                    Math.min(
                                      31,
                                      Math.floor(
                                        Number(
                                          e.target
                                            .value,
                                        ),
                                      ),
                                    ),
                                  ),
                                },
                              })
                            }
                          />
                        </td>

                        <td className="sim-gold">
                          {stat(key)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="sim-panel">
              <div className="sim-heading">
                <h3>
                  Movimientos ·{' '}
                  {draft.moves.length}/4
                </h3>

                <input
                  aria-label="Buscar movimientos"
                  placeholder="Buscar movimiento o tipo…"
                  value={query}
                  onChange={e =>
                    setQuery(e.target.value)
                  }
                />
              </div>

              <div className="sim-selected-moves">
                {draft.moves.map(move => (
                  <button
                    key={move}
                    onClick={() => toggle(move)}
                  >
                    {move} ✕
                  </button>
                ))}
              </div>

              <div className="sim-move-picker">
                {detail.moves
                  .filter(move =>
                    `${move.name} ${move.type}`
                      .toLowerCase()
                      .includes(
                        query.toLowerCase(),
                      ),
                  )
                  .map(move => (
                    <button
                      key={move.id}
                      aria-pressed={
                        draft.moves.includes(
                          move.name,
                        )
                      }
                      disabled={
                        !draft.moves.includes(
                          move.name,
                        ) &&
                        draft.moves.length >= 4
                      }
                      onClick={() =>
                        toggle(move.name)
                      }
                    >
                      <div>
                        <b>{move.name}</b>

                        <TypeBadge
                          type={move.type}
                        />
                      </div>

                      <small>
                        {move.category}
                        {' · '}Pot.{' '}
                        {move.power || '—'}
                        {' · '}Prec.{' '}
                        {move.accuracy === true
                          ? '—'
                          : move.accuracy}
                        {' · '}PP {move.pp}
                      </small>

                      <span>{move.desc}</span>
                    </button>
                  ))}
              </div>
            </section>

            {error && (
              <p
                className="sim-notice"
                role="alert"
              >
                {error}
              </p>
            )}

            <p className="sim-muted">
              El equipo completo se valida con
              Showdown antes de entrar al combate.
              Datos y descripciones originales en
              inglés.
            </p>

            <div className="sim-actions">
              <button
                className="sim-secondary"
                onClick={onClose}
              >
                Cancelar
              </button>

              <button
                className="sim-primary"
                onClick={save}
              >
                Guardar configuración
              </button>
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}

function Fighter({ pokemon, side, attack }) {
  const health = percent(pokemon);

  return (
    <div
      className={
        `sim-fighter sim-fighter-${side} ` +
        (attack ? 'sim-attacking' : '')
      }
    >
      <div className="sim-health-card">
        <div className="sim-health-heading">
          <b className="sim-health-name">
            {pokemon?.name ||
              'Preparando equipo'}
          </b>

          <span>Nv. 100</span>
        </div>

        <div className="sim-type-list">
          {pokemon?.types.map(type => {
            const [label, emoji] =
              BATTLE_TYPES[type] ||
              [type, '✦'];

            return (
              <span
                key={type}
                className="pdx-type sim-health-type"
                style={{
                  '--type-color':
                    TIPOS_COLORES[type] ||
                    '#94a3b8',
                }}
              >
                <span
                  className="sim-type-emoji"
                  aria-hidden="true"
                >
                  {emoji}
                </span>

                {label}
              </span>
            );
          })}
        </div>

        <div
          className="sim-hp"
          role="progressbar"
          aria-label={
            `PS de ${pokemon?.name || 'Pokémon'}`
          }
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(health)}
          aria-valuetext={
            pokemon?.fainted
              ? 'Debilitado'
              : hpText(pokemon)
          }
        >
          <span
            style={{
              width: `${health}%`,
              background:
                health > 50
                  ? '#22c55e'
                  : health > 20
                    ? '#f6c90e'
                    : '#ef4444',
            }}
          />
        </div>

        <div className="sim-health-meta">
          <small>
            {pokemon?.fainted
              ? 'DEBILITADO'
              : hpText(pokemon)}
          </small>

          {pokemon?.status && (
            <b className="sim-status">
              {STATUS[pokemon.status] ||
                pokemon.status}
            </b>
          )}
        </div>

        {pokemon?.tera && (
          <span className="sim-tera-badge">
            ✦ Tera{' '}
            {BATTLE_TYPES[pokemon.tera]?.[0] ||
              pokemon.tera}
          </span>
        )}

        <div className="sim-boosts">
          {pokemon &&
            Object.entries(pokemon.boosts)
              .filter(([, value]) => value !== 0)
              .map(([key, value]) => (
                <span key={key}>
                  {key}{' '}
                  {value > 0 ? '+' : ''}
                  {value}
                </span>
              ))}
        </div>
      </div>

      <div className="sim-ground-anchor">
        <div className="sim-platform" />

        <div
          className={
            'sim-fighter-sprite ' +
            (pokemon?.fainted
              ? 'sim-fainted'
              : '')
          }
        >
          <div className="sim-sprite-motion">
            {pokemon && (
              <PokemonImage
                name={pokemon.name}
                sprite={pokemon.sprite}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Controls({ state, busy, send }) {
  const [tab, setTab] = useState('moves');
  const [tera, setTera] = useState(false);
  const [item, setItem] = useState('potion');
  const [lead, setLead] = useState(0);

  const controls = state.controls;

  if (!controls) {
    return (
      <div className="sim-panel sim-wait">
        {state.done
          ? 'La batalla ha terminado.'
          : 'Resolviendo el turno…'}
      </div>
    );
  }

  if (controls.type === 'preview') {
    return (
      <section className="sim-panel sim-controls">
        <h3>
          Vista previa · Elige tu primer Pokémon
        </h3>

        <p className="sim-muted">
          Ambos equipos son visibles antes del
          primer turno. Los movimientos y objetos
          del rival permanecen ocultos.
        </p>

        <div className="sim-party">
          {state.team.map(pokemon => (
            <button
              aria-pressed={
                lead === pokemon.slot
              }
              disabled={busy}
              key={pokemon.slot}
              onClick={() =>
                setLead(pokemon.slot)
              }
            >
              <PokemonImage
                name={pokemon.name}
                sprite={pokemon.sprite}
              />

              <b>{pokemon.name}</b>
            </button>
          ))}
        </div>

        <button
          className="sim-primary"
          disabled={busy}
          onClick={() =>
            send({
              action:
                `team ${[
                  lead + 1,
                  ...state.team
                    .filter(
                      p => p.slot !== lead,
                    )
                    .map(p => p.slot + 1),
                ].join('')}`,
            })
          }
        >
          Comenzar con{' '}
          {state.team[lead]?.name}
        </button>
      </section>
    );
  }

  const forced =
    controls.type === 'switch';

  return (
    <section className="sim-panel sim-controls">
      <div className="sim-heading">
        <h3>
          {forced
            ? controls.reviving
              ? 'Elige a quién revivir'
              : 'Cambio obligatorio'
            : 'Tu siguiente decisión'}
        </h3>

        <span className="sim-kicker">
          TURNO {state.turn}
        </span>
      </div>

      {!forced && (
        <div className="sim-tabs">
          {[
            ['moves', 'Atacar'],
            ['switch', 'Cambiar'],
            ...(state.rules === 'bag'
              ? [['bag', 'Mochila']]
              : []),
          ].map(([id, title]) => (
            <button
              key={id}
              aria-pressed={tab === id}
              onClick={() => setTab(id)}
            >
              {title}
            </button>
          ))}
        </div>
      )}

      {!forced && tab === 'moves' && (
        <>
          <div className="sim-battle-moves">
            {controls.moves.map(move => (
              <button
                key={move.index}
                disabled={
                  busy || move.disabled
                }
                onClick={() =>
                  send({
                    action:
                      `move ${move.index}` +
                      (tera && controls.tera
                        ? ' terastallize'
                        : ''),
                  })
                }
              >
                <b>{move.name}</b>

                <TypeBadge
                  type={move.type}
                />

                <small>
                  PP{' '}
                  {move.pp == null
                    ? '—'
                    : `${move.pp}/${move.maxpp}`}
                  {' · '}Potencia{' '}
                  {move.power || '—'}
                </small>
              </button>
            ))}
          </div>

          {controls.tera && (
            <label className="sim-checkbox">
              <input
                type="checkbox"
                checked={tera}
                onChange={e =>
                  setTera(e.target.checked)
                }
              />

              ✦ Teracristalizar a{' '}
              {controls.tera} · una vez por equipo
            </label>
          )}
        </>
      )}

      {(forced || tab === 'switch') && (
        <>
          <p className="sim-muted">
            {controls.trapped && !forced
              ? 'No puedes cambiar: tu Pokémon está atrapado.'
              : 'Cambiar ocupa la acción de este turno, salvo cambios forzados.'}
          </p>

          <div className="sim-party">
            {state.team.map(pokemon => (
              <button
                key={pokemon.slot}
                disabled={
                  busy ||
                  (controls.reviving
                    ? !pokemon.fainted
                    : pokemon.active ||
                      pokemon.fainted ||
                      (controls.trapped &&
                        !forced))
                }
                onClick={() =>
                  send({
                    action:
                      `switch ${pokemon.slot + 1}`,
                  })
                }
              >
                <PokemonImage
                  name={pokemon.name}
                  sprite={pokemon.sprite}
                />

                <b>{pokemon.name}</b>

                <small>
                  {pokemon.fainted
                    ? 'Debilitado'
                    : hpText(pokemon)}{' '}
                  {STATUS[pokemon.status]}
                </small>
              </button>
            ))}
          </div>
        </>
      )}

      {!forced && tab === 'bag' && (
        <>
          <p className="sim-muted">
            Regla Pokemita: el objeto se usa antes
            de cambios y ataques; sustituye tu
            movimiento, sin gastar PP. Puedes
            apuntar a miembros de tu equipo. La IA
            tiene el mismo inventario.
          </p>

          <div className="sim-bag">
            {Object.entries(state.bag).map(
              ([id, value]) => (
                <button
                  key={id}
                  aria-pressed={item === id}
                  disabled={value.uses <= 0}
                  onClick={() => setItem(id)}
                >
                  <b>{value.label}</b>

                  <small>
                    ×{value.uses} ·{' '}
                    {value.revive
                      ? '50 % PS'
                      : value.status
                        ? 'Cura estado'
                        : value.heal === 'max'
                          ? 'Todos los PS'
                          : `+${value.heal} PS`}
                  </small>
                </button>
              ),
            )}
          </div>

          <h4>Selecciona el objetivo</h4>

          <div className="sim-party">
            {state.team.map(pokemon => {
              const chosen = state.bag[item];

              const invalid =
                !chosen ||
                chosen.uses <= 0 ||
                (chosen.revive
                  ? !pokemon.fainted
                  : pokemon.fainted) ||
                (chosen.status &&
                  !pokemon.status) ||
                (chosen.heal &&
                  pokemon.hp >= pokemon.maxhp);

              return (
                <button
                  key={pokemon.slot}
                  disabled={busy || invalid}
                  onClick={() =>
                    send({
                      item,
                      target: pokemon.slot,
                    })
                  }
                >
                  <PokemonImage
                    name={pokemon.name}
                    sprite={pokemon.sprite}
                  />

                  <b>{pokemon.name}</b>

                  <small>
                    {pokemon.fainted
                      ? 'Debilitado'
                      : hpText(pokemon)}
                  </small>
                </button>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

function eventText(line) {
  const parts = line.split('|');
  const actor =
    parts[2]?.split(': ')[1] || parts[2];

  const source = (
    parts.find(part =>
      part.startsWith('[from]'),
    ) || ''
  ).replace(
    /^\[from\]\s*(?:item:|ability:|move:)?\s*/,
    '',
  );

  const reason = source
    ? ` · ${STATUS[source] || source}`
    : '';

  switch (parts[1]) {
    case 'turn':
      return `— TURNO ${parts[2]} —`;

    case 'move':
      return `${actor} usa ${parts[3]}.`;

    case 'switch':
    case 'drag':
      return `${
        parts[2]?.startsWith('p1')
          ? 'Azul'
          : 'Rojo'
      } envía a ${parts[3]?.split(',')[0]}.`;

    case '-damage':
      return `${actor} recibe daño: ${
        parts[3]?.split(' ')[0]
      }${reason}.`;

    case '-heal':
      return `${actor} recupera PS: ${
        parts[3]?.split(' ')[0]
      }${reason}.`;

    case 'faint':
      return `${actor} se ha debilitado.`;

    case '-status':
      return `${actor}: ${
        STATUS[parts[3]] || parts[3]
      }.`;

    case '-curestatus':
      return `${actor} se recupera de ${
        STATUS[parts[3]] || parts[3]
      }.`;

    case '-boost':
      return `${actor}: ${parts[3]} +${parts[4]}.`;

    case '-unboost':
      return `${actor}: ${parts[3]} −${parts[4]}.`;

    case '-supereffective':
      return '¡Es supereficaz!';

    case '-resisted':
      return 'No es muy eficaz…';

    case '-immune':
      return `${actor} es inmune.`;

    case '-crit':
      return '¡Golpe crítico!';

    case '-miss':
      return 'El ataque falló.';

    case '-fail':
      return `${actor}: la acción falló.`;

    case 'cant':
      return `${actor} no puede actuar (${parts[3]}).`;

    case '-weather':
      return `Clima: ${parts[2]}.`;

    case '-fieldstart':
    case '-fieldend':
      return `Campo: ${parts[2]}.`;

    case '-sidestart':
    case '-sideend':
      return `${parts[2]}: ${parts[3]}.`;

    case '-start':
    case '-end':
    case '-activate':
      return `${actor}: ${parts[3]}.`;

    case 'replace':
    case '-formechange':
    case 'detailschange':
      return `${actor}: ${
        parts[3]?.split(',')[0]
      }.`;

    case '-ability':
      return `${actor} activa ${parts[3]}.`;

    case '-item':
    case '-enditem':
      return `${actor}: ${parts[3]}.`;

    case '-terastallize':
      return `${actor} teracristaliza a ${parts[3]}.`;

    case 'win':
      return `Victoria de ${parts[2]}.`;

    case 'tie':
      return 'La batalla termina en empate.';

    case 'message':
    case 'error':
      return parts.slice(2).join(' ');

    default:
      return null;
  }
}

export default function Simulador() {
  const [screen, setScreen] = useState('menu');
  const [rules, setRules] = useState('bag');
  const [speed, setSpeed] = useState(650);
  const [options, setOptions] = useState(null);
  const [catalogError, setCatalogError] =
    useState('');
  const [reload, setReload] = useState(0);
  const [team, setTeam] = useState([]);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [visible, setVisible] = useState(48);
  const [editor, setEditor] = useState(null);
  const [saved, setSaved] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState(null);
  const [logs, setLogs] = useState([]);
  const [connection, setConnection] =
    useState('disconnected');
  const [attack, setAttack] = useState('');

  const socket = useRef(null);
  const current = useRef(null);
  const queue = useRef([]);
  const playing = useRef(false);
  const generation = useRef(0);
  const pace = useRef(speed);
  const logBox = useRef(null);

  useEffect(() => {
    pace.current = speed;
  }, [speed]);

  useEffect(() => {
    const controller = new AbortController();

    api
      .get('/simulator/catalog', {
        signal: controller.signal,
      })
      .then(({ data }) => {
        setOptions(data);
        setCatalogError('');
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setCatalogError(
            'No se pudo consultar el catálogo. Comprueba el backend.',
          );
        }
      });

    return () => controller.abort();
  }, [reload]);

  function stop() {
    generation.current++;
    queue.current = [];
    playing.current = false;

    const ws = socket.current;
    socket.current = null;

    if (ws) {
      ws.onclose = null;
      ws.onerror = null;
      ws.onmessage = null;
      ws.close();
    }

    current.current = null;
    setBusy(false);
    setAttack('');
    setConnection('disconnected');
  }

  useEffect(
    () => () => {
      generation.current++;

      const ws = socket.current;

      if (ws) {
        ws.onclose = null;
        ws.onerror = null;
        ws.onmessage = null;
        ws.close();
      }
    },
    [],
  );

  useEffect(() => {
    if (logBox.current) {
      logBox.current.scrollTop =
        logBox.current.scrollHeight;
    }
  }, [logs]);

  async function drain() {
    if (playing.current) return;

    playing.current = true;
    const token = generation.current;

    try {
      while (
        queue.current.length &&
        token === generation.current
      ) {
        const incoming = queue.current.shift();
        current.current = incoming;

        if (incoming.mode === 'manual') {
          setBusy(true);
        }

        for (const line of incoming.events) {
          if (token !== generation.current) return;

          const text = eventText(line);
          if (!text) continue;

          const parts = line.split('|');

          const side =
            parts[2]?.startsWith('p1')
              ? 'p1'
              : 'p2';

          if (parts[1] === 'move') {
            setAttack(side);
          }

          setLogs(previous => [
            ...previous.slice(-399),
            text,
          ]);

          if (
            [
              '-damage',
              '-heal',
              'switch',
              'drag',
              'faint',
              '-status',
              '-curestatus',
            ].includes(parts[1])
          ) {
            setState(previous => {
              if (
                !previous?.[side] ||
                !parts[2]?.startsWith(
                  `${side}a:`,
                )
              ) {
                return previous;
              }

              const next = {
                ...previous[side],
              };

              if (
                ['switch', 'drag'].includes(
                  parts[1],
                )
              ) {
                next.name =
                  parts[3].split(',')[0];
                next.sprite = undefined;
              }

              if (
                [
                  '-damage',
                  '-heal',
                  'switch',
                  'drag',
                ].includes(parts[1])
              ) {
                const condition =
                  parts[
                    ['switch', 'drag'].includes(
                      parts[1],
                    )
                      ? 4
                      : 3
                  ].split(' ');

                const [hp, maxhp] = condition[0]
                  .split('/')
                  .map(Number);

                next.hp = hp;
                next.maxhp =
                  maxhp || next.maxhp;
                next.fainted = hp === 0;
                next.status =
                  condition[1] &&
                  condition[1] !== 'fnt'
                    ? condition[1]
                    : '';
              }

              if (parts[1] === 'faint') {
                next.hp = 0;
                next.fainted = true;
              }

              if (parts[1] === '-status') {
                next.status = parts[3];
              }

              if (parts[1] === '-curestatus') {
                next.status = '';
              }

              return {
                ...previous,
                [side]: next,
              };
            });
          }

          await new Promise(resolve =>
            setTimeout(
              resolve,
              incoming.mode === 'auto'
                ? 0
                : Math.min(pace.current, 900),
            ),
          );

          if (token !== generation.current) return;

          setAttack('');
        }

        if (token !== generation.current) return;

        setState(incoming);
        setBusy(false);
      }
    } finally {
      if (token === generation.current) {
        playing.current = false;
      }
    }
  }

  function start(mode, resumeId = null) {
    if (
      mode === 'manual' &&
      !resumeId &&
      team.length !== 6
    ) {
      return setNotice(
        'Completa los seis miembros de tu equipo.',
      );
    }

    stop();
    setNotice('');
    setLogs([]);
    setState(null);
    setBusy(true);
    setScreen('battle');
    setConnection('connecting');

    const base = new URL(
      api.defaults.baseURL,
      window.location.href,
    );

    const ws = new WebSocket(
      `${base.protocol === 'https:' ? 'wss:' : 'ws:'}//${base.host}`,
    );

    socket.current = ws;

    ws.onopen = () => {
      setConnection('connected');

      ws.send(
        JSON.stringify({
          type: resumeId
            ? 'resume_battle'
            : 'start_battle',
          sessionId: resumeId,
          token:
            localStorage.getItem(
              'pokemita_token',
            ) ||
            sessionStorage.getItem(
              'pokemita_token',
            ),
          mode,
          rules,
          team:
            mode === 'manual'
              ? team
              : undefined,
          speed,
        }),
      );
    };

    ws.onmessage = event => {
      if (socket.current !== ws) return;

      const data = JSON.parse(event.data);

      if (data.type === 'state') {
        if (data.state.mode === 'manual') {
          if (data.state.done) {
            sessionStorage.removeItem(
              'pokemita_pending',
            );
          } else {
            sessionStorage.setItem(
              'pokemita_pending',
              data.state.id,
            );
          }
        }

        queue.current.push(data.state);
        void drain();
      }

      if (data.type === 'error') {
        if (resumeId) {
          sessionStorage.removeItem(
            'pokemita_pending',
          );
        }

        setNotice(data.message);
        setBusy(false);

        if (data.state) {
          current.current = data.state;
          setState(data.state);
        }
      }
    };

    ws.onerror = () => {
      setNotice(
        'No se pudo conectar con el servidor de batallas.',
      );
      setBusy(false);
    };

    ws.onclose = () => {
      if (socket.current === ws) {
        setConnection('disconnected');
        setBusy(false);

        if (!current.current?.done) {
          setNotice(
            'Se perdió la conexión. Vuelve al menú para iniciar otra batalla.',
          );
        }
      }
    };
  }

  function send(payload) {
    if (
      busy ||
      !current.current ||
      socket.current?.readyState !==
        WebSocket.OPEN
    ) {
      return;
    }

    setNotice('');
    setBusy(true);

    socket.current.send(
      JSON.stringify({
        type: 'player_action',
        sessionId: current.current.id,
        version: current.current.version,
        ...payload,
      }),
    );
  }

  function changeSpeed(value) {
    setSpeed(value);

    if (
      socket.current?.readyState ===
      WebSocket.OPEN
    ) {
      socket.current.send(
        JSON.stringify({
          type: 'speed',
          speed: value,
        }),
      );
    }
  }

  async function randomize() {
    setBusy(true);
    setNotice('');

    try {
      const { data } = await api.get(
        '/simulator/random-team',
      );

      setTeam(data);
    } catch (error) {
      setNotice(
        error.response?.data?.error ||
          'No se pudo generar el equipo.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    setBusy(true);
    setNotice('');

    try {
      const { data } = await api.post(
        '/simulator/validate',
        { team },
      );

      if (data.errors.length) {
        setNotice(data.errors.join('\n'));
      } else {
        start('manual');
      }
    } catch {
      setNotice(
        'No se pudo validar el equipo.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function loadTeams() {
    try {
      setSaved(await listarEquiposAPI());
    } catch {
      setNotice(
        'No se pudieron cargar tus equipos. Revisa tu sesión y la base de datos.',
      );
    }
  }

  async function saveTeam() {
    if (
      !teamName.trim() ||
      team.length !== 6
    ) {
      return setNotice(
        'Escribe un nombre y completa seis Pokémon.',
      );
    }

    setBusy(true);

    try {
      await guardarEquipoAPI(
        teamName.trim(),
        team,
      );

      setNotice(
        'Equipo guardado correctamente.',
      );
    } catch {
      setNotice(
        'No se pudo guardar. Revisa tu sesión y la base de datos.',
      );
    } finally {
      setBusy(false);
    }
  }

  const filtered =
    options?.pokemon.filter(
      pokemon =>
        `${pokemon.name} ${pokemon.num}`
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        (!type ||
          pokemon.types.includes(type)),
    ) || [];

  function openMember(pokemon, index = null) {
    if (
      index === null &&
      team.length >= 6
    ) {
      return setNotice(
        'Ya tienes seis miembros. Edita o retira uno antes de añadir otro.',
      );
    }

    if (
      index === null &&
      team.some(
        member =>
          (member.species || member.name) ===
          pokemon.name,
      )
    ) {
      return setNotice(
        'Ese Pokémon ya está en el equipo.',
      );
    }

    setEditor({
      member:
        index === null
          ? { species: pokemon.name }
          : pokemon,
      index,
    });
  }

  return (
    <div className="sim page-container">
      <div className="sim-heading sim-page-heading">
        <div>
          <span className="sim-kicker">
            POKEMITA / CENTRO DE COMBATE
          </span>

          <h1>
            {screen === 'menu'
              ? 'Tu próxima batalla empieza aquí.'
              : screen === 'builder'
                ? 'Diseña tu estrategia.'
                : 'Arena de combate'}
          </h1>
        </div>

        {screen !== 'menu' && (
          <button
            className="sim-secondary"
            onClick={() => {
              stop();
              setScreen('menu');
              setNotice('');
            }}
          >
            ← Volver al menú
          </button>
        )}
      </div>

      {notice && (
        <div
          className="sim-notice"
          role="alert"
        >
          {notice}
        </div>
      )}

      {catalogError && (
        <div className="sim-notice">
          {catalogError}{' '}

          <button
            onClick={() =>
              setReload(value => value + 1)
            }
          >
            Reintentar
          </button>
        </div>
      )}

      {screen === 'menu' && (
        <>
          {sessionStorage.getItem(
            'pokemita_pending',
          ) && (
            <button
              className="sim-secondary"
              onClick={() =>
                start(
                  'manual',
                  sessionStorage.getItem(
                    'pokemita_pending',
                  ),
                )
              }
            >
              Retomar última batalla · margen de
              60 segundos
            </button>
          )}

          <section className="sim-menu-hero">
            <div>
              <span className="sim-kicker">
                SINGLES · GENERACIÓN 9 · NIVEL 100
              </span>

              <h2>
                Seis Pokémon.
                <br />
                <em>Una estrategia.</em>
              </h2>

              <p>
                Reglas y cálculos de Pokémon
                Showdown. Equipos validados,
                decisiones por turnos y una arena
                lista para competir.
              </p>
            </div>

            <div
              className="sim-pokeball"
              aria-hidden="true"
            >
              ◉
            </div>
          </section>

          <div className="sim-two">
            <section className="sim-panel">
              <h3>Elige las reglas</h3>

              <div className="sim-rule-options">
                <button
                  aria-pressed={
                    rules === 'bag'
                  }
                  onClick={() =>
                    setRules('bag')
                  }
                >
                  <b>
                    Pokemita con mochila
                  </b>

                  <span>
                    Reglas de equipo OU + objetos
                    de entrenador. Variante propia,
                    no OU oficial.
                  </span>
                </button>

                <button
                  aria-pressed={
                    rules === 'strict'
                  }
                  onClick={() =>
                    setRules('strict')
                  }
                >
                  <b>OU estricto</b>

                  <span>
                    Sin mochila. Objetos equipados,
                    habilidades y teracristalización
                    del formato.
                  </span>
                </button>
              </div>

              <p className="sim-muted">
                En Pokemita, tú y la IA disponen
                del mismo inventario. Cada uso
                ocupa un turno, antes de cambios
                y movimientos. No se permite
                durante cambios forzados.
              </p>
            </section>

            <section className="sim-panel">
              <h3>Ritmo del combate</h3>

              <label className="sim-label">
                Velocidad de eventos · {speed} ms

                <input
                  aria-label="Velocidad de eventos"
                  type="range"
                  min="150"
                  max="1500"
                  step="50"
                  value={speed}
                  onChange={e =>
                    changeSpeed(
                      Number(e.target.value),
                    )
                  }
                />
              </label>

              <p className="sim-muted">
                La velocidad de presentación no
                cambia la Velocidad, prioridad ni
                cálculos del motor.
              </p>

              <div className="sim-rule-tags">
                <span>✓ Validación OU</span>
                <span>✓ EVs e IVs</span>
                <span>✓ Tera</span>
                <span>
                  ✓ Estados y campo
                </span>
              </div>
            </section>
          </div>

          <div className="sim-two sim-mode-cards">
            <button
              onClick={() => {
                setScreen('builder');
                setNotice('');
              }}
              disabled={!options}
            >
              <span className="sim-mode-icon">
                ⚔
              </span>

              <span className="sim-kicker">
                TOMA EL CONTROL
              </span>

              <h2>Combatir vs IA</h2>

              <p>
                Construye, carga o genera tu
                equipo. Elige cada movimiento y
                cambio.
              </p>

              <b>Preparar equipo →</b>
            </button>

            <button
              onClick={() => start('auto')}
              disabled={!options}
            >
              <span className="sim-mode-icon">
                ◈
              </span>

              <span className="sim-kicker">
                OBSERVA Y APRENDE
              </span>

              <h2>IA vs IA</h2>

              <p>
                Dos equipos legales, decisiones
                automáticas y registro de la
                batalla.
              </p>

              <b>
                Entrar como espectador →
              </b>
            </button>
          </div>
        </>
      )}

      {screen === 'builder' && options && (
        <>
          <section className="sim-panel">
            <div className="sim-heading">
              <div>
                <span className="sim-kicker">
                  CONSTRUCTOR /{' '}
                  {rules === 'bag'
                    ? 'POKEMITA CON MOCHILA'
                    : 'OU ESTRICTO'}
                </span>

                <h2>
                  Tu equipo{' '}
                  <small>
                    {team.length}/6
                  </small>
                </h2>
              </div>

              <div className="sim-actions">
                <button
                  disabled={busy}
                  className="sim-secondary"
                  onClick={randomize}
                >
                  ↻ Aleatorio
                </button>

                <button
                  className="sim-secondary"
                  onClick={loadTeams}
                >
                  Cargar equipo
                </button>

                <button
                  disabled={
                    busy ||
                    team.length !== 6
                  }
                  className="sim-primary"
                  onClick={confirm}
                >
                  Validar y combatir →
                </button>
              </div>
            </div>

            <div className="sim-team-slots">
              {Array.from(
                { length: 6 },
                (_, index) => {
                  const member = team[index];

                  const entry =
                    options.pokemon.find(
                      pokemon =>
                        pokemon.name ===
                        (member?.species ||
                          member?.name),
                    );

                  return (
                    <div
                      className="sim-team-slot"
                      key={index}
                    >
                      {member ? (
                        <>
                          <button
                            className="sim-team-edit"
                            onClick={() =>
                              openMember(
                                member,
                                index,
                              )
                            }
                          >
                            <PokemonImage
                              name={
                                entry?.name ||
                                member.name ||
                                member.species
                              }
                              sprite={
                                entry?.sprite
                              }
                            />

                            <b>
                              {member.species ||
                                member.name}
                            </b>

                            <small>
                              {member.ability}
                            </small>

                            <span>
                              {member.moves
                                ?.length || 0}{' '}
                              movimientos · Editar
                            </span>
                          </button>

                          <button
                            className="sim-remove"
                            aria-label={
                              `Retirar ${
                                member.species ||
                                member.name
                              }`
                            }
                            onClick={() =>
                              setTeam(
                                team.filter(
                                  (_, i) =>
                                    i !== index,
                                ),
                              )
                            }
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        <div className="sim-empty-slot">
                          <span>＋</span>

                          <small>
                            Miembro {index + 1}
                          </small>
                        </div>
                      )}
                    </div>
                  );
                },
              )}
            </div>

            <div className="sim-save-row">
              <input
                aria-label="Nombre del equipo"
                placeholder="Nombre de tu equipo…"
                value={teamName}
                maxLength={100}
                onChange={e =>
                  setTeamName(e.target.value)
                }
              />

              <button
                className="sim-secondary"
                disabled={busy}
                onClick={saveTeam}
              >
                Guardar equipo
              </button>
            </div>
          </section>

          {saved && (
            <section className="sim-panel">
              <div className="sim-heading">
                <h3>
                  Tus equipos guardados
                </h3>

                <button
                  className="sim-icon"
                  onClick={() =>
                    setSaved(null)
                  }
                  aria-label="Cerrar equipos guardados"
                >
                  ✕
                </button>
              </div>

              {!saved.length && (
                <p className="sim-muted">
                  Aún no hay equipos guardados.
                </p>
              )}

              {saved.map(row => (
                <div
                  className="sim-saved-row"
                  key={row.id}
                >
                  <div>
                    <b>{row.nombre}</b>

                    <p>
                      {Array.isArray(
                        row.team_data,
                      )
                        ? row.team_data
                            .map(
                              pokemon =>
                                pokemon.species ||
                                pokemon.name,
                            )
                            .join(' · ')
                        : 'Formato guardado no reconocido'}
                    </p>
                  </div>

                  <button
                    className="sim-secondary"
                    onClick={() => {
                      if (
                        Array.isArray(
                          row.team_data,
                        )
                      ) {
                        setTeam(row.team_data);
                        setTeamName(
                          row.nombre,
                        );
                        setSaved(null);

                        setNotice(
                          'Equipo cargado. Se validará antes del combate; revisa los conjuntos antiguos.',
                        );
                      }
                    }}
                  >
                    Cargar
                  </button>

                  <button
                    className="sim-icon"
                    aria-label={
                      `Eliminar equipo ${row.nombre}`
                    }
                    onClick={async () => {
                      try {
                        await eliminarEquipoAPI(
                          row.id,
                        );

                        setSaved(
                          saved.filter(
                            item =>
                              item.id !==
                              row.id,
                          ),
                        );
                      } catch {
                        setNotice(
                          'No se pudo eliminar el equipo.',
                        );
                      }
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </section>
          )}

          <section className="sim-panel">
            <div className="sim-heading">
              <div>
                <span className="sim-kicker">
                  POKÉMON PERMITIDOS EN EL FORMATO
                </span>

                <h2>Elige tus aliados</h2>
              </div>

              <span className="sim-muted">
                {filtered.length} resultados
              </span>
            </div>

            <div className="sim-filters">
              <input
                aria-label="Buscar Pokémon para el equipo"
                placeholder="Buscar Pokémon por nombre o número…"
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  setVisible(48);
                }}
              />

              <select
                aria-label="Filtrar Pokémon por tipo"
                value={type}
                onChange={e => {
                  setType(e.target.value);
                  setVisible(48);
                }}
              >
                <option value="">
                  Todos los tipos
                </option>

                {options.types.map(item => (
                  <option key={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="sim-catalog">
              {filtered
                .slice(0, visible)
                .map(pokemon => (
                  <button
                    key={pokemon.id}
                    onClick={() =>
                      openMember(pokemon)
                    }
                  >
                    <span className="sim-kicker">
                      #{pokemon.num} ·{' '}
                      {pokemon.tier}
                    </span>

                    <PokemonImage
                      name={pokemon.name}
                      sprite={pokemon.sprite}
                    />

                    <b>{pokemon.name}</b>

                    <div className="sim-type-list">
                      {pokemon.types.map(
                        item => (
                          <TypeBadge
                            key={item}
                            type={item}
                          />
                        ),
                      )}
                    </div>

                    <small>
                      {pokemon.abilityCount}{' '}
                      habilidad
                      {pokemon.abilityCount === 1
                        ? ''
                        : 'es'}{' '}
                      permitida
                      {pokemon.abilityCount === 1
                        ? ''
                        : 's'}
                      {' · '}Base {pokemon.bst}
                    </small>

                    <span className="sim-gold">
                      Configurar +
                    </span>
                  </button>
                ))}
            </div>

            {!filtered.length && (
              <p className="sim-wait">
                No hay Pokémon que coincidan.
              </p>
            )}

            {visible < filtered.length && (
              <button
                className="sim-secondary sim-more"
                onClick={() =>
                  setVisible(
                    value => value + 48,
                  )
                }
              >
                Mostrar más ↓
              </button>
            )}
          </section>
        </>
      )}

      {screen === 'battle' && (
        <>
          <div className="sim-battle-top">
            {state?.mode === 'manual' &&
              !state.done && (
                <button
                  className="sim-secondary"
                  disabled={
                    busy ||
                    connection !== 'connected'
                  }
                  onClick={() => {
                    if (
                      window.confirm(
                        'Rendirse cuenta como derrota. ¿Continuar?',
                      )
                    ) {
                      setBusy(true);

                      socket.current.send(
                        JSON.stringify({
                          type: 'surrender',
                          sessionId: state.id,
                        }),
                      );
                    }
                  }}
                >
                  Rendirse
                </button>
              )}

            <span className="sim-chip">
              {state?.rules === 'strict'
                ? 'OU ESTRICTO'
                : 'POKEMITA CON MOCHILA'}
            </span>

            <span className="sim-chip">
              {connection === 'connected'
                ? '● Conectado'
                : connection === 'connecting'
                  ? 'Conectando…'
                  : 'Desconectado'}
            </span>

            <span className="sim-chip">
              Turno {state?.turn || 0}
            </span>

            <label>
              Ritmo
              <input
                aria-label="Velocidad de batalla"
                type="range"
                min="150"
                max="1500"
                step="50"
                value={speed}
                onChange={e =>
                  changeSpeed(
                    Number(e.target.value),
                  )
                }
              />
            </label>
          </div>

          {!state ? (
            <div className="sim-panel sim-wait">
              {connection === 'connected'
                ? 'Validando y preparando la batalla…'
                : 'Esperando conexión con el motor…'}
            </div>
          ) : (
            <>
              <div className="sim-field-layout">
                <div className="sim-field-column">
                  <div
                    className="sim-arena"
                    aria-label="Campo de batalla Pokémon"
                  >
                    <div
                      className="sim-arena-sky"
                      aria-hidden="true"
                    />

                    <div
                      className="sim-arena-floor"
                      aria-hidden="true"
                    />

                    <div className="sim-arena-title">
                      POKEMITA STADIUM

                      <span>
                        {state.mode === 'auto'
                          ? 'IA AZUL vs IA ROJA'
                          : 'TÚ vs IA'}
                        {' · '}GEN 9
                      </span>
                    </div>

                    <Fighter
                      side="p2"
                      pokemon={state.p2}
                      attack={attack === 'p2'}
                    />

                    <Fighter
                      side="p1"
                      pokemon={state.p1}
                      attack={attack === 'p1'}
                    />

                    <div className="sim-arena-caption">
                      {state.done
                        ? 'COMBATE FINALIZADO'
                        : !state.p1
                          ? 'ELIGE TU POKÉMON INICIAL'
                          : busy
                            ? 'RESOLVIENDO EL TURNO…'
                            : state.mode === 'auto'
                              ? 'MODO ESPECTADOR'
                              : `¿QUÉ HARÁ ${state.p1.name.toUpperCase()}?`}
                    </div>
                  </div>

                  <div className="sim-field">
                    <span>
                      Clima:{' '}
                      {state.field.weather ||
                        'Despejado'}
                    </span>

                    <span>
                      Terreno:{' '}
                      {state.field.terrain ||
                        'Normal'}
                    </span>

                    {state.field.effects.map(
                      effect => (
                        <span key={effect}>
                          {effect}
                        </span>
                      ),
                    )}

                    <span>
                      Tu lado:{' '}
                      {state.field.p1.join(
                        ', ',
                      ) || 'Sin efectos'}
                    </span>

                    <span>
                      Rival:{' '}
                      {state.field.p2.join(
                        ', ',
                      ) || 'Sin efectos'}
                    </span>
                  </div>

                  <div className="sim-opponent-preview">
                    <b>Equipo rival</b>

                    {state.opponent.map(
                      (pokemon, index) => (
                        <span
                          key={index}
                          className={
                            pokemon.fainted
                              ? 'sim-fainted'
                              : ''
                          }
                        >
                          <PokemonImage
                            name={pokemon.name}
                            sprite={
                              pokemon.sprite
                            }
                          />

                          <small>
                            {pokemon.name}
                          </small>
                        </span>
                      ),
                    )}
                  </div>
                </div>

                <aside
                  className="sim-panel sim-combat-journal"
                  aria-label="Registro junto al campo"
                >
                  <div className="sim-heading">
                    <div>
                      <span className="sim-kicker">
                        CRÓNICA DEL COMBATE
                      </span>

                      <h3>
                        Registro de batalla
                      </h3>
                    </div>

                    <span
                      className={
                        'sim-journal-indicator ' +
                        (busy ? 'is-busy' : '')
                      }
                    >
                      {busy
                        ? 'EN TURNO'
                        : state.done
                          ? 'FINAL'
                          : 'LISTO'}
                    </span>
                  </div>

                  <div
                    ref={logBox}
                    className="sim-battle-log"
                    role="log"
                    aria-label="Registro de batalla"
                    aria-relevant="additions"
                  >
                    {logs.length ? (
                      logs.map((line, index) => (
                        <p
                          key={index}
                          className={
                            line.startsWith('—')
                              ? 'sim-log-turn'
                              : /Victoria|debilitado|empate/.test(
                                    line,
                                  )
                                ? 'sim-log-important'
                                : ''
                          }
                        >
                          <span
                            className="sim-log-number"
                            aria-hidden="true"
                          >
                            {String(
                              index + 1,
                            ).padStart(3, '0')}
                          </span>

                          <span>{line}</span>
                        </p>
                      ))
                    ) : (
                      <div className="sim-log-empty">
                        <span aria-hidden="true">
                          ◈
                        </span>

                        <p>
                          La historia de esta
                          batalla aparecerá aquí.
                        </p>

                        <small>
                          Movimientos, daño,
                          estados y efectos del
                          campo.
                        </small>
                      </div>
                    )}
                  </div>

                  <footer className="sim-journal-footer">
                    <span>
                      Turno {state.turn}
                    </span>

                    <span>
                      {logs.length} eventos
                      visibles
                    </span>
                  </footer>
                </aside>
              </div>

              {state.done && (
                <section className="sim-result">
                  <span>✦</span>

                  <h2>
                    {state.winner
                      ? state.winner === 'Tú'
                        ? '¡Victoria!'
                        : `Victoria de ${state.winner}`
                      : 'Empate'}
                  </h2>

                  <p>
                    Combate finalizado en el
                    turno {state.turn}.
                  </p>

                  <button
                    className="sim-primary"
                    onClick={() => {
                      stop();

                      setScreen(
                        state.mode === 'manual'
                          ? 'builder'
                          : 'menu',
                      );
                    }}
                  >
                    Preparar otra batalla
                  </button>
                </section>
              )}

              <div className="sim-command-row">
                {state.mode === 'manual' &&
                !state.done ? (
                  <Controls
                    key={
                      `${state.controls?.type}-${state.p1?.name}`
                    }
                    state={state}
                    busy={
                      busy ||
                      connection !== 'connected'
                    }
                    send={send}
                  />
                ) : (
                  <section className="sim-panel">
                    <h3>
                      {state.done
                        ? 'Fin del combate'
                        : 'Modo espectador'}
                    </h3>

                    <p className="sim-muted">
                      {state.done
                        ? 'Puedes revisar el registro o preparar otra batalla.'
                        : 'La IA decide cada turno. Ajusta el ritmo para observar el desarrollo.'}
                    </p>
                  </section>
                )}
              </div>
            </>
          )}
        </>
      )}

      {editor && (
        <Editor
          member={editor.member}
          options={options}
          onClose={() => setEditor(null)}
          onSave={member => {
            setTeam(currentTeam =>
              editor.index === null
                ? [...currentTeam, member]
                : currentTeam.map(
                    (pokemon, index) =>
                      index === editor.index
                        ? member
                        : pokemon,
                  ),
            );

            setEditor(null);

            setNotice(
              'Configuración guardada en el equipo.',
            );
          }}
        />
      )}
    </div>
  );
}