import { useId, useState } from 'react';
import { TIPOS_COLORES } from '../../utils/pokemon';

export function PokemonImage({
  name,
  sprite,
  className = '',
}) {
  const [failed, setFailed] = useState(false);
  const [previous, setPrevious] = useState(name);

  if (previous !== name) {
    setPrevious(name);
    setFailed(false);
  }

  const spriteName =
    sprite ||
    name.toLowerCase().replace(/[^a-z0-9-]/g, '');

  return failed ? (
    <span
      className={`pdx-image-fallback ${className}`}
      aria-label={name}
    >
      ◉
    </span>
  ) : (
    <img
      className={`pdx-sprite ${className}`}
      src={`https://play.pokemonshowdown.com/sprites/gen5/${spriteName}.png`}
      alt={name}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export function TypeBadge({ type }) {
  return (
    <span
      className="pdx-type"
      style={{
        '--type-color':
          TIPOS_COLORES[type] || '#94a3b8',
      }}
    >
      {type}
    </span>
  );
}

export function Radar({ stats, name }) {
  const id = useId();

  const axes = [
    ['spe', 'VELOCIDAD'],
    ['def', 'DEFENSA'],
    ['spd', 'DEF. ESP.'],
    ['hp', 'PS'],
    ['spa', 'AT. ESP.'],
    ['atk', 'ATAQUE'],
  ];

  function point(index, radius) {
    const angle =
      -Math.PI / 2 + (index * Math.PI) / 3;

    return [
      200 + Math.cos(angle) * radius,
      190 + Math.sin(angle) * radius,
    ];
  }

  const polygon = radius =>
    axes
      .map((_, index) =>
        point(index, radius).join(','),
      )
      .join(' ');

  const values = axes
    .map(([key], index) =>
      point(index, (125 * stats[key]) / 255).join(','),
    )
    .join(' ');

  return (
    <figure className="pdx-radar">
      <svg
        viewBox="0 0 400 390"
        role="img"
        aria-labelledby={id}
      >
        <title id={id}>
          Estadísticas base de {name}, escala de 0 a 255
        </title>

        {[0.2, 0.4, 0.6, 0.8, 1].map(step => (
          <polygon
            key={step}
            points={polygon(125 * step)}
            fill="none"
            stroke="#34425f"
          />
        ))}

        {axes.map(([key, label], index) => {
          const [x, y] = point(index, 125);
          const [labelX, labelY] = point(index, 164);

          return (
            <g key={key}>
              <line
                x1="200"
                y1="190"
                x2={x}
                y2={y}
                stroke="#34425f"
              />

              <text
                x={labelX}
                y={labelY - 5}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="10"
                fontWeight="700"
              >
                {label}
              </text>

              <text
                x={labelX}
                y={labelY + 14}
                textAnchor="middle"
                fill="#F6C90E"
                fontSize="17"
                fontWeight="900"
              >
                {stats[key]}
              </text>
            </g>
          );
        })}

        <polygon
          points={values}
          fill="#33A1FD33"
          stroke="#33A1FD"
          strokeWidth="3"
          strokeLinejoin="round"
        />

        {axes.map(([key], index) => {
          const [cx, cy] = point(
            index,
            (125 * stats[key]) / 255,
          );

          return (
            <circle
              key={key}
              cx={cx}
              cy={cy}
              r="3"
              fill="#bfdbfe"
            />
          );
        })}
      </svg>

      <figcaption>
        Estadísticas base · escala común 0–255
      </figcaption>
    </figure>
  );
}