import api from './api';

export async function generar2FAAPI() {
  const { data } = await api.post('/2fa/generar');
  return data;
}

export async function activar2FAAPI(codigo) {
  const { data } = await api.post('/2fa/activar', { codigo });
  return data;
}