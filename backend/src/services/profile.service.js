const db = require('../db');
const { createHash } = require('node:crypto');
const { dex, normalize } = require('./simulator-teams');

const engine =
  require('pokemon-showdown/package.json').version;

function canonical(value) {
  if (Array.isArray(value)) {
    return value.map(canonical);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map(key => [key, canonical(value[key])]),
    );
  }

  return value;
}

function signature(team) {
  const normalized = team
    .map(normalize)
    .map(canonical)
    .sort((a, b) => a.species.localeCompare(b.species));

  return createHash('sha256')
    .update(JSON.stringify(normalized))
    .digest('hex');
}

const parse = value =>
  typeof value === 'string'
    ? JSON.parse(value)
    : value;

async function begin(userId, session) {
  const team = session.initial.team;
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const fingerprint = signature(team);

    const [saved] = await conn.execute(
      'SELECT id, team_data FROM equipos WHERE usuario_id = ?',
      [userId],
    );

    let equipoId = null;

    for (const row of saved) {
      try {
        if (
          signature(parse(row.team_data)) === fingerprint
        ) {
          equipoId = row.id;
          break;
        }
      } catch {
        // Los equipos antiguos pueden tener otro formato.
      }
    }

    const formatVersion =
      `gen9ou / showdown ${engine} / ` +
      (session.rules === 'bag'
        ? 'pokemita-bag-v1'
        : 'strict');

    const [result] = await conn.execute(
      `INSERT INTO batallas (
        usuario_id,
        equipo_id,
        session_id,
        reglas,
        equipo_firma,
        equipo_snapshot,
        rival_snapshot,
        motor_version,
        formato_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        equipoId,
        session.id,
        session.rules,
        fingerprint,
        JSON.stringify(team),
        JSON.stringify(session.initial.opponent),
        engine,
        formatVersion,
      ],
    );

    for (const [slot, member] of team.entries()) {
      const species = dex.species.get(member.species);

      await conn.execute(
        `INSERT INTO batalla_pokemon (
          batalla_id,
          slot,
          especie_id,
          nombre,
          sprite
        ) VALUES (?, ?, ?, ?, ?)`,
        [
          result.insertId,
          slot + 1,
          species.id,
          species.name,
          species.spriteid,
        ],
      );
    }

    await conn.commit();
    return result.insertId;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

async function finish(
  id,
  session,
  reason = 'normal',
) {
  if (!id) return;

  const battle = session.battle;
  const ended = battle.ended;

  const state = ended
    ? 'finalizada'
    : reason === 'error_servidor'
      ? 'error'
      : 'abandonada';

  const result = ended
    ? !battle.winner
      ? 'empate'
      : battle.winner === battle.p1.name
        ? 'victoria'
        : 'derrota'
    : null;

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const [updated] = await conn.execute(
      `UPDATE batallas
       SET estado = ?,
           resultado = ?,
           motivo_fin = ?,
           turnos = ?,
           finalizada_at = UTC_TIMESTAMP()
       WHERE id = ? AND estado = 'en_curso'`,
      [
        state,
        result,
        reason,
        battle.turn,
        id,
      ],
    );

    if (updated.affectedRows) {
      for (
        const [slot, member]
        of session.initial.team.entries()
      ) {
        const pokemon = battle.p1.pokemon.find(
          p => p.set.species === member.species,
        );

        await conn.execute(
          `UPDATE batalla_pokemon
           SET entro_al_campo = ?, debilitado = ?
           WHERE batalla_id = ? AND slot = ?`,
          [
            Number(
              Boolean(
                pokemon?.previouslySwitchedIn ||
                pokemon?.isActive,
              ),
            ),
            Number(Boolean(pokemon?.fainted)),
            id,
            slot + 1,
          ],
        );
      }
    }

    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

async function profile(userId, rules, page) {
  await db.execute(
    `UPDATE batallas
     SET estado = 'error',
         motivo_fin = 'sesion_expirada',
         finalizada_at = UTC_TIMESTAMP()
     WHERE usuario_id = ?
       AND estado = 'en_curso'
       AND actualizada_at <
           UTC_TIMESTAMP() - INTERVAL 31 MINUTE`,
    [userId],
  );

  const [users] = await db.execute(
    `SELECT username,
            email,
            phone,
            bio,
            avatar_pokemon,
            created_at,
            twofa_enabled
     FROM usuarios
     WHERE id = ?`,
    [userId],
  );

  if (!users.length) {
    throw new Error('Usuario no encontrado.');
  }

  const args = [userId, rules];

  const [summary] = await db.execute(
    `SELECT
      COUNT(*) total,
      SUM(estado = 'finalizada') finalizadas,
      SUM(resultado = 'victoria') victorias,
      SUM(resultado = 'derrota') derrotas,
      SUM(resultado = 'empate') empates,
      SUM(estado = 'abandonada') abandonos,
      SUM(estado = 'error') errores,
      SUM(estado = 'en_curso') en_curso,
      ROUND(
        AVG(
          CASE
            WHEN estado = 'finalizada' THEN turnos
          END
        ),
        1
      ) promedio_turnos
     FROM batallas
     WHERE usuario_id = ? AND reglas = ?`,
    args,
  );

  const [pokemon] = await db.execute(
    `SELECT
      p.especie_id,
      p.nombre,
      p.sprite,
      COUNT(*) partidas,
      SUM(p.entro_al_campo) participaciones,
      SUM(b.resultado = 'victoria') victorias
     FROM batalla_pokemon p
     JOIN batallas b ON b.id = p.batalla_id
     WHERE b.usuario_id = ?
       AND b.reglas = ?
       AND b.estado = 'finalizada'
     GROUP BY p.especie_id, p.nombre, p.sprite
     ORDER BY partidas DESC, p.nombre
     LIMIT 8`,
    args,
  );

  const [teams] = await db.execute(
    `SELECT
      equipo_firma,
      COUNT(*) partidas,
      SUM(resultado = 'victoria') victorias,
      MAX(id) ultima
     FROM batallas
     WHERE usuario_id = ?
       AND reglas = ?
       AND estado = 'finalizada'
     GROUP BY equipo_firma
     ORDER BY victorias DESC, partidas DESC
     LIMIT 5`,
    args,
  );

  for (const team of teams) {
    const [rows] = await db.execute(
      `SELECT equipo_snapshot
       FROM batallas
       WHERE id = ?`,
      [team.ultima],
    );

    team.team = parse(
      rows[0].equipo_snapshot,
    ).map(member => {
      const species = dex.species.get(member.species);

      return {
        name: species.name,
        sprite: species.spriteid,
      };
    });
  }

  const [activity] = await db.execute(
    `SELECT
      DATE_FORMAT(iniciada_at, '%Y-%m-%d') dia,
      COUNT(*) partidas,
      SUM(resultado = 'victoria') victorias
     FROM batallas
     WHERE usuario_id = ?
       AND reglas = ?
       AND estado = 'finalizada'
       AND iniciada_at >=
           UTC_DATE() - INTERVAL 29 DAY
     GROUP BY dia
     ORDER BY dia`,
    args,
  );

  const [history] = await db.query(
    `SELECT
      id,
      reglas,
      estado,
      resultado,
      motivo_fin,
      turnos,
      iniciada_at,
      equipo_snapshot,
      motor_version
     FROM batallas
     WHERE usuario_id = ? AND reglas = ?
     ORDER BY id DESC
     LIMIT 10 OFFSET ?`,
    [...args, (page - 1) * 10],
  );

  history.forEach(battle => {
    battle.team = parse(
      battle.equipo_snapshot,
    ).map(member => member.species);

    delete battle.equipo_snapshot;
  });

  return {
    user: users[0],
    summary: summary[0],
    pokemon,
    teams,
    activity,
    history,
    page,
    pages: Math.ceil(Number(summary[0].total) / 10),
  };
}

async function touch(id) {
  if (!id) return;

  await db.execute(
    `UPDATE batallas
     SET actualizada_at = UTC_TIMESTAMP()
     WHERE id = ? AND estado = 'en_curso'`,
    [id],
  );
}

module.exports = {
  begin,
  finish,
  profile,
  signature,
  touch,
};