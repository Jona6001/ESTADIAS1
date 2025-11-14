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
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
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
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
      comment: "Subtotal sin IVA de todos los productos",
    },
    incluir_iva: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "Indica si la cotización incluye IVA",
    },
    iva: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
      comment: "Monto del IVA calculado (16% en México)",
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
      comment: "Total final (subtotal + IVA si aplica)",
    },
    anticipo: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
      comment: "Anticipo o saldo pagado por el cliente",
    },
    status: {
      type: DataTypes.ENUM(
        "pendiente",
        "pagado",
        "cancelado",
        "en_proceso",
        "terminado",
        "entregado_pagopendiente"
      ),
      allowNull: false,
      defaultValue: "pendiente",
      comment:
        "Estado de la cotización. Los estados base son: pendiente, pagado, cancelado. Los demás son opcionales para uso manual.",
    },
    fecha_ultimo_anticipo: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Fecha en que se registró el último anticipo",
    },
  },
  {
    tableName: "Cotizaciones",
    timestamps: false,
  }
);

module.exports = Cotizacion;
