// models/Producto.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../db/database");
const Usuario = require("./Usermodel");

const Producto = sequelize.define(
  "Producto",
  {
    ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    imagen: {
      type: DataTypes.STRING(255), // ruta de la imagen
      allowNull: true,
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    cantidad_piezas: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0, // puede ser negativo
    },
    medida_por_unidad: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    cantidad_m2: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    ID_usuario_creador: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Usuario,
        key: "ID",
      },
    },
    // status eliminado
  },
  {
    tableName: "Productos",
    timestamps: false,
    hooks: {
      beforeSave: (producto) => {
        // Calcula la cantidad en m2 automáticamente
        producto.cantidad_m2 =
          producto.cantidad_piezas * producto.medida_por_unidad;
      },
    },
  }
);

// ...existing code...

module.exports = Producto;
