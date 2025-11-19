const express = require("express");
const router = express.Router();
const { validarToken } = require("../config/auth");
const {
  obtenerResiduos,
  obtenerResiduoPorId,
  crearResiduo,
  actualizarResiduo,
  eliminarResiduo,
} = require("../controllers/residuosController");

// Rutas CRUD básico para residuos
router.get("/api/residuos", validarToken, obtenerResiduos);
router.get("/api/residuos/:id", validarToken, obtenerResiduoPorId);
router.post("/api/residuos", validarToken, crearResiduo);
router.put("/api/residuos/:id", validarToken, actualizarResiduo);
router.delete("/api/residuos/:id", validarToken, eliminarResiduo);

module.exports = router;
