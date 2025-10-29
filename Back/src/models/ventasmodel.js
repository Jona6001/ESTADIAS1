const { DataTypes } = require("sequelize");
const { sequelize } = require("../db/database");

const VentasProductos = sequelize.define(
  "VentasProductos",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    cotizacionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "Cotizaciones", key: "ID" },
    },
    productoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "Productos", key: "ID" },
    },
    tipoFigura: {
      type: DataTypes.ENUM(
        "circulo",
        "ovalo",
        "cuadrado",
        "rectangulo",
        "L",
        "L invertida"
      ),
      allowNull: false,
    },
    base: { type: DataTypes.FLOAT, allowNull: true }, // base de la figura principal
    altura: { type: DataTypes.FLOAT, allowNull: true }, // altura de la figura principal
    radio: { type: DataTypes.FLOAT, allowNull: true }, // para circulos/ovalos
    // Para figuras tipo L: se divide en dos rectángulos
    base2: { type: DataTypes.FLOAT, allowNull: true }, // base del segundo rectángulo (para L)
    altura2: { type: DataTypes.FLOAT, allowNull: true }, // altura del segundo rectángulo (para L)
    soclo_base: { type: DataTypes.FLOAT, allowNull: true }, // base del soclo
    soclo_altura: { type: DataTypes.FLOAT, allowNull: true }, // altura del soclo
    cubierta_base: { type: DataTypes.FLOAT, allowNull: true }, // base de la caída
    cubierta_altura: { type: DataTypes.FLOAT, allowNull: true }, // altura de la caída
    total_m2: { type: DataTypes.FLOAT, allowNull: true }, // total calculado: (base*altura) + (soclo_base*soclo_altura) + (solapa_base*solapa_altura) + (caida_base*caida_altura)
    descripcion: { type: DataTypes.STRING, allowNull: true },
  },
  {
    tableName: "ventas_productos",
    timestamps: true,
  }
);

module.exports = VentasProductos;
