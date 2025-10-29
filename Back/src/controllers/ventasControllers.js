const Cotizacion = require("../models/cotizacionesmodel");
const VentasProductos = require("../models/ventasmodel");
const Producto = require("../models/prodcutosModel");
const Cliente = require("../models/Clientesmodel");
const Usuario = require("../models/Usermodel");
const Residuo = require("../models/residuosmodel");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

// Crear una nueva orden (cotización con productos)
const crearOrden = async (req, res) => {
  try {
    const { ID_usuario, ID_cliente, productos, anticipo } = req.body;

    // Validar que vengan los datos necesarios
    if (!ID_usuario || !ID_cliente || !productos || productos.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Faltan datos obligatorios: ID_usuario, ID_cliente y productos",
      });
    }

    // Verificar que el usuario exista
    const usuarioExiste = await Usuario.findByPk(ID_usuario);
    if (!usuarioExiste) {
      return res.status(404).json({
        success: false,
        message: `No se encontró el usuario con ID: ${ID_usuario}`,
      });
    }

    // Verificar que el cliente exista
    const clienteExiste = await Cliente.findByPk(ID_cliente);
    if (!clienteExiste) {
      return res.status(404).json({
        success: false,
        message: `No se encontró el cliente con ID: ${ID_cliente}`,
      });
    }

    // Crear la cotización (sin total aún, se calculará después)
    const nuevaCotizacion = await Cotizacion.create({
      ID_usuario,
      ID_cliente,
      fecha_creacion: new Date(),
      total: 0.0,
      anticipo: anticipo || 0.0,
      status: "pendiente",
    });

    // Validar y crear los productos de la venta
    const productosCreados = [];
    let totalCotizacion = 0;

    for (const producto of productos) {
      const {
        productoId,
        tipoFigura,
        base,
        altura,
        radio,
        base2,
        altura2,
        soclo_base,
        soclo_altura,
        cubierta_base,
        cubierta_altura,
        descripcion,
      } = producto;

      // Validar que el producto exista
      const productoExiste = await Producto.findByPk(productoId);
      if (!productoExiste) {
        return res.status(404).json({
          success: false,
          message: `No se encontró el producto con ID: ${productoId}`,
        });
      }

      // Validar que venga el tipo de figura
      if (!tipoFigura) {
        return res.status(400).json({
          success: false,
          message: "Cada producto debe tener un tipoFigura especificado",
        });
      }

      // Calcular el total de m2
      let total_m2 = 0;

      // Área de la figura principal
      if (tipoFigura === "circulo") {
        if (!radio) {
          return res.status(400).json({
            success: false,
            message: `El producto con ID ${productoId} requiere 'radio' para el tipo círculo`,
          });
        }
        total_m2 += Math.PI * Math.pow(radio, 2);
      } else if (tipoFigura === "ovalo") {
        if (!base || !altura) {
          return res.status(400).json({
            success: false,
            message: `El producto con ID ${productoId} requiere 'base' y 'altura' para el tipo óvalo`,
          });
        }
        total_m2 += Math.PI * (base / 2) * (altura / 2);
      } else if (tipoFigura === "L" || tipoFigura === "L invertida") {
        // Para L o L invertida necesitamos dos rectángulos
        if (!base || !altura) {
          return res.status(400).json({
            success: false,
            message: `El producto con ID ${productoId} requiere 'base' y 'altura' para el primer rectángulo de la L`,
          });
        }
        if (!base2 || !altura2) {
          return res.status(400).json({
            success: false,
            message: `El producto con ID ${productoId} requiere 'base2' y 'altura2' para el segundo rectángulo de la L`,
          });
        }
        // Área de la L = área del rectángulo 1 + área del rectángulo 2
        total_m2 += base * altura + base2 * altura2;
      } else {
        // Para cuadrado y rectangulo
        if (!base || !altura) {
          return res.status(400).json({
            success: false,
            message: `El producto con ID ${productoId} requiere 'base' y 'altura'`,
          });
        }
        total_m2 += base * altura;
      }

      // Área del soclo (parte pequeña que cae debajo, cubre la esquina)
      if (soclo_base && soclo_altura) {
        total_m2 += soclo_base * soclo_altura;
      }

      // Área de la cubierta (parte que sube, ejemplo: salpicadero de cocina)
      if (cubierta_base && cubierta_altura) {
        total_m2 += cubierta_base * cubierta_altura;
      }

      // Calcular el subtotal de este producto basándose en los m2 y el precio del producto
      // Asumiendo que el producto tiene la cantidad_m2 que representa el precio por m2
      const subtotalProducto = total_m2 * productoExiste.cantidad_m2;
      totalCotizacion += subtotalProducto;

      // Crear el registro en ventas_productos
      const ventaProducto = await VentasProductos.create({
        cotizacionId: nuevaCotizacion.ID,
        productoId,
        tipoFigura,
        base: base || null,
        altura: altura || null,
        radio: radio || null,
        base2: base2 || null,
        altura2: altura2 || null,
        soclo_base: soclo_base || null,
        soclo_altura: soclo_altura || null,
        cubierta_base: cubierta_base || null,
        cubierta_altura: cubierta_altura || null,
        total_m2: parseFloat(total_m2.toFixed(4)),
        descripcion: descripcion || null,
      });

      productosCreados.push(ventaProducto);
    }

    // Actualizar el total de la cotización
    nuevaCotizacion.total = parseFloat(totalCotizacion.toFixed(2));
    await nuevaCotizacion.save();

    // Obtener la cotización completa con los productos
    const ordenCompleta = await Cotizacion.findByPk(nuevaCotizacion.ID, {
      include: [
        {
          model: Usuario,
          attributes: ["ID", "nombre", "correo"],
        },
        {
          model: Cliente,
          attributes: ["ID", "nombre", "telefono", "rfc", "direccion"],
        },
      ],
    });

    return res.status(201).json({
      success: true,
      message: "Orden creada exitosamente",
      data: {
        cotizacion: ordenCompleta,
        productos: productosCreados,
      },
    });
  } catch (error) {
    console.error("Error al crear la orden:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor al crear la orden",
      error: error.message,
    });
  }
};

// Obtener todas las órdenes (cotizaciones)
const obtenerOrdenes = async (req, res) => {
  try {
    const ordenes = await Cotizacion.findAll({
      include: [
        {
          model: Usuario,
          attributes: ["ID", "nombre", "correo"],
        },
        {
          model: Cliente,
          attributes: ["ID", "nombre", "telefono", "rfc"],
        },
      ],
      order: [["fecha_creacion", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: ordenes,
    });
  } catch (error) {
    console.error("Error al obtener órdenes:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Obtener una orden por ID con sus productos
const obtenerOrdenPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const orden = await Cotizacion.findByPk(id, {
      include: [
        {
          model: Usuario,
          attributes: ["ID", "nombre", "correo"],
        },
        {
          model: Cliente,
          attributes: ["ID", "nombre", "telefono", "rfc", "direccion"],
        },
      ],
    });

    if (!orden) {
      return res.status(404).json({
        success: false,
        message: `No se encontró la orden con ID: ${id}`,
      });
    }

    // Obtener los productos de esta cotización
    const productos = await VentasProductos.findAll({
      where: { cotizacionId: id },
      include: [
        {
          model: Producto,
          attributes: ["ID", "nombre", "descripcion"],
        },
      ],
    });

    return res.status(200).json({
      success: true,
      data: {
        cotizacion: orden,
        productos: productos,
      },
    });
  } catch (error) {
    console.error("Error al obtener la orden:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Actualizar el status de una orden
const actualizarStatusOrden = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validar que el status sea válido
    if (!["pendiente", "pagado", "cancelado"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status inválido. Debe ser: pendiente, pagado o cancelado",
      });
    }

    const orden = await Cotizacion.findByPk(id);

    if (!orden) {
      return res.status(404).json({
        success: false,
        message: `No se encontró la orden con ID: ${id}`,
      });
    }

    orden.status = status;
    await orden.save();

    return res.status(200).json({
      success: true,
      message: "Status actualizado exitosamente",
      data: orden,
    });
  } catch (error) {
    console.error("Error al actualizar el status:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Actualizar el anticipo de una orden
const actualizarAnticipo = async (req, res) => {
  try {
    const { id } = req.params;
    const { anticipo } = req.body;

    // Validar que el anticipo sea un número válido
    if (anticipo === undefined || anticipo === null || isNaN(anticipo)) {
      return res.status(400).json({
        success: false,
        message: "El campo 'anticipo' debe ser un número válido",
      });
    }

    // Validar que el anticipo no sea negativo
    if (anticipo < 0) {
      return res.status(400).json({
        success: false,
        message: "El anticipo no puede ser negativo",
      });
    }

    const orden = await Cotizacion.findByPk(id);

    if (!orden) {
      return res.status(404).json({
        success: false,
        message: `No se encontró la orden con ID: ${id}`,
      });
    }

    // Validar que el anticipo no sea mayor al total
    if (parseFloat(anticipo) > parseFloat(orden.total)) {
      return res.status(400).json({
        success: false,
        message: `El anticipo ($${anticipo}) no puede ser mayor al total de la orden ($${orden.total})`,
      });
    }

    orden.anticipo = parseFloat(anticipo).toFixed(2);

    // Si el anticipo es igual al total, marcar como pagado
    if (parseFloat(orden.anticipo) >= parseFloat(orden.total)) {
      orden.status = "pagado";
    }

    await orden.save();

    return res.status(200).json({
      success: true,
      message: "Anticipo actualizado exitosamente",
      data: {
        orden,
        saldo_pendiente: (
          parseFloat(orden.total) - parseFloat(orden.anticipo)
        ).toFixed(2),
      },
    });
  } catch (error) {
    console.error("Error al actualizar el anticipo:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Calcular inventario necesario y residuos (PASO 1)
const calcularInventarioNecesario = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener la orden con sus productos
    const orden = await Cotizacion.findByPk(id);
    if (!orden) {
      return res.status(404).json({
        success: false,
        message: "Orden no encontrada",
      });
    }

    // Verificar que tenga al menos 50% de anticipo
    const porcentajeAnticipo =
      (parseFloat(orden.anticipo) / parseFloat(orden.total)) * 100;
    if (porcentajeAnticipo < 50) {
      return res.status(400).json({
        success: false,
        message: `Se requiere al menos 50% de anticipo para procesar inventario. Anticipo actual: ${porcentajeAnticipo.toFixed(
          2
        )}%`,
        porcentaje_actual: porcentajeAnticipo.toFixed(2),
      });
    }

    // Obtener productos de la orden
    const productosOrden = await VentasProductos.findAll({
      where: { cotizacionId: id },
    });

    if (productosOrden.length === 0) {
      return res.status(400).json({
        success: false,
        message: "La orden no tiene productos asociados",
      });
    }

    const analisisInventario = [];

    for (const item of productosOrden) {
      const producto = await Producto.findByPk(item.productoId);

      if (!producto) {
        return res.status(404).json({
          success: false,
          message: `No se encontró el producto con ID: ${item.productoId}`,
        });
      }

      // Calcular cuántas piezas se necesitan
      const m2Necesarios = item.total_m2;
      const m2PorPieza = producto.medida_por_unidad;

      if (m2PorPieza <= 0) {
        return res.status(400).json({
          success: false,
          message: `El producto "${producto.nombre}" tiene una medida por unidad inválida (${m2PorPieza})`,
        });
      }

      const piezasNecesariasExactas = m2Necesarios / m2PorPieza;
      const piezasNecesarias = Math.ceil(piezasNecesariasExactas);

      // Calcular residuo
      const m2Usados = piezasNecesarias * m2PorPieza;
      const residuo = m2Usados - m2Necesarios;
      const porcentajeResiduoPieza = (residuo / m2PorPieza) * 100;

      // Determinar si es un residuo pequeño (menos del 15% de una pieza)
      const esResiduoPequeno = porcentajeResiduoPieza < 15;

      analisisInventario.push({
        productoId: producto.ID,
        nombreProducto: producto.nombre,
        m2_necesarios: parseFloat(m2Necesarios.toFixed(4)),
        m2_por_pieza: m2PorPieza,
        piezas_disponibles: producto.cantidad_piezas,
        piezas_necesarias_exactas: parseFloat(
          piezasNecesariasExactas.toFixed(2)
        ),
        piezas_necesarias: piezasNecesarias,
        piezas_sobrantes_inventario: parseFloat(
          (producto.cantidad_piezas - piezasNecesarias).toFixed(2)
        ),
        m2_usados: parseFloat(m2Usados.toFixed(4)),
        residuo_m2: parseFloat(residuo.toFixed(4)),
        porcentaje_residuo: parseFloat(porcentajeResiduoPieza.toFixed(2)),
        es_residuo_pequeno: esResiduoPequeno,
        tiene_suficiente_inventario:
          producto.cantidad_piezas >= piezasNecesarias,
        sugerencia: esResiduoPequeno
          ? "Se recomienda descartar el residuo por ser muy pequeño"
          : "Se recomienda guardar el residuo para futuros proyectos",
      });
    }

    // Verificar si hay inventario insuficiente
    const inventarioInsuficiente = analisisInventario.filter(
      (item) => !item.tiene_suficiente_inventario
    );

    return res.status(200).json({
      success: true,
      message: "Análisis de inventario calculado exitosamente",
      data: {
        ordenId: orden.ID,
        cliente: orden.ID_cliente,
        anticipo: parseFloat(orden.anticipo),
        total: parseFloat(orden.total),
        porcentaje_anticipo: parseFloat(porcentajeAnticipo.toFixed(2)),
        puede_confirmar:
          porcentajeAnticipo >= 50 && inventarioInsuficiente.length === 0,
        productos: analisisInventario,
        errores_inventario:
          inventarioInsuficiente.length > 0
            ? inventarioInsuficiente.map(
                (p) =>
                  `${p.nombreProducto}: necesita ${p.piezas_necesarias}, disponible ${p.piezas_disponibles}`
              )
            : [],
      },
    });
  } catch (error) {
    console.error("Error al calcular inventario:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor al calcular inventario",
      error: error.message,
    });
  }
};

// Confirmar y descontar inventario con registro de residuos (PASO 2)
const confirmarInventario = async (req, res) => {
  try {
    const { id } = req.params;
    const { productos_confirmados, ID_usuario } = req.body;
    // productos_confirmados: [{ productoId: 1, guardar_residuo: true, observaciones: "..." }, ...]

    if (!ID_usuario) {
      return res.status(400).json({
        success: false,
        message: "Se requiere ID_usuario para registrar la operación",
      });
    }

    if (!productos_confirmados || productos_confirmados.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Se requiere el array 'productos_confirmados' con las decisiones sobre residuos",
      });
    }

    const orden = await Cotizacion.findByPk(id);
    if (!orden) {
      return res.status(404).json({
        success: false,
        message: "Orden no encontrada",
      });
    }

    // Verificar anticipo ≥ 50%
    const porcentajeAnticipo =
      (parseFloat(orden.anticipo) / parseFloat(orden.total)) * 100;
    if (porcentajeAnticipo < 50) {
      return res.status(400).json({
        success: false,
        message:
          "Se requiere al menos 50% de anticipo para confirmar inventario",
        porcentaje_actual: porcentajeAnticipo.toFixed(2),
      });
    }

    const productosOrden = await VentasProductos.findAll({
      where: { cotizacionId: id },
    });

    if (productosOrden.length === 0) {
      return res.status(400).json({
        success: false,
        message: "La orden no tiene productos asociados",
      });
    }

    const resultados = [];
    const residuosCreados = [];

    for (const item of productosOrden) {
      const producto = await Producto.findByPk(item.productoId);

      if (!producto) {
        return res.status(404).json({
          success: false,
          message: `No se encontró el producto con ID: ${item.productoId}`,
        });
      }

      const confirmacion = productos_confirmados.find(
        (p) => p.productoId === item.productoId
      );

      if (!confirmacion) {
        return res.status(400).json({
          success: false,
          message: `Falta la confirmación para el producto: ${producto.nombre}`,
        });
      }

      const m2Necesarios = item.total_m2;
      const m2PorPieza = producto.medida_por_unidad;
      const piezasNecesariasExactas = m2Necesarios / m2PorPieza;
      const piezasNecesarias = Math.ceil(piezasNecesariasExactas);

      // Verificar inventario suficiente
      if (producto.cantidad_piezas < piezasNecesarias) {
        return res.status(400).json({
          success: false,
          message: `Inventario insuficiente para ${producto.nombre}. Disponible: ${producto.cantidad_piezas}, Necesario: ${piezasNecesarias}`,
        });
      }

      // Calcular residuo
      const m2Usados = piezasNecesarias * m2PorPieza;
      const residuoM2 = m2Usados - m2Necesarios;
      const porcentajeResiduo = (residuoM2 / m2PorPieza) * 100;

      // Descontar del inventario
      producto.cantidad_piezas -= piezasNecesarias;
      await producto.save();

      // Registrar el residuo en la tabla de Residuos
      if (confirmacion.guardar_residuo && residuoM2 > 0) {
        const nuevoResiduo = await Residuo.create({
          cotizacionId: id,
          productoId: item.productoId,
          piezas_usadas: piezasNecesarias,
          m2_necesarios: m2Necesarios,
          m2_usados: m2Usados,
          m2_residuo: residuoM2,
          porcentaje_residuo: porcentajeResiduo,
          medida_por_unidad: m2PorPieza,
          estado: "disponible",
          observaciones: confirmacion.observaciones || null,
          fecha_creacion: new Date(),
          ID_usuario_registro: ID_usuario,
        });

        residuosCreados.push({
          residuoId: nuevoResiduo.ID,
          producto: producto.nombre,
          m2_residuo: parseFloat(residuoM2.toFixed(4)),
          porcentaje: parseFloat(porcentajeResiduo.toFixed(2)),
          estado: "disponible",
        });
      }

      resultados.push({
        producto: producto.nombre,
        productoId: producto.ID,
        piezas_necesarias: piezasNecesarias,
        piezas_usadas_exactas: parseFloat(piezasNecesariasExactas.toFixed(2)),
        piezas_descontadas: piezasNecesarias,
        piezas_restantes: parseFloat(producto.cantidad_piezas.toFixed(2)),
        m2_necesarios: parseFloat(m2Necesarios.toFixed(4)),
        m2_usados: parseFloat(m2Usados.toFixed(4)),
        residuo_m2: parseFloat(residuoM2.toFixed(4)),
        residuo_guardado: confirmacion.guardar_residuo && residuoM2 > 0,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Inventario confirmado y descontado exitosamente",
      data: {
        ordenId: id,
        productos_procesados: resultados,
        residuos_registrados: residuosCreados,
        total_residuos_guardados: residuosCreados.length,
      },
    });
  } catch (error) {
    console.error("Error al confirmar inventario:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor al confirmar inventario",
      error: error.message,
    });
  }
};

// Listar residuos disponibles
const listarResiduosDisponibles = async (req, res) => {
  try {
    const { productoId, estado } = req.query;

    const whereClause = {};
    if (productoId) whereClause.productoId = productoId;
    if (estado) whereClause.estado = estado;
    else whereClause.estado = "disponible"; // Por defecto mostrar solo disponibles

    const residuos = await Residuo.findAll({
      where: whereClause,
      include: [
        {
          model: Producto,
          attributes: ["ID", "nombre", "descripcion"],
        },
        {
          model: Cotizacion,
          attributes: ["ID", "fecha_creacion"],
        },
      ],
      order: [["fecha_creacion", "DESC"]],
    });

    // Agrupar por producto
    const residuosPorProducto = {};
    let totalM2Disponibles = 0;

    residuos.forEach((residuo) => {
      const productoNombre = residuo.Producto.nombre;

      if (!residuosPorProducto[productoNombre]) {
        residuosPorProducto[productoNombre] = {
          productoId: residuo.productoId,
          producto: productoNombre,
          total_m2: 0,
          cantidad_residuos: 0,
          residuos: [],
        };
      }

      residuosPorProducto[productoNombre].total_m2 += residuo.m2_residuo;
      residuosPorProducto[productoNombre].cantidad_residuos += 1;
      residuosPorProducto[productoNombre].residuos.push({
        id: residuo.ID,
        m2: parseFloat(residuo.m2_residuo.toFixed(4)),
        porcentaje: parseFloat(residuo.porcentaje_residuo.toFixed(2)),
        fecha: residuo.fecha_creacion,
        cotizacion: residuo.cotizacionId,
        observaciones: residuo.observaciones,
      });

      totalM2Disponibles += residuo.m2_residuo;
    });

    return res.status(200).json({
      success: true,
      data: {
        total_residuos: residuos.length,
        total_m2_disponibles: parseFloat(totalM2Disponibles.toFixed(4)),
        por_producto: Object.values(residuosPorProducto),
        todos_los_residuos: residuos.map((r) => ({
          id: r.ID,
          producto: r.Producto.nombre,
          m2_residuo: parseFloat(r.m2_residuo.toFixed(4)),
          porcentaje: parseFloat(r.porcentaje_residuo.toFixed(2)),
          estado: r.estado,
          fecha: r.fecha_creacion,
          cotizacion: r.cotizacionId,
          observaciones: r.observaciones,
        })),
      },
    });
  } catch (error) {
    console.error("Error al listar residuos:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Generar factura en PDF
const generarFacturaPDF = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener la orden completa con todas las relaciones
    const orden = await Cotizacion.findByPk(id, {
      include: [
        {
          model: Usuario,
          attributes: ["ID", "nombre", "correo", "telefono"],
        },
        {
          model: Cliente,
          attributes: ["ID", "nombre", "telefono", "rfc", "direccion"],
        },
      ],
    });

    if (!orden) {
      return res.status(404).json({
        success: false,
        message: "Orden no encontrada",
      });
    }

    // Obtener los productos de la orden
    const productosOrden = await VentasProductos.findAll({
      where: { cotizacionId: id },
      include: [
        {
          model: Producto,
          attributes: ["ID", "nombre", "descripcion", "cantidad_m2"],
        },
      ],
    });

    if (productosOrden.length === 0) {
      return res.status(400).json({
        success: false,
        message: "La orden no tiene productos asociados",
      });
    }

    // Crear directorio de facturas si no existe
    const facturasDir = path.join(__dirname, "../../facturas");
    if (!fs.existsSync(facturasDir)) {
      fs.mkdirSync(facturasDir, { recursive: true });
    }

    // Nombre del archivo
    const nombreArchivo = `factura_${id}_${Date.now()}.pdf`;
    const rutaArchivo = path.join(facturasDir, nombreArchivo);

    // Crear el documento PDF
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(rutaArchivo);
    doc.pipe(stream);

    // --- ENCABEZADO ---
    doc.fontSize(20).text("FACTURA / COTIZACIÓN", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`No. Orden: ${orden.ID}`, { align: "center" });
    doc.text(
      `Fecha: ${new Date(orden.fecha_creacion).toLocaleDateString("es-MX")}`,
      {
        align: "center",
      }
    );
    doc.moveDown(1);

    // Línea separadora
    doc
      .strokeColor("#aaaaaa")
      .lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .stroke();
    doc.moveDown(1);

    // --- INFORMACIÓN DEL CLIENTE ---
    doc
      .fontSize(14)
      .fillColor("#000000")
      .text("DATOS DEL CLIENTE", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text(`Nombre: ${orden.Cliente.nombre}`);
    doc.text(`Teléfono: ${orden.Cliente.telefono || "N/A"}`);
    doc.text(`RFC: ${orden.Cliente.rfc || "N/A"}`);
    doc.text(`Dirección: ${orden.Cliente.direccion || "N/A"}`);
    doc.moveDown(1);

    // --- INFORMACIÓN DEL VENDEDOR ---
    doc.fontSize(14).text("VENDEDOR", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text(`Nombre: ${orden.Usuario.nombre}`);
    doc.text(`Teléfono: ${orden.Usuario.telefono || "N/A"}`);
    doc.text(`Correo: ${orden.Usuario.correo}`);
    doc.moveDown(1.5);

    // Línea separadora
    doc
      .strokeColor("#aaaaaa")
      .lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .stroke();
    doc.moveDown(1);

    // --- DETALLES DE LOS PRODUCTOS ---
    doc
      .fontSize(14)
      .fillColor("#000000")
      .text("DETALLES DEL PEDIDO", { underline: true });
    doc.moveDown(1);

    // Encabezados de tabla
    const tableTop = doc.y;
    const col1 = 50; // Producto
    const col2 = 200; // Figura
    const col3 = 300; // Medidas
    const col4 = 430; // m²
    const col5 = 490; // Precio

    doc.fontSize(9).fillColor("#444444");
    doc.text("Producto", col1, tableTop, { width: 140 });
    doc.text("Figura", col2, tableTop, { width: 90 });
    doc.text("Medidas", col3, tableTop, { width: 120 });
    doc.text("m²", col4, tableTop, { width: 50, align: "right" });
    doc.text("Precio", col5, tableTop, { width: 60, align: "right" });

    // Línea debajo del encabezado
    doc
      .strokeColor("#aaaaaa")
      .lineWidth(1)
      .moveTo(50, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .stroke();

    let yPosition = tableTop + 25;
    let totalM2 = 0;
    let subtotal = 0;

    // Iterar sobre los productos
    for (const item of productosOrden) {
      const producto = item.Producto;
      const precioPorM2 = producto.cantidad_m2 || 0;
      const precioItem = item.total_m2 * precioPorM2;
      totalM2 += item.total_m2;
      subtotal += precioItem;

      // Construir texto de medidas
      let medidas = "";
      if (item.tipoFigura === "circulo") {
        medidas = `Radio: ${item.radio}m`;
      } else if (item.tipoFigura === "ovalo") {
        medidas = `${item.base}m × ${item.altura}m`;
      } else if (item.tipoFigura === "L" || item.tipoFigura === "L invertida") {
        medidas = `B1:${item.base}×${item.altura}m, B2:${item.base2}×${item.altura2}m`;
      } else {
        medidas = `${item.base}m × ${item.altura}m`;
      }

      // Agregar medidas adicionales
      if (item.soclo_base && item.soclo_altura) {
        medidas += `, Soclo:${item.soclo_base}×${item.soclo_altura}m`;
      }
      if (item.cubierta_base && item.cubierta_altura) {
        medidas += `, Cub:${item.cubierta_base}×${item.cubierta_altura}m`;
      }

      doc.fontSize(9).fillColor("#000000");
      doc.text(producto.nombre, col1, yPosition, { width: 140 });
      doc.text(item.tipoFigura, col2, yPosition, { width: 90 });
      doc.text(medidas, col3, yPosition, { width: 120 });
      doc.text(item.total_m2.toFixed(2), col4, yPosition, {
        width: 50,
        align: "right",
      });
      doc.text(`$${precioItem.toFixed(2)}`, col5, yPosition, {
        width: 60,
        align: "right",
      });

      // Descripción adicional si existe
      if (item.descripcion) {
        yPosition += 15;
        doc.fontSize(8).fillColor("#666666");
        doc.text(`  ${item.descripcion}`, col1, yPosition, { width: 500 });
      }

      yPosition += 25;

      // Nueva página si es necesario
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }
    }

    // Línea antes del total
    doc
      .strokeColor("#aaaaaa")
      .lineWidth(1)
      .moveTo(50, yPosition)
      .lineTo(550, yPosition)
      .stroke();
    yPosition += 15;

    // --- TOTALES ---
    doc.fontSize(10).fillColor("#000000");
    doc.text(`Total m²:`, 380, yPosition, { width: 100 });
    doc.text(totalM2.toFixed(2), 480, yPosition, { width: 70, align: "right" });
    yPosition += 20;

    doc.fontSize(12).font("Helvetica-Bold");
    doc.text(`TOTAL:`, 380, yPosition, { width: 100 });
    doc.text(`$${parseFloat(orden.total).toFixed(2)}`, 480, yPosition, {
      width: 70,
      align: "right",
    });
    yPosition += 20;

    doc.fontSize(11).fillColor("#006600");
    doc.text(`Anticipo:`, 380, yPosition, { width: 100 });
    doc.text(`$${parseFloat(orden.anticipo).toFixed(2)}`, 480, yPosition, {
      width: 70,
      align: "right",
    });
    yPosition += 20;

    const saldoPendiente = parseFloat(orden.total) - parseFloat(orden.anticipo);
    doc.fontSize(11).fillColor("#CC0000");
    doc.text(`Saldo Pendiente:`, 380, yPosition, { width: 100 });
    doc.text(`$${saldoPendiente.toFixed(2)}`, 480, yPosition, {
      width: 70,
      align: "right",
    });
    yPosition += 30;

    // --- PIE DE PÁGINA ---
    doc.fontSize(10).fillColor("#666666").font("Helvetica");
    doc.text(`Estado: ${orden.status.toUpperCase()}`, 50, yPosition);
    yPosition += 30;

    // Línea final
    doc
      .strokeColor("#aaaaaa")
      .lineWidth(1)
      .moveTo(50, yPosition)
      .lineTo(550, yPosition)
      .stroke();
    yPosition += 15;

    doc.fontSize(8).fillColor("#888888");
    doc.text("Gracias por su preferencia", { align: "center" });

    // Finalizar el PDF
    doc.end();

    // Esperar a que termine de escribirse
    stream.on("finish", () => {
      // Enviar el archivo como descarga
      res.download(rutaArchivo, nombreArchivo, (err) => {
        if (err) {
          console.error("Error al enviar el archivo:", err);
          return res.status(500).json({
            success: false,
            message: "Error al descargar la factura",
          });
        }
        // Opcionalmente, eliminar el archivo después de enviarlo
        // fs.unlinkSync(rutaArchivo);
      });
    });

    stream.on("error", (error) => {
      console.error("Error al crear el PDF:", error);
      return res.status(500).json({
        success: false,
        message: "Error al generar la factura",
        error: error.message,
      });
    });
  } catch (error) {
    console.error("Error al generar factura:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor al generar factura",
      error: error.message,
    });
  }
};

module.exports = {
  crearOrden,
  obtenerOrdenes,
  obtenerOrdenPorId,
  actualizarStatusOrden,
  actualizarAnticipo,
  calcularInventarioNecesario,
  confirmarInventario,
  listarResiduosDisponibles,
  generarFacturaPDF,
};
