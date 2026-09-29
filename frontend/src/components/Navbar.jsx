import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import Icon from "./ui/Icon";

import pokemitaLogo from "../assets/images/pokemita-logo.png";

const links = [
  ["/", "Inicio", "home"],
  ["/pokedex", "Pokédex", "search"],
  ["/simulador", "Simulador", "sword"],
  ["/meta", "Meta competitivo", "trophy"],
  ["/guias", "Guías", "book"],
  ["/contacto", "Contacto", "mail"],
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const { isAuthenticated, user, dispatch } = useAuth();

  const navigate = useNavigate();

  const linkClass = ({ isActive }) =>
    `
      nav-link
      ${isActive ? "nav-link-active" : ""}
    `;

  function logout() {
    dispatch({
      type: "LOGOUT",
    });

    setOpen(false);

    navigate("/");
  }

  return (
    <header
      className="
      sticky
      top-0
      z-50
      border-b
      border-white/10
      bg-void/90
      backdrop-blur-xl
      "
    >
      <div
        className="
        mx-auto
        flex
        h-[72px]
        max-w-[1440px]
        items-center
        px-4
        sm:px-6
        "
      >
        {/* LOGO */}

        <Link
          to="/"
          className="
          mr-6
          flex
          items-center
          "
          onClick={() => setOpen(false)}
        >
          <img
            src={pokemitaLogo}
            alt="Pokemita Competitive"
            className="h-14 w-auto object-contain sm:h-15 md:h-15"
          />
        </Link>

        {/* MENU DESKTOP */}

        <nav
          className="
          hidden
          flex-1
          items-center
          justify-center
          gap-1
          xl:flex
          "
        >
          {links.map(([to, label, icon]) => (
            <NavLink key={to} to={to} end={to === "/"} className={linkClass}>
              <Icon name={icon} size={17} />

              {label}
            </NavLink>
          ))}
        </nav>

        {/* USUARIO */}

        <div
          className="
          ml-auto
          hidden
          items-center
          gap-3
          xl:flex
          "
        >
          {isAuthenticated ? (
            <>
              <div
                className="
                flex
                items-center
                gap-2
                rounded-xl
                border
                border-white/10
                bg-card
                px-3
                py-2
                text-sm
                "
              >
                <span
                  className="
                  grid
                  h-7
                  w-7
                  place-items-center
                  rounded-lg
                  bg-brand
                  text-void
                  "
                >
                  <Icon name="user" size={16} />
                </span>

                <span
                  className="
                  font-bold
                  text-white
                  "
                >
                  {user?.username}
                </span>
              </div>

              <button
                onClick={logout}
                className="
                text-xs
                font-bold
                text-slate-400
                hover:text-error
                "
              >
                SALIR
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="
                px-3
                py-2
                text-sm
                font-bold
                text-slate-300
                hover:text-white
                "
              >
                Ingresar
              </Link>

              <Link
                to="/register"
                className="
                rounded-xl
                bg-brand
                px-4
                py-2.5
                text-sm
                font-black
                text-void
                hover:bg-brand-light
                "
              >
                Crear cuenta
              </Link>
            </>
          )}
        </div>

        {/* MOBILE BUTTON */}

        <button
          onClick={() => setOpen(!open)}
          className="
          ml-auto
          rounded-xl
          border
          border-white/10
          bg-card
          p-2.5
          text-white
          xl:hidden
          "
        >
          <Icon name={open ? "close" : "menu"} />
        </button>
      </div>

      {/* MOBILE MENU */}

      {open && (
        <nav
          className="
          border-t
          border-white/10
          bg-card
          p-4
          xl:hidden
          "
        >
          <div
            className="
            grid
            gap-1
            "
          >
            {links.map(([to, label, icon]) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                onClick={() => setOpen(false)}
                className={linkClass}
              >
                <Icon name={icon} size={18} />

                {label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
