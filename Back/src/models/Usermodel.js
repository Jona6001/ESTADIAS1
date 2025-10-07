// models/Usuario.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/database');


const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  rol: {
    type: DataTypes.ENUM('admin', 'empleado'), // solo puede ser uno de estos dos
    allowNull: false,
    defaultValue: 'empleado', // por defecto empleado
  },
  status: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true, // soft delete
  },
  creadoPorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'usuarios',
  timestamps: true, // createdAt y updatedAt
});

module.exports = Usuario;
