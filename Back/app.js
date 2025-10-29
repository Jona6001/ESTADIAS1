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

// Rutas
const authRoutes = require("./src/routes/authRoutes");
const clientRoutes = require("./src/routes/clientesRoutes");
const productRoutes = require("./src/routes/productRoutes");
const ventasRoutes = require("./src/routes/ventasRoutes");
app.use(authRoutes);
app.use(clientRoutes);
app.use(productRoutes);
app.use(ventasRoutes);
// ...existing code...

// ...existing code...

// Conexión a la base de datosEjemplo de organización recomendada

async function initializeApp() {
  try {
    await connectDB();
    // Sincronizar modelos con la base de datos
    await sequelize.sync({ force: false });
    console.log("Tablas sincronizadas correctamente");
    // Iniciar el servidor
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en el puerto ${PORT}`);
    });
    // Inicializar el primer usuario al arrancar el servidor
    const {
      inicializarPrimerUsuario,
    } = require("./src/controllers/usercontrolleres");
    await inicializarPrimerUsuario();
  } catch (error) {
    console.error("Error al inicializar la aplicación:", error);
  }
}

initializeApp();

// Rutas
// ... Define tus rutas aquí ...
