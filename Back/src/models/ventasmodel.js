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
    base: { type: DataTypes.FLOAT, allowNull: false }, // base de la figura principal
    altura: { type: DataTypes.FLOAT, allowNull: false }, // altura de la figura principal
    radio: { type: DataTypes.FLOAT, allowNull: false }, // para circulos/ovalos
    soclo_base: { type: DataTypes.FLOAT, allowNull: false }, // base del soclo
    soclo_altura: { type: DataTypes.FLOAT, allowNull: false }, // altura del soclo
    solapa_base: { type: DataTypes.FLOAT, allowNull: false }, // base de la solapa
    solapa_altura: { type: DataTypes.FLOAT, allowNull: false }, // altura de la solapa
    caida_base: { type: DataTypes.FLOAT, allowNull: false }, // base de la caída
    caida_altura: { type: DataTypes.FLOAT, allowNull: false }, // altura de la caída
    total_m2: { type: DataTypes.FLOAT, allowNull: false }, // total calculado: (base*altura) + (soclo_base*soclo_altura) + (solapa_base*solapa_altura) + (caida_base*caida_altura)
    descripcion: { type: DataTypes.STRING, allowNull: true },
  },
  {
    tableName: "ventas_productos",
    timestamps: true,
  }
);

module.exports = VentasProductos;
