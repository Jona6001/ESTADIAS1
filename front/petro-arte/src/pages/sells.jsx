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

  // Formulario cotización
  const [form, setForm] = useState(initialCotizacion);
  const [clienteSearch, setClienteSearch] = useState("");
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

  const openEditModal = (cot) => {
    // Nota: no tenemos endpoint para editar productos de la cotización en backend
    // Mantendremos edición solo de status/anticipo en otras acciones.
    setForm({
      ID_cliente: cot.ID_cliente,
      productos: cot.productos ? [...cot.productos] : [],
      anticipo: cot.anticipo || 0,
      status: cot.status || "pendiente",
    });
    setEditTarget(cot);
    setModalOpen("edit");
    setErrorMsg("");
  };

  const closeModal = () => {
    setModalOpen(null);
    setForm(initialCotizacion);
    setErrorMsg("");
  };

  // Form handlers
  const filteredClientes = clientes.filter((c) =>
    (c.nombre || "").toLowerCase().includes(clienteSearch.toLowerCase()) ||
    (c.telefono && c.telefono.includes(clienteSearch)) ||
    (c.rfc && c.rfc.toLowerCase().includes(clienteSearch.toLowerCase()))
  );

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

  const handleRemoveProducto = (idx) => {
    const next = [...form.productos];
    next.splice(idx, 1);
    setForm({ ...form, productos: next });
  };

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

  // CRUD Cotizaciones
  const handleAdd = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user || !user.ID) {
      setErrorMsg("No se encontró el usuario autenticado. Inicia sesión.");
      return;
    }
    if (!form.ID_cliente) {
      setErrorMsg("Selecciona un cliente.");
      return;
    }
    if (!form.productos || form.productos.length === 0) {
      setErrorMsg("Agrega al menos un producto.");
      return;
    }

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

      closeModal();
      setForm(initialCotizacion);
      await fetchAll();
    } catch (err) {
      console.error("crear cotización error:", err);
      setErrorMsg("Error al crear la cotización");
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (!editTarget) { setErrorMsg("No hay cotización seleccionada"); return; }
    const id = editTarget.ID || editTarget.id;
    const token = localStorage.getItem("token");
    const headers = { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` };

    try {
      // Actualizar anticipo si cambió
      if (form.anticipo !== undefined && form.anticipo !== editTarget.anticipo) {
        const resAnt = await fetch(`${API_COTIZACIONES}/${id}/anticipo`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ anticipo: Number(form.anticipo) }),
        });
        const txtAnt = await resAnt.text();
        let dAnt; try { dAnt = JSON.parse(txtAnt); } catch { dAnt = { message: txtAnt }; }
        if (!resAnt.ok || dAnt?.success === false) throw new Error(dAnt?.message || "No se pudo actualizar el anticipo");
      }

      // Actualizar status si cambió
      if (form.status && form.status !== editTarget.status) {
        const resSt = await fetch(`${API_COTIZACIONES}/${id}/status`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ status: form.status }),
        });
        const txtSt = await resSt.text();
        let dSt; try { dSt = JSON.parse(txtSt); } catch { dSt = { message: txtSt }; }
        if (!resSt.ok || dSt?.success === false) throw new Error(dSt?.message || "No se pudo actualizar el estado");
      }

      setModalOpen(null);
      setEditTarget(null);
      setForm(initialCotizacion);
      await fetchAll();
    } catch (err) {
      setErrorMsg(err.message || "Error al editar la cotización");
    }
  };

  const handleConfirmVenta = async () => {
    if (!ventaResumen) return;
    setErrorMsg("");
    const token = localStorage.getItem("token");
    const id = ventaResumen.ID || ventaResumen.id;
    try {
      const res = await fetch(`${API_COTIZACIONES}/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "pagado" }),
      });
      const txt = await res.text();
      let data; try { data = JSON.parse(txt); } catch { data = { message: txt }; }
      if (!res.ok || data?.success === false) throw new Error(data?.mensaje || data?.message || "No se puede realizar la venta");
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
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
              setCotFilterField(e.target.value);
              setCotFilterText("");
            }}
          >
            <option value="cliente">Cliente</option>
            <option value="vendedor">Vendedor</option>
            <option value="estado">Estado</option>
            <option value="id">ID</option>
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
          ) : (
            <input
              className="users-table-filter-input"
              placeholder="Escribe para filtrar…"
              value={cotFilterText}
              onChange={(e) => setCotFilterText(e.target.value)}
            />
          )}
          <button
            type="button"
            className="users-filter-clear-btn"
            onClick={() => setCotFilterText("")}
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
                  // Aplicar filtro a cotizaciones
                  cotizaciones
                    .filter((cot) => {
                      const cliente = (cot.Cliente?.nombre || cot.cliente?.nombre || "").toLowerCase();
                      const vendedor = (cot.Usuario?.nombre || cot.usuario?.nombre || "").toLowerCase();
                      const estado = (cot.status || "").toLowerCase();
                      const idStr = String(cot.ID || cot.id || "");
                      const q = (cotFilterText || "").toLowerCase().trim();
                      if (!q) return true;
                      switch (cotFilterField) {
                        case "cliente":
                          return cliente.includes(q);
                        case "vendedor":
                          return vendedor.includes(q);
                        case "estado":
                          return estado.includes(q);
                        case "id":
                          return idStr.includes(q);
                        default:
                          return true;
                      }
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

        {/* Modal para crear/editar cotización */}
        {(modalOpen === 'add' || modalOpen === 'edit') && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ width: '70vw', maxWidth: 900, maxHeight: '75vh', overflowY: 'auto' }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: 10 }}>{modalOpen === 'add' ? 'Nueva Cotización' : 'Editar Cotización'}</h2>
              <form className="user-form" onSubmit={modalOpen === 'add' ? handleAdd : handleEdit}>
                <label htmlFor="clienteSearch">Buscar cliente</label>
                <input
                  id="clienteSearch"
                  className="user-input"
                  type="text"
                  placeholder="Buscar por nombre, teléfono o RFC"
                  value={clienteSearch}
                  onChange={e => setClienteSearch(e.target.value)}
                  style={{ marginBottom: 6 }}
                />
                <label htmlFor="clienteSelect">Cliente</label>
                <select
                  id="clienteSelect"
                  className="user-input"
                  name="ID_cliente"
                  value={form.ID_cliente}
                  onChange={e => {
                    setForm({ ...form, ID_cliente: e.target.value });
                  }}
                  disabled={modalOpen === 'edit'}
                  required
                >
                  <option value="">Selecciona un cliente</option>
                  {filteredClientes.map(c => (
                    <option key={c.ID} value={c.ID}>{c.nombre} {c.telefono ? `(${c.telefono})` : ''} {c.rfc ? `RFC: ${c.rfc}` : ''}</option>
                  ))}
                </select>

                <label htmlFor="anticipoInput">Anticipo</label>
                <input
                  id="anticipoInput"
                  className="user-input"
                  name="anticipo"
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.anticipo || ''}
                  onChange={e => setForm({ ...form, anticipo: e.target.value })}
                  placeholder="Anticipo"
                  required
                />

                <label>Productos</label>
                <div className="products-list">
                  {form.productos.map((p, idx) => (
                    <div className="product-card" key={`${idx}-${p.productoId || 'new'}`}>
                      <div className="product-grid">
                        <div className="product-field">
                          <label>Producto</label>
                          <select
                            className="user-input"
                            value={p.productoId || ''}
                            onChange={e => handleProductoChange(idx, 'productoId', e.target.value)}
                            required
                            disabled={productos.length === 0 || modalOpen === 'edit'}
                          >
                            <option value="">{productos.length === 0 ? 'No hay productos' : 'Selecciona producto'}</option>
                            {productos.map(pr => (
                              <option key={pr.ID} value={pr.ID}>{pr.nombre}{pr.descripcion ? ` - ${pr.descripcion}` : ''}</option>
                            ))}
                          </select>
                          {productos.length === 0 && (
                            <div style={{ color: '#a30015', marginTop: 6 }}>No hay productos. Agrega productos primero.</div>
                          )}
                        </div>
                        <div className="product-field">
                          <label>Cantidad</label>
                          <input className="user-input" type="number" min={1} value={p.cantidad} onChange={e => handleProductoChange(idx, 'cantidad', e.target.value)} required disabled={modalOpen === 'edit'} />
                        </div>
                        <div className="product-field">
                          <label>Figura</label>
                          <select className="user-input" value={p.tipoFigura} onChange={e => handleProductoChange(idx, 'tipoFigura', e.target.value)} required disabled={modalOpen === 'edit'}>
                            <option value="cuadrado">Cuadrado</option>
                            <option value="rectangulo">Rectángulo</option>
                            <option value="circulo">Círculo</option>
                            <option value="ovalo">Óvalo</option>
                            <option value="L">L</option>
                            <option value="L invertida">L invertida</option>
                          </select>
                        </div>

                        {p.tipoFigura === 'circulo' && (
                          <div className="product-field">
                            <label>Radio</label>
                            <input className="user-input" type="number" min={0} step={0.01} value={p.radio || ''} onChange={e => handleProductoChange(idx, 'radio', e.target.value)} placeholder="Radio" required disabled={modalOpen === 'edit'} />
                          </div>
                        )}

                        {p.tipoFigura === 'ovalo' && (
                          <>
                            <div className="product-field">
                              <label>Base</label>
                              <input className="user-input" type="number" min={0} step={0.01} value={p.base || ''} onChange={e => handleProductoChange(idx, 'base', e.target.value)} placeholder="Base" required disabled={modalOpen === 'edit'} />
                            </div>
                            <div className="product-field">
                              <label>Altura</label>
                              <input className="user-input" type="number" min={0} step={0.01} value={p.altura || ''} onChange={e => handleProductoChange(idx, 'altura', e.target.value)} placeholder="Altura" required disabled={modalOpen === 'edit'} />
                            </div>
                          </>
                        )}

                        {(p.tipoFigura === 'L' || p.tipoFigura === 'L invertida') && (
                          <>
                            <div className="product-field">
                              <label>Base 1</label>
                              <input className="user-input" type="number" min={0} step={0.01} value={p.base || ''} onChange={e => handleProductoChange(idx, 'base', e.target.value)} placeholder="Base 1" required disabled={modalOpen === 'edit'} />
                            </div>
                            <div className="product-field">
                              <label>Altura 1</label>
                              <input className="user-input" type="number" min={0} step={0.01} value={p.altura || ''} onChange={e => handleProductoChange(idx, 'altura', e.target.value)} placeholder="Altura 1" required disabled={modalOpen === 'edit'} />
                            </div>
                            <div className="product-field">
                              <label>Base 2</label>
                              <input className="user-input" type="number" min={0} step={0.01} value={p.base2 || ''} onChange={e => handleProductoChange(idx, 'base2', e.target.value)} placeholder="Base 2" required disabled={modalOpen === 'edit'} />
                            </div>
                            <div className="product-field">
                              <label>Altura 2</label>
                              <input className="user-input" type="number" min={0} step={0.01} value={p.altura2 || ''} onChange={e => handleProductoChange(idx, 'altura2', e.target.value)} placeholder="Altura 2" required disabled={modalOpen === 'edit'} />
                            </div>
                          </>
                        )}

                        {(p.tipoFigura === 'cuadrado' || p.tipoFigura === 'rectangulo') && (
                          <>
                            <div className="product-field">
                              <label>Base</label>
                              <input className="user-input" type="number" min={0} step={0.01} value={p.base || ''} onChange={e => handleProductoChange(idx, 'base', e.target.value)} placeholder="Base" required disabled={modalOpen === 'edit'} />
                            </div>
                            <div className="product-field">
                              <label>Altura</label>
                              <input className="user-input" type="number" min={0} step={0.01} value={p.altura || ''} onChange={e => handleProductoChange(idx, 'altura', e.target.value)} placeholder="Altura" required disabled={modalOpen === 'edit'} />
                            </div>
                          </>
                        )}

                        <div className="product-field">
                          <label>Soclo Base</label>
                          <input className="user-input" type="number" min={0} step={0.01} value={p.soclo_base || ''} onChange={e => handleProductoChange(idx, 'soclo_base', e.target.value)} placeholder="Base" disabled={modalOpen === 'edit'} />
                        </div>
                        <div className="product-field">
                          <label>Soclo Altura</label>
                          <input className="user-input" type="number" min={0} step={0.01} value={p.soclo_altura || ''} onChange={e => handleProductoChange(idx, 'soclo_altura', e.target.value)} placeholder="Altura" disabled={modalOpen === 'edit'} />
                        </div>

                        <div className="product-field">
                          <label>Cubierta Base</label>
                          <input className="user-input" type="number" min={0} step={0.01} value={p.cubierta_base || ''} onChange={e => handleProductoChange(idx, 'cubierta_base', e.target.value)} placeholder="Base" disabled={modalOpen === 'edit'} />
                        </div>
                        <div className="product-field">
                          <label>Cubierta Altura</label>
                          <input className="user-input" type="number" min={0} step={0.01} value={p.cubierta_altura || ''} onChange={e => handleProductoChange(idx, 'cubierta_altura', e.target.value)} placeholder="Altura" disabled={modalOpen === 'edit'} />
                        </div>

                        <div className="product-field product-field--full">
                          <label>Descripción</label>
                          <input className="user-input" type="text" value={p.descripcion || ''} onChange={e => handleProductoChange(idx, 'descripcion', e.target.value)} placeholder="Descripción" disabled={modalOpen === 'edit'} />
                        </div>
                      </div>
                      <div className="product-actions">
                        <button type="button" className="delete-btn" onClick={() => handleRemoveProducto(idx)} title="Quitar" disabled={modalOpen === 'edit'}>
                          <FaTrash /> Quitar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" className="add-btn" style={{ marginBottom: 10 }} onClick={handleAddProducto}>
                  <FaPlus style={{ marginRight: 6 }} /> Agregar producto
                </button>

                <label htmlFor="statusSelect">Estado</label>
                <select
                  id="statusSelect"
                  className="user-input"
                  name="status"
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                  required
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="pagado">Pagado</option>
                  <option value="cancelado">Cancelado</option>
                </select>

                {errorMsg && <div style={{ color: "#a30015", marginBottom: 8 }}>{errorMsg}</div>}
                <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
                  <button type="submit" className="add-btn" style={{ flex: 1 }}>
                    <FaSave style={{ marginRight: 6 }} /> {modalOpen === 'add' ? 'Guardar' : 'Actualizar'}
                  </button>
                  <button type="button" className="cancel-btn" onClick={closeModal} style={{ flex: 1 }}>
                    <FaTimes style={{ marginRight: 6 }} /> Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de confirmación de venta */}
        {modalOpen === 'confirmVenta' && ventaResumen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ width: 420, maxWidth: '90vw', maxHeight: '70vh', overflowY: 'auto', color: '#222' }}>
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

        {/* Modal de confirmación para cancelar cotización */}
        {showDeleteConfirm && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ width: 380, maxWidth: '90vw', color: '#222' }}>
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
              style={{ width: '70vw', maxWidth: 820, maxHeight: '80vh', overflowY: 'auto', color: '#111' }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ fontSize: '1.2rem', marginBottom: 10 }}>Detalles de la cotización</h2>
              {detailsLoading ? (
                <p>Cargando detalles…</p>
              ) : !detailsData ? (
                <p>No se encontraron detalles.</p>
              ) : (
                (() => {
                  const d = detailsData || {};
                  const cliente = d.Cliente || d.cliente || {};
                  const usuario = d.Usuario || d.usuario || {};
                  const fecha = d.fecha_creacion
                    ? new Date(d.fecha_creacion).toLocaleString('es-MX')
                    : (d.createdAt ? new Date(d.createdAt).toLocaleString('es-MX') : '');
                  const anticipo = Number(d.anticipo || 0);
                  const total = Number(d.total || d.importe || 0);
                  const resto = (total - anticipo).toFixed(2);
                  const prods = d.productos || d.VentasProductos || [];
                  return (
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginBottom: 12 }}>
                        <div><strong>ID:</strong> {d.ID || d.id}</div>
                        <div><strong>Cliente:</strong> {cliente.nombre || '-'}</div>
                        <div><strong>Vendedor:</strong> {usuario.nombre || '-'}</div>
                        <div><strong>Fecha:</strong> {fecha || '-'}</div>
                        <div>
                          <strong>Estado:</strong>
                          {d.status ? (
                            <span style={{ marginLeft: 6 }} className={`status-badge status-${String(d.status).toLowerCase()}`}>{d.status}</span>
                          ) : (
                            ' -'
                          )}
                        </div>
                        <div><strong>Anticipo:</strong> ${anticipo.toFixed(2)}</div>
                        <div><strong>Total:</strong> ${total.toFixed(2)}</div>
                        <div><strong>Resto:</strong> ${resto}</div>
                      </div>
                      <h3 style={{ marginTop: 12, marginBottom: 8, fontSize: '1.05rem' }}>Productos</h3>
                      {prods.length === 0 ? (
                        <p>Sin productos.</p>
                      ) : (
                        <div className="products-list">
                          {prods.map((p, i) => {
                            const prodMatch = productos.find((pr) => pr.ID === (p.productoId || p.ID_producto));
                            const nombreProd = prodMatch?.nombre || p.Producto?.nombre || '';
                            return (
                              <div key={`${i}-${p.productoId || p.ID_producto || 'prod'}`} className="product-card">
                                <div className="product-grid">
                                  <div className="product-field"><label>Producto</label><div>{nombreProd}</div></div>
                                  <div className="product-field"><label>Cantidad</label><div>{p.cantidad}</div></div>
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