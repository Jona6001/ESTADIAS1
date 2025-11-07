const { DataTypes } = require("sequelize");
const { sequelize } = require("../db/database");

const VentasProductos = sequelize.define(
  "VentasProductos",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    cotizacionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "Cotizaciones", key: "ID" },
    },
    productoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "Productos", key: "ID" },
    },
    // Cantidad solicitada (piezas o m2 según el tipo_medida)
    cantidad: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 1,
      comment: "Cantidad solicitada en la unidad especificada en tipo_medida",
    },
    // Tipo de medida para esta venta: "piezas" o "m2"
    tipo_medida: {
      type: DataTypes.ENUM("piezas", "m2"),
      allowNull: false,
      comment: "Indica si la cantidad se refiere a piezas o metros cuadrados",
    },
    // Campos calculados automáticamente
    cantidad_piezas_calculada: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: "Cantidad equivalente en piezas (calculada automáticamente)",
    },
    cantidad_m2_calculada: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: "Cantidad equivalente en m² (calculada automáticamente)",
    },
    precio_unitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: "Precio por unidad al momento de la venta",
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: "Subtotal calculado para este producto",
    },
    // Campo opcional para descripción o notas adicionales
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment:
        "Descripción adicional o notas sobre el producto en esta cotización",
    },
  },
  {
    tableName: "ventas_productos",
    timestamps: true,
    hooks: {
      beforeSave: async (ventaProducto) => {
        // Obtener el producto para saber sus medidas
        const { sequelize } = require("../db/database");
        const producto = await sequelize.models.Producto.findByPk(
          ventaProducto.productoId
        );

        if (!producto) {
          throw new Error(
            `Producto con ID ${ventaProducto.productoId} no encontrado`
          );
        }

        // Determinar el tipo de medida del producto
        const esProductoPorPiezas =
          producto.cantidad_piezas !== null && producto.cantidad_m2 === null;
        const esProductoPorM2 =
          producto.cantidad_m2 !== null && producto.medida_por_unidad !== null;

        if (!esProductoPorPiezas && !esProductoPorM2) {
          throw new Error(
            `El producto ${producto.nombre} tiene configuración de medidas inconsistente`
          );
        }

        // Calcular equivalencias según el tipo de medida del producto y la venta
        if (esProductoPorPiezas) {
          // Producto se maneja por piezas
          if (ventaProducto.tipo_medida === "piezas") {
            ventaProducto.cantidad_piezas_calculada = ventaProducto.cantidad;
            ventaProducto.cantidad_m2_calculada = null;
            // Para productos por piezas, no hay precio por m², usar precio base si existe
            ventaProducto.precio_unitario = 0; // Se puede ajustar según el modelo de negocio
            ventaProducto.subtotal = 0;
          } else {
            throw new Error(
              `El producto ${producto.nombre} solo se puede vender por piezas`
            );
          }
        } else if (esProductoPorM2) {
          // Producto se maneja por m²
          if (ventaProducto.tipo_medida === "m2") {
            ventaProducto.cantidad_m2_calculada = ventaProducto.cantidad;
            ventaProducto.cantidad_piezas_calculada =
              ventaProducto.cantidad / producto.medida_por_unidad;
            // Usar cantidad_m2 del producto como precio por m²
            ventaProducto.precio_unitario = parseFloat(
              producto.cantidad_m2 || 0
            );
            ventaProducto.subtotal =
              ventaProducto.cantidad_m2_calculada *
              ventaProducto.precio_unitario;
          } else {
            throw new Error(
              `El producto ${producto.nombre} solo se puede vender por m²`
            );
          }
        }
      },
    },
  }
);

module.exports = VentasProductos;
