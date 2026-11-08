// frontend/src/store/battleStore.js
import { create } from 'zustand';

export const useBattleStore = create((set, get) => ({
  // Modo actual: 'menu' | 'building' | 'battle'
  mode: 'menu',

  // Team builder
  allPokemon: [],
  selectedTeam: [],
  itemsCache: [],

  // Batalla
  sessionId: null,
  awaitingInput: false,
  lastRequest: null,
  mochila: {},
  teamState: null,
  currentTab: 'moves',

  // Velocidad de eventos
  speed: 400,

  // Log de la batalla
  logEntries: [],
  turno: 0,

  // Estado de los sprites
  p1: { name: '---', hpPct: 100, hpCur: 0, hpMax: 100, status: '', types: [], fainted: false },
  p2: { name: '---', hpPct: 100, hpCur: 0, hpMax: 100, status: '', types: [], fainted: false },

  // WebSocket
  socket: null,
  isConnected: false,

  // ---- Acciones Generales ----
  setMode: (mode) => set({ mode }),
  setSpeed: (speed) => set({ speed }),

  setAllPokemon: (allPokemon) => set({ allPokemon }),
  setItemsCache: (itemsCache) => set({ itemsCache }),

  setSelectedTeam: (selectedTeam) => set({ selectedTeam }),
  addToTeam: (pokemon) => {
    const team = get().selectedTeam;
    if (team.length >= 6) return;
    if (team.find((p) => p.name === pokemon.name)) return;
    set({ selectedTeam: [...team, pokemon] });
  },
  removeFromTeam: (name) => {
    set({ selectedTeam: get().selectedTeam.filter((p) => p.name !== name) });
  },
  updateTeamMember: (index, updated) => {
    const team = [...get().selectedTeam];
    team[index] = { ...team[index], ...updated };
    set({ selectedTeam: team });
  },
  clearTeam: () => set({ selectedTeam: [] }),

  setSessionId: (sessionId) => set({ sessionId }),
  setAwaitingInput: (awaitingInput) => set({ awaitingInput }),
  setLastRequest: (lastRequest) => set({ lastRequest }),
  setMochila: (mochila) => set({ mochila }),
  setTeamState: (teamState) => set({ teamState }),
  setCurrentTab: (currentTab) => set({ currentTab }),

  addLog: (entry) =>
    set((state) => ({ logEntries: [...state.logEntries, entry] })),
  clearLog: () => set({ logEntries: [] }),

  setTurno: (turno) => set({ turno }),

  updateSide: (side, data) =>
    set((state) => ({
      [side]: { ...state[side], ...data },
    })),

  resetBattle: () =>
    set({
      sessionId: null,
      awaitingInput: false,
      lastRequest: null,
      mochila: {},
      teamState: null,
      logEntries: [],
      turno: 0,
      p1: { name: '---', hpPct: 100, hpCur: 0, hpMax: 100, status: '', types: [], fainted: false },
      p2: { name: '---', hpPct: 100, hpCur: 0, hpMax: 100, status: '', types: [], fainted: false },
    }),

  // ==========================================
  // ---- ACCIONES DE WEBSOCKET ----
  // ==========================================

   connectSocket: (onEvent, onRequest, initialMessage) => {
    const ws = new WebSocket('ws://localhost:3000');
    
    ws.onopen = () => {
      console.log('✅ Conectado al WebSocket');
      set({ isConnected: true });
      
      // Si hay un mensaje inicial (como start_battle), lo enviamos ya
      if (initialMessage) {
        ws.send(JSON.stringify(initialMessage));
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'battle_event') {
          onEvent(data.event);
        }
        
        if (data.type === 'request_action') {
          onRequest(data.request, data.teamState, data.mochila);
        }

        if (data.type === 'session_created') {
          set({ sessionId: data.sessionId });
        }
        
        if (data.type === 'error') {
          console.error('Error del servidor:', data.message);
        }
      } catch (err) {
        console.error('Error parseando mensaje WS:', err);
      }
    };

    ws.onclose = () => {
      console.log('❌ WebSocket desconectado');
      set({ isConnected: false, socket: null });
    };
    
    set({ socket: ws });
    return ws;
  },

  sendSocketMessage: (msg) => {
    const ws = get().socket;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    } else {
      console.error('❌ WebSocket no está conectado');
    }
  },

  disconnectSocket: () => {
    const ws = get().socket;
    if (ws) {
      ws.close();
      set({ socket: null, isConnected: false });
    }
  },
}));