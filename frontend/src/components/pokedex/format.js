export const number = value =>
  new Intl.NumberFormat('es-PE').format(value);

export const percent = value =>
  value == null
    ? 'Sin datos'
    : value > 0 && value < 0.01
      ? '<0.01 %'
      : `${value.toFixed(2)} %`;

export const STAT_LABELS = [
  'PS',
  'Ataque',
  'Defensa',
  'At. especial',
  'Def. especial',
  'Velocidad',
];