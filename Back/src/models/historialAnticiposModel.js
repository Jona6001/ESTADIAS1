const { DataTypes } = require("sequelize");
const { sequelize } = require("../db/database");
const Cotizacion = require("./cotizacionesmodel");
const Usuario = require("./Usermodel");

const HistorialAnticipos = sequelize.define(
  "HistorialAnticipos",
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
        model: Cotizacion,
        key: "ID",
      },
      comment: "ID de la cotización a la que pertenece el anticipo",
    },
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Usuario,
        key: "ID",
      },
      comment: "ID del usuario que registró el anticipo",
    },
    monto: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: "Monto del anticipo",
    },
    fecha: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: "Fecha y hora en que se realizó el anticipo",
    },
    tipo: {
      type: DataTypes.ENUM("nuevo", "modificacion"),
      allowNull: false,
      defaultValue: "nuevo",
      comment: "Indica si es un nuevo anticipo o una modificación",
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Observaciones o notas sobre el anticipo",
    },
  },
  {
    tableName: "historial_anticipos",
    timestamps: true,
  }
);

// Relaciones
HistorialAnticipos.belongsTo(Cotizacion, { foreignKey: "cotizacionId" });
HistorialAnticipos.belongsTo(Usuario, { foreignKey: "usuarioId" });

module.exports = HistorialAnticipos;
