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
    tipoMaterial: {
      type: DataTypes.STRING(50),
      allowNull: false,
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
      allowNull: true,
      defaultValue: null, // permite null cuando no aplica, permite valores negativos
    },
    medida_por_unidad: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: null, // permite null cuando no aplica, permite valores negativos
    },
    cantidad_m2: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: null, // permite null cuando no aplica, permite valores negativos
    },
    precio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
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
        // Calcula la cantidad en m2 automáticamente solo si ambos valores están presentes y son números válidos
        const piezasValidas =
          producto.cantidad_piezas !== null &&
          producto.cantidad_piezas !== undefined &&
          !isNaN(producto.cantidad_piezas);

        const medidaValida =
          producto.medida_por_unidad !== null &&
          producto.medida_por_unidad !== undefined &&
          !isNaN(producto.medida_por_unidad);

        if (piezasValidas && medidaValida) {
          // Permite el cálculo incluso con valores negativos
          producto.cantidad_m2 =
            producto.cantidad_piezas * producto.medida_por_unidad;
        } else {
          // Si falta algún valor o no es válido, no calcular automáticamente
          // Mantener el valor actual de cantidad_m2 o dejarlo como null si no se especifica
          if (producto.cantidad_m2 === undefined) {
            producto.cantidad_m2 = null;
          }
        }
      },
    },
  }
);

// ...existing code...

module.exports = Producto;
