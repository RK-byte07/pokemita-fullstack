import { useEffect } from 'react';
import Icon from './Icon';

export default function Modal({ open, title, message, tone = 'error', onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    const handleKey = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;
  const success = tone === 'success';
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/75 p-4 backdrop-blur-sm" role="presentation" onMouseDown={onClose}>
      <section className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-card shadow-2xl shadow-black/50" role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={(e) => e.stopPropagation()}>
        <div className={`h-1 ${success ? 'bg-success' : 'bg-error'}`} />
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className={`grid h-12 w-12 place-items-center rounded-xl ${success ? 'bg-success/15 text-success' : 'bg-error/15 text-error'}`}>
              <Icon name={success ? 'check' : 'shield'} size={24} />
            </div>
            <button onClick={onClose} className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white" aria-label="Cerrar modal"><Icon name="close" /></button>
          </div>
          <h2 id="modal-title" className="mt-5 text-2xl font-black text-white">{title}</h2>
          <p className="mt-2 leading-relaxed text-slate-300">{message}</p>
          <button autoFocus onClick={onClose} className="mt-6 w-full rounded-xl bg-brand px-5 py-3 font-black text-void transition hover:bg-brand-light focus:outline-none focus:ring-2 focus:ring-brand/50">Entendido</button>
        </div>
      </section>
    </div>
  );
}
