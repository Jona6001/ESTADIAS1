import React, { useState, useRef, useEffect } from "react";
import "../App.css";
import { useNavigate, useLocation } from "react-router-dom";
import { FaUser, FaMoneyCheckAlt, FaEdit, FaTrash, FaPlus, FaSave, FaTimes, FaEye } from "react-icons/fa";

// Endpoints
const API_COTIZACIONES = "http://localhost:3000/api/ordenes";
const API_CLIENTES = "http://localhost:3000/clientes";
const API_PRODUCTOS = "http://localhost:3000/productos";

const initialCotizacion = {
  ID_cliente: "",
  productos: [], // [{ productoId, cantidad, tipoFigura, ... }]
  anticipo: 0,
  status: "pendiente",
};

const Sells = () => {
  // Navbar / estado global de pantalla
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const menuRef = useRef();
  const navigate = useNavigate();
  const location = useLocation();

  // Datos
  const [cotizaciones, setCotizaciones] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);

  // UI/Modal
  const [modalOpen, setModalOpen] = useState(null); // null | 'add' | 'edit' | 'confirmVenta'
  const [ventaResumen, setVentaResumen] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsData, setDetailsData] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  // Filtro de cotizaciones
  const [cotFilterText, setCotFilterText] = useState("");
  const [cotFilterField, setCotFilterField] = useState("cliente");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [cotOrder, setCotOrder] = useState("recientes"); // 'recientes' | 'antiguos'

  // Formulario cotización
  const [form, setForm] = useState(initialCotizacion);
  // Eliminado buscador de cliente en modal para ahorrar espacio
  // opcional: búsqueda de productos (no usada actualmente)

  // Fecha y hora
   useEffect(() => {
     const updateTime = () => {
       const now = new Date();
       const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
       setDateStr(now.toLocaleDateString("es-MX", options));
       setTimeStr(now.toLocaleTimeString("es-MX", { hour12: false }));
     };
     updateTime();
     const interval = setInterval(updateTime, 1000);
     return () => clearInterval(interval);
   }, []);

  // Autenticación básica: nombre del usuario
  useEffect(() => {
    const userRaw = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!token || !userRaw) {
      navigate("/");
      return;
    }
    try {
      const u = JSON.parse(userRaw);
      if (u && (u.nombre || u.name)) setUserName(u.nombre || u.name);
    } catch {
      /* ignore parse error */
    }
  }, [navigate]);

  // Cargar todo
  const fetchAll = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const token = localStorage.getItem("token");
      const authHeaders = token
        ? { Authorization: `Bearer ${token}`, Accept: "application/json" }
        : { Accept: "application/json" };

      const [resClientes, resProductos, resCots] = await Promise.all([
        fetch(API_CLIENTES, { headers: authHeaders }),
        fetch(API_PRODUCTOS, { headers: authHeaders }),
        fetch(API_COTIZACIONES, { headers: authHeaders }),
      ]);

      const parseSafe = async (res) => {
        const text = await res.text();
        try { return JSON.parse(text); } catch { return text; }
      };

      const cData = await parseSafe(resClientes);
      const pData = await parseSafe(resProductos);
      const oData = await parseSafe(resCots);

      const clientesArr = Array.isArray(cData)
        ? cData
        : cData?.clientes || cData?.data || [];
      const productosArr = Array.isArray(pData)
        ? pData
        : pData?.productos || pData?.data || [];
      const cotArr = Array.isArray(oData?.data)
        ? oData.data
        : (Array.isArray(oData) ? oData : []);

      setClientes(Array.isArray(clientesArr) ? clientesArr : []);
      setProductos(Array.isArray(productosArr) ? productosArr : []);
      setCotizaciones(Array.isArray(cotArr) ? cotArr : []);
    } catch (err) {
      console.error("fetchAll error:", err);
      setErrorMsg("No se pudieron cargar clientes/productos/cotizaciones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // Cerrar menú usuario al hacer click fuera
  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // Modal handlers
  const openAddModal = () => {
    setForm({ ...initialCotizacion });
    setModalOpen("add");
    setErrorMsg("");
  };

  const openConfirmVenta = (cot) => {
    setVentaResumen(cot);
    setModalOpen("confirmVenta");
  };

  const openDetails = async (cot) => {
    const token = localStorage.getItem("token");
    setDetailsOpen(true);
    setDetailsLoading(true);
    setDetailsData(null);
    try {
      const res = await fetch(`${API_COTIZACIONES}/${cot.ID || cot.id}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const txt = await res.text();
      let data; try { data = JSON.parse(txt); } catch { data = { success: false, message: txt }; }
      if (!res.ok || data?.success === false) throw new Error(data?.message || "No se pudo cargar detalles");
      setDetailsData(data.data || data);
    } catch (err) {
      setErrorMsg(err.message || "No se pudo cargar detalles");
    } finally {
      setDetailsLoading(false);
    }
  };

  const [editTarget, setEditTarget] = useState(null);

  const openEditModal = async (cot) => {
    // Abrir modal con datos base
    setEditTarget(cot);
    setModalOpen("edit");
    setErrorMsg("");

    // Precargar valores básicos
    setForm((prev) => ({
      ...prev,
      ID_cliente: cot.ID_cliente,
      productos: [], // se cargarán abajo desde el detalle
      anticipo: cot.anticipo || 0,
      status: cot.status || "pendiente",
    }));

    // Cargar productos reales de la cotización para permitir edición completa
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_COTIZACIONES}/${cot.ID || cot.id}` , {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const txt = await res.text();
      let data; try { data = JSON.parse(txt); } catch { data = { success: false, message: txt }; }
      if (!res.ok || data?.success === false) throw new Error(data?.message || "No se pudo cargar productos de la cotización");
      const payload = data.data || data;
      const productosDetalle = Array.isArray(payload?.productos) ? payload.productos : [];

      // Mapear al formato del formulario de edición/creación
      const mapped = productosDetalle.map((p) => ({
        productoId: p.productoId || p.Producto?.ID || p.ID_producto || "",
        cantidad: p.cantidad || 1,
        tipoFigura: p.tipoFigura || p.tipo_figura || "rectangulo",
        base: p.base ?? null,
        altura: p.altura ?? null,
        radio: p.radio ?? null,
        base2: p.base2 ?? null,
        altura2: p.altura2 ?? null,
        soclo_base: p.soclo_base ?? null,
        soclo_altura: p.soclo_altura ?? null,
        cubierta_base: p.cubierta_base ?? null,
        cubierta_altura: p.cubierta_altura ?? null,
        descripcion: p.descripcion ?? "",
      }));

      setForm((prev) => ({ ...prev, productos: mapped }));
    } catch (e) {
      console.error("No se pudieron cargar productos para editar:", e);
      // se deja el formulario con productos vacíos, usuario puede agregar si lo desea
    }
  };

  const closeModal = () => {
    setModalOpen(null);
    setForm(initialCotizacion);
    setErrorMsg("");
  };

  // Form handlers
  // Lista de clientes (sin buscador en modal de add/edit para mantener compacto)
  const filteredClientes = clientes;
  // Evita warning si el modal no está montado en esta vista
  void filteredClientes;

  // Para productos, usamos la lista completa en el selector

  // Productos en cotización
  const handleAddProducto = () => {
    setForm({
      ...form,
      productos: [
        ...form.productos,
        {
          productoId: "",
          cantidad: 1,
          tipoFigura: "cuadrado",
          base: "",
          altura: "",
          radio: "",
          base2: "",
          altura2: "",
          soclo_base: "",
          soclo_altura: "",
          cubierta_base: "",
          cubierta_altura: "",
          descripcion: "",
        },
      ],
    });
  };
  void handleAddProducto;

  const handleRemoveProducto = (idx) => {
    const next = [...form.productos];
    next.splice(idx, 1);
    setForm({ ...form, productos: next });
  };
  void handleRemoveProducto;

  const handleProductoChange = (idx, field, value) => {
    const next = [...form.productos];
    // Convertir numéricos
    const numericFields = [
      "cantidad",
      "base",
      "altura",
      "radio",
      "base2",
      "altura2",
      "soclo_base",
      "soclo_altura",
      "cubierta_base",
      "cubierta_altura",
    ];
    next[idx] = {
      ...next[idx],
      [field]: numericFields.includes(field) && value !== "" ? Number(value) : value,
    };
    setForm({ ...form, productos: next });
  };
  void handleProductoChange;

  // Validación con enfoque/scroll al primer error
  const validateFormAndFocus = () => {
    // Cliente
    if (!form.ID_cliente) {
      setErrorMsg("Selecciona un cliente.");
      const el = document.getElementById("cliente-select");
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus(); }
      return false;
    }
    // Productos
    if (!form.productos || form.productos.length === 0) {
      setErrorMsg("Agrega al menos un producto.");
      return false;
    }
    for (let i = 0; i < form.productos.length; i++) {
      const p = form.productos[i];
      // productoId
      if (!p.productoId) {
        setErrorMsg(`Selecciona el producto #${i + 1}.`);
        const el = document.getElementById(`prod-${i}-productoId`);
        if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus(); }
        return false;
      }
      // cantidad
      if (!p.cantidad || Number(p.cantidad) < 1) {
        setErrorMsg(`La cantidad del producto #${i + 1} debe ser al menos 1.`);
        const el = document.getElementById(`prod-${i}-cantidad`);
        if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus(); }
        return false;
      }
      // tipoFigura
      if (!p.tipoFigura) {
        setErrorMsg(`Selecciona el tipo de figura del producto #${i + 1}.`);
        const el = document.getElementById(`prod-${i}-tipoFigura`);
        if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus(); }
        return false;
      }
      // campos según figura
      if (p.tipoFigura === 'circulo') {
        if (!p.radio || Number(p.radio) <= 0) {
          setErrorMsg(`Ingresa el radio (> 0) para el producto #${i + 1}.`);
          const el = document.getElementById(`prod-${i}-radio`);
          if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus(); }
          return false;
        }
      } else {
        if (!p.base || Number(p.base) <= 0) {
          setErrorMsg(`Ingresa la base (> 0) para el producto #${i + 1}.`);
          const el = document.getElementById(`prod-${i}-base`);
          if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus(); }
          return false;
        }
        if (!p.altura || Number(p.altura) <= 0) {
          setErrorMsg(`Ingresa la altura (> 0) para el producto #${i + 1}.`);
          const el = document.getElementById(`prod-${i}-altura`);
          if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus(); }
          return false;
        }
        if ((p.tipoFigura === 'L' || p.tipoFigura === 'L invertida')) {
          if (!p.base2 || Number(p.base2) <= 0) {
            setErrorMsg(`Ingresa la base 2 (> 0) para el producto #${i + 1}.`);
            const el = document.getElementById(`prod-${i}-base2`);
            if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus(); }
            return false;
          }
          if (!p.altura2 || Number(p.altura2) <= 0) {
            setErrorMsg(`Ingresa la altura 2 (> 0) para el producto #${i + 1}.`);
            const el = document.getElementById(`prod-${i}-altura2`);
            if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus(); }
            return false;
          }
        }
      }
    }
    return true;
  };

  // CRUD Cotizaciones
  const handleAdd = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user || !user.ID) { setErrorMsg("No se encontró el usuario autenticado. Inicia sesión."); return; }
    if (!validateFormAndFocus()) return;

    try {
      const cleanForm = {
        ID_usuario: user.ID,
        ID_cliente: form.ID_cliente,
        productos: form.productos.map((p) => ({
          productoId: p.productoId,
          cantidad: p.cantidad,
          tipoFigura: p.tipoFigura,
          base: p.base,
          altura: p.altura,
          radio: p.radio,
          base2: p.base2,
          altura2: p.altura2,
          soclo_base: p.soclo_base,
          soclo_altura: p.soclo_altura,
          cubierta_base: p.cubierta_base,
          cubierta_altura: p.cubierta_altura,
          descripcion: p.descripcion,
        })),
        anticipo: form.anticipo || 0,
        status: form.status || "pendiente",
      };

      const res = await fetch(API_COTIZACIONES, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(cleanForm),
      });

      const txt = await res.text();
      let data;
      try { data = JSON.parse(txt); } catch { data = { success: false, message: txt }; }
      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || data?.error || "Error al crear cotización");
      }

      // Intentar descontar inventario automáticamente (si cumple condiciones)
      const newId = data?.data?.cotizacion?.ID || data?.cotizacion?.ID;
      if (newId) {
        try {
          const resCalc = await fetch(`${API_COTIZACIONES}/${newId}/calcular-inventario`, { headers: { Authorization: `Bearer ${token}` } });
          const txtCalc = await resCalc.text();
          let dCalc; try { dCalc = JSON.parse(txtCalc); } catch { dCalc = { success: false, message: txtCalc }; }
          if (resCalc.ok && dCalc?.success && dCalc?.data?.puede_confirmar) {
            const productos_confirmados = (form.productos || []).map(p => ({ productoId: p.productoId, guardar_residuo: false, observaciones: null }));
            await fetch(`${API_COTIZACIONES}/${newId}/confirmar-inventario`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ productos_confirmados, ID_usuario: user.ID }),
            });
          }
  } catch { /* si falla, solo no descuenta automáticamente */ }
      }

      closeModal();
      setForm(initialCotizacion);
      await fetchAll();
    } catch (err) {
      console.error("crear cotización error:", err);
      setErrorMsg("Error al crear la cotización");
    }
  };
  void handleAdd;

  const handleEdit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (!editTarget) { setErrorMsg("No hay cotización seleccionada"); return; }
    if (!validateFormAndFocus()) return;

    const id = editTarget.ID || editTarget.id;
    const token = localStorage.getItem("token");
    const headers = { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` };

    // Preparar payload
    const payload = {
      ID_cliente: form.ID_cliente,
      productos: form.productos.map((p) => ({
        productoId: p.productoId,
        cantidad: p.cantidad,
        tipoFigura: p.tipoFigura,
        base: p.base,
        altura: p.altura,
        radio: p.radio,
        base2: p.base2,
        altura2: p.altura2,
        soclo_base: p.soclo_base,
        soclo_altura: p.soclo_altura,
        cubierta_base: p.cubierta_base,
        cubierta_altura: p.cubierta_altura,
        descripcion: p.descripcion,
      })),
      anticipo: form.anticipo,
      status: form.status,
    };

    try {
      const res = await fetch(`${API_COTIZACIONES}/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      });
      const txt = await res.text();
      let data; try { data = JSON.parse(txt); } catch { data = { success: false, message: txt }; }
      if (!res.ok || data?.success === false) throw new Error(data?.message || data?.error || "No se pudo actualizar la cotización");

      // Intentar descontar inventario automáticamente (si cumple condiciones)
      try {
        const resCalc = await fetch(`${API_COTIZACIONES}/${id}/calcular-inventario`, { headers: { Authorization: `Bearer ${token}` } });
        const txtCalc = await resCalc.text();
        let dCalc; try { dCalc = JSON.parse(txtCalc); } catch { dCalc = { success: false, message: txtCalc }; }
        if (resCalc.ok && dCalc?.success && dCalc?.data?.puede_confirmar) {
          const productos_confirmados = (form.productos || []).map(p => ({ productoId: p.productoId, guardar_residuo: false, observaciones: null }));
          await fetch(`${API_COTIZACIONES}/${id}/confirmar-inventario`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ productos_confirmados, ID_usuario: JSON.parse(localStorage.getItem("user") || "{}")?.ID }),
          });
        }
      } catch { /* si falla, no detenemos el flujo */ }

      setModalOpen(null);
      setEditTarget(null);
      setForm(initialCotizacion);
      await fetchAll();
    } catch (err) {
      setErrorMsg(err.message || "Error al editar la cotización");
    }
  };

  // Evita warning de variable sin usar si el modal de edición no se monta en ciertos estados
  void handleEdit;

  const handleConfirmVenta = async () => {
    if (!ventaResumen) return;
    setErrorMsg("");
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const id = ventaResumen.ID || ventaResumen.id;
    try {
      // 1) Obtener detalles (total, anticipo y productos)
      const resDet = await fetch(`${API_COTIZACIONES}/${id}`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
      const txtDet = await resDet.text();
      let dataDet; try { dataDet = JSON.parse(txtDet); } catch { dataDet = { success: false, message: txtDet }; }
      if (!resDet.ok || dataDet?.success === false) throw new Error(dataDet?.message || "No se pudo obtener detalles de la orden");
      const payload = dataDet.data || dataDet;
      const cot = payload.cotizacion || payload;
      const prods = Array.isArray(payload.productos) ? payload.productos : [];

      // 2) Asegurar anticipo = total (esto marca pagado en backend y supera el umbral del 50%)
      const total = Number(cot.total || 0);
      if (Number(cot.anticipo || 0) < total) {
        const resAnti = await fetch(`${API_COTIZACIONES}/${id}/anticipo`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ anticipo: total })
        });
        const txtAnti = await resAnti.text();
        let dAnti; try { dAnti = JSON.parse(txtAnti); } catch { dAnti = { success: false, message: txtAnti }; }
        if (!resAnti.ok || dAnti?.success === false) throw new Error(dAnti?.message || "No se pudo actualizar el anticipo");
      }

      // 3) Calcular inventario
      const resCalc = await fetch(`${API_COTIZACIONES}/${id}/calcular-inventario`, { headers: { Authorization: `Bearer ${token}` } });
      const txtCalc = await resCalc.text();
      let dCalc; try { dCalc = JSON.parse(txtCalc); } catch { dCalc = { success: false, message: txtCalc }; }
      if (!resCalc.ok || dCalc?.success === false) throw new Error(dCalc?.message || "No se pudo calcular inventario");
      if (!dCalc?.data?.puede_confirmar) {
        const errores = (dCalc?.data?.errores_inventario || []).join("; ");
        throw new Error(errores || "Inventario insuficiente para confirmar la venta");
      }

      // 4) Confirmar inventario (descontar piezas)
      const productos_confirmados = prods.map(p => ({
        productoId: p.productoId || p.ID_producto || p.Producto?.ID,
        guardar_residuo: false,
        observaciones: null,
      })).filter(x => x.productoId);

      const resConf = await fetch(`${API_COTIZACIONES}/${id}/confirmar-inventario`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productos_confirmados, ID_usuario: user?.ID })
      });
      const txtConf = await resConf.text();
      let dConf; try { dConf = JSON.parse(txtConf); } catch { dConf = { success: false, message: txtConf }; }
      if (!resConf.ok || dConf?.success === false) throw new Error(dConf?.message || "No se pudo confirmar inventario");

      // 5) Cerrar modal y refrescar
      setModalOpen(null);
      setVentaResumen(null);
      await fetchAll();
    } catch (e) {
      setErrorMsg(e.message || "No se puede realizar la venta");
    }
  };

  const handleGenerarPDF = async (cotId) => {
    // El backend expone factura PDF en /factura
    window.open(`${API_COTIZACIONES}/${cotId}/factura`, "_blank");
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");
    try {
      // Preferimos marcar como cancelado en lugar de borrar físicamente
      const res = await fetch(`${API_COTIZACIONES}/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "cancelado" }),
      });
      const txt = await res.text();
      let data; try { data = JSON.parse(txt); } catch { data = { message: txt }; }
      if (!res.ok || data?.success === false) throw new Error(data?.mensaje || data?.message || "No se pudo cancelar la cotización");
      await fetchAll();
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    } catch (err) {
      setErrorMsg(err.message || "No se pudo cancelar la cotización");
    }
  };

  // Navbar/Logout
  const handleLogout = () => { setMenuOpen(false); setShowLogoutConfirm(true); };
  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };
  const cancelLogout = () => setShowLogoutConfirm(false);
  const handleConfig = () => { setMenuOpen(false); navigate("/config"); };

  // Render
  return (
    <div className="home-bg">
      <nav className="main-navbar guinda-navbar">
        <div className="nav-container">
          <div className="nav-left">
            <div className="nav-logo mobile-menu-toggle" onClick={() => setMobileMenuOpen((v) => !v)}>
              <img src="https://irp.cdn-website.com/d7ba7f52/dms3rep/multi/265.png" alt="Logo" className="logo-img" />
              <div className="nav-title">VENTAS</div>
            </div>
            <header className="header">
              <h1>
                VENTAS <FaMoneyCheckAlt className="iconName" />
              </h1>
            </header>
            <div className={`mobile-menu ${mobileMenuOpen ? "open" : ""}`}>
              <button className={`nav-btn${location.pathname === "/home" ? " nav-btn-active" : ""}`} onClick={() => navigate("/home")}>
                Inicio
              </button>
              <button className={`nav-btn${location.pathname === "/inventario" ? " nav-btn-active" : ""}`} onClick={() => navigate("/inventario")}>
                Inventario
              </button>
              <button className={`nav-btn${location.pathname === "/ventas" ? " nav-btn-active" : ""}`} onClick={() => navigate("/ventas")}>
                Ventas
              </button>
              <button className={`nav-btn${location.pathname === "/clientes" ? " nav-btn-active" : ""}`} onClick={() => navigate("/clientes")}>
                Clientes
              </button>
              <button className={`nav-btn${location.pathname === "/usuarios" ? " nav-btn-active" : ""}`} onClick={() => navigate("/usuarios")}>
                Usuarios
              </button>
            </div>
          </div>
          <div className="nav-center">
            <button className={`nav-btn${location.pathname === "/home" ? " nav-btn-active" : ""}`} onClick={() => navigate("/home")}>
              Inicio
            </button>
            <button className={`nav-btn${location.pathname === "/inventario" ? " nav-btn-active" : ""}`} onClick={() => navigate("/inventario")}>
              Inventario
            </button>
            <button className={`nav-btn${location.pathname === "/ventas" ? " nav-btn-active" : ""}`} onClick={() => navigate("/ventas")}>
              Ventas
            </button>
            <button className={`nav-btn${location.pathname === "/clientes" ? " nav-btn-active" : ""}`} onClick={() => navigate("/clientes")}>
              Clientes
            </button>
            <button className={`nav-btn${location.pathname === "/usuarios" ? " nav-btn-active" : ""}`} onClick={() => navigate("/usuarios")}>
              Usuarios
            </button>
          </div>
           <div className="nav-datetime">
            <span>{dateStr}</span>
            <span>{timeStr}</span>
          </div>
          <div className="nav-user" ref={menuRef}>
            <button className="user-btn" onClick={() => setMenuOpen((v) => !v)}>
              <FaUser size={28} color="#fff" />
            </button>
            {userName && (
              <span className="user-name" style={{ color: "#fff", fontWeight: "bold", whiteSpace: "nowrap" }}>
                {userName}
              </span>
            )}
            {menuOpen && (
              <div className="user-menu">
                <button onClick={handleConfig}>Configuración</button>
                <button onClick={handleLogout}>Cerrar sesión</button>
              </div>
            )}
            {showLogoutConfirm && (
              <div className="modal-overlay" style={{ zIndex: 2000 }}>
                <div className="modal-content" style={{ maxWidth: 340, padding: "2rem 1.5rem", textAlign: "center" }}>
                  <h2 style={{ color: "#a30015", fontWeight: 800, fontSize: "1.15rem", marginBottom: 18 }}>¿Cerrar sesión?</h2>
                  <p style={{ color: "#7b1531", marginBottom: 22, fontWeight: 600 }}>¿Estás seguro de que deseas cerrar sesión?</p>
                  <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                    <button className="delete-btn" style={{ minWidth: 90 }} onClick={confirmLogout}>
                      Cerrar sesión
                    </button>
                    <button className="cancel-btn" style={{ minWidth: 90 }} onClick={cancelLogout}>
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

  <div style={{ padding: 24, paddingTop: 'calc(var(--navbar-offset) + 2px)', maxWidth: 1100, margin: "0 auto" }}>
        <div className="top-actions">
          <button className="open-add-modal-btn" onClick={openAddModal}>
            <FaPlus style={{ marginRight: 8 }} /> Nueva Cotización
          </button>
        </div>
        {/* Barra de filtros (estilo igual al de Usuarios) */}
        <div className="users-table-filter-row" style={{ margin: 0, marginBottom: 10 }}>
          <div className="users-filter-title">Filtrar por:</div>
          <select
            className="users-table-filter-select"
            value={cotFilterField}
            onChange={(e) => {
              const v = e.target.value;
              setCotFilterField(v);
              setCotFilterText("");
              setDateStart("");
              setDateEnd("");
            }}
          >
            <option value="cliente">Cliente</option>
            <option value="vendedor">Vendedor</option>
            <option value="estado">Estado</option>
            <option value="id">ID</option>
            <option value="fecha">Fecha</option>
          </select>
          {cotFilterField === "estado" ? (
            <select
              className="users-table-filter-input"
              value={cotFilterText}
              onChange={(e) => setCotFilterText(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="pagado">Pagado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          ) : cotFilterField === "fecha" ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input
                type="date"
                className="users-table-filter-input"
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
              />
              <span style={{ alignSelf: 'center', color: '#555' }}>a</span>
              <input
                type="date"
                className="users-table-filter-input"
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
              />
            </div>
          ) : (
            <input
              className="users-table-filter-input"
              placeholder="Escribe para filtrar…"
              value={cotFilterText}
              onChange={(e) => setCotFilterText(e.target.value)}
            />
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="users-filter-title" style={{ marginLeft: 6 }}>Orden:</span>
            <select
              className="users-table-filter-select"
              value={cotOrder}
              onChange={(e) => setCotOrder(e.target.value)}
            >
              <option value="recientes">Más recientes</option>
              <option value="antiguos">Más antiguos</option>
            </select>
          </div>
          <button
            type="button"
            className="users-filter-clear-btn"
            onClick={() => {
              setCotFilterText("");
              setDateStart("");
              setDateEnd("");
              setCotOrder("recientes");
              setCotFilterField("cliente");
            }}
            title="Limpiar filtro"
          >
            <FaTimes /> Limpiar
          </button>
        </div>
        {/* Cotizaciones */}
        <section className="cotizaciones-section">
         
          <div style={{ overflowX: "auto" }}>
            <table className="cotizaciones-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Vendedor</th>
                  <th>Fecha</th>
                  <th>Anticipo</th>
                  <th>Total</th>
                  <th>Resto</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
               
                {loading ? (
                  <tr>
                    <td colSpan="9">Cargando...</td>
                  </tr>
                ) : cotizaciones.length === 0 ? (
                  <tr>
                    <td colSpan="9">No hay cotizaciones registradas</td>
                  </tr>
                ) : (
                  // Filtrar y ordenar cotizaciones
                  cotizaciones
                    .filter((cot) => {
                      const clienteNombre = (cot.Cliente?.nombre || cot.cliente?.nombre || "").toLowerCase();
                      const vendedorNombre = (cot.Usuario?.nombre || cot.usuario?.nombre || "").toLowerCase();
                      const estado = (cot.status || "").toLowerCase();
                      const idStr = String(cot.ID || cot.id || "");
                      const q = (cotFilterText || "").toLowerCase().trim();

                      // Filtro por fecha (rango)
                      if (cotFilterField === 'fecha') {
                        if (!dateStart && !dateEnd) return true;
                        const t = new Date(cot.fecha_creacion || cot.createdAt || cot.fecha || 0).getTime();
                        if (!t) return false;
                        const start = dateStart ? new Date(`${dateStart}T00:00:00`).getTime() : null;
                        const end = dateEnd ? new Date(`${dateEnd}T23:59:59`).getTime() : null;
                        if (start && end) return t >= start && t <= end;
                        if (start && !end) return t >= start;
                        if (!start && end) return t <= end;
                        return true;
                      }

                      // Filtros por texto/estado/id
                      if (!q) return true;
                      switch (cotFilterField) {
                        case 'cliente':
                          return clienteNombre.includes(q);
                        case 'vendedor':
                          return vendedorNombre.includes(q);
                        case 'estado':
                          return estado.includes(q);
                        case 'id':
                          return idStr.includes(q);
                        default:
                          return true;
                      }
                    })
                    .sort((a, b) => {
                      const ta = new Date(a.fecha_creacion || a.createdAt || a.fecha || 0).getTime();
                      const tb = new Date(b.fecha_creacion || b.createdAt || b.fecha || 0).getTime();
                      if (cotOrder === 'antiguos') return ta - tb;
                      return tb - ta; // recientes primero
                    })
                    .map((cot) => {
                    const cliente = cot.Cliente || cot.cliente || {};
                    const usuario = cot.Usuario || cot.usuario || {};
                    const fecha = cot.fecha_creacion ? new Date(cot.fecha_creacion).toLocaleDateString() : "";
                    const anticipo = Number(cot.anticipo || 0);
                    const total = Number(cot.total || 0);
                    const resto = (total - anticipo).toFixed(2);
                    const statusClass = `status-badge status-${(cot.status || '').toLowerCase()}`;
                    return (
                      <tr key={cot.ID || cot.id}>
                        <td>{cot.ID || cot.id}</td>
                        <td>{cliente.nombre || "-"}</td>
                        <td>{usuario.nombre || "-"}</td>
                        <td>{fecha}</td>
                        <td>${anticipo.toFixed(2)}</td>
                        <td>${total.toFixed(2)}</td>
                        <td>${resto}</td>
                        <td>
                          {cot.status ? (
                            <span className={statusClass}>{cot.status}</span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <button className="edit-btn" title="Editar" onClick={() => openEditModal(cot)}>
                            <FaEdit />
                          </button>
                          <button className="delete-btn" title="Cancelar" onClick={() => { setDeleteTarget(cot); setShowDeleteConfirm(true); }}>
                            <FaTrash />
                          </button>
                          <button className="ventas-btn" title="Ver detalles" onClick={() => openDetails(cot)}>
                            <FaEye />
                          </button>
                          {cot.status === "pendiente" && (
                            <button className="ventas-btn" title="Confirmar venta" onClick={() => openConfirmVenta(cot)}>
                              Venta
                            </button>
                          )}
                          <button className="ventas-btn" title="Generar PDF" onClick={() => handleGenerarPDF(cot.ID || cot.id)}>
                            <FaSave />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>


        {/* Modal de confirmación de venta */}
        {modalOpen === 'confirmVenta' && ventaResumen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ width: 420, maxWidth: '90vw', maxHeight: '70vh', overflowY: 'auto', color: '#222', position: 'relative' }}>
              <div className="modal-close-row">
                <button
                  className="modal-close-btn"
                  title="Cancelar"
                  aria-label="Cancelar"
                  onClick={() => setModalOpen(null)}
                >
                  {/* X dibujada por CSS */}
                </button>
              </div>
              <h2 style={{ fontSize: '1.1rem', marginBottom: 10, color: '#111' }}>Confirmar venta</h2>
              <div style={{ marginBottom: 10 }}>
                <strong>Cliente:</strong> {clientes.find(c => c.ID === ventaResumen.ID_cliente)?.nombre || '-'}<br />
                <strong>Importe:</strong> ${ventaResumen.importe || ventaResumen.total || 0}<br />
                <strong>Anticipo:</strong> ${ventaResumen.anticipo || 0}<br />
                <strong>Saldo:</strong> ${ventaResumen.resto || 0}<br />
                <strong>Vendedor:</strong> {ventaResumen.vendedor || '-'}<br />
                <strong>Productos:</strong>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {(ventaResumen.productos || []).map((p, i) => {
                    const prod = productos.find(pr => pr.ID === p.productoId);
                    return (
                      <li key={i}>{prod?.nombre || ''} x{p.cantidad} ({p.tipoFigura}) {p.medidas ? `[${p.medidas}]` : ''}</li>
                    );
                  })}
                </ul>
              </div>
              {errorMsg && <div style={{ color: "#a30015", marginBottom: 8 }}>{errorMsg}</div>}
              <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
                <button className="add-btn" style={{ flex: 1 }} onClick={handleConfirmVenta}>
                  <FaSave style={{ marginRight: 6 }} /> Confirmar venta
                </button>
                <button className="cancel-btn" style={{ flex: 1 }} onClick={() => setModalOpen(null)}>
                  <FaTimes style={{ marginRight: 6 }} /> Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de crear/editar cotización */}
        {(modalOpen === 'add' || modalOpen === 'edit') && (
          <div className="modal-overlay" onClick={closeModal}>
            <div
              className="modal-content compact"
              style={{ color: '#111', width: '90vw', maxWidth: 1200, maxHeight: '80vh', overflowY: 'auto', position: 'relative' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-close-row">
                <button
                  className="modal-close-btn"
                  title="Cancelar"
                  aria-label="Cancelar"
                  onClick={closeModal}
                >
                  {/* X dibujada por CSS */}
                </button>
              </div>
              <h2 style={{ fontSize: '1.15rem', marginTop: 4, marginBottom: 12 }}>
                {modalOpen === 'edit' ? `Editar cotización${editTarget?.ID ? ` #${editTarget.ID}` : ''}` : 'Nueva cotización'}
              </h2>
              {errorMsg && (
                <div style={{ color: '#a30015', marginBottom: 10 }}>{errorMsg}</div>
              )}
              <form onSubmit={modalOpen === 'edit' ? handleEdit : handleAdd} className="user-form">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
                  <div>
                    <label htmlFor="cliente-select">Nombre del cliente</label>
                    <select
                      id="cliente-select"
                      className="user-input"
                      value={form.ID_cliente || ''}
                      onChange={(e) => setForm({ ...form, ID_cliente: Number(e.target.value) })}
                    >
                      <option value="">Selecciona un cliente…</option>
                      {(clientes || []).map((c) => (
                        <option key={c.ID} value={c.ID}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>Anticipo</label>
                    <input
                      className="user-input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.anticipo ?? 0}
                      onChange={(e) => setForm({ ...form, anticipo: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label>Estado de la cotización</label>
                    <select
                      className="user-input"
                      value={form.status || 'pendiente'}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="pagado">Pagado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '4px 0 6px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Productos</h3>
                  <button type="button" className="add-btn" onClick={handleAddProducto}>
                    <FaPlus style={{ marginRight: 6 }} /> Agregar producto
                  </button>
                </div>

                <div className="products-list">
                  {(form.productos || []).length === 0 ? (
                    <div style={{ color: '#666', fontSize: '.92rem', marginBottom: 8 }}>Aún no hay productos agregados.</div>
                  ) : null}

                  {(form.productos || []).map((p, i) => {
                    const prodMatch = productos.find((pr) => pr.ID === (p.productoId || p.ID_producto));
                    const imgUrl = prodMatch?.imagen || prodMatch?.image || prodMatch?.img || null;
                    return (
                      <div key={`edit-prod-${i}`} className="product-card">
                        <div className="product-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>Producto {i + 1}</span>
                          <button type="button" className="cancel-btn" onClick={() => handleRemoveProducto(i)}>Quitar</button>
                        </div>
                        {imgUrl ? (
                          <img src={imgUrl} alt={prodMatch?.nombre || `Producto ${i + 1}`} className="product-thumb" />
                        ) : (
                          <div className="product-thumb product-thumb--placeholder">Sin imagen</div>
                        )}
                        <div className="product-grid">
                          <div className="product-field">
                            <label htmlFor={`prod-${i}-productoId`}>Nombre del producto</label>
                            <select
                              id={`prod-${i}-productoId`}
                              className="user-input"
                              value={p.productoId || ''}
                              onChange={(e) => handleProductoChange(i, 'productoId', Number(e.target.value))}
                            >
                              <option value="">Selecciona un producto…</option>
                              {(productos || []).map((pr) => (
                                <option key={pr.ID} value={pr.ID}>{pr.nombre}</option>
                              ))}
                            </select>
                          </div>
                          <div className="product-field">
                            <label htmlFor={`prod-${i}-cantidad`}>Cantidad de piezas</label>
                            <input
                              id={`prod-${i}-cantidad`}
                              className="user-input"
                              type="number"
                              min="1"
                              value={p.cantidad ?? 1}
                              onChange={(e) => handleProductoChange(i, 'cantidad', e.target.value)}
                            />
                          </div>
                          <div className="product-field">
                            <label htmlFor={`prod-${i}-tipoFigura`}>Tipo de figura</label>
                            <select
                              id={`prod-${i}-tipoFigura`}
                              className="user-input"
                              value={p.tipoFigura || 'rectangulo'}
                              onChange={(e) => handleProductoChange(i, 'tipoFigura', e.target.value)}
                            >
                              <option value="rectangulo">Rectángulo</option>
                              <option value="cuadrado">Cuadrado</option>
                              <option value="circulo">Círculo</option>
                              <option value="ovalo">Óvalo</option>
                              <option value="L">L</option>
                              <option value="L invertida">L invertida</option>
                            </select>
                          </div>

                          {p.tipoFigura === 'circulo' ? (
                            <div className="product-field">
                              <label htmlFor={`prod-${i}-radio`}>Radio (cm)</label>
                              <input
                                id={`prod-${i}-radio`}
                                className="user-input"
                                type="number"
                                min="0"
                                step="0.01"
                                value={p.radio ?? ''}
                                onChange={(e) => handleProductoChange(i, 'radio', e.target.value)}
                              />
                            </div>
                          ) : (
                            <>
                              <div className="product-field">
                                <label htmlFor={`prod-${i}-base`}>Base (cm)</label>
                                <input
                                  id={`prod-${i}-base`}
                                  className="user-input"
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={p.base ?? ''}
                                  onChange={(e) => handleProductoChange(i, 'base', e.target.value)}
                                />
                              </div>
                              <div className="product-field">
                                <label htmlFor={`prod-${i}-altura`}>Altura (cm)</label>
                                <input
                                  id={`prod-${i}-altura`}
                                  className="user-input"
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={p.altura ?? ''}
                                  onChange={(e) => handleProductoChange(i, 'altura', e.target.value)}
                                />
                              </div>
                            </>
                          )}

                          {(p.tipoFigura === 'L' || p.tipoFigura === 'L invertida') && (
                            <>
                              <div className="product-field">
                                <label htmlFor={`prod-${i}-base2`}>Base 2 (cm)</label>
                                <input
                                  id={`prod-${i}-base2`}
                                  className="user-input"
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={p.base2 ?? ''}
                                  onChange={(e) => handleProductoChange(i, 'base2', e.target.value)}
                                />
                              </div>
                              <div className="product-field">
                                <label htmlFor={`prod-${i}-altura2`}>Altura 2 (cm)</label>
                                <input
                                  id={`prod-${i}-altura2`}
                                  className="user-input"
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={p.altura2 ?? ''}
                                  onChange={(e) => handleProductoChange(i, 'altura2', e.target.value)}
                                />
                              </div>
                            </>
                          )}

                          <div className="product-field">
                            <label>Soclo (base)</label>
                            <input
                              className="user-input"
                              type="number"
                              min="0"
                              step="0.01"
                              value={p.soclo_base ?? ''}
                              onChange={(e) => handleProductoChange(i, 'soclo_base', e.target.value)}
                            />
                          </div>
                          <div className="product-field">
                            <label>Soclo (altura)</label>
                            <input
                              className="user-input"
                              type="number"
                              min="0"
                              step="0.01"
                              value={p.soclo_altura ?? ''}
                              onChange={(e) => handleProductoChange(i, 'soclo_altura', e.target.value)}
                            />
                          </div>
                          <div className="product-field">
                            <label>Cubierta (base)</label>
                            <input
                              className="user-input"
                              type="number"
                              min="0"
                              step="0.01"
                              value={p.cubierta_base ?? ''}
                              onChange={(e) => handleProductoChange(i, 'cubierta_base', e.target.value)}
                            />
                          </div>
                          <div className="product-field">
                            <label>Cubierta (altura)</label>
                            <input
                              className="user-input"
                              type="number"
                              min="0"
                              step="0.01"
                              value={p.cubierta_altura ?? ''}
                              onChange={(e) => handleProductoChange(i, 'cubierta_altura', e.target.value)}
                            />
                          </div>
                          <div className="product-field product-field--full">
                            <label>Descripción del producto</label>
                            <textarea
                              className="user-input"
                              rows={2}
                              value={p.descripcion || ''}
                              onChange={(e) => handleProductoChange(i, 'descripcion', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="modal-btn-row" style={{ marginTop: 8 }}>
                  <button type="submit" className="add-btn">
                    <FaSave style={{ marginRight: 6 }} /> {modalOpen === 'edit' ? 'Actualizar' : 'Guardar'}
                  </button>
                  <button type="button" className="cancel-btn" onClick={closeModal}>
                    <FaTimes style={{ marginRight: 6 }} /> Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de confirmación para cancelar cotización */}
        {showDeleteConfirm && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ width: 380, maxWidth: '90vw', color: '#222', position: 'relative' }}>
              <div className="modal-close-row">
                <button
                  className="modal-close-btn"
                  title="Cancelar"
                  aria-label="Cancelar"
                  onClick={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }}
                >
                  {/* X dibujada por CSS */}
                </button>
              </div>
              <h2 style={{ color: '#111', fontSize: '1.05rem', marginBottom: 10 }}>Confirmar cancelación</h2>
              <p style={{ marginBottom: 16 }}>
                ¿Seguro que deseas cancelar la cotización #{deleteTarget?.ID || deleteTarget?.id}? Esta acción no se puede deshacer.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  className="cancel-btn"
                  onClick={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }}
                >
                  No, volver
                </button>
                <button
                  className="delete-btn"
                  onClick={() => deleteTarget && handleDelete(deleteTarget.ID || deleteTarget.id)}
                >
                  Sí, cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de detalles de cotización */}
        {detailsOpen && (
          <div className="modal-overlay" onClick={() => setDetailsOpen(false)}>
            <div
              className="modal-content"
              style={{ width: '80vw', maxWidth: 980, maxHeight: '82vh', overflowY: 'auto', color: '#111', position: 'relative' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-close-row">
                <button
                  className="modal-close-btn"
                  title="Cancelar"
                  aria-label="Cancelar"
                  onClick={() => setDetailsOpen(false)}
                >
                  {/* X dibujada por CSS */}
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: 0 }}>Detalles de la cotización</h2>
                {detailsData?.cotizacion && (
                  <button
                    className="add-btn"
                    onClick={() => { const cot = detailsData.cotizacion; setDetailsOpen(false); openEditModal(cot); }}
                    title="Editar esta cotización"
                  >
                    Editar esta cotización
                  </button>
                )}
              </div>
              {detailsLoading ? (
                <p>Cargando detalles…</p>
              ) : !detailsData ? (
                <p>No se encontraron detalles.</p>
              ) : (
                (() => {
                  const D = detailsData || {};
                  const cot = D.cotizacion || D; // backend devuelve { cotizacion, productos }
                  // Cliente con fallback a la lista si no viene anidado
                  const cliente = (cot.Cliente || cot.cliente || cot.customer) || clientes.find(c => c.ID === (cot.ID_cliente || cot.id_cliente || cot.clienteId || cot.customerId)) || {};
                  // Usuario/vendedor con fallback a un posible campo vendedor
                  const usuario = (cot.Usuario || cot.usuario) || { nombre: cot.vendedor } || {};
                  const fechaRaw = cot.fecha_creacion || cot.createdAt || cot.fecha || cot.fecha_venta || cot.fechaCotizacion;
                  const fecha = fechaRaw ? new Date(fechaRaw).toLocaleString('es-MX') : '';
                  const anticipo = Number(cot.anticipo ?? cot.advance ?? 0);
                  const total = Number(cot.total ?? cot.importe ?? cot.monto ?? 0);
                  const resto = (total - anticipo).toFixed(2);
                  const prods = D.productos || D.items || cot.VentasProductos || [];
                  const telefono = cliente?.telefono || cliente?.tel || cliente?.phone || cliente?.celular || '-';
                  const rfc = cliente?.rfc || cliente?.RFC || cliente?.rfc_cliente || '-';
                  const statusText = ((cot.status || cot.estado || cot.estatus || '') + '').toString();
                  const direccion = cliente?.direccion || [cliente?.calle, cliente?.colonia, cliente?.ciudad, cliente?.estado, cliente?.cp].filter(Boolean).join(', ');
                  const idVenta = cot.ID || cot.id || cot.ID_venta || cot.ventaId || cot.cotizacionId || cot.folio || '';
                  return (
                    <div>
                      <div className="details-grid">
                        <div className="details-item">
                          <div className="details-label">ID</div>
                          <div className="details-value">{idVenta || '-'}</div>
                        </div>
                        <div className="details-item">
                          <div className="details-label">Cliente</div>
                          <div className="details-value">{cliente?.nombre || cliente?.name || '-'}</div>
                        </div>
                        <div className="details-item">
                          <div className="details-label">Teléfono</div>
                          <div className="details-value">{telefono}</div>
                        </div>
                        <div className="details-item">
                          <div className="details-label">RFC</div>
                          <div className="details-value">{rfc}</div>
                        </div>
                        <div className="details-item">
                          <div className="details-label">Dirección</div>
                          <div className="details-value">{direccion || '-'}</div>
                        </div>
                        <div className="details-item">
                          <div className="details-label">Vendedor</div>
                          <div className="details-value">{usuario?.nombre || usuario?.name || cot.vendedor || '-'}</div>
                        </div>
                        <div className="details-item">
                          <div className="details-label">Fecha</div>
                          <div className="details-value">{fecha || '-'}</div>
                        </div>
                        <div className="details-item">
                          <div className="details-label">Estado</div>
                          <div className="details-value">
                            {statusText ? (
                              <span className={`status-badge status-${statusText.toLowerCase()}`}>{statusText}</span>
                            ) : (
                              '-'
                            )}
                          </div>
                        </div>
                        <div className="details-item">
                          <div className="details-label">Anticipo</div>
                          <div className="details-value">${anticipo.toFixed(2)}</div>
                        </div>
                        <div className="details-item">
                          <div className="details-label">Total</div>
                          <div className="details-value">${total.toFixed(2)}</div>
                        </div>
                        <div className="details-item">
                          <div className="details-label">Resto</div>
                          <div className="details-value">${resto}</div>
                        </div>
                      </div>
                      <h3 style={{ marginTop: 12, marginBottom: 8, fontSize: '1.05rem' }}>Productos</h3>
                      {prods.length === 0 ? (
                        <p>Sin productos.</p>
                      ) : (
                        <div className="products-list">
                          {prods.map((p, i) => {
                            const prodMatch = productos.find((pr) => pr.ID === (p.productoId || p.ID_producto || p.idProducto || p.productId));
                            const nombreProd = p.Producto?.nombre || prodMatch?.nombre || p.nombre || '';
                            const imgUrl = prodMatch?.imagen || prodMatch?.image || prodMatch?.img || prodMatch?.foto || prodMatch?.foto_url || p.imagen || null;
                            const medidas = p.medidas || p.tamano || '';
                            return (
                              <div key={`${i}-${p.productoId || p.ID_producto || 'prod'}`} className="product-card">
                                <div className="product-card-header">Producto {i + 1}</div>
                                {imgUrl ? (
                                  <img src={imgUrl} alt={nombreProd || `Producto ${i+1}`} className="product-thumb" />
                                ) : (
                                  <div className="product-thumb product-thumb--placeholder">Sin imagen</div>
                                )}
                                <div className="product-grid">
                                  <div className="product-field"><label>Producto</label><div>{nombreProd}</div></div>
                                  <div className="product-field"><label>Cantidad</label><div>{p.cantidad ?? 1}</div></div>
                                  <div className="product-field"><label>m²</label><div>{(p.total_m2 ?? '').toString() || '-'}</div></div>
                                  <div className="product-field"><label>Figura</label><div>{p.tipoFigura || '-'}</div></div>
                                  {p.tipoFigura === 'circulo' && (
                                    <div className="product-field"><label>Radio</label><div>{p.radio || '-'}</div></div>
                                  )}
                                  {(p.tipoFigura === 'ovalo' || p.tipoFigura === 'rectangulo' || p.tipoFigura === 'cuadrado' || p.tipoFigura === 'L' || p.tipoFigura === 'L invertida') && (
                                    <>
                                      {'base' in p && <div className="product-field"><label>Base</label><div>{p.base || '-'}</div></div>}
                                      {'altura' in p && <div className="product-field"><label>Altura</label><div>{p.altura || '-'}</div></div>}
                                    </>
                                  )}
                                  {('base2' in p || 'altura2' in p) && (
                                    <>
                                      {'base2' in p && <div className="product-field"><label>Base 2</label><div>{p.base2 || '-'}</div></div>}
                                      {'altura2' in p && <div className="product-field"><label>Altura 2</label><div>{p.altura2 || '-'}</div></div>}
                                    </>
                                  )}
                                  {('soclo_base' in p || 'soclo_altura' in p) && (
                                    <>
                                      <div className="product-field"><label>Soclo Base</label><div>{p.soclo_base || '-'}</div></div>
                                      <div className="product-field"><label>Soclo Altura</label><div>{p.soclo_altura || '-'}</div></div>
                                    </>
                                  )}
                                  {('cubierta_base' in p || 'cubierta_altura' in p) && (
                                    <>
                                      <div className="product-field"><label>Cubierta Base</label><div>{p.cubierta_base || '-'}</div></div>
                                      <div className="product-field"><label>Cubierta Altura</label><div>{p.cubierta_altura || '-'}</div></div>
                                    </>
                                  )}
                                  {!!medidas && (
                                    <div className="product-field product-field--full"><label>Medidas</label><div>{medidas}</div></div>
                                  )}
                                  {('ancho' in p || 'largo' in p) && (
                                    <>
                                      {'ancho' in p && <div className="product-field"><label>Ancho</label><div>{p.ancho || '-'}</div></div>}
                                      {'largo' in p && <div className="product-field"><label>Largo</label><div>{p.largo || '-'}</div></div>}
                                    </>
                                  )}
                                  {'descripcion' in p && (
                                    <div className="product-field product-field--full"><label>Descripción</label><div>{p.descripcion || '-'}</div></div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
                        <button className="cancel-btn" onClick={() => setDetailsOpen(false)}>
                          Cerrar
                        </button>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sells;