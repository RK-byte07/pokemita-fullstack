import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import PasswordStrength, {
  passwordRules,
} from "../components/ui/PasswordStrength";

import Icon from "../components/ui/Icon";

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
  });

  const [errors, setErrors] = useState({});

  const [modal, setModal] = useState(null);

  const [loading, setLoading] = useState(false);

  const { register } = useAuth();

  const navigate = useNavigate();

  const rules = passwordRules(form.password);

  const secure = Object.values(rules).every(Boolean);

  const matches = form.confirm.length > 0 && form.password === form.confirm;

  const canSubmit =
    form.username.trim() &&
    /^\S+@\S+\.\S+$/.test(form.email) &&
    form.phone.trim() &&
    secure &&
    matches;

  const fields = useMemo(
    () => [
      ["username", "Nombre de usuario", "user", "Ash_Ketchum", "text"],

      ["email", "Correo electrónico", "mail", "usuario@email.com", "email"],

      ["phone", "Teléfono", "phone", "+51 999 999 999", "tel"],
    ],
    [],
  );

  function update(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    setErrors((current) => ({
      ...current,
      [key]: "",
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!canSubmit) return;

    setLoading(true);

    const result = await register(form);

    setLoading(false);

    if (!result.ok) {
      setModal({
        title: "Correo ya registrado",

        message:
          "Ya existe una cuenta con este correo. Inicia sesión o utiliza otro.",
      });

      return;
    }

    navigate("/simulador", {
      replace: true,
    });
  }

  return (
    <div
      className="
      min-h-[calc(100vh-72px)]
      bg-void
      px-4
      py-12
      sm:px-6
      "
    >
      <div
        className="
        mx-auto
        grid
        max-w-6xl
        overflow-hidden
        rounded-3xl
        border
        border-white/10
        bg-card
        shadow-2xl
        shadow-black/30
        lg:grid-cols-[.78fr_1.22fr]
        "
      >
        <aside
          className="
          relative
          hidden
          overflow-hidden
          border-r
          border-white/10
          bg-surface
          p-10
          lg:flex
          lg:flex-col
          "
        >
          <div
            className="
            absolute
            inset-0
            grid-pattern
            opacity-20
            "
          />

          <div className="relative">
            <span className="eyebrow">NUEVO ENTRENADOR</span>

            <h1
              className="
              mt-5
              text-4xl
              font-black
              leading-tight
              text-white
              "
            >
              Tu camino al <span className="text-brand">top ladder</span>{" "}
              empieza aquí.
            </h1>

            <p
              className="
              mt-4
              leading-relaxed
              text-slate-300
              "
            >
              Crea tu perfil, diseña equipos y aprende de cada enfrentamiento.
            </p>
          </div>

          <div
            className="
            relative
            mt-auto
            space-y-4
            "
          >
            {[
              "Constructor competitivo 6v6",
              "Motor de batalla Gen 9 OU",
              "Análisis de cada turno",
            ].map((item) => (
              <div
                key={item}
                className="
                  flex
                  items-center
                  gap-3
                  text-sm
                  font-bold
                  text-slate-200
                  "
              >
                <span
                  className="
                    grid
                    h-8
                    w-8
                    place-items-center
                    rounded-lg
                    bg-brand/10
                    text-brand
                    "
                >
                  <Icon name="check" size={16} />
                </span>

                {item}
              </div>
            ))}
          </div>
        </aside>

        <section
          className="
          p-6
          sm:p-10
          lg:p-12
          "
        >
          <div className="mb-8">
            <span className="eyebrow">CREAR PERFIL</span>

            <h2
              className="
              mt-3
              text-3xl
              font-black
              text-white
              "
            >
              Únete a Pokemita
            </h2>

            <p
              className="
              mt-2
              text-slate-400
              "
            >
              Completa tus datos para acceder a la arena.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div
              className="
              grid
              gap-5
              sm:grid-cols-2
              "
            >
              {fields.map(([key, label, icon, placeholder, type], index) => (
                <Input
                  key={key}
                  className={index === 2 ? "sm:col-span-2" : ""}
                  label={label}
                  icon={icon}
                  placeholder={placeholder}
                  type={type}
                  autoComplete={key}
                  value={form[key]}
                  onChange={(e) => update(key, e.target.value)}
                  error={errors[key]}
                  required
                />
              ))}
            </div>

            <div
              className="
              grid
              gap-5
              sm:grid-cols-2
              "
            >
              <Input
                label="Contraseña"
                icon="lock"
                type="password"
                autoComplete="new-password"
                placeholder="Crea una contraseña"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
              />

              <Input
                label="Confirmar contraseña"
                icon="shield"
                type="password"
                autoComplete="new-password"
                placeholder="Repite tu contraseña"
                value={form.confirm}
                onChange={(e) => update("confirm", e.target.value)}
              />
            </div>

            <PasswordStrength password={form.password} />

            {form.confirm && (
              <p
                className={`
                  flex
                  items-center
                  gap-2
                  text-sm
                  font-bold

                  ${matches ? "text-success" : "text-error"}

                  `}
              >
                <Icon name={matches ? "check" : "close"} size={17} />

                {matches
                  ? "Las contraseñas coinciden"
                  : "Las contraseñas no coinciden"}
              </p>
            )}

            <button
              disabled={!canSubmit || loading}
              className="
              cta-button
              w-full
              disabled:cursor-not-allowed
              disabled:bg-surface
              disabled:text-slate-500
              "
            >
              {loading ? "Creando perfil…" : "Crear cuenta"}

              <Icon name="arrow" />
            </button>
          </form>

          <p
            className="
            mt-6
            text-center
            text-sm
            text-slate-400
            "
          >
            ¿Ya tienes cuenta?{" "}
            <Link
              to="/login"
              className="
              font-black
              text-brand
              hover:text-brand-light
              "
            >
              Inicia sesión
            </Link>
          </p>
        </section>
      </div>

      <Modal open={!!modal} {...modal} onClose={() => setModal(null)} />
    </div>
  );
}
