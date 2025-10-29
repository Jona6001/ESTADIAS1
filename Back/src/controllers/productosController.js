const Producto = require("../models/prodcutosModel");

// Crear producto (solo admin)
async function crearProducto(req, res) {
  try {
    if (!req.usuario || req.usuario.rol !== "admin") {
      return res
        .status(403)
        .json({ mensaje: "No tienes permisos para crear productos" });
    }
    const { nombre, descripcion, imagen, cantidad_piezas, medida_por_unidad } =
      req.body;
    if (
      !nombre ||
      cantidad_piezas === undefined ||
      medida_por_unidad === undefined
    ) {
      return res
        .status(400)
        .json({
          mensaje:
            "Los campos nombre, cantidad_piezas y medida_por_unidad son requeridos",
        });
    }
    const nuevoProducto = await Producto.create({
      nombre,
      descripcion: descripcion || null,
      imagen: imagen || null,
      cantidad_piezas,
      medida_por_unidad,
      ID_usuario_creador: req.usuario.ID
    });
    res
      .status(201)
      .json({ mensaje: "Producto creado con éxito", producto: nuevoProducto });
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
    const camposModificables = [
      "nombre",
      "descripcion",
      "imagen",
      "cantidad_piezas",
      "medida_por_unidad"
    ];
    let algunCampoModificado = false;
    for (const campo of camposModificables) {
      if (req.body[campo] !== undefined) {
        producto[campo] = req.body[campo];
        algunCampoModificado = true;
      }
    }
    if (!algunCampoModificado) {
      return res
        .status(400)
        .json({ mensaje: "Debes enviar al menos un campo a modificar" });
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
      mensaje: "Producto eliminado con éxito"
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
  res.status(400).json({ mensaje: "No se puede reactivar un producto eliminado físicamente" });
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
