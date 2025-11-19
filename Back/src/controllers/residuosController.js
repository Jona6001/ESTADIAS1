const { Residuo, Producto, Usuario } = require("../models");

const USUARIO_ALIAS =
  Residuo.associations?.usuario_registro?.as || "usuario_registro";
const usuarioInclude = {
  model: Usuario,
  as: USUARIO_ALIAS,
  attributes: ["nombre", "correo"],
};

// Obtener todos los residuos
const obtenerResiduos = async (req, res) => {
  try {
    const residuos = await Residuo.findAll({
      include: [
        {
          model: Producto,
          attributes: ["nombre", "descripcion"],
        },
        usuarioInclude,
      ],
      order: [["fecha_creacion", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: residuos,
    });
  } catch (error) {
    console.error("Error al obtener residuos:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener los residuos",
      error: error.message,
    });
  }
};

// Obtener un residuo por ID
const obtenerResiduoPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const residuo = await Residuo.findByPk(id, {
      include: [
        {
          model: Producto,
          attributes: ["nombre", "descripcion"],
        },
        usuarioInclude,
      ],
    });

    if (!residuo) {
      return res.status(404).json({
        success: false,
        message: "Residuo no encontrado",
      });
    }

    return res.status(200).json({
      success: true,
      data: residuo,
    });
  } catch (error) {
    console.error("Error al obtener el residuo:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener el residuo",
      error: error.message,
    });
  }
};

// Crear un nuevo residuo
const crearResiduo = async (req, res) => {
  try {
    // Aceptar alias y normalizar payload numérico y de texto
    const body = req.body || {};
    const toNumber = (v, def = 0) =>
      v === undefined || v === null || v === "" || isNaN(Number(v))
        ? def
        : Number(v);

    const cotizacionId = toNumber(body.cotizacionId, null);
    const productoId = toNumber(body.productoId, null);
    const ID_usuario_registro = toNumber(body.ID_usuario_registro, null);

    // Permitir alias m2Residuo
    const m2_residuo = toNumber(
      body.m2_residuo !== undefined ? body.m2_residuo : body.m2Residuo,
      0
    );
    const piezas_usadas = toNumber(body.piezas_usadas, 0);
    const m2_necesarios = toNumber(body.m2_necesarios, 0);
    const m2_usados = toNumber(body.m2_usados, 0);
    const porcentaje_residuo = toNumber(body.porcentaje_residuo, 0);
    // medida_por_unidad es requerida en el modelo: ponemos default 1 si no viene
    const medida_por_unidad = toNumber(body.medida_por_unidad, 1);
    const estado = body.estado || "disponible";
    const observaciones = body.observaciones ?? null;

    // Validar datos requeridos
    if (!cotizacionId || !productoId || !ID_usuario_registro) {
      return res.status(400).json({
        success: false,
        message: "Faltan datos requeridos",
        required: ["cotizacionId", "productoId", "ID_usuario_registro"],
      });
    }

    const nuevoResiduo = await Residuo.create({
      cotizacionId,
      productoId,
      piezas_usadas,
      m2_necesarios,
      m2_usados,
      m2_residuo,
      porcentaje_residuo,
      medida_por_unidad,
      estado,
      observaciones,
      ID_usuario_registro,
    });

    // Obtener el residuo creado con sus relaciones
    const residuoConRelaciones = await Residuo.findByPk(nuevoResiduo.ID, {
      include: [
        {
          model: Producto,
          attributes: ["nombre", "descripcion"],
        },
        usuarioInclude,
      ],
    });

    return res.status(201).json({
      success: true,
      message: "Residuo creado exitosamente",
      data: residuoConRelaciones,
    });
  } catch (error) {
    console.error("Error al crear el residuo:", error);
    return res.status(500).json({
      success: false,
      message: "Error al crear el residuo",
      error: error.message,
    });
  }
};

// Actualizar un residuo
const actualizarResiduo = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, observaciones } = req.body;

    const residuo = await Residuo.findByPk(id);

    if (!residuo) {
      return res.status(404).json({
        success: false,
        message: "Residuo no encontrado",
      });
    }

    // Solo permitir actualizar estado y observaciones
    if (estado) residuo.estado = estado;
    if (observaciones) residuo.observaciones = observaciones;

    await residuo.save();

    // Obtener el residuo actualizado con sus relaciones
    const residuoActualizado = await Residuo.findByPk(id, {
      include: [
        {
          model: Producto,
          attributes: ["nombre", "descripcion"],
        },
        usuarioInclude,
      ],
    });

    return res.status(200).json({
      success: true,
      message: "Residuo actualizado exitosamente",
      data: residuoActualizado,
    });
  } catch (error) {
    console.error("Error al actualizar el residuo:", error);
    return res.status(500).json({
      success: false,
      message: "Error al actualizar el residuo",
      error: error.message,
    });
  }
};

// Eliminar un residuo
const eliminarResiduo = async (req, res) => {
  try {
    const { id } = req.params;

    const residuo = await Residuo.findByPk(id);

    if (!residuo) {
      return res.status(404).json({
        success: false,
        message: "Residuo no encontrado",
      });
    }

    await residuo.destroy();

    return res.status(200).json({
      success: true,
      message: "Residuo eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar el residuo:", error);
    return res.status(500).json({
      success: false,
      message: "Error al eliminar el residuo",
      error: error.message,
    });
  }
};

module.exports = {
  obtenerResiduos,
  obtenerResiduoPorId,
  crearResiduo,
  actualizarResiduo,
  eliminarResiduo,
};
