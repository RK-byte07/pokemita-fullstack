import { useState } from "react";
import { createPortal } from "react-dom";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import Input from "../components/ui/Input";
import Icon from "../components/ui/Icon";
import AuthVisual from "../components/AuthVisual";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [tokenTemporal, setTokenTemporal] = useState(null);
  const [codigo2FA, setCodigo2FA] = useState("");
  const [error2FA, setError2FA] = useState("");

  const { login, verificar2FA } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  function goToApplication() {
    navigate(
      location.state?.from?.pathname || "/simulador",
      { replace: true },
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Introduce un correo válido.");
      return;
    }

    if (!password) {
      setError("Introduce tu contraseña.");
      return;
    }

    setLoading(true);

    const result = await login(
      email.trim(),
      password,
      remember,
    );

    setLoading(false);

    if (!result.ok) {
      setError(result.reason);
      return;
    }

    if (result.requiere2FA) {
      setCodigo2FA("");
      setError2FA("");
      setTokenTemporal(result.tokenTemporal);
      return;
    }

    goToApplication();
  }

  async function handleVerificar2FA(event) {
    event.preventDefault();

    if (!/^\d{6}$/.test(codigo2FA)) {
      setError2FA("Introduce un código de seis dígitos.");
      return;
    }

    setError2FA("");
    setLoading(true);

    const result = await verificar2FA(
      tokenTemporal,
      codigo2FA,
      remember,
    );

    setLoading(false);

    if (!result.ok) {
      setError2FA(result.reason);
      return;
    }

    setTokenTemporal(null);
    goToApplication();
  }

  function cancelVerification() {
    if (loading) return;

    setTokenTemporal(null);
    setCodigo2FA("");
    setError2FA("");
    setPassword("");
  }

  return (
    <>
      <div className="auth-shell">
        <AuthVisual />

        <section className="flex items-center justify-center p-6 sm:p-10 lg:p-16">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <span className="eyebrow">
                ACCESO DE ENTRENADOR
              </span>

              <h1 className="mt-3 text-4xl font-black text-white">
                Vuelve a la arena
              </h1>

              <p className="mt-2 text-slate-400">
                Inicia sesión para gestionar tu equipo.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
              noValidate
            >
              <Input
                label="Correo electrónico"
                icon="mail"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                disabled={loading || Boolean(tokenTemporal)}
              />

              <Input
                label="Contraseña"
                icon="lock"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                disabled={loading || Boolean(tokenTemporal)}
              />

              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) =>
                    setRemember(event.target.checked)
                  }
                  disabled={
                    loading || Boolean(tokenTemporal)
                  }
                  className="accent-brand"
                />
                Recordarme
              </label>

              {error && (
                <p
                  role="alert"
                  className="text-sm text-red-400"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || Boolean(tokenTemporal)}
                className="cta-button w-full disabled:opacity-50"
              >
                {loading ? "Verificando…" : "Iniciar sesión"}
                <Icon name="arrow" />
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-slate-400">
              ¿Todavía no tienes cuenta?{" "}
              <Link
                to="/register"
                className="font-black text-brand"
              >
                Crear cuenta
              </Link>
            </p>
          </div>
        </section>
      </div>

      {tokenTemporal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/80 p-4 backdrop-blur-sm">
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="login-2fa-title"
              aria-describedby="login-2fa-description"
              className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-800 p-6 shadow-2xl"
            >
              <h2
                id="login-2fa-title"
                className="text-2xl font-black text-yellow-400"
              >
                Verificación de dos factores
              </h2>

              <p
                id="login-2fa-description"
                className="mt-3 text-sm text-slate-300"
              >
                Abre tu aplicación autenticadora e
                introduce el código de seis dígitos.
              </p>

              <form
                onSubmit={handleVerificar2FA}
                className="mt-5 space-y-4"
              >
                <Input
                  autoFocus
                  label="Código de verificación"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  value={codigo2FA}
                  onChange={(event) =>
                    setCodigo2FA(
                      event.target.value.replace(/\D/g, ""),
                    )
                  }
                  disabled={loading}
                  error={error2FA}
                />

                <button
                  type="submit"
                  disabled={
                    loading || codigo2FA.length !== 6
                  }
                  className="w-full rounded-xl bg-yellow-400 px-4 py-3 font-bold text-slate-900 disabled:opacity-50"
                >
                  {loading
                    ? "Verificando…"
                    : "Verificar y entrar"}
                </button>

                <button
                  type="button"
                  onClick={cancelVerification}
                  disabled={loading}
                  className="w-full py-2 text-sm text-slate-400 hover:text-white disabled:opacity-50"
                >
                  Cancelar
                </button>
              </form>
            </section>
          </div>,
          document.body,
        )}
    </>
  );
}