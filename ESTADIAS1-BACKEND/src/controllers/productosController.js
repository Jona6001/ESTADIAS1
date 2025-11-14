const Producto = require("../models/prodcutosModel");

// Crear producto (solo admin)
async function crearProducto(req, res) {
  try {
    if (!req.usuario || req.usuario.rol !== "admin") {
      return res
        .status(403)
        .json({ mensaje: "No tienes permisos para crear productos" });
    }

    const {
      tipoMaterial,
      nombre,
      descripcion,
      imagen,
      precio,
      unidadMedida, // "piezas" o "m2"
      // Campo para medición por piezas
      cantidad_piezas,
      // Campos para medición por m2
      cantidad_m2,
      medida_por_unidad, // cuántos m2 tiene cada pieza (para calcular equivalencias)
    } = req.body;

    // Validaciones básicas obligatorias
    if (
      !tipoMaterial ||
      !nombre ||
      !unidadMedida ||
      precio === undefined ||
      precio === null
    ) {
      return res.status(400).json({
        mensaje:
          "Los campos tipoMaterial, nombre, precio y unidadMedida son requeridos",
      });
    }

    // Validar que el precio sea un número válido y mayor que 0
    if (isNaN(precio) || parseFloat(precio) <= 0) {
      return res.status(400).json({
        mensaje: "El precio debe ser un número válido mayor que 0",
      });
    }

    // Validar que unidadMedida tenga un valor válido
    if (!["piezas", "m2"].includes(unidadMedida)) {
      return res.status(400).json({
        mensaje: "unidadMedida debe ser 'piezas' o 'm2'",
      });
    }

    let datosProducto = {
      tipoMaterial,
      nombre,
      descripcion: descripcion || null,
      imagen: imagen || null,
      precio: parseFloat(precio),
      ID_usuario_creador: req.usuario.ID,
      cantidad_piezas: null,
      medida_por_unidad: null,
      cantidad_m2: null,
    };

    // Validaciones y asignación según la unidad de medida elegida
    if (unidadMedida === "piezas") {
      // Para medición por piezas - solo se requiere cantidad de piezas
      if (cantidad_piezas === undefined || cantidad_piezas === null) {
        return res.status(400).json({
          mensaje: "Para unidad de medida 'piezas' se requiere cantidad_piezas",
        });
      }

      datosProducto.cantidad_piezas = cantidad_piezas;
      // Para productos vendidos por piezas, medida_por_unidad y cantidad_m2 no aplican
      datosProducto.medida_por_unidad = null;
      datosProducto.cantidad_m2 = null;
    } else if (unidadMedida === "m2") {
      // Para medición por m2 se requiere la cantidad en m2 y medida por unidad (obligatorio)
      if (cantidad_m2 === undefined || cantidad_m2 === null) {
        return res.status(400).json({
          mensaje: "Para unidad de medida 'm2' se requiere cantidad_m2",
        });
      }

      if (
        medida_por_unidad === undefined ||
        medida_por_unidad === null ||
        medida_por_unidad <= 0
      ) {
        return res.status(400).json({
          mensaje:
            "Para unidad de medida 'm2' se requiere medida_por_unidad (metros cuadrados por pieza)",
        });
      }

      datosProducto.cantidad_m2 = cantidad_m2;
      datosProducto.medida_por_unidad = medida_por_unidad;
      // Calcular cantidad de piezas equivalentes
      datosProducto.cantidad_piezas = cantidad_m2 / medida_por_unidad;
    }

    const nuevoProducto = await Producto.create(datosProducto);

    res.status(201).json({
      mensaje: "Producto creado con éxito",
      producto: nuevoProducto,
    });
  } catch (error) {
    res
      .status(500)
      .json({ mensaje: "Error al crear producto", error: error.message });
  }
}

// Modificar producto (solo admin)
async function modificarProducto(req, res) {
  try {
    if (!req.usuario || req.usuario.rol !== "admin") {
      return res
        .status(403)
        .json({ mensaje: "No tienes permisos para modificar productos" });
    }

    const { id } = req.params;
    const producto = await Producto.findByPk(id);
    if (!producto) {
      return res.status(404).json({ mensaje: "Producto no encontrado" });
    }

    // Determinar el tipo de medida actual del producto
    const esProductoPorPiezas =
      producto.cantidad_piezas !== null && producto.cantidad_m2 === null;
    const esProductoPorM2 =
      producto.cantidad_m2 !== null && producto.medida_por_unidad !== null;

    // Campos básicos siempre modificables
    const camposBasicos = ["tipoMaterial", "nombre", "descripcion", "imagen"];

    // Validar y asignar campos básicos
    let algunCampoModificado = false;
    for (const campo of camposBasicos) {
      if (req.body[campo] !== undefined) {
        producto[campo] = req.body[campo];
        algunCampoModificado = true;
      }
    }

    // Validar y asignar precio si se proporciona
    if (req.body.precio !== undefined) {
      if (isNaN(req.body.precio) || parseFloat(req.body.precio) <= 0) {
        return res.status(400).json({
          mensaje: "El precio debe ser un número válido mayor que 0",
        });
      }
      producto.precio = parseFloat(req.body.precio);
      algunCampoModificado = true;
    }

    // Validar y modificar campos de medición según el tipo de producto
    if (esProductoPorPiezas) {
      // Producto medido por piezas - solo permitir modificar cantidad_piezas
      if (req.body.cantidad_piezas !== undefined) {
        producto.cantidad_piezas = req.body.cantidad_piezas;
        algunCampoModificado = true;
      }

      // Validar que no se intenten enviar campos de m2
      if (
        req.body.cantidad_m2 !== undefined ||
        req.body.medida_por_unidad !== undefined
      ) {
        return res.status(400).json({
          mensaje:
            "Este producto se mide por piezas. No se pueden modificar cantidad_m2 o medida_por_unidad",
        });
      }
    } else if (esProductoPorM2) {
      // Producto medido por m2 - permitir modificar cantidad_m2 y medida_por_unidad
      let cantidad_m2_nueva = producto.cantidad_m2;
      let medida_por_unidad_nueva = producto.medida_por_unidad;

      if (req.body.cantidad_m2 !== undefined) {
        cantidad_m2_nueva = req.body.cantidad_m2;
        algunCampoModificado = true;
      }

      if (req.body.medida_por_unidad !== undefined) {
        if (req.body.medida_por_unidad <= 0) {
          return res.status(400).json({
            mensaje: "medida_por_unidad debe ser mayor que 0",
          });
        }
        medida_por_unidad_nueva = req.body.medida_por_unidad;
        algunCampoModificado = true;
      }

      // Validar que no se intente enviar cantidad_piezas directamente
      if (req.body.cantidad_piezas !== undefined) {
        return res.status(400).json({
          mensaje:
            "Este producto se mide por m2. No se puede modificar cantidad_piezas directamente (se calcula automáticamente)",
        });
      }

      // Actualizar valores y recalcular piezas
      producto.cantidad_m2 = cantidad_m2_nueva;
      producto.medida_por_unidad = medida_por_unidad_nueva;
      producto.cantidad_piezas = cantidad_m2_nueva / medida_por_unidad_nueva;
    } else {
      return res.status(400).json({
        mensaje:
          "El producto tiene un estado de medición inconsistente. Contacte al administrador",
      });
    }

    if (!algunCampoModificado) {
      return res.status(400).json({
        mensaje: "Debes enviar al menos un campo a modificar",
      });
    }

    await producto.save();
    res.json({ mensaje: "Producto modificado con éxito", producto });
  } catch (error) {
    res
      .status(500)
      .json({ mensaje: "Error al modificar producto", error: error.message });
  }
}

// Eliminar producto (soft delete, solo admin)
async function eliminarProducto(req, res) {
  try {
    if (!req.usuario || req.usuario.rol !== "admin") {
      return res
        .status(403)
        .json({ mensaje: "No tienes permisos para eliminar productos" });
    }
    const { id } = req.params;
    const producto = await Producto.findByPk(id);
    if (!producto) {
      return res.status(404).json({ mensaje: "Producto no encontrado" });
    }
    // Eliminar producto físicamente
    await producto.destroy();
    res.json({
      mensaje: "Producto eliminado con éxito",
    });
  } catch (error) {
    res
      .status(500)
      .json({ mensaje: "Error al eliminar producto", error: error.message });
  }
}

// Reactivar producto (solo admin)
async function reactivarProducto(req, res) {
  try {
    if (!req.usuario || req.usuario.rol !== "admin") {
      return res
        .status(403)
        .json({ mensaje: "No tienes permisos para reactivar productos" });
    }
    const { id } = req.params;
    const producto = await Producto.findByPk(id);
    if (!producto) {
      return res.status(404).json({ mensaje: "Producto no encontrado" });
    }
    // No se puede reactivar un producto eliminado físicamente
    res.status(400).json({
      mensaje: "No se puede reactivar un producto eliminado físicamente",
    });
  } catch (error) {
    res
      .status(500)
      .json({ mensaje: "Error al reactivar producto", error: error.message });
  }
}

// Obtener producto por ID (autenticado)
async function buscarProducto(req, res) {
  try {
    const { id } = req.params;
    const producto = await Producto.findByPk(id);
    if (!producto) {
      return res.status(404).json({ mensaje: "Producto no encontrado" });
    }
    res.json({ producto });
  } catch (error) {
    res
      .status(500)
      .json({ mensaje: "Error al buscar producto", error: error.message });
  }
}

// Listar todos los productos (autenticado)
async function listarProductos(req, res) {
  try {
    const productos = await Producto.findAll();
    res.json({ productos });
  } catch (error) {
    res
      .status(500)
      .json({ mensaje: "Error al listar productos", error: error.message });
  }
}

module.exports = {
  crearProducto,
  modificarProducto,
  eliminarProducto,
  reactivarProducto,
  buscarProducto,
  listarProductos,
};
