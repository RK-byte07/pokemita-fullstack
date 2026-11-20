import api from './api';

export async function apiRegister(data) {
  const response = await api.post('/auth/register', data);
  return response.data;
}

export async function apiLogin(email, password) {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
}

// ESTA ES LA FUNCIÓN QUE FALTABA
export async function apiVerificar2FA(tokenTemporal, codigo) {
  const response = await api.post('/auth/verificar-2fa', { tokenTemporal, codigo });
  return response.data;
}