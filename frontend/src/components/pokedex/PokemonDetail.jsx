import {
  useEffect,
  useRef,
  useState,
} from 'react';

import { createPortal } from 'react-dom';
import api from '../../services/api';

import {
  PokemonImage,
  TypeBadge,
  Radar,
} from './PokemonVisuals';

import {
  STAT_LABELS,
  number,
  percent,
} from './format';

function Bars({
  title,
  rows = [],
  onSelect,
}) {
  return (
    <section className="pdx-panel">
      <h3>{title}</h3>

      {!rows.length && (
        <p className="pdx-muted">
          Sin registros suficientes.
        </p>
      )}

      <div className="pdx-bars">
        {rows.map(row => (
          <div key={row.id}>
            <div className="pdx-bar-label">
              {onSelect ? (
                <button
                  type="button"
                  onClick={() => onSelect(row.id)}
                >
                  {row.name} ↗
                </button>
              ) : (
                <span>{row.name}</span>
              )}

              <strong>{percent(row.percent)}</strong>
            </div>

            <div className="pdx-track">
              <span
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(0, row.percent),
                  )}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function PokemonDetail({
  id,
  onClose,
  onSelect,
}) {
  const dialog = useRef(null);
  const body = useRef(null);

  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('profile');
  const [search, setSearch] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const node = dialog.current;
    const focused = document.activeElement;
    const overflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';
    node.showModal();

    return () => {
      node.close();
      document.body.style.overflow = overflow;

      if (focused?.isConnected) {
        focused.focus();
      }
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    body.current?.scrollTo(0, 0);

    api
      .get(`/pokedex/${encodeURIComponent(id)}`, {
        signal: controller.signal,
      })
      .then(response => {
        if (!controller.signal.aborted) {
          setData(response.data);
        }
      })
      .catch(err => {
        if (!controller.signal.aborted) {
          setError(
            err.response?.data?.error ||
              'No se pudo cargar la ficha.',
          );
        }
      });

    return () => controller.abort();
  }, [id, attempt]);

  const competitive = data?.competitive;

  const moves =
    data?.moves.filter(move =>
      `${move.name} ${move.type}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    ) || [];

  return createPortal(
    <dialog
      ref={dialog}
      className="pdx-dialog"
      aria-labelledby="pokemon-detail-title"
      onCancel={event => {
        event.preventDefault();
        onClose();
      }}
      onClick={event => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="pdx-modal-shell">
        <header className="pdx-modal-header">
          <span className="eyebrow">
            ARCHIVO DE COMBATE
          </span>

          <button
            autoFocus
            type="button"
            className="pdx-close"
            onClick={onClose}
            aria-label="Cerrar ficha"
          >
            ✕
          </button>
        </header>

        <div
          ref={body}
          className="pdx-modal-body"
          aria-busy={!data && !error}
        >
          <h2
            id="pokemon-detail-title"
            className="pdx-detail-title"
          >
            {data?.name || 'Ficha Pokémon'}
          </h2>

          {error ? (
            <div className="pdx-notice" role="alert">
              {error}

              <button
                onClick={() => {
                  setError('');
                  setAttempt(value => value + 1);
                }}
              >
                Reintentar
              </button>
            </div>
          ) : !data ? (
            <p className="pdx-loading" role="status">
              Consultando la Pokédex…
            </p>
          ) : (
            <>
              <div className="pdx-detail-hero">
                <div className="pdx-detail-art">
                  <PokemonImage
                    name={data.name}
                    sprite={data.sprite}
                  />
                </div>

                <div>
                  <p className="pdx-kicker">
                    N.º {String(data.num).padStart(3, '0')}
                    {' · '}
                    GENERACIÓN {data.gen}
                  </p>

                  <div className="pdx-types">
                    {data.types.map(type => (
                      <TypeBadge
                        key={type}
                        type={type}
                      />
                    ))}
                  </div>

                  <p className="pdx-muted">
                    {data.height} m · {data.weight} kg
                    {' · '}
                    Tier del motor: {data.tier}
                  </p>

                  {data.battleOnly && (
                    <p className="pdx-muted">
                      Forma que se alcanza durante el
                      combate.
                    </p>
                  )}

                  <div className="pdx-detail-metrics">
                    <div>
                      <strong>{data.bst}</strong>
                      <span>Total base</span>
                    </div>

                    <div>
                      <strong>
                        {percent(competitive?.usage)}
                      </strong>
                      <span>Uso en el reporte</span>
                    </div>

                    <div>
                      <strong>
                        {competitive
                          ? `#${competitive.rank}`
                          : '—'}
                      </strong>
                      <span>Ranking del reporte</span>
                    </div>
                  </div>
                </div>
              </div>

              {data.forms.length > 1 && (
                <div className="pdx-form-picker">
                  <label htmlFor="pokemon-form">
                    Forma
                  </label>

                  <select
                    id="pokemon-form"
                    value={data.id}
                    onChange={event =>
                      onSelect(event.target.value)
                    }
                  >
                    {data.forms.map(form => (
                      <option
                        key={form.id}
                        value={form.id}
                      >
                        {form.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <nav
                className="pdx-tabs"
                aria-label="Secciones de la ficha"
              >
                {[
                  ['profile', 'Perfil y radar'],
                  ['competitive', 'Uso competitivo'],
                  [
                    'moves',
                    `Movimientos (${data.moves.length})`,
                  ],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={tab === value}
                    onClick={() => setTab(value)}
                  >
                    {label}
                  </button>
                ))}
              </nav>

              {tab === 'profile' && (
                <div className="pdx-tab-content">
                  <div className="pdx-two-columns">
                    <section className="pdx-panel">
                      <h3>ADN competitivo</h3>

                      <Radar
                        stats={data.baseStats}
                        name={data.name}
                      />
                    </section>

                    <section className="pdx-panel">
                      <h3>Atributos de la especie</h3>

                      {Object.entries(
                        data.baseStats,
                      ).map(([key, value], index) => (
                        <div
                          className="pdx-stat"
                          key={key}
                        >
                          <span>
                            {STAT_LABELS[index]}
                          </span>

                          <strong>{value}</strong>

                          <div className="pdx-track">
                            <span
                              style={{
                                width: `${
                                  (value / 255) * 100
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}

                      <p className="pdx-note">
                        Valores base, sin nivel, EVs,
                        IVs, naturaleza ni efectos de
                        combate. No representan daño
                        ni porcentaje de victorias.
                      </p>
                    </section>
                  </div>

                  <section className="pdx-panel">
                    <h3>Habilidades de esta forma</h3>

                    <div className="pdx-two-columns">
                      {data.abilities.map(ability => (
                        <article
                          className="pdx-ability"
                          key={ability.id}
                        >
                          <h4>
                            {ability.name}

                            {ability.hidden && (
                              <small>OCULTA</small>
                            )}
                          </h4>

                          <p>{ability.desc}</p>
                        </article>
                      ))}
                    </div>
                  </section>

                  <section className="pdx-panel">
                    <h3>Afinidades defensivas</h3>

                    <p className="pdx-note">
                      Solo tipos: habilidades, objetos,
                      movimientos y teracristalización
                      pueden cambiar el resultado.
                    </p>

                    {[
                      [
                        'Debilidades',
                        matchup =>
                          matchup.multiplier > 1,
                      ],
                      [
                        'Resistencias',
                        matchup =>
                          matchup.multiplier > 0 &&
                          matchup.multiplier < 1,
                      ],
                      [
                        'Inmunidades',
                        matchup =>
                          matchup.multiplier === 0,
                      ],
                    ].map(([label, filter]) => (
                      <div
                        className="pdx-matchups"
                        key={label}
                      >
                        <h4>{label}</h4>

                        <div className="pdx-types">
                          {data.matchups.filter(filter)
                            .length ? (
                            data.matchups
                              .filter(filter)
                              .map(matchup => (
                                <span
                                  className="pdx-matchup"
                                  key={matchup.type}
                                >
                                  <TypeBadge
                                    type={matchup.type}
                                  />

                                  <b>
                                    ×
                                    {matchup.multiplier}
                                  </b>
                                </span>
                              ))
                          ) : (
                            <span className="pdx-muted">
                              Ninguna por tipos
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </section>
                </div>
              )}

              {tab === 'competitive' && (
                <div className="pdx-tab-content">
                  <p className="pdx-source">
                    Smogon · {data.report.label}
                    {' · '}
                    Gen 9 OU · Corte{' '}
                    {data.report.cutoff}
                  </p>

                  {!competitive ? (
                    <div className="pdx-notice">
                      Sin datos en este reporte. Esto
                      no equivale a 0 % de uso ni
                      determina su legalidad en OU.
                    </div>
                  ) : (
                    <>
                      {competitive.grouped && (
                        <div className="pdx-notice">
                          Reporte agrupado de
                          Toxtricity: incluye ambas
                          formas. Las habilidades
                          observadas aquí no son todas
                          seleccionables en la forma
                          actual.
                        </div>
                      )}

                      <p className="pdx-note">
                        {number(competitive.rawCount)}
                        {' '}
                        apariciones sin ponderar. Los
                        porcentajes usan pesos
                        estadísticos; no son tasas de
                        victoria. Movimientos y
                        compañeros pueden sumar más
                        de 100 %.
                      </p>

                      <div className="pdx-two-columns">
                        <Bars
                          title="Movimientos más usados"
                          rows={competitive.moves}
                        />

                        <Bars
                          title="Objetos más usados"
                          rows={competitive.items}
                        />

                        <Bars
                          title="Habilidades observadas"
                          rows={competitive.abilities}
                        />

                        <Bars
                          title="Teratipos registrados"
                          rows={competitive.teraTypes}
                        />

                        <Bars
                          title="Compañeros frecuentes"
                          rows={competitive.teammates}
                          onSelect={onSelect}
                        />

                        <section className="pdx-panel">
                          <h3>
                            Naturalezas y EVs frecuentes
                          </h3>

                          <p className="pdx-note">
                            Orden: PS / Atq / Def /
                            At. Esp. / Def. Esp. / Vel.
                            Los conjuntos completos
                            requieren validación
                            independiente.
                          </p>

                          {competitive.spreads.map(
                            row => (
                              <div
                                className="pdx-spread"
                                key={row.id}
                              >
                                <div>
                                  <b>{row.nature}</b>
                                  <strong>
                                    {percent(row.percent)}
                                  </strong>
                                </div>

                                <code>
                                  {row.evs.join(' / ')}
                                </code>
                              </div>
                            ),
                          )}
                        </section>
                      </div>

                      <section className="pdx-panel">
                        <h3>
                          Checks y counters observados
                        </h3>

                        <p className="pdx-note">
                          Frecuencia de KO o retirada
                          del Pokémon analizado en los
                          encuentros registrados.
                          ± indica error estándar; N
                          es ponderado. No es
                          probabilidad de ganar una
                          batalla. Se muestran
                          muestras con N ≥ 20 y
                          p − 4d ≥ 50 %.
                        </p>

                        {!competitive.counters.length ? (
                          <p className="pdx-muted">
                            Sin muestras suficientes
                            bajo este criterio.
                          </p>
                        ) : (
                          <div className="pdx-table-scroll">
                            <table className="pdx-table">
                              <thead>
                                <tr>
                                  <th>Rival</th>
                                  <th>
                                    Frecuencia ± error
                                  </th>
                                  <th>N ponderado</th>
                                </tr>
                              </thead>

                              <tbody>
                                {competitive.counters.map(
                                  row => (
                                    <tr key={row.id}>
                                      <td>
                                        <button
                                          onClick={() =>
                                            onSelect(
                                              row.id,
                                            )
                                          }
                                        >
                                          {row.name} ↗
                                        </button>
                                      </td>

                                      <td>
                                        {row.percent.toFixed(
                                          1,
                                        )}
                                        {' % ± '}
                                        {row.error.toFixed(
                                          1,
                                        )}
                                      </td>

                                      <td>
                                        {row.encounters.toFixed(
                                          1,
                                        )}
                                      </td>
                                    </tr>
                                  ),
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </section>
                    </>
                  )}
                </div>
              )}

              {tab === 'moves' && (
                <section className="pdx-panel pdx-tab-content">
                  <h3>
                    Movimientos disponibles en Gen 9
                  </h3>

                  <p className="pdx-note">
                    Incluye movimientos heredados.
                    La lista no garantiza la
                    legalidad conjunta de un equipo,
                    habilidad o combinación de
                    movimientos. Descripciones
                    originales de Showdown en inglés.
                  </p>

                  <input
                    className="pdx-search"
                    aria-label="Buscar movimiento o tipo"
                    placeholder="Buscar movimiento o tipo…"
                    value={search}
                    onChange={event =>
                      setSearch(event.target.value)
                    }
                  />

                  <div className="pdx-table-scroll">
                    <table className="pdx-table">
                      <thead>
                        <tr>
                          <th>Movimiento</th>
                          <th>Tipo</th>
                          <th>Categoría</th>
                          <th>Pot.</th>
                          <th>Prec.</th>
                          <th>PP</th>
                        </tr>
                      </thead>

                      <tbody>
                        {moves.map(move => (
                          <tr key={move.id}>
                            <td>
                              <b>{move.name}</b>
                              <small>{move.desc}</small>
                            </td>

                            <td>
                              <TypeBadge
                                type={move.type}
                              />
                            </td>

                            <td>
                              {
                                {
                                  Physical: 'Físico',
                                  Special: 'Especial',
                                  Status: 'Estado',
                                }[move.category]
                              }
                            </td>

                            <td>{move.power || '—'}</td>

                            <td>
                              {move.accuracy === true
                                ? 'Sin chequeo'
                                : `${move.accuracy} %`}
                            </td>

                            <td>{move.pp}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {!moves.length && (
                    <p className="pdx-muted">
                      No hay movimientos que coincidan.
                    </p>
                  )}
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </dialog>,
    document.body,
  );
}