// models/Cliente.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/database');
const Usuario = require('./Usermodel');

const Cliente = sequelize.define('Cliente', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  apellidos: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  empresa: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  rfc: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  regimenFiscal: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  direccion: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  domicilioFiscal: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  cp: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  pais: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  estado: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  municipio: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ciudad: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  telefono: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true, // soft delete
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false, // el usuario que creó el cliente
  },
}, {
  tableName: 'clientes',
  timestamps: true, // createdAt y updatedAt
});

// Relación con Usuario
Cliente.belongsTo(Usuario, { foreignKey: 'usuarioId' });

module.exports = Cliente;
