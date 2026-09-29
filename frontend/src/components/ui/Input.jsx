import Icon from './Icon';

export default function Input({ label, icon, error, className = '', ...props }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-bold text-slate-200">{label}</span>
      <span className={`flex items-center gap-3 rounded-xl border bg-surface px-4 transition focus-within:ring-2 ${error ? 'border-error/70 focus-within:ring-error/20' : 'border-white/10 focus-within:border-brand/70 focus-within:ring-brand/10'}`}>
        {icon && <Icon name={icon} className="shrink-0 text-slate-400" />}
        <input {...props} className="min-w-0 flex-1 bg-transparent py-3.5 text-white outline-none placeholder:text-slate-500" />
      </span>
      {error && <span className="mt-1.5 block text-xs font-semibold text-error">{error}</span>}
    </label>
  );
}
