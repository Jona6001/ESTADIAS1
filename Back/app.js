const express = require('express');
const { connectDB, sequelize } = require('./src/db/database');
const Usuario = require('./src/models/Usermodel');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Conexión a la base de datos
async function initializeApp() {
  try {
    await connectDB();
    
    // Sincronizar modelos con la base de datos
    await sequelize.sync({ force: false });
    console.log('Tablas sincronizadas correctamente');
    
    // Iniciar el servidor
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error('Error al inicializar la aplicación:', error);
  }
}

initializeApp();

