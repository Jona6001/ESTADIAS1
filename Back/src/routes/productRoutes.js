const express = require("express");
const router = express.Router();
const {
  crearProducto,
  modificarProducto,
  eliminarProducto,
  buscarProducto,
  listarProductos,
} = require("../controllers/productosController");
const { validarToken } = require("../config/auth");

// Crear producto (solo admin)
router.post("/productos", validarToken, crearProducto);

// Modificar producto (solo admin)
router.patch("/productos/:id", validarToken, modificarProducto);

// Eliminar producto permanentemente (solo admin)
router.delete("/productos/:id", validarToken, eliminarProducto);

// Obtener producto por ID (autenticado)
router.get("/productos/:id", validarToken, buscarProducto);

// Listar todos los productos (autenticado)
router.get("/productos", validarToken, listarProductos);

module.exports = router;
