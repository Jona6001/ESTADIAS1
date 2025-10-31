const express = require("express");
const router = express.Router();
const { validarToken, verificarRol } = require("../config/auth");
const {
  crearOrden,
  obtenerOrdenes,
  obtenerOrdenPorId,
  actualizarStatusOrden,
  actualizarOrden,
  actualizarAnticipo,
  calcularInventarioNecesario,
  confirmarInventario,
  listarResiduosDisponibles,
  generarFacturaPDF,
} = require("../controllers/ventasControllers");

// Rutas de órdenes/cotizaciones
router.post("/api/ordenes", validarToken, crearOrden);
router.get("/api/ordenes", validarToken, obtenerOrdenes);
router.get("/api/ordenes/:id", validarToken, obtenerOrdenPorId);
router.put("/api/ordenes/:id", validarToken, actualizarOrden);
router.patch("/api/ordenes/:id/status", validarToken, actualizarStatusOrden);
router.patch("/api/ordenes/:id/anticipo", validarToken, actualizarAnticipo);

// Rutas de inventario
router.get(
  "/api/ordenes/:id/calcular-inventario",
  validarToken,
  calcularInventarioNecesario
);
router.post(
  "/api/ordenes/:id/confirmar-inventario",
  validarToken,
  confirmarInventario
);

// Rutas de residuos
router.get(
  "/api/residuos/disponibles",
  validarToken,
  listarResiduosDisponibles
);

// Rutas de facturación
router.get("/api/ordenes/:id/factura", validarToken, generarFacturaPDF);

module.exports = router;
