// frontend/src/services/equiposService.js
import api from './api';

export async function guardarEquipoAPI(nombre, teamData) {
  const { data } = await api.post('/equipos', { nombre, team_data: teamData });
  return data;
}

export async function listarEquiposAPI() {
  const { data } = await api.get('/equipos');
  return data;
}

export async function eliminarEquipoAPI(id) {
  const { data } = await api.delete(`/equipos/${id}`);
  return data;
}