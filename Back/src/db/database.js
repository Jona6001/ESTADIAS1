const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  "railway",
  "root",
  "cOUmZJyFqXooeTiXkTUHCoHCpypMFzLu",
  {
    host: "turntable.proxy.rlwy.net",
    port: 46223,
    dialect: "mysql",
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexión a la base de datos en Railway exitosa.");
  } catch (error) {
    console.error("❌ No se pudo conectar a la base de datos:", error);
  }
};

module.exports = { sequelize, connectDB };
