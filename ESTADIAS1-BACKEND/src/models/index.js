// Importar modelos rediseñados
const Usuario = require("./Usermodel");
const Cliente = require("./Clientesmodel");
const Producto = require("./prodcutosModel");
const Cotizacion = require("./cotizacionesmodel");
const VentasProductos = require("./ventasmodel");
const Residuo = require("./residuosmodel");

// Relación Cliente -> Usuario (quién lo creó)
Cliente.belongsTo(Usuario, { foreignKey: "ID_usuario_creador", as: "creador" });

// Relación Producto -> Usuario (quién lo creó)
Producto.belongsTo(Usuario, {
  foreignKey: "ID_usuario_creador",
  as: "creador",
});

// Relación Cotizacion -> Usuario y Cliente
Cotizacion.belongsTo(Usuario, { foreignKey: "ID_usuario" });
Cotizacion.belongsTo(Cliente, { foreignKey: "ID_cliente" });

// Relación VentasProductos -> Cotizacion y Producto
VentasProductos.belongsTo(Cotizacion, { foreignKey: "cotizacionId" });
VentasProductos.belongsTo(Producto, { foreignKey: "productoId" });

// Relación Residuo -> Cotizacion, Producto y Usuario
Residuo.belongsTo(Cotizacion, { foreignKey: "cotizacionId" });
Residuo.belongsTo(Producto, { foreignKey: "productoId" });
Residuo.belongsTo(Usuario, {
  foreignKey: "ID_usuario_registro",
  as: "usuario_registro",
});

// Relaciones inversas para consultas
Cotizacion.hasMany(Residuo, { foreignKey: "cotizacionId", as: "residuos" });
Producto.hasMany(Residuo, { foreignKey: "productoId", as: "residuos" });

module.exports = {
  Usuario,
  Cliente,
  Producto,
  Cotizacion,
  VentasProductos,
  Residuo,
};
