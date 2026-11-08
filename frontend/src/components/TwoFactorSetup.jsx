// src/components/TwoFactorSetup.jsx
import { useState } from 'react';
import { createPortal } from 'react-dom'; // <-- IMPORTANTE
import { generar2FAAPI, activar2FAAPI } from '../services/twofaService';

export default function TwoFactorSetup({ onClose }) {
  const [qr, setQr] = useState(null);
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');
  const [activado, setActivado] = useState(false);

  async function handleGenerar() {
    try {
      const data = await generar2FAAPI();
      setQr(data.qrImage);
    } catch (e) {
      setError(e.response?.data?.error || 'Error al generar QR');
    }
  }

  async function handleActivar() {
    try {
      await activar2FAAPI(codigo);
      setActivado(true);
      setTimeout(onClose, 2000);
    } catch (e) {
      setError(e.response?.data?.error || 'Código incorrecto');
    }
  }

  // ENVOLVEMOS TODO EN UN PORTAL
  return createPortal(
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-md w-full p-6 shadow-2xl">
        <h3 className="text-xl font-bold text-yellow-400 mb-4">🔐 Configurar 2FA</h3>
        
        {!qr && !activado && (
          <button onClick={handleGenerar} className="w-full bg-blue-600 hover:bg-blue-500 p-2 rounded font-bold text-white transition">
            Generar Código QR
          </button>
        )}

        {qr && !activado && (
          <div className="space-y-4 text-center">
            <p className="text-sm text-slate-300">Escanea este código con Google Authenticator:</p>
            <img src={qr} alt="QR 2FA" className="mx-auto bg-white p-2 rounded" />
            <input
              type="text"
              placeholder="Código de 6 dígitos"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-center text-xl tracking-widest text-white focus:outline-none focus:border-yellow-400"
            />
            <button onClick={handleActivar} className="w-full bg-green-600 hover:bg-green-500 p-2 rounded font-bold text-white transition">
              Activar 2FA
            </button>
          </div>
        )}

        {activado && (
          <p className="text-green-400 text-center font-bold">✅ ¡2FA Activado con éxito!</p>
        )}

        {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
        
        <button onClick={onClose} className="mt-4 w-full text-slate-400 hover:text-white text-sm transition">
          Cerrar
        </button>
      </div>
    </div>,
    document.body // <-- SE RENDERIZA EN EL BODY, NO EN EL NAVBAR
  );
}