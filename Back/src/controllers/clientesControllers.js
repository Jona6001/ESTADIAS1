// Modificar cliente (solo admin)
async function modificarCliente(req, res) {
  try {
    if (!req.usuario || req.usuario.rol !== "admin") {
      return res
        .status(403)
        .json({ mensaje: "No tienes permisos para modificar clientes" });
    }
    const { id } = req.params;
    const cliente = await Cliente.findByPk(id);
    if (!cliente) {
      return res.status(404).json({ mensaje: "Cliente no encontrado" });
    }
    const camposModificables = [
      "nombre",
      "telefono",
      "rfc",
      "direccion",
      "status",
    ];
    let algunCampoModificado = false;
    for (const campo of camposModificables) {
      if (req.body[campo] !== undefined) {
        cliente[campo] = req.body[campo];
        algunCampoModificado = true;
      }
    }
    if (!algunCampoModificado) {
      return res
        .status(400)
        .json({ mensaje: "Debes enviar al menos un campo a modificar" });
    }
    await cliente.save();
    res.json({ mensaje: "Cliente modificado con éxito", cliente });
  } catch (error) {
    res
      .status(500)
      .json({ mensaje: "Error al modificar cliente", error: error.message });
  }
}

// Eliminar cliente (solo admin, status=false)
async function eliminarCliente(req, res) {
  try {
    if (!req.usuario || req.usuario.rol !== "admin") {
      return res
        .status(403)
        .json({ mensaje: "No tienes permisos para eliminar clientes" });
    }
    const { id } = req.params;
    const cliente = await Cliente.findByPk(id);
    if (!cliente) {
      return res.status(404).json({ mensaje: "Cliente no encontrado" });
    }
    cliente.status = false;
    await cliente.save();
    res.json({ mensaje: "Cliente eliminado (desactivado) con éxito", cliente });
  } catch (error) {
    res
      .status(500)
      .json({ mensaje: "Error al eliminar cliente", error: error.message });
  }
}

// Reactivar cliente (solo admin)
async function reactivarCliente(req, res) {
  try {
    if (!req.usuario || req.usuario.rol !== "admin") {
      return res
        .status(403)
        .json({ mensaje: "No tienes permisos para reactivar clientes" });
    }
    const { id } = req.params;
    const cliente = await Cliente.findByPk(id);
    if (!cliente) {
      return res.status(404).json({ mensaje: "Cliente no encontrado" });
    }
    cliente.status = true;
    await cliente.save();
    res.json({ mensaje: "Cliente reactivado con éxito", cliente });
  } catch (error) {
    res
      .status(500)
      .json({ mensaje: "Error al reactivar cliente", error: error.message });
  }
}

// Buscar cliente por ID (autenticado)
async function buscarCliente(req, res) {
  try {
    const { id } = req.params;
    const cliente = await Cliente.findByPk(id);
    if (!cliente) {
      return res.status(404).json({ mensaje: "Cliente no encontrado" });
    }
    res.json({ cliente });
  } catch (error) {
    res
      .status(500)
      .json({ mensaje: "Error al buscar cliente", error: error.message });
  }
}

// Buscar todos los clientes (autenticado)
async function listarClientes(req, res) {
  try {
    const clientes = await Cliente.findAll();
    res.json({ clientes });
  } catch (error) {
    res
      .status(500)
      .json({ mensaje: "Error al listar clientes", error: error.message });
  }
}
const Cliente = require("../models/Clientesmodel");
async function crearCliente(req, res) {
  try {
    if (!req.usuario || req.usuario.rol !== "admin") {
      return res
        .status(403)
        .json({ mensaje: "No tienes permisos para realizar la acción" });
    }

    const { nombre, telefono, rfc, direccion } = req.body;

    if (!nombre || !telefono || !direccion) {
      return res.status(400).json({
        mensaje: "Los campos nombre, telefono y direccion son requeridos",
      });
    }

    const validadCliente = await Cliente.findOne({ where: { telefono } });
    if (validadCliente) {
      return res
        .status(400)
        .json({ mensaje: `Cliente con el telefono ya registrado ${telefono}` });
    }

    const nuevoCliente = await Cliente.create({
      nombre,
      telefono,
      rfc: rfc || null,
      direccion,
      ID_usuario_creador: req.usuario.ID,
    });

    res.status(201).json({
      mensaje: "Cliente creado con éxito",
      cliente: nuevoCliente,
    });
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al crear cliente",
      error: error.message,
    });
  }
}
module.exports = {
  crearCliente,
  modificarCliente,
  eliminarCliente,
  reactivarCliente,
  buscarCliente,
  listarClientes,
};
