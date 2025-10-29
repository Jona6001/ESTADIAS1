// Obtener todos los usuarios (autenticado)
async function listarUsuarios(req, res) {
  try {
    const usuarios = await Usuario.findAll();
    res.json({ usuarios });
  } catch (error) {
    res
      .status(500)
      .json({ mensaje: "Error al listar usuarios", error: error.message });
  }
}

// Obtener usuario por ID (autenticado)
async function buscarUsuario(req, res) {
  try {
    const { id } = req.params;
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }
    res.json({ usuario });
  } catch (error) {
    res
      .status(500)
      .json({ mensaje: "Error al buscar usuario", error: error.message });
  }
}
// Controlador para reactivar usuario (solo admin)
async function reactivarUsuario(req, res) {
  try {
    const { id } = req.params;
    if (!req.usuario || req.usuario.rol !== "admin") {
      return res
        .status(403)
        .json({ mensaje: "Solo el administrador puede reactivar usuarios" });
    }
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }
    usuario.status = true;
    await usuario.save();
    res.json({ mensaje: "Usuario reactivado con éxito", usuario });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al reactivar el usuario", error });
  }
}
// Controlador para eliminar usuario (solo admin)
async function eliminarUsuario(req, res) {
  try {
    const { id } = req.params;
    if (!req.usuario || req.usuario.rol !== "admin") {
      return res
        .status(403)
        .json({ mensaje: "Solo el administrador puede eliminar usuarios" });
    }
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }
    usuario.status = false;
    await usuario.save();
    res.json({ mensaje: "Usuario desactivado con éxito", usuario });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al eliminar el usuario", error });
  }
}
// Controlador para modificar usuario por ID (solo admin o el propio usuario)
async function modificarUsuario(req, res) {
  try {
    const { id } = req.params;
    // Verificar permisos: admin o el mismo usuario
    if (!req.usuario || (req.usuario.rol !== "admin" && req.usuario.id != id)) {
      return res
        .status(403)
        .json({ mensaje: "No tienes permisos para modificar este usuario" });
    }
    // Buscar usuario
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }
    // Solo modificar los campos enviados
    const camposModificables = [
      "nombre",
      "correo",
      "contrasena",
      "rol",
      "telefono",
      "status",
    ];
    for (const campo of camposModificables) {
      if (req.body[campo] !== undefined) {
        if (campo === "contrasena") {
          usuario[campo] = await bcrypt.hash(req.body[campo], 10);
        } else {
          usuario[campo] = req.body[campo];
        }
      }
    }
    await usuario.save();
    res.json({ mensaje: "Usuario modificado con éxito", usuario });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al modificar el usuario", error });
  }
}
const { verificarRol, validarToken } = require("../config/auth");
// Controlador para crear un usuario (solo admin)
async function crearUsuario(req, res) {
  try {
    // Verificar si el usuario autenticado es admin
    if (!req.usuario || req.usuario.rol !== "admin") {
      return res
        .status(403)
        .json({ mensaje: "No tienes permisos para crear usuarios" });
    }
    const { nombre, correo, contrasena, rol, telefono } = req.body;
    if (!nombre || !correo || !contrasena || !rol) {
      return res
        .status(400)
        .json({ mensaje: "Todos los campos son requeridos" });
    }
    // Verificar si ya existe el usuario
    const usuarioExistente = await Usuario.findOne({ where: { correo } });
    if (usuarioExistente) {
      return res.status(400).json({ mensaje: "El correo ya está registrado" });
    }
    const hashedPassword = await bcrypt.hash(contrasena, 10);
    const nuevoUsuario = await Usuario.create({
      nombre,
      correo,
      contrasena: hashedPassword,
      rol,
      telefono,
      ID_creador: req.usuario.id,
    });
    res.status(201).json({
      mensaje: "Usuario creado con éxito",
      usuario: nuevoUsuario,
    });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al crear el usuario", error });
  }
}
const { generarToken } = require("../config/auth");
// Controlador para login
async function login(req, res) {
  const { correo, contrasena } = req.body;
  if (!correo || !contrasena) {
    return res.status(400).json({ message: "Correo y contraseña requeridos" });
  }
  try {
    const usuario = await Usuario.findOne({ where: { correo } });
    if (!usuario) {
      return res.status(401).json({ message: "Usuario no encontrado" });
    }
    if (usuario.status === false) {
      return res.status(403).json({ message: "Cuenta desactivada" });
    }
    const passwordValida = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!passwordValida) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }
    const { contrasena: _, ...userData } = usuario.toJSON();
    // Generar token JWT
    const token = generarToken(usuario);
    res.json({
      message: "Login exitoso.",
      user: userData,
      token,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error en el servidor",
      error: error.message,
    });
  }
}
const Usuario = require("../models/Usermodel");
const bcrypt = require("bcrypt");

// Controlador para crear un primer usuario
async function crearPrimerUsuario(req, res) {
  try {
    // Verificar si ya existe un usuario en la base de datos
    const usuarioExistente = await Usuario.findOne();
    if (usuarioExistente) {
      return res
        .status(400)
        .json({ mensaje: "Ya existe un usuario en la base de datos" });
    }

    // Crear el primer usuario con contraseña hasheada
    const { nombre, correo, contrasena, rol } = req.body;
    const hashedPassword = await bcrypt.hash(contrasena, 10);
    const nuevoUsuario = await Usuario.create({
      nombre,
      correo,
      contrasena: hashedPassword,
      rol,
    });

    res.status(201).json({
      mensaje: "Primer usuario creado con éxito",
      usuario: nuevoUsuario,
    });
  } catch (error) {
    res
      .status(500)
      .json({ mensaje: "Error al crear el primer usuario", error });
  }
}

// Función para inicializar el primer usuario al iniciar el servidor
async function inicializarPrimerUsuario() {
  try {
    // Verificar si ya existe un usuario en la base de datos
    const usuarioExistente = await Usuario.findOne();
    if (usuarioExistente) {
      console.log(
        "Ya existe un usuario en la base de datos. No se creará un usuario inicial."
      );
      return;
    }

    // Crear el primer usuario con contraseña hasheada
    const hashedPassword = await bcrypt.hash("admin123", 10); // Cambiar por una contraseña segura
    const nuevoUsuario = await Usuario.create({
      nombre: "Administrador",
      correo: "admin@example.com",
      contrasena: hashedPassword,
      rol: "admin",
    });

    console.log("Primer usuario creado con éxito:", nuevoUsuario);
  } catch (error) {
    console.error("Error al crear el primer usuario:", error);
  }
}

module.exports = {
  crearPrimerUsuario,
  inicializarPrimerUsuario,
  login,
  crearUsuario,
  modificarUsuario,
  eliminarUsuario,
  reactivarUsuario,
  listarUsuarios,
  buscarUsuario,
};
