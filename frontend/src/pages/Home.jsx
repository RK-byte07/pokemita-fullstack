// src/pages/Home.jsx
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-yellow-400 mb-4">
          ⚡ Pokemita
        </h1>
        <p className="text-xl text-slate-300 mb-2">
          Simulador de combates Pokémon competitivos
        </p>
        <p className="text-slate-400">
          Arma tu equipo, elige tus movimientos y enfréntate al meta Gen 9 OU
        </p>

        {isAuthenticated && (
          <p className="mt-4 text-yellow-300">
            👋 Bienvenido, <strong>{user?.username}</strong>
          </p>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Link
          to="/simulador"
          className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-6 transition group"
        >
          <div className="text-4xl mb-3">🎮</div>
          <h3 className="text-xl font-bold text-yellow-400 mb-2">Simulador</h3>
          <p className="text-slate-400 text-sm">
            Combate en tiempo real contra la IA o mira batallas automáticas
          </p>
        </Link>

        <Link
          to="/wiki"
          className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-6 transition group"
        >
          <div className="text-4xl mb-3">📖</div>
          <h3 className="text-xl font-bold text-yellow-400 mb-2">Wiki</h3>
          <p className="text-slate-400 text-sm">
            Guías, tiers y consejos para armar tu equipo competitivo
          </p>
        </Link>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="text-4xl mb-3">🏆</div>
          <h3 className="text-xl font-bold text-yellow-400 mb-2">Meta Gen 9 OU</h3>
          <p className="text-slate-400 text-sm">
            Enfréntate a los Pokémon más usados del competitivo actual
          </p>
        </div>
      </div>

      {!isAuthenticated && (
        <div className="mt-12 text-center">
          <Link
            to="/register"
            className="inline-block bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold px-8 py-3 rounded-lg transition"
          >
            Crear cuenta gratis
          </Link>
        </div>
      )}
    </div>
  );
}