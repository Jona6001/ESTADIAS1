// models/Cliente.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../db/database");
const Usuario = require("./Usermodel");

const Cliente = sequelize.define(
  "Cliente",
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
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    rfc: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    direccion: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true, // true = activo, false = soft delete
    },
    ID_usuario_creador: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Usuario,
        key: "ID",
      },
    },
  },
  {
    tableName: "Clientes",
    timestamps: false,
  }
);

// ...existing code...

module.exports = Cliente;
