import { useState } from 'react';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Icon from '../components/ui/Icon';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);
  function update(key, value) { setForm((current) => ({ ...current, [key]: value })); setErrors((current) => ({ ...current, [key]: '' })); }
  function submit(event) {
    event.preventDefault(); const next = {};
    Object.entries(form).forEach(([key, value]) => { if (!value.trim()) next[key] = 'Este campo es obligatorio.'; });
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Ingresa un correo válido.';
    setErrors(next); if (Object.keys(next).length) return;
    setSent(true); setForm({ name: '', email: '', subject: '', message: '' });
  }
  return (
    <div className="page-container py-14"><div className="mx-auto max-w-3xl"><div className="mb-8 text-center"><span className="eyebrow">CENTRO DE CONTACTO</span><h1 className="mt-4 text-4xl font-black text-white">Hablemos de estrategia</h1><p className="mt-3 text-slate-400">¿Tienes una propuesta, encontraste un problema o quieres mejorar Pokemita?</p></div><form onSubmit={submit} className="rounded-3xl border border-white/10 bg-card p-6 shadow-2xl shadow-black/30 sm:p-10" noValidate><div className="grid gap-5 sm:grid-cols-2"><Input label="Nombre" icon="user" placeholder="Tu nombre" value={form.name} onChange={(e) => update('name', e.target.value)} error={errors.name} /><Input label="Correo" icon="mail" type="email" placeholder="usuario@email.com" value={form.email} onChange={(e) => update('email', e.target.value)} error={errors.email} /></div><Input className="mt-5" label="Asunto" icon="book" placeholder="¿En qué podemos ayudarte?" value={form.subject} onChange={(e) => update('subject', e.target.value)} error={errors.subject} /><label className="mt-5 block"><span className="mb-2 block text-sm font-bold text-slate-200">Mensaje</span><textarea rows="6" value={form.message} onChange={(e) => update('message', e.target.value)} placeholder="Cuéntanos los detalles…" className={`w-full resize-none rounded-xl border bg-surface p-4 text-white outline-none placeholder:text-slate-500 focus:ring-2 ${errors.message ? 'border-error focus:ring-error/20' : 'border-white/10 focus:border-brand focus:ring-brand/10'}`} />{errors.message && <span className="mt-1 block text-xs font-bold text-error">{errors.message}</span>}</label><button className="cta-button mt-6 w-full sm:w-auto">Enviar mensaje<Icon name="arrow" /></button></form></div><Modal open={sent} tone="success" title="Mensaje enviado correctamente" message="Gracias por contactar con Pokemita. Hemos recibido tu mensaje." onClose={() => setSent(false)} /></div>
  );
}
