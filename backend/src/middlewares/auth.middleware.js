const jwt = require("jsonwebtoken");

const {
  JWT_SECRET,
} = require("../services/auth.service");

function verificarToken(req, res, next) {
  const authorization = req.headers.authorization || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      error: "Acceso denegado: falta una sesión válida",
    });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    if (
      !payload ||
      typeof payload !== "object" ||
      !payload.id
    ) {
      return res.status(401).json({
        error: "Token inválido",
      });
    }

    if (payload.etapa) {
      return res.status(401).json({
        error:
          "Debes completar la verificación de dos factores",
      });
    }

    req.usuario = payload;
    next();
  } catch {
    return res.status(401).json({
      error: "Token inválido o expirado",
    });
  }
}

module.exports = { verificarToken };