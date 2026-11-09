import {
  BrowserRouter,
  Routes,
  Route,
} from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Wiki from './pages/Wiki';
import Simulador from './pages/Simulador';
import Contact from './pages/Contact';
import Pokedex from './pages/pokedex';
import Meta from './pages/Meta';
import Perfil from './pages/Perfil';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-void">
          <Navbar />

          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/register"
                element={<Register />}
              />
              <Route path="/wiki" element={<Wiki />} />
              <Route path="/guias" element={<Wiki />} />
              <Route
                path="/pokedex"
                element={<Pokedex />}
              />
              <Route path="/meta" element={<Meta />} />
              <Route
                path="/contacto"
                element={<Contact />}
              />

              <Route element={<ProtectedRoute />}>
                <Route
                  path="/simulador"
                  element={<Simulador />}
                />
                <Route
                  path="/perfil"
                  element={<Perfil />}
                />
              </Route>

              <Route
                path="*"
                element={
                  <div className="page-container py-32 text-center">
                    <p className="eyebrow">
                      ERROR 404
                    </p>
                    <h1 className="mt-4 text-5xl font-black">
                      Ruta fuera de combate
                    </h1>
                    <p className="mt-3 text-slate-400">
                      Esta zona no existe en el mapa
                      competitivo.
                    </p>
                  </div>
                }
              />
            </Routes>
          </main>

          <footer className="border-t border-white/10 bg-void py-6">
            <div className="page-container flex flex-col justify-between gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 sm:flex-row">
              <span>
                Pokemita Competitive Platform
              </span>
              <span>
                Battle smarter ·{' '}
                {new Date().getFullYear()}
              </span>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}