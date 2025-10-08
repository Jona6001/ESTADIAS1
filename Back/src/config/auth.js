const jwt = require("jsonwebtoken");
const { Usuario } = require("../models/Usermodel"); // Asegúrate de que la ruta sea correcta

const authConfig = {
  secret: "your_secret_key", // Cambia esto por una clave secreta segura
  expiresIn: "1h", // Tiempo de expiración del token
};

// Función para generar un token
function generarToken(usuario) {
  const payload = {
    id: usuario.id,
    rol: usuario.rol, // Asegúrate de que el modelo Usuario tenga un campo "rol"
  };

  return jwt.sign(payload, authConfig.secret, {
    expiresIn: authConfig.expiresIn,
  });
}

// Middleware para validar el token
function validarToken(req, res, next) {
  const token = req.headers["authorization"]?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ mensaje: "Token no proporcionado" });
  }

  jwt.verify(token, authConfig.secret, (err, decoded) => {
    if (err) {
      return res.status(401).json({ mensaje: "Token inválido o expirado" });
    }

    req.usuario = decoded; // Agregar los datos del usuario al objeto req
    next();
  });
}

// Middleware para verificar el rol
function verificarRol(rolesPermitidos) {
  return (req, res, next) => {
    const { rol } = req.usuario;

    if (!rolesPermitidos.includes(rol)) {
      return res
        .status(403)
        .json({ mensaje: "No tienes permisos para realizar esta acción" });
    }

    next();
  };
}

module.exports = {
  generarToken,
  validarToken,
  verificarRol,
};
