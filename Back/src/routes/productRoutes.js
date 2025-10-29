const express = require("express");
const router = express.Router();
const {
  crearProducto,
  modificarProducto,
  eliminarProducto,
  reactivarProducto,
  buscarProducto,
  listarProductos,
} = require("../controllers/productosController");
const { validarToken } = require("../config/auth");

// Crear producto (solo admin)
router.post("/productos", validarToken, crearProducto);

// Modificar producto (solo admin)
router.patch("/productos/:id", validarToken, modificarProducto);

// Eliminar producto (soft delete, solo admin)
router.patch("/productos/:id/desactivar", validarToken, eliminarProducto);

// Reactivar producto (solo admin)
router.patch("/productos/:id/reactivar", validarToken, reactivarProducto);

// Obtener producto por ID (autenticado)
router.get("/productos/:id", validarToken, buscarProducto);

// Listar todos los productos (autenticado)
router.get("/productos", validarToken, listarProductos);

module.exports = router;
