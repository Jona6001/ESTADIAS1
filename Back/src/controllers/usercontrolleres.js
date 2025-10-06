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
};
