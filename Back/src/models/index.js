// Importar modelos rediseñados
const Usuario = require("./Usermodel");
const Cliente = require("./Clientesmodel");
const Producto = require("./prodcutosModel");
const Cotizacion = require("./cotizacionesmodel");
const VentasProductos = require("./ventasmodel");

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

module.exports = {
  Usuario,
  Cliente,
  Producto,
  Cotizacion,
  VentasProductos,
};
