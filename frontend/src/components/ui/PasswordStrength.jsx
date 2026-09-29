import Icon from './Icon';

export const passwordRules = (value) => ({
  length: value.length >= 8,
  uppercase: /[A-Z]/.test(value),
  number: /\d/.test(value),
  symbol: /[^A-Za-z0-9]/.test(value),
});

export default function PasswordStrength({ password }) {
  const rules = passwordRules(password);
  const score = Object.values(rules).filter(Boolean).length;
  const level = score <= 1 ? { label: 'Contraseña débil', color: 'bg-error', text: 'text-error' }
    : score <= 3 ? { label: 'Contraseña media', color: 'bg-warning', text: 'text-warning' }
      : { label: 'Contraseña fuerte', color: 'bg-success', text: 'text-success' };
  const requirements = [
    ['length', 'Mínimo 8 caracteres'], ['uppercase', 'Una letra mayúscula'],
    ['number', 'Un número'], ['symbol', 'Un símbolo'],
  ];

  return (
    <div className="rounded-xl border border-white/10 bg-void/45 p-4">
      <div className="mb-2 flex justify-between text-xs font-bold"><span className={password ? level.text : 'text-slate-400'}>{password ? level.label : 'Seguridad de contraseña'}</span><span className="text-slate-500">{score}/4</span></div>
      <div className="grid grid-cols-4 gap-1.5">{[1, 2, 3, 4].map((item) => <span key={item} className={`h-1.5 rounded-full ${item <= score ? level.color : 'bg-surface'}`} />)}</div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">{requirements.map(([key, text]) => <div key={key} className={`flex items-center gap-2 text-xs ${rules[key] ? 'text-success' : 'text-slate-500'}`}><span className={`grid h-4 w-4 place-items-center rounded-full ${rules[key] ? 'bg-success/15' : 'bg-white/5'}`}><Icon name="check" size={11} /></span>{text}</div>)}</div>
    </div>
  );
}
