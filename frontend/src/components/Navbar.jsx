// src/components/Navbar.jsx
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { isAuthenticated, user, dispatch } = useAuth();
  const navigate = useNavigate();

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition ${
      isActive
        ? 'bg-yellow-400 text-slate-900'
        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
    }`;

  function handleLogout() {
    dispatch({ type: 'LOGOUT' });
    navigate('/');
  }

  return (
    <nav className="bg-slate-800 border-b border-slate-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-bold text-yellow-400">
            ⚡ Pokemita
          </Link>

          <div className="flex items-center gap-2">
            <NavLink to="/" className={linkClass} end>Inicio</NavLink>
            <NavLink to="/wiki" className={linkClass}>Wiki</NavLink>
            <NavLink to="/simulador" className={linkClass}>Simulador</NavLink>

            {isAuthenticated ? (
              <>
                <span className="text-slate-400 text-sm ml-2">
                  👤 {user?.username}
                </span>
                <button
                  onClick={handleLogout}
                  className="ml-2 px-3 py-2 rounded-md text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition"
                >
                  Salir
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={linkClass}>Login</NavLink>
                <NavLink to="/register" className={linkClass}>Registro</NavLink>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}