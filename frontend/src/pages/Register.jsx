// src/pages/Register.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { dispatch } = useAuth();
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!username.trim()) return setError('El usuario es obligatorio');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Correo inválido');
    if (password.length < 6) return setError('La contraseña debe tener mínimo 6 caracteres');

    dispatch({ type: 'LOGIN', payload: { username, email } });
    navigate('/', { replace: true });
  }

  return (
    <div className="max-w-md mx-auto mt-16 px-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 shadow-lg">
        <h2 className="text-3xl font-bold text-yellow-400 mb-6 text-center">
          Crear cuenta
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-yellow-400"
              placeholder="ash_ketchum"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Correo
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-yellow-400"
              placeholder="ash@pokemon.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-yellow-400"
              placeholder="••••••"
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 text-sm px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold py-2 rounded-lg transition"
          >
            Registrarse
          </button>
        </form>

        <p className="mt-6 text-center text-slate-400 text-sm">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-yellow-400 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}