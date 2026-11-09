import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  apiLogin,
  apiRegister,
  apiVerificar2FA,
} from "../services/authService";

import TwoFactorSetup from "../components/TwoFactorSetup";

const AuthContext = createContext(null);

const TOKEN_KEY = "pokemita_token";
const USER_KEY = "pokemita_user";

function emptySession() {
  return {
    user: null,
    token: null,
    remember: false,
  };
}

function readSession() {
  for (const storage of [localStorage, sessionStorage]) {
    try {
      const token = storage.getItem(TOKEN_KEY);
      const savedUser = storage.getItem(USER_KEY);

      if (token && savedUser) {
        const user = JSON.parse(savedUser);

        if (user && typeof user === "object") {
          return {
            user,
            token,
            remember: storage === localStorage,
          };
        }
      }
    } catch {
      storage.removeItem(TOKEN_KEY);
      storage.removeItem(USER_KEY);
    }
  }

  return emptySession();
}

function hasTwoFactor(user) {
  return (
    user?.twofa_enabled === true ||
    user?.twofa_enabled === 1 ||
    user?.twofa_enabled === "1"
  );
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession);

  const isAuthenticated = Boolean(session.user && session.token);

  const requiresSetup =
    isAuthenticated && !hasTwoFactor(session.user);

  useEffect(() => {
    for (const storage of [localStorage, sessionStorage]) {
      storage.removeItem(TOKEN_KEY);
      storage.removeItem(USER_KEY);
    }

    if (session.user && session.token) {
      const storage = session.remember
        ? localStorage
        : sessionStorage;

      storage.setItem(TOKEN_KEY, session.token);
      storage.setItem(USER_KEY, JSON.stringify(session.user));
    }
  }, [session]);

  function saveSession(data, remember) {
    // Lo guardamos antes de resolver register/login para que las
    // peticiones del modal ya puedan utilizar el interceptor de Axios.
    for (const storage of [localStorage, sessionStorage]) {
      storage.removeItem(TOKEN_KEY);
      storage.removeItem(USER_KEY);
    }

    const storage = remember ? localStorage : sessionStorage;

    storage.setItem(TOKEN_KEY, data.token);
    storage.setItem(USER_KEY, JSON.stringify(data.user));

    setSession({
      user: data.user,
      token: data.token,
      remember,
    });
  }

  function logout() {
    for (const storage of [localStorage, sessionStorage]) {
      storage.removeItem(TOKEN_KEY);
      storage.removeItem(USER_KEY);
    }

    setSession(emptySession());
  }

  async function register({ username, email, phone, password }) {
    try {
      const data = await apiRegister({
        username,
        email,
        phone,
        password,
      });

      saveSession(data, true);

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        reason:
          error.response?.data?.error ||
          "No se pudo crear la cuenta.",
      };
    }
  }

  async function login(email, password, remember = true) {
    try {
      const data = await apiLogin(email, password);

      if (data.requiere2FA) {
        // Este token temporal no se guarda como sesión.
        return {
          ok: true,
          requiere2FA: true,
          tokenTemporal: data.tokenTemporal,
        };
      }

      saveSession(data, remember);

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        reason:
          error.response?.data?.error ||
          "No se pudo iniciar sesión.",
      };
    }
  }

  async function verificar2FA(
    tokenTemporal,
    codigo,
    remember = true,
  ) {
    try {
      const data = await apiVerificar2FA(
        tokenTemporal,
        codigo,
      );

      saveSession(data, remember);

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        reason:
          error.response?.data?.error ||
          "Código incorrecto o sesión temporal expirada.",
      };
    }
  }

  function completeTwoFactorSetup() {
    setSession((current) => ({
      ...current,
      user: {
        ...current.user,
        twofa_enabled: true,
      },
    }));
  }

  // Conserva compatibilidad con componentes que usan dispatch.
  function dispatch(action) {
    if (action.type === "LOGOUT") {
      logout();
    }
  }

  return (
    <AuthContext.Provider
      value={{
        ...session,
        isAuthenticated,
        requiresSetup,
        register,
        login,
        verificar2FA,
        logout,
        dispatch,
      }}
    >
      {requiresSetup ? (
        <TwoFactorSetup
          onActivated={completeTwoFactorSetup}
          onLogout={logout}
        />
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth debe usarse dentro de AuthProvider",
    );
  }

  return context;
}