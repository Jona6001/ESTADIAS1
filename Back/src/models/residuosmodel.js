const { DataTypes } = require("sequelize");
const { sequelize } = require("../db/database");
const Producto = require("./prodcutosModel");
const Usuario = require("./Usermodel");

const Residuo = sequelize.define(
  "Residuo",
  {
    ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    cotizacionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Cotizaciones",
        key: "ID",
      },
      comment: "ID de la cotización/venta que generó el residuo",
    },
    productoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Producto,
        key: "ID",
      },
      comment: "Tipo de material del residuo",
    },
    piezas_usadas: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      comment: "Cantidad de piezas completas que se usaron",
    },
    m2_necesarios: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      comment: "Metros cuadrados que se necesitaban",
    },
    m2_usados: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      comment:
        "Metros cuadrados reales que se usaron (piezas_usadas * medida_por_unidad)",
    },
    m2_residuo: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      comment: "Metros cuadrados que sobraron (m2_usados - m2_necesarios)",
    },
    porcentaje_residuo: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      comment: "Porcentaje de residuo respecto a una pieza completa",
    },
    medida_por_unidad: {
      type: DataTypes.FLOAT,
      allowNull: false,
      comment:
        "Medida por unidad del producto al momento de la venta (para histórico)",
    },
    estado: {
      type: DataTypes.ENUM("disponible", "usado", "descartado"),
      allowNull: false,
      defaultValue: "disponible",
      comment:
        "Estado del residuo: disponible para usar, ya usado, o descartado",
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Notas adicionales sobre el residuo",
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    ID_usuario_registro: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Usuario,
        key: "ID",
      },
      comment: "Usuario que registró el residuo",
    },
  },
  {
    tableName: "Residuos",
    timestamps: false,
    indexes: [
      {
        name: "idx_cotizacion",
        fields: ["cotizacionId"],
      },
      {
        name: "idx_producto",
        fields: ["productoId"],
      },
      {
        name: "idx_estado",
        fields: ["estado"],
      },
    ],
  }
);

module.exports = Residuo;
