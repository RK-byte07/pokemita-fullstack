import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { PokemonImage } from '../components/pokedex/PokemonVisuals';
import './perfil.css';

const TITLES = {
  strict: 'OU estricto',
  bag: 'Pokemita con mochila',
};

const RESULTS = {
  victoria: 'Victoria',
  derrota: 'Derrota',
  empate: 'Empate',
  abandonada: 'Abandono',
  error: 'Error del servidor',
  en_curso: 'En curso',
};

const REASONS = {
  normal: 'Fin normal',
  rendicion: 'Rendición',
  desconexion: 'Desconexión',
  salida: 'Salida de la batalla',
  inactividad: 'Inactividad',
  error_servidor: 'Error del servidor',
  sesion_expirada:
    'Sesión expirada tras perder el servidor',
};

const n = value => Number(value || 0);

const rate = (wins, total) =>
  total
    ? Math.round((n(wins) / n(total)) * 100)
    : 0;

const date = value =>
  new Date(value).toLocaleString('es-PE', {
    timeZone: 'America/Lima',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

function Empty({ children }) {
  return <p className="pf-empty">{children}</p>;
}

function EditProfile({
  user,
  onDone,
  onCancel,
}) {
  const [bio, setBio] = useState(user.bio || '');
  const [avatar, setAvatar] = useState(
    user.avatar_pokemon || 'pikachu',
  );
  const [catalog, setCatalog] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    api
      .get('/simulator/catalog', {
        signal: controller.signal,
      })
      .then(({ data }) => {
        setCatalog(data.pokemon);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError(
            'No se pudo cargar el catálogo de avatares.',
          );
        }
      });

    return () => controller.abort();
  }, []);

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      await api.patch('/perfil', {
        bio,
        avatar_pokemon: avatar,
      });

      onDone();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'No se pudo guardar.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className="pf-card pf-edit"
      onSubmit={save}
    >
      <h2>Personaliza tu ficha</h2>

      <label>
        Pokémon del avatar
        <select
          value={avatar}
          onChange={e =>
            setAvatar(e.target.value)
          }
        >
          <option value={user.avatar_pokemon}>
            {user.avatar_pokemon}
          </option>

          {catalog
            .filter(
              p =>
                p.sprite !== user.avatar_pokemon,
            )
            .map(p => (
              <option
                key={p.id}
                value={p.sprite}
              >
                {p.name}
              </option>
            ))}
        </select>
      </label>

      <label>
        Biografía
        <textarea
          value={bio}
          maxLength={250}
          rows={3}
          onChange={e =>
            setBio(e.target.value)
          }
        />
        <small>{bio.length}/250</small>
      </label>

      {error && (
        <p role="alert" className="pf-error">
          {error}
        </p>
      )}

      <div className="pf-actions">
        <button
          disabled={saving}
          className="pf-primary"
        >
          {saving
            ? 'Guardando…'
            : 'Guardar perfil'}
        </button>

        <button
          type="button"
          disabled={saving}
          onClick={onCancel}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default function Perfil() {
  const [rules, setRules] = useState('strict');
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    api
      .get('/perfil', {
        params: { rules, page },
        signal: controller.signal,
      })
      .then(({ data }) => setData(data))
      .catch(err => {
        if (!controller.signal.aborted) {
          setError(
            err.response?.data?.error ||
              'No se pudo cargar tu perfil.',
          );
        }
      });

    return () => controller.abort();
  }, [rules, page, reload]);

  const summary = data?.summary || {};
  const total = n(summary.finalizadas);
  const wins = n(summary.victorias);
  const losses = n(summary.derrotas);
  const ties = n(summary.empates);

  const winRate = rate(wins, total);
  const winEnd = total
    ? (wins / total) * 100
    : 0;
  const lossEnd = total
    ? ((wins + losses) / total) * 100
    : 0;

  const activity = Array.from(
    { length: 30 },
    (_, index) => {
      const day = new Date();
      day.setUTCDate(
        day.getUTCDate() - 29 + index,
      );

      const key = day
        .toISOString()
        .slice(0, 10);

      return {
        dia: key,
        partidas: 0,
        victorias: 0,
        ...data?.activity.find(
          entry => entry.dia === key,
        ),
      };
    },
  );

  const maxActivity = Math.max(
    1,
    ...activity.map(entry => n(entry.partidas)),
  );

  function refresh() {
    setError('');
    setData(null);
    setReload(value => value + 1);
  }

  function changePage(next) {
    setData(null);
    setError('');
    setPage(next);
  }

  return (
    <div className="pf page-container">
      <header className="pf-page-title">
        <div>
          <span className="pf-kicker">
            POKEMITA / PERFIL DE ENTRENADOR
          </span>

          <h1>
            Tu estrategia tiene historia.
          </h1>

          <p>
            Explora tus resultados, descubre tus
            aliados y prepara tu próxima victoria.
          </p>
        </div>

        <Link
          className="pf-primary"
          to="/simulador"
        >
          ⚔ Ir al simulador
        </Link>
      </header>

      <div
        className="pf-filter"
        role="group"
        aria-label="Reglas de las estadísticas"
      >
        {Object.entries(TITLES).map(
          ([id, title]) => (
            <button
              key={id}
              aria-pressed={rules === id}
              onClick={() => {
                if (id !== rules) {
                  setData(null);
                  setError('');
                  setRules(id);
                  setPage(1);
                }
              }}
            >
              {id === 'strict' ? '🏆' : '🎒'}{' '}
              {title}
            </button>
          ),
        )}
      </div>

      <p className="pf-scope">
        Estadísticas personales contra la IA ·{' '}
        {TITLES[rules]} · Los abandonos y errores
        no cuentan para el porcentaje de victorias.
      </p>

      {error ? (
        <div
          className="pf-card pf-error"
          role="alert"
        >
          {error}
          <button onClick={refresh}>
            Reintentar
          </button>
        </div>
      ) : !data ? (
        <div
          className="pf-card pf-loading"
          role="status"
        >
          Consultando tu historial…
        </div>
      ) : (
        <>
          <section className="pf-hero">
            <div className="pf-avatar">
              <PokemonImage
                name={data.user.avatar_pokemon}
                sprite={data.user.avatar_pokemon}
              />
            </div>

            <div className="pf-identity">
              <span className="pf-kicker">
                FICHA DEL ENTRENADOR
              </span>

              <h2>{data.user.username}</h2>

              <p>
                {data.user.bio ||
                  'Cada equipo cuenta una historia. Escribe la tuya.'}
              </p>

              <div className="pf-tags">
                <span>
                  Desde{' '}
                  {new Date(
                    data.user.created_at,
                  ).toLocaleDateString('es-PE', {
                    timeZone: 'America/Lima',
                  })}
                </span>

                <span>
                  {data.user.twofa_enabled
                    ? '🔐 2FA activado'
                    : '2FA sin activar'}
                </span>

                <span>{TITLES[rules]}</span>
              </div>
            </div>

            <button
              onClick={() =>
                setEditing(!editing)
              }
            >
              ✎ Editar perfil
            </button>
          </section>

          {editing && (
            <EditProfile
              user={data.user}
              onCancel={() =>
                setEditing(false)
              }
              onDone={() => {
                setEditing(false);
                refresh();
              }}
            />
          )}

          <div className="pf-kpis">
            {[
              [
                '⚔',
                'Batallas finalizadas',
                total,
              ],
              ['🏆', 'Victorias', wins],
              [
                '📈',
                'Porcentaje de victorias',
                `${winRate}%`,
              ],
              [
                '↗',
                'Turnos por partida',
                n(summary.promedio_turnos) || '—',
              ],
            ].map(([icon, label, value]) => (
              <article
                className="pf-card"
                key={label}
              >
                <span>
                  {icon} {label}
                </span>

                <strong>{value}</strong>

                <small>
                  {label ===
                  'Porcentaje de victorias'
                    ? `${wins} victorias de ${total} partidas`
                    : 'Solo batallas finalizadas de estas reglas'}
                </small>
              </article>
            ))}
          </div>

          <div className="pf-main-grid">
            <section className="pf-card">
              <div className="pf-heading">
                <div>
                  <span className="pf-kicker">
                    BALANCE PERSONAL
                  </span>
                  <h2>
                    Resultados de combate
                  </h2>
                </div>

                <span className="pf-pill">
                  {TITLES[rules]}
                </span>
              </div>

              <div className="pf-results">
                <div
                  className="pf-donut"
                  role="img"
                  aria-label={
                    `${wins} victorias, ` +
                    `${losses} derrotas y ` +
                    `${ties} empates`
                  }
                  style={{
                    background: total
                      ? `conic-gradient(
                          #f6c90e 0 ${winEnd}%,
                          #f87171 ${winEnd}% ${lossEnd}%,
                          #60a5fa ${lossEnd}% 100%
                        )`
                      : '#29354a',
                  }}
                >
                  <div>
                    <strong>
                      {winRate}%
                    </strong>
                    <span>VICTORIAS</span>
                  </div>
                </div>

                <div className="pf-legend">
                  {[
                    [
                      'Victorias',
                      wins,
                      '#f6c90e',
                    ],
                    [
                      'Derrotas',
                      losses,
                      '#f87171',
                    ],
                    [
                      'Empates',
                      ties,
                      '#60a5fa',
                    ],
                  ].map(
                    ([label, value, color]) => (
                      <div key={label}>
                        <i
                          style={{
                            background: color,
                          }}
                        />
                        <span>{label}</span>
                        <b>{value}</b>
                      </div>
                    ),
                  )}
                </div>
              </div>

              {!total && (
                <Empty>
                  Tu primer resultado aparecerá al
                  finalizar una batalla.
                </Empty>
              )}

              <div className="pf-status-grid">
                <span>
                  Abandonos
                  <b>
                    {n(summary.abandonos)}
                  </b>
                </span>

                <span>
                  Errores
                  <b>{n(summary.errores)}</b>
                </span>

                <span>
                  En curso
                  <b>
                    {n(summary.en_curso)}
                  </b>
                </span>
              </div>
            </section>

            <section className="pf-card">
              <div className="pf-heading">
                <div>
                  <span className="pf-kicker">
                    ÚLTIMOS 30 DÍAS · UTC
                  </span>
                  <h2>Tu ritmo de juego</h2>
                </div>

                <span className="pf-pill">
                  {activity.reduce(
                    (sum, day) =>
                      sum + n(day.partidas),
                    0,
                  )}{' '}
                  partidas
                </span>
              </div>

              <p className="pf-muted">
                Pasa el cursor o enfoca una barra
                para consultar el día.
              </p>

              <div
                className="pf-activity"
                role="group"
                aria-label="Actividad diaria"
              >
                {activity.map(day => (
                  <div
                    key={day.dia}
                    className="pf-day"
                    tabIndex={0}
                    aria-label={
                      `${day.dia}: ` +
                      `${day.partidas} partidas, ` +
                      `${day.victorias} victorias`
                    }
                  >
                    <span className="pf-tooltip">
                      {day.dia}
                      <br />
                      {day.partidas} partidas ·{' '}
                      {day.victorias} victorias
                    </span>

                    <div
                      style={{
                        height:
                          `${
                            (n(day.partidas) /
                              maxActivity) *
                            100
                          }%`,
                        minHeight: n(day.partidas)
                          ? 6
                          : 2,
                      }}
                    >
                      <i
                        style={{
                          height:
                            `${rate(
                              day.victorias,
                              day.partidas,
                            )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pf-axis">
                <span>
                  {activity[0].dia}
                </span>
                <span>Hoy</span>
              </div>

              <p className="pf-muted">
                Azul: partidas finalizadas ·
                Amarillo: victorias
              </p>
            </section>
          </div>

          <div className="pf-main-grid">
            <section className="pf-card">
              <div className="pf-heading">
                <div>
                  <span className="pf-kicker">
                    TUS ALIADOS
                  </span>
                  <h2>
                    Pokémon más utilizados
                  </h2>
                </div>

                <span className="pf-pill">
                  Top 8
                </span>
              </div>

              <p className="pf-muted">
                Presencia en equipos de partidas
                finalizadas. Participación indica
                si entró al campo.
              </p>

              {!data.pokemon.length ? (
                <Empty>
                  Aún no hay Pokémon registrados
                  en partidas finalizadas.
                </Empty>
              ) : (
                data.pokemon.map(
                  (pokemon, index) => (
                    <div
                      className="pf-pokemon"
                      key={pokemon.especie_id}
                    >
                      <span className="pf-rank">
                        {index + 1}
                      </span>

                      <PokemonImage
                        name={pokemon.nombre}
                        sprite={pokemon.sprite}
                      />

                      <div>
                        <div className="pf-heading">
                          <b>
                            {pokemon.nombre}
                          </b>

                          <strong>
                            {rate(
                              pokemon.partidas,
                              total,
                            )}
                            %
                          </strong>
                        </div>

                        <div className="pf-meter">
                          <span
                            style={{
                              width:
                                `${rate(
                                  pokemon.partidas,
                                  total,
                                )}%`,
                            }}
                          />
                        </div>

                        <small>
                          {pokemon.partidas}{' '}
                          equipos ·{' '}
                          {pokemon.participaciones}{' '}
                          participaciones ·{' '}
                          {pokemon.victorias}{' '}
                          victorias
                        </small>
                      </div>
                    </div>
                  ),
                )
              )}
            </section>

            <section className="pf-card">
              <div className="pf-heading">
                <div>
                  <span className="pf-kicker">
                    COMPOSICIONES DESTACADAS
                  </span>
                  <h2>
                    Equipos con más victorias
                  </h2>
                </div>
              </div>

              <p className="pf-muted">
                Agrupados por especies,
                movimientos, habilidades, objetos
                y entrenamiento. Se conserva la
                configuración de cada batalla.
              </p>

              {!data.teams.length ? (
                <Empty>
                  Completa una partida para
                  descubrir tus equipos destacados.
                </Empty>
              ) : (
                data.teams.map((team, index) => (
                  <article
                    className="pf-team"
                    key={team.equipo_firma}
                  >
                    <div className="pf-heading">
                      <b>
                        #{index + 1} · Composición{' '}
                        {team.equipo_firma.slice(
                          0,
                          6,
                        )}
                      </b>

                      <span>
                        {team.victorias} V /{' '}
                        {team.partidas} PJ
                      </span>
                    </div>

                    <div className="pf-team-sprites">
                      {team.team.map(
                        (pokemon, slot) => (
                          <div
                            key={slot}
                            title={pokemon.name}
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
                          </div>
                        ),
                      )}
                    </div>

                    <div className="pf-heading pf-muted">
                      <span>
                        {rate(
                          team.victorias,
                          team.partidas,
                        )}
                        % de victorias
                      </span>

                      <span>
                        {n(team.partidas) >= 5
                          ? 'Muestra de 5+ partidas'
                          : 'Muestra pequeña'}
                      </span>
                    </div>
                  </article>
                ))
              )}
            </section>
          </div>

          <section className="pf-card">
            <div className="pf-heading">
              <div>
                <span className="pf-kicker">
                  CADA TURNO CUENTA
                </span>
                <h2>
                  Historial de batallas
                </h2>
              </div>

              <span className="pf-pill">
                {TITLES[rules]}
              </span>
            </div>

            {!data.history.length ? (
              <Empty>
                Todavía no hay batallas con estas
                reglas. Empieza desde el simulador.
              </Empty>
            ) : (
              data.history.map(battle => (
                <details
                  className="pf-history"
                  key={battle.id}
                >
                  <summary>
                    <span
                      className={
                        'pf-outcome pf-' +
                        (battle.resultado ||
                          battle.estado)
                      }
                    >
                      {
                        RESULTS[
                          battle.resultado ||
                            battle.estado
                        ]
                      }
                    </span>

                    <span>
                      {date(battle.iniciada_at)}
                    </span>

                    <span>
                      {TITLES[battle.reglas]}
                    </span>

                    <span>
                      {battle.turnos} turnos
                    </span>

                    <span>
                      Ver equipo ＋
                    </span>
                  </summary>

                  <div>
                    <p>
                      {battle.team.join(' · ')}
                    </p>

                    <small>
                      Contra IA ·{' '}
                      {REASONS[battle.motivo_fin] ||
                        'Partida pendiente'}
                      {' · '}Showdown{' '}
                      {battle.motor_version}
                    </small>
                  </div>
                </details>
              ))
            )}

            <div className="pf-pagination">
              <button
                disabled={page <= 1}
                onClick={() =>
                  changePage(page - 1)
                }
              >
                ← Anterior
              </button>

              <span>
                Página {page} de{' '}
                {Math.max(1, data.pages)}
              </span>

              <button
                disabled={page >= data.pages}
                onClick={() =>
                  changePage(page + 1)
                }
              >
                Siguiente →
              </button>
            </div>
          </section>

          <section className="pf-card pf-private">
            <h2>
              Información de tu cuenta
            </h2>

            <p>
              Solo visible en tu sesión.
            </p>

            <dl>
              <div>
                <dt>Correo</dt>
                <dd>{data.user.email}</dd>
              </div>

              <div>
                <dt>Teléfono</dt>
                <dd>
                  {data.user.phone ||
                    'Sin registrar'}
                </dd>
              </div>
            </dl>
          </section>
        </>
      )}
    </div>
  );
}