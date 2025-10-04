const { DataTypes } = require("sequelize");
const { sequelize } = require("../db/database");
const Usuario = require("./Usermodel");
const Cliente = require("./Clientesmodel");
const Producto = require("./prodcutosModel");

const Cotizacion = sequelize.define(
  "Cotizacion",
  {
    ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    ID_usuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Usuario,
        key: "ID",
      },
    },
    ID_cliente: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Cliente,
        key: "ID",
      },
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    status: {
      type: DataTypes.ENUM("pendiente", "pagado", "cancelado"),
      allowNull: false,
      defaultValue: "pendiente",
    },
  },
  {
    tableName: "Cotizaciones",
    timestamps: false,
  }
);

module.exports = Cotizacion;
