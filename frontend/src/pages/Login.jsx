// src/pages/Login.jsx

import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Input from '../components/ui/Input';
import Modal from "../components/ui/Modal";
import Icon from "../components/ui/Icon";
import AuthVisual from "../components/AuthVisual";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [remember, setRemember] = useState(true);

  const [errors, setErrors] = useState({});

  const [modal, setModal] = useState(null);

  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  const navigate = useNavigate();

  const location = useLocation();

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = {};

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      nextErrors.email = "Ingresa un correo electrónico válido.";
    }

    if (!password) {
      nextErrors.password = "Ingresa tu contraseña.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      return;
    }

    setLoading(true);

    const result = await login(email, password, remember);

    setLoading(false);

    if (!result.ok) {
      setModal(
        result.reason === "email"
          ? {
              title: "Acceso denegado",

              message: "El correo ingresado no está registrado.",
            }
          : {
              title: "Contraseña incorrecta",

              message: "Verifica tus credenciales e intenta nuevamente.",
            },
      );

      return;
    }

    navigate(location.state?.from?.pathname || "/simulador", {
      replace: true,
    });
  }

  return (
    <div className="auth-shell">
      <AuthVisual />

      <section
        className="
        flex
        items-center
        justify-center
        p-6
        sm:p-10
        lg:p-16
        "
      >
        <div className="w-full max-w-md">
          <div className="mb-8">
            <span className="eyebrow">ACCESO DE ENTRENADOR</span>

            <h1
              className="
              mt-3
              text-4xl
              font-black
              tracking-tight
              text-white
              "
            >
              Vuelve a la arena
            </h1>

            <p className="mt-2 text-slate-400">
              Inicia sesión para gestionar tu equipo competitivo.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <Input
              label="Correo electrónico"
              icon="mail"
              type="email"
              autoComplete="email"
              placeholder="usuario@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
            />

            <Input
              label="Contraseña"
              icon="lock"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
            />

            <div
              className="
              flex
              items-center
              justify-between
              gap-4
              text-sm
              "
            >
              <label
                className="
                flex
                cursor-pointer
                items-center
                gap-2
                text-slate-300
                "
              >
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="
                  h-4
                  w-4
                  accent-brand
                  "
                />
                Recordarme
              </label>

              <button
                type="button"
                onClick={() =>
                  setModal({
                    title: "Recuperación no disponible",

                    message:
                      "La recuperación de contraseña se habilitará cuando el servicio de correo esté conectado.",
                  })
                }
                className="
                font-bold
                text-info
                hover:text-white
                "
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button
              disabled={loading}
              className="
              cta-button
              w-full
              "
            >
              {loading ? "Verificando…" : "Iniciar batalla"}

              <Icon name="arrow" />
            </button>
          </form>

          <p
            className="
            mt-7
            text-center
            text-sm
            text-slate-400
            "
          >
            ¿Aún no tienes perfil?{" "}
            <Link
              to="/register"
              className="
              font-black
              text-brand
              hover:text-brand-light
              "
            >
              Crea tu cuenta
            </Link>
          </p>
        </div>
      </section>

      <Modal open={!!modal} {...modal} onClose={() => setModal(null)} />
    </div>
  );
}
