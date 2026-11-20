// frontend/src/services/api.js
import axios from 'axios';

// En producción (Vercel, modo services) el backend es un servicio interno y
// su URL se inyecta vía binding como BACKEND_URL (ver bindings del servicio
// frontend en vercel.json). Si no existe, se asume que el backend está en el
// mismo origen bajo /api (por ejemplo con "vercel dev").
// En desarrollo local fuera de Vercel se usa el backend de nodemon en
// http://localhost:3000.
const backendBase =
  import.meta.env.VITE_BACKEND_URL ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:3000/api');

const api = axios.create({
  baseURL: backendBase,
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