import axios from 'axios';

// URL del backend (Render). En local usa http://localhost:3000;
// en produccion se define VITE_API_URL al construir en Netlify,
// ej: https://pokemita-backend.onrender.com
const API_ORIGIN =
  import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  timeout: 15000,
});

// Interceptor de peticiones: añade el token JWT si existe
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pokemita_token') || sessionStorage.getItem('pokemita_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de respuestas: manejo de errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error(`[API Error] ${error.response.status}`, error.response.data);
    } else {
      console.error('[API Error]', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;