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
  
  // Estados para el 2FA
  const [tokenTemporal, setTokenTemporal] = useState(null);
  const [codigo2FA, setCodigo2FA] = useState("");

  const { login, verificar2FA } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = "Ingresa un correo electrónico válido.";
    if (!password) nextErrors.password = "Ingresa tu contraseña.";
    
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    const result = await login(email, password, remember);
    setLoading(false);

    if (!result.ok) {
      setModal({ title: "Error", message: result.reason });
      return;
    }

    // Si el backend pide 2FA, guardamos el token temporal y mostramos el input
    if (result.requiere2FA) {
      setTokenTemporal(result.tokenTemporal);
      return;
    }

    // Si no, redirigimos
    navigate(location.state?.from?.pathname || "/simulador", { replace: true });
  }

  async function handleVerificar2FA(e) {
    e.preventDefault();
    setLoading(true);
    
    // Llamamos al contexto
    const result = await verificar2FA(tokenTemporal, codigo2FA);
    
    setLoading(false);

    // SI EL RESULTADO NO ES OK, MOSTRAMOS EL ERROR Y NO NAVEGAMOS
    if (!result.ok) {
      setModal({ 
        title: "Código incorrecto", 
        message: result.reason || "El código ingresado no es válido." 
      });
      return; // <--- ESTO ES CLAVE: Detiene la ejecución y no te deja pasar
    }

    // Solo si es OK, navegamos al simulador
    navigate(location.state?.from?.pathname || "/simulador", { replace: true });
  }

  return (
    <div className="auth-shell">
      <AuthVisual />

      <section className="flex items-center justify-center p-6 sm:p-10 lg:p-16">
        <div className="w-full max-w-md">
          
          {tokenTemporal ? (
            // FORMULARIO 2FA
            <form onSubmit={handleVerificar2FA} className="space-y-5">
              <div className="mb-8">
                <span className="eyebrow">SEGURIDAD EXTRA</span>
                <h1 className="mt-3 text-4xl font-black tracking-tight text-white">Verificación 2FA</h1>
                <p className="mt-2 text-slate-400">Ingresa el código de 6 dígitos de tu app autenticadora.</p>
              </div>
              
              <Input
                label="Código de 6 dígitos"
                type="text"
                placeholder="123456"
                value={codigo2FA}
                onChange={(e) => setCodigo2FA(e.target.value)}
                maxLength={6}
              />

              <button disabled={loading} className="cta-button w-full">
                {loading ? "Verificando…" : "Verificar código"}
                <Icon name="arrow" />
              </button>
            </form>
          ) : (
            // LOGIN NORMAL
            <>
              <div className="mb-8">
                <span className="eyebrow">ACCESO DE ENTRENADOR</span>
                <h1 className="mt-3 text-4xl font-black tracking-tight text-white">Vuelve a la arena</h1>
                <p className="mt-2 text-slate-400">Inicia sesión para gestionar tu equipo competitivo.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <Input
                  label="Correo electrónico"
                  icon="mail"
                  type="email"
                  placeholder="usuario@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={errors.email}
                />

                <Input
                  label="Contraseña"
                  icon="lock"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                />

                <div className="flex items-center justify-between gap-4 text-sm">
                  <label className="flex cursor-pointer items-center gap-2 text-slate-300">
                    <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-brand" />
                    Recordarme
                  </label>
                </div>

                <button disabled={loading} className="cta-button w-full">
                  {loading ? "Verificando…" : "Iniciar batalla"}
                  <Icon name="arrow" />
                </button>
              </form>

              <p className="mt-7 text-center text-sm text-slate-400">
                ¿Aún no tienes perfil?{" "}
                <Link to="/register" className="font-black text-brand hover:text-brand-light">
                  Crea tu cuenta
                </Link>
              </p>
            </>
          )}
        </div>
      </section>

      <Modal open={!!modal} {...modal} onClose={() => setModal(null)} />
    </div>
  );
}