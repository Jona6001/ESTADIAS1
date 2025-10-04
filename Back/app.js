const express = require("express");
const { connectDB, sequelize } = require("./src/db/database");
// Importar todos los modelos y relaciones desde index.js
const models = require("./src/models");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Endpoint de login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email y contraseña requeridos" });
  }
  try {
    // Verificar conexión a la base de datos antes de buscar usuario
    await sequelize.authenticate();
    // Si la conexión es exitosa, continuar
    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario) {
      return res.status(401).json({ message: "Usuario no encontrado" });
    }
    // Comparación simple, para producción usar bcrypt
    if (usuario.password !== password) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }
    // No enviar password al frontend
    const { password: _, ...userData } = usuario.toJSON();
    res.json({
      message: "Login exitoso. Conexión a la base de datos exitosa.",
      user: userData,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error en el servidor o en la conexión a la base de datos",
      error: error.message,
    });
  }
});

// ...existing code...

// Conexión a la base de datos
async function initializeApp() {
  try {
    await connectDB();
    // Sincronizar modelos con la base de datos
    await sequelize.sync({ force: true });
    console.log("Tablas sincronizadas correctamente");
    // Iniciar el servidor
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error("Error al inicializar la aplicación:", error);
  }
}

initializeApp();

const {
  inicializarPrimerUsuario,
} = require("./src/controllers/usercontrolleres");

// Inicializar el primer usuario al arrancar el servidor
inicializarPrimerUsuario();

// Rutas
// ... Define tus rutas aquí ...
