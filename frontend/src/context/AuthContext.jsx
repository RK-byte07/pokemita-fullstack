// frontend/src/context/AuthContext.jsx

import { createContext, useContext, useEffect, useReducer } from "react";
import { apiLogin, apiRegister, apiVerificar2FA } from "../services/authService";

const AuthContext = createContext(null);

const TOKEN_KEY = "pokemita_token";
const USER_KEY = "pokemita_user";

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  remember: false,
};

function authReducer(state, action) {
  switch (action.type) {
    case "LOGIN":
      return {
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        remember: action.payload.remember,
      };
    case "LOGOUT":
      return initialState;
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState, () => {
    // Al recargar, recuperamos el usuario y el token
    const savedUser = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    const savedToken = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    
    if (savedUser && savedToken) {
      return {
        user: JSON.parse(savedUser),
        token: savedToken,
        isAuthenticated: true,
        remember: !!localStorage.getItem(TOKEN_KEY),
      };
    }
    return initialState;
  });

  useEffect(() => {
    // Limpiamos ambos almacenamientos antes de guardar
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);

    if (state.user && state.token) {
      const storage = state.remember ? localStorage : sessionStorage;
      storage.setItem(TOKEN_KEY, state.token);
      storage.setItem(USER_KEY, JSON.stringify(state.user));
    }
  }, [state.user, state.token, state.remember]);

  async function register({ username, email, phone, password }) {
    try {
      const data = await apiRegister({ username, email, phone, password });
      dispatch({
        type: "LOGIN",
        payload: { user: data.user, token: data.token, remember: true },
      });
      return { ok: true };
    } catch (error) {
      return { ok: false, reason: error.response?.data?.error || "Error de conexión" };
    }
  }

  async function login(email, password, remember = true) {
    try {
      const data = await apiLogin(email, password);

      // Si el backend pide 2FA, NO guardamos el token final todavía
      if (data.requiere2FA) {
        return { 
          ok: true, 
          requiere2FA: true, 
          tokenTemporal: data.tokenTemporal 
        };
      }

      // Si no pide 2FA, guardamos todo normal
      dispatch({
        type: "LOGIN",
        payload: { user: data.user, token: data.token, remember },
      });
      return { ok: true };
    } catch (error) {
      return { ok: false, reason: error.response?.data?.error || "Error de conexión" };
    }
  }

  async function verificar2FA(tokenTemporal, codigo) {
    try {
      const data = await apiVerificar2FA(tokenTemporal, codigo);
      // Aquí ya nos dan el token final y el usuario
      dispatch({
        type: "LOGIN",
        payload: { user: data.user, token: data.token, remember: true },
      });
      return { ok: true };
    } catch (error) {
      return { ok: false, reason: error.response?.data?.error || "Código incorrecto" };
    }
  }

  return (
    <AuthContext.Provider
      value={{
        ...state,
        dispatch,
        login,
        register,
        verificar2FA,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}