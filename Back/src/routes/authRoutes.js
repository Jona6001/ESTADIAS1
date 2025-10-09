const express = require("express");
const router = express.Router();
const {
  login,
  crearUsuario,
  modificarUsuario,
} = require("../controllers/usercontrolleres");
const { validarToken } = require("../config/auth");

router.post("/login", login);

// Ruta protegida para crear usuario (solo admin)
router.post("/usuarios", validarToken, crearUsuario);

// Ruta protegida para modificar usuario por ID (admin o el mismo usuario)
router.patch("/usuarios/:id", validarToken, modificarUsuario);

// Ruta protegida para eliminar usuario por ID (solo admin)
router.delete("/usuarios/:id", validarToken, eliminarUsuario);

module.exports = router;
