const express = require("express");
const router = express.Router();
const {
  login,
  crearUsuario,
  modificarUsuario,
  listarUsuarios,
  buscarUsuario,
  eliminarUsuario,
  reactivarUsuario,
} = require("../controllers/usercontrolleres");
const { validarToken } = require("../config/auth");

router.post("/login", login);

// Ruta protegida para crear usuario (solo admin)
router.post("/usuarios", validarToken, crearUsuario);

// Ruta protegida para modificar usuario por ID (admin o el mismo usuario)
router.patch("/usuarios/:id", validarToken, modificarUsuario);

// Ruta protegida para eliminar usuario por ID (solo admin, soft delete)
router.patch("/usuarios/:id/desactivar", validarToken, eliminarUsuario);

// Ruta protegida para reactivar usuario por ID (solo admin)
router.patch("/usuarios/:id/reactivar", validarToken, reactivarUsuario);

// Obtener todos los usuarios (autenticado)
router.get("/usuarios", validarToken, listarUsuarios);

// Obtener usuario por ID (autenticado)
router.get("/usuarios/:id", validarToken, buscarUsuario);

module.exports = router;
