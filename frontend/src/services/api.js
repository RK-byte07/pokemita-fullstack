// frontend/src/services/api.js
import axios from 'axios';

// En producción (Vercel) el backend se sirve bajo el mismo dominio en /api
// gracias al rewrite de vercel.json. En desarrollo local se usa el backend
// de nodemon en http://localhost:3000.
const api = axios.create({
  baseURL: import.meta.env.PROD ? '/api' : 'http://localhost:3000/api',
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