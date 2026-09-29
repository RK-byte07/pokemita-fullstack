// frontend/src/context/AuthContext.jsx

import { createContext, useContext, useEffect, useReducer } from "react";

const AuthContext = createContext(null);

const USER_KEY = "pokemita_user";
const SESSION_USER_KEY = "pokemita_session_user";
const ACCOUNTS_KEY = "pokemita_accounts";

const initialState = {
  user: null,

  isAuthenticated: false,

  remember: false,
};

function readJSON(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

async function hashPassword(password) {
  const encoder = new TextEncoder();

  const data = encoder.encode(password);

  const hash = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function authReducer(state, action) {
  switch (action.type) {
    case "LOGIN":
      return {
        user: action.payload.user,

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
  const [state, dispatch] = useReducer(
    authReducer,

    initialState,

    () => {
      const savedUser = readJSON(USER_KEY, null);

      const sessionUser = JSON.parse(sessionStorage.getItem(SESSION_USER_KEY));

      if (savedUser) {
        return {
          user: savedUser,

          isAuthenticated: true,

          remember: true,
        };
      }

      if (sessionUser) {
        return {
          user: sessionUser,

          isAuthenticated: true,

          remember: false,
        };
      }

      return initialState;
    },
  );

  useEffect(() => {
    localStorage.removeItem(USER_KEY);

    sessionStorage.removeItem(SESSION_USER_KEY);

    if (state.user && state.remember) {
      localStorage.setItem(
        USER_KEY,

        JSON.stringify(state.user),
      );
    }

    if (state.user && !state.remember) {
      sessionStorage.setItem(
        SESSION_USER_KEY,

        JSON.stringify(state.user),
      );
    }
  }, [state.user, state.remember]);

  async function register({
    username,

    email,

    phone,

    password,
  }) {
    const accounts = readJSON(ACCOUNTS_KEY, []);

    const cleanEmail = email.trim().toLowerCase();

    const exists = accounts.some((account) => account.email === cleanEmail);

    if (exists) {
      return {
        ok: false,

        reason: "exists",
      };
    }

    const account = {
      username: username.trim(),

      email: cleanEmail,

      phone: phone.trim(),

      passwordHash: await hashPassword(password),
    };

    localStorage.setItem(
      ACCOUNTS_KEY,

      JSON.stringify([...accounts, account]),
    );

    const user = {
      username: account.username,

      email: account.email,

      phone: account.phone,
    };

    dispatch({
      type: "LOGIN",

      payload: {
        user,

        remember: true,
      },
    });

    return {
      ok: true,
    };
  }

  async function login(
    email,

    password,

    remember = true,
  ) {
    const accounts = readJSON(ACCOUNTS_KEY, []);

    const account = accounts.find(
      (item) => item.email === email.trim().toLowerCase(),
    );

    if (!account) {
      return {
        ok: false,

        reason: "email",
      };
    }

    const passwordHash = await hashPassword(password);

    if (account.passwordHash !== passwordHash) {
      return {
        ok: false,

        reason: "password",
      };
    }

    const user = {
      username: account.username,

      email: account.email,

      phone: account.phone,
    };

    dispatch({
      type: "LOGIN",

      payload: {
        user,

        remember,
      },
    });

    return {
      ok: true,
    };
  }

  return (
    <AuthContext.Provider
      value={{
        ...state,

        dispatch,

        login,

        register,
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
