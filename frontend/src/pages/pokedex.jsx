import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import api from '../services/api';
import { TIPOS_COLORES } from '../utils/pokemon';

import PokemonDetail from '../components/pokedex/PokemonDetail';

import {
  PokemonImage,
  TypeBadge,
} from '../components/pokedex/PokemonVisuals';

import {
  number,
  percent,
} from '../components/pokedex/format';

import './pokedex.css';

export default function Pokedex() {
  const [catalog, setCatalog] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  const [filters, setFilters] = useState({
    search: '',
    type: '',
    tier: '',
    sort: 'usage',
    reported: false,
  });

  const [visible, setVisible] = useState(36);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      api.get('/pokedex', {
        signal: controller.signal,
      }),
      api.get('/pokedex/meta', {
        signal: controller.signal,
      }),
    ])
      .then(([pokemon, meta]) => {
        if (!controller.signal.aborted) {
          setCatalog(pokemon.data);
          setReport(meta.data);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError(
            'No se pudo conectar con la Pokédex. Comprueba que el backend esté ejecutándose.',
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [attempt]);

  function updateFilter(key, value) {
    setFilters(current => ({
      ...current,
      [key]: value,
    }));

    setVisible(36);
  }

  const tiers = useMemo(
    () =>
      [...new Set(catalog.map(p => p.tier))].sort(),
    [catalog],
  );

  const filtered = useMemo(() => {
    const query = filters.search.trim().toLowerCase();

    const result = catalog.filter(
      pokemon =>
        (!query ||
          `${pokemon.name} ${pokemon.id} ${pokemon.num}`
            .toLowerCase()
            .includes(query)) &&
        (!filters.type ||
          pokemon.types.includes(filters.type)) &&
        (!filters.tier ||
          pokemon.tier === filters.tier) &&
        (!filters.reported ||
          pokemon.usage !== null),
    );

    return result.sort((a, b) => {
      if (filters.sort === 'usage') {
        return (
          (b.usage ?? -1) - (a.usage ?? -1) ||
          a.name.localeCompare(b.name)
        );
      }

      if (filters.sort === 'bst') {
        return (
          b.bst - a.bst ||
          a.name.localeCompare(b.name)
        );
      }

      if (filters.sort === 'name') {
        return a.name.localeCompare(b.name);
      }

      return (
        a.num - b.num ||
        a.name.localeCompare(b.name)
      );
    });
  }, [catalog, filters]);

  const top = report?.top || [];

  function resetFilters() {
    setFilters({
      search: '',
      type: '',
      tier: '',
      sort: 'usage',
      reported: false,
    });

    setVisible(36);
  }

  function retry() {
    setLoading(true);
    setError('');
    setAttempt(value => value + 1);
  }

  return (
    <div className="pdx page-container">
      <header className="pdx-hero">
        <div className="pdx-hero-copy">
          <span className="eyebrow">
            POKEMITA / INTELIGENCIA COMPETITIVA
          </span>

          <h1>
            Conoce tu
            <br />
            <em>próximo movimiento.</em>
          </h1>

          <p>
            Explora la Pokédex, compara atributos y
            descubre qué se juega en Gen 9 OU.
          </p>
        </div>

        <div
          className="pdx-hero-emblem"
          aria-hidden="true"
        >
          <span />
        </div>
      </header>

      <div className="pdx-summary">
        <div>
          <span>Pokédex Gen 9</span>
          <strong>
            {loading ? '—' : number(catalog.length)}
          </strong>
          <small>Especies y formas</small>
        </div>

        <div>
          <span>Batallas del reporte</span>
          <strong>
            {report?.available
              ? number(report.battles)
              : '—'}
          </strong>
          <small>Fuente: Smogon</small>
        </div>

        <div>
          <span>Entradas competitivas</span>
          <strong>
            {report?.available
              ? number(report.total)
              : '—'}
          </strong>
          <small>
            Datos ponderados por clasificación
          </small>
        </div>

        <div>
          <span>Líder del reporte</span>
          <strong>{top[0]?.name || '—'}</strong>
          <small>
            {top.length
              ? `${percent(top[0].usage)} de uso`
              : 'Esperando datos'}
          </small>
        </div>
      </div>

      {error && (
        <div className="pdx-notice" role="alert">
          {error}
          <button onClick={retry}>Reintentar</button>
        </div>
      )}

      {report && !report.available && (
        <div className="pdx-notice">
          {report.message} Las fichas base siguen
          disponibles.
        </div>
      )}

      {report?.available && (
        <section
          className="pdx-meta-grid"
          aria-label="Ranking de uso competitivo"
        >
          <div className="pdx-panel pdx-usage-chart">
            <div className="pdx-section-heading">
              <div>
                <span className="pdx-kicker">
                  EL PULSO DEL META
                </span>
                <h2>Los más utilizados</h2>
              </div>

              <span className="pdx-pill">GEN 9 OU</span>
            </div>

            <div className="pdx-leader-bars">
              {top.slice(0, 6).map(row => (
                <button
                  className="pdx-leader"
                  type="button"
                  key={row.id}
                  onClick={() => setSelected(row.id)}
                  aria-label={`Abrir ${row.name}, puesto ${row.rank}, uso ${percent(row.usage)}`}
                >
                  <span className="pdx-rank">
                    {String(row.rank).padStart(2, '0')}
                  </span>

                  <PokemonImage
                    name={row.name}
                    sprite={row.sprite}
                  />

                  <span className="pdx-leader-value">
                    <span>
                      <b>{row.name}</b>
                      <strong>
                        {percent(row.usage)}
                      </strong>
                    </span>

                    <span className="pdx-leader-track">
                      <span
                        style={{
                          width: `${
                            (row.usage / top[0].usage) *
                            100
                          }%`,
                        }}
                      />
                    </span>
                  </span>
                </button>
              ))}
            </div>

          </div>

          <div className="pdx-panel pdx-ranking">
            <div className="pdx-section-heading">
              <div>
                <span className="pdx-kicker">
                  CLASIFICACIÓN DE USO
                </span>
                <h2>Top 10</h2>
              </div>

              <span className="pdx-pill">SMOGON</span>
            </div>

            <div className="pdx-table-scroll">
              <table className="pdx-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Pokémon</th>
                    <th>Uso</th>
                  </tr>
                </thead>

                <tbody>
                  {top.map(row => (
                    <tr key={row.id}>
                      <td
                        className={
                          row.rank <= 3
                            ? 'pdx-gold'
                            : ''
                        }
                      >
                        {String(row.rank).padStart(
                          2,
                          '0',
                        )}
                      </td>

                      <td>
                        <button
                          className="pdx-ranking-name"
                          type="button"
                          onClick={() =>
                            setSelected(row.id)
                          }
                        >
                          <PokemonImage
                            name={row.name}
                            sprite={row.sprite}
                          />
                          <b>{row.name}</b>
                        </button>
                      </td>

                      <td>{percent(row.usage)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      <section
        className="pdx-catalog"
        aria-labelledby="pokedex-heading"
      >
        <div className="pdx-section-heading">
          <div>
            <span className="pdx-kicker">
              ARCHIVO DE ESPECIES
            </span>
            <h2 id="pokedex-heading">
              Pokédex táctica
            </h2>
          </div>

          <span className="pdx-pill">
            {loading
              ? 'CARGANDO'
              : `${filtered.length} RESULTADOS`}
          </span>
        </div>

        <div className="pdx-filters">
          <input
            className="pdx-search"
            aria-label="Buscar Pokémon"
            placeholder="Buscar por nombre o número…"
            value={filters.search}
            onChange={event =>
              updateFilter(
                'search',
                event.target.value,
              )
            }
          />

          <select
            aria-label="Filtrar por tipo"
            value={filters.type}
            onChange={event =>
              updateFilter('type', event.target.value)
            }
          >
            <option value="">Todos los tipos</option>
            {Object.keys(TIPOS_COLORES).map(type => (
              <option key={type}>{type}</option>
            ))}
          </select>

          <select
            aria-label="Filtrar por tier"
            value={filters.tier}
            onChange={event =>
              updateFilter('tier', event.target.value)
            }
          >
            <option value="">Todos los tiers</option>
            {tiers.map(tier => (
              <option key={tier}>{tier}</option>
            ))}
          </select>

          <select
            aria-label="Ordenar Pokémon"
            value={filters.sort}
            onChange={event =>
              updateFilter('sort', event.target.value)
            }
          >
            <option value="usage">Mayor uso</option>
            <option value="number">
              Número Pokédex
            </option>
            <option value="name">Nombre A–Z</option>
            <option value="bst">
              Mayor total base
            </option>
          </select>
        </div>

        <div className="pdx-filter-footer">
          <label>
            <input
              type="checkbox"
              checked={filters.reported}
              onChange={event =>
                updateFilter(
                  'reported',
                  event.target.checked,
                )
              }
            />
            Con datos en este reporte
          </label>
        </div>

        <div
          aria-live="polite"
          className="pdx-sr-only"
        >
          {!loading &&
            `${filtered.length} Pokémon encontrados`}
        </div>

        {loading ? (
          <div
            className="pdx-card-grid"
            aria-busy="true"
            aria-label="Cargando Pokémon"
          >
            {Array.from(
              { length: 12 },
              (_, index) => (
                <div
                  key={index}
                  className="pdx-skeleton"
                />
              ),
            )}
          </div>
        ) : !filtered.length && !error ? (
          <div className="pdx-empty">
            <span aria-hidden="true">◉</span>
            <h3>No encontramos ese Pokémon</h3>
            <p>
              Prueba otro nombre o cambia los filtros.
            </p>

            <button
              className="secondary-button"
              onClick={resetFilters}
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="pdx-card-grid">
            {filtered
              .slice(0, visible)
              .map(pokemon => (
                <button
                  type="button"
                  key={pokemon.id}
                  className="pdx-card"
                  style={{
                    '--pokemon-color':
                      TIPOS_COLORES[
                        pokemon.types[0]
                      ] || '#33A1FD',
                  }}
                  onClick={() =>
                    setSelected(pokemon.id)
                  }
                  aria-label={`Abrir ficha de ${pokemon.name}`}
                >
                  <span className="pdx-card-top">
                    <span>
                      #
                      {String(pokemon.num).padStart(
                        3,
                        '0',
                      )}
                    </span>

                    <span>{pokemon.tier}</span>
                  </span>

                  <span className="pdx-card-art">
                    <span className="pdx-card-orbit" />

                    <PokemonImage
                      name={pokemon.name}
                      sprite={pokemon.sprite}
                    />
                  </span>

                  <strong className="pdx-card-name">
                    {pokemon.name}
                  </strong>

                  <span className="pdx-types">
                    {pokemon.types.map(type => (
                      <TypeBadge
                        key={type}
                        type={type}
                      />
                    ))}
                  </span>

                  <span className="pdx-card-info">
                    <span>
                      BASE <b>{pokemon.bst}</b>
                    </span>

                    <span>
                      {pokemon.usage === null
                        ? 'Sin datos de uso'
                        : `${percent(pokemon.usage)}${
                            pokemon.grouped
                              ? ' · grupo'
                              : ' uso'
                          }`}
                    </span>
                  </span>

                  <span className="pdx-card-action">
                    Explorar ficha
                    <span aria-hidden="true">↗</span>
                  </span>
                </button>
              ))}
          </div>
        )}

        {!loading && visible < filtered.length && (
          <div className="pdx-load-more">
            <p>
              {Math.min(visible, filtered.length)} de{' '}
              {filtered.length} Pokémon
            </p>

            <button
              className="secondary-button"
              onClick={() =>
                setVisible(current => current + 36)
              }
            >
              Cargar más Pokémon ↓
            </button>
          </div>
        )}
      </section>

      <p className="pdx-bottom-note">
        Atributos: Pokémon Showdown · Uso competitivo:
        Smogon, octubre de 2026. El uso no determina
        la legalidad ni la fuerza de un Pokémon.
      </p>

      {selected && (
        <PokemonDetail
          key={selected}
          id={selected}
          onSelect={setSelected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}