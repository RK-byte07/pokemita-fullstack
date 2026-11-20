import api from './api';

export async function fetchPokemonList() {
  const { data } = await api.get('/pokemon-list');
  return data;
}

export async function fetchItems() {
  const { data } = await api.get('/items');
  return data;
}

export async function fetchPokemonDetail(name) {
  const { data } = await api.get(`/pokemon/${encodeURIComponent(name)}`);
  return data;
}

export async function startManualBattle(teamText) {
  const { data } = await api.post('/manual/start', { teamText });
  return data;
}

export async function sendAction(sessionId, action) {
  const { data } = await api.post('/manual/action', { sessionId, action });
  return data;
}

/**
 * Auto battle en streaming NDJSON.
 * Lee el stream y llama onEvent por cada evento.
 */
export async function streamAutoBattle(onEvent, onError) {
  const response = await fetch('http://localhost:3000/api/battle');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const obj = JSON.parse(line);

        if (obj.error) {
          if (onError) onError(obj.error);
          continue;
        }

        if (obj.event) onEvent(obj.event);

      } catch {
      }
    }
  }
}