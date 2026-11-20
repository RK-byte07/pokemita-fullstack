import { useState } from "react";
import { createPortal } from "react-dom";

import {
  generar2FAAPI,
  activar2FAAPI,
} from "../services/twofaService";

export default function TwoFactorSetup({
  onActivated,
  onLogout,
}) {
  const [qr, setQr] = useState(null);
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGenerar() {
    setError("");
    setLoading(true);

    try {
      const data = await generar2FAAPI();
      setQr(data.qrImage);
    } catch (error) {
      setError(
        error.response?.data?.error ||
          "No se pudo generar el código QR.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleActivar(event) {
    event.preventDefault();

    if (!/^\d{6}$/.test(codigo)) {
      setError("Introduce un código de seis dígitos.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await activar2FAAPI(codigo);
      onActivated();
    } catch (error) {
      setError(
        error.response?.data?.error ||
          "No se pudo activar el 2FA.",
      );
    } finally {
      setLoading(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] grid place-items-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="setup-2fa-title"
        aria-describedby="setup-2fa-description"
        className="my-6 w-full max-w-md rounded-2xl border border-white/10 bg-slate-800 p-6 shadow-2xl"
      >
        <h2
          id="setup-2fa-title"
          className="text-2xl font-black text-yellow-400"
        >
          Protege tu cuenta
        </h2>

        <p
          id="setup-2fa-description"
          className="mt-3 text-sm leading-relaxed text-slate-300"
        >
          Configura la autenticación de dos factores para
          continuar. En tus próximos inicios de sesión,
          además de tu contraseña, te pediremos el código
          de tu aplicación autenticadora.
        </p>

        {!qr ? (
          <button
            type="button"
            autoFocus
            disabled={loading}
            onClick={handleGenerar}
            className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 font-bold text-white disabled:opacity-50"
          >
            {loading ? "Generando…" : "Generar código QR"}
          </button>
        ) : (
          <form
            onSubmit={handleActivar}
            className="mt-5 space-y-4"
          >
            <p className="text-sm text-slate-300">
              Escanea este QR con Google Authenticator
              o una aplicación compatible. Después
              escribe el código de seis dígitos.
            </p>

            <img
              src={qr}
              alt="QR para configurar tu autenticador"
              className="mx-auto h-52 w-52 rounded-lg bg-white p-2"
            />

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-white">
                Código de verificación
              </span>

              <input
                autoFocus
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={codigo}
                onChange={(event) =>
                  setCodigo(
                    event.target.value.replace(/\D/g, ""),
                  )
                }
                placeholder="000000"
                disabled={loading}
                className="w-full rounded-xl border border-slate-600 bg-slate-900 p-3 text-center text-xl tracking-widest text-white"
              />
            </label>

            <button
              type="submit"
              disabled={loading || codigo.length !== 6}
              className="w-full rounded-xl bg-green-600 px-4 py-3 font-bold text-white disabled:opacity-50"
            >
              {loading
                ? "Verificando…"
                : "Activar 2FA y continuar"}
            </button>
          </form>
        )}

        {error && (
          <p
            role="alert"
            className="mt-4 text-sm text-red-400"
          >
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={loading}
          onClick={onLogout}
          className="mt-5 w-full text-sm text-slate-400 hover:text-white disabled:opacity-50"
        >
          Cerrar sesión y configurar después
        </button>
      </section>
    </div>,
    document.body,
  );
}