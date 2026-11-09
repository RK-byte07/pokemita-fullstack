const {
  Session,
} = require('../services/battle.service');

const sessions = new Map();

const expiry = setInterval(() => {
  for (
    const [id, session] of sessions
  ) {
    if (
      Date.now() -
        session.lastUsed >
      30 * 60 * 1000
    ) {
      session.destroy();
      sessions.delete(id);
    }
  }
}, 60000);

expiry.unref();

exports.autoBattle = async (
  req,
  res,
) => {
  const session = new Session({
    mode: 'auto',
    rules: 'strict',
  });

  let closed = false;

  res.on('close', () => {
    closed = true;
  });

  res.setHeader(
    'Content-Type',
    'application/x-ndjson; charset=utf-8',
  );

  try {
    while (!closed) {
      const state =
        session.snapshot();

      for (
        const event of state.events
      ) {
        res.write(
          JSON.stringify({
            event,
          }) + '\n',
        );
      }

      if (state.done) break;

      session.step();

      await new Promise(resolve =>
        setTimeout(resolve, 100),
      );
    }
  } finally {
    session.destroy();
    res.end();
  }
};

exports.manualStart = (req, res) => {
  try {
    const session = new Session({
      ...req.body,
      mode: 'manual',
    });

    sessions.set(
      session.id,
      session,
    );

    res.json(
      session.snapshot(),
    );
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
};

exports.manualAction = (req, res) => {
  const session = sessions.get(
    req.body.sessionId,
  );

  if (!session) {
    return res.status(404).json({
      error: 'Sesión no encontrada.',
    });
  }

  try {
    session.act(req.body);

    const state =
      session.snapshot();

    res.json(state);

    if (state.done) {
      session.destroy();

      sessions.delete(
        session.id,
      );
    }
  } catch (error) {
    res.status(400).json({
      error: error.message,
      state: session.snapshot(),
    });
  }
};