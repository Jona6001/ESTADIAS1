const express = require("express");
const router = express.Router();
const {
  crearCliente,
  modificarCliente,
  eliminarCliente,
  reactivarCliente,
  listarClientes,
  buscarCliente,
} = require("../controllers/clientesControllers");
const { validarToken } = require("../config/auth");

// Crear cliente (solo admin)
router.post("/crearCliente", validarToken, crearCliente);

// Modificar cliente (solo admin)
router.patch("/clientes/:id", validarToken, modificarCliente);

// Desactivar cliente (solo admin, soft delete)
router.patch("/clientes/:id/desactivar", validarToken, eliminarCliente);

// Reactivar cliente (solo admin)
router.patch("/clientes/:id/reactivar", validarToken, reactivarCliente);

// Obtener todos los clientes (autenticado)
router.get("/clientes", validarToken, listarClientes);

// Obtener cliente por ID (autenticado)
router.get("/clientes/:id", validarToken, buscarCliente);

module.exports = router;
