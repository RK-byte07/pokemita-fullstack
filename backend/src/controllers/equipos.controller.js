const db = require('../db');

// Guardar un equipo nuevo
async function guardarEquipo(req, res) {
  try {
    const { nombre, team_data } = req.body;
    const usuarioId = req.usuario.id; // Viene del middleware JWT

    if (!nombre || !team_data) {
      return res.status(400).json({ error: 'Faltan datos del equipo' });
    }

    const [result] = await db.query(
      'INSERT INTO equipos (usuario_id, nombre, team_data) VALUES (?, ?, ?)',
      [usuarioId, nombre, JSON.stringify(team_data)]
    );

    res.status(201).json({ 
      id: result.insertId, 
      mensaje: 'Equipo guardado correctamente' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al guardar el equipo' });
  }
}

// Obtener todos los equipos del usuario logueado
async function listarEquipos(req, res) {
  try {
    const usuarioId = req.usuario.id;
    
    // Solo devolvemos los equipos de ESTE usuario (Evita BOLA)
    const [rows] = await db.query(
      'SELECT id, nombre, team_data, created_at FROM equipos WHERE usuario_id = ?',
      [usuarioId]
    );

    // Parseamos el JSON antes de enviarlo
    const equipos = rows.map(e => ({
      ...e,
      team_data: JSON.parse(e.team_data)
    }));

    res.json(equipos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los equipos' });
  }
}

// Eliminar un equipo
async function eliminarEquipo(req, res) {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario.id;

    // Solo puede eliminar si el equipo es suyo
    const [result] = await db.query(
      'DELETE FROM equipos WHERE id = ? AND usuario_id = ?',
      [id, usuarioId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Equipo no encontrado o no tienes permiso' });
    }

    res.json({ mensaje: 'Equipo eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el equipo' });
  }
}

module.exports = { guardarEquipo, listarEquipos, eliminarEquipo };