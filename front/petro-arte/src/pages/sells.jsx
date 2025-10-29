import React, { useState, useRef, useEffect } from "react";
import "../App.css";
import { useNavigate, useLocation } from "react-router-dom";
import { FaUser, FaMoneyCheckAlt, FaEdit, FaTrash, FaPlus, FaSave, FaTimes } from "react-icons/fa";


// Endpoints
const API_COTIZACIONES = "http://localhost:3000/cotizaciones";
const API_CLIENTES = "http://localhost:3000/clientes";
const API_PRODUCTOS = "http://localhost:3000/productos";

const initialCotizacion = {
  ID_cliente: "",
  productos: [], // [{ productoId, cantidad, tipoFigura, ... }
  status: "pendiente"
};

const Sells = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(null); // null, 'add', 'edit'
  const [form, setForm] = useState(initialCotizacion);
  const [editId, setEditId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const menuRef = useRef();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.nombre) setUserName(user.nombre);
    fetchAll();
  }, [navigate]);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch all data
  const fetchAll = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const [cotRes, cliRes, prodRes] = await Promise.all([
        fetch(API_COTIZACIONES, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(API_CLIENTES, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(API_PRODUCTOS, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const cotData = await cotRes.json();
      const cliData = await cliRes.json();
      const prodData = await prodRes.json();
      setCotizaciones(cotData.cotizaciones || []);
      setClientes(cliData.clientes || []);
      setProductos(prodData.productos || []);
    } catch {
      setErrorMsg("Error al cargar datos");
    }
    setLoading(false);
  };

  // Modal handlers
  const openAddModal = () => {
    setForm({ ...initialCotizacion });
    setEditId(null);
    setModalOpen('add');
    setErrorMsg("");
  };

  const openEditModal = (cot) => {
    setForm({
      ID_cliente: cot.ID_cliente,
      productos: cot.productos ? [...cot.productos] : [],
      status: cot.status
    });
    setEditId(cot.ID);
    setModalOpen('edit');
    setErrorMsg("");
  };

  const closeModal = () => {
    setModalOpen(null);
    setEditId(null);
    setForm(initialCotizacion);
    setErrorMsg("");
  };

  // Form handlers
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Productos en cotización
  const handleAddProducto = () => {
    setForm({
      ...form,
      productos: [
        ...form.productos,
        { productoId: "", cantidad: 1, tipoFigura: "cuadrado" }
      ]
    });
  };
  const handleRemoveProducto = (idx) => {
    setForm({
      ...form,
      productos: form.productos.filter((_, i) => i !== idx)
    });
  };
  const handleProductoChange = (idx, field, value) => {
    setForm({
      ...form,
      productos: form.productos.map((p, i) =>
        i === idx ? { ...p, [field]: value } : p
      )
    });
  };

  // CRUD Cotizaciones
  const handleAdd = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(API_COTIZACIONES, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje || "Error");
      closeModal();
      fetchAll();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_COTIZACIONES}/${editId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje || "Error");
      closeModal();
      fetchAll();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que deseas cancelar esta cotización?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_COTIZACIONES}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje || "Error");
      fetchAll();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // Navbar/Logout
  const handleLogout = () => {
    setMenuOpen(false);
    setShowLogoutConfirm(true);
  };
  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };
  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };
  const handleConfig = () => {
    setMenuOpen(false);
    navigate("/config");
  };

  // Render
  return (
    <div className="home-bg">
      <nav className="main-navbar guinda-navbar">
        <div className="nav-container">
          <div className="nav-left">
            <div
              className="nav-logo mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(v => !v)}
            >
              <img
                src="https://irp.cdn-website.com/d7ba7f52/dms3rep/multi/265.png"
                alt="Logo"
                className="logo-img"
              />
              <div className="nav-title">VENTAS</div>
            </div>
            <header className="header">
              <h1>VENTAS <FaMoneyCheckAlt className="iconName" /></h1>
            </header>
            <div className={`mobile-menu ${mobileMenuOpen ? "open" : ""}`}>
              <button className={`nav-btn${location.pathname === "/home" ? " nav-btn-active" : ""}`} onClick={() => navigate("/home")}>Inicio</button>
              <button className={`nav-btn${location.pathname === "/inventario" ? " nav-btn-active" : ""}`} onClick={() => navigate("/inventario")}>Inventario</button>
              <button className={`nav-btn${location.pathname === "/ventas" ? " nav-btn-active" : ""}`} onClick={() => navigate("/ventas")}>Ventas</button>
              <button className={`nav-btn${location.pathname === "/clientes" ? " nav-btn-active" : ""}`} onClick={() => navigate("/clientes")}>Clientes</button>
              <button className={`nav-btn${location.pathname === "/usuarios" ? " nav-btn-active" : ""}`} onClick={() => navigate("/usuarios")}>Usuarios</button>
            </div>
          </div>
          <div className="nav-center">
            <button className={`nav-btn${location.pathname === "/home" ? " nav-btn-active" : ""}`} onClick={() => navigate("/home")}>Inicio</button>
            <button className={`nav-btn${location.pathname === "/inventario" ? " nav-btn-active" : ""}`} onClick={() => navigate("/inventario")}>Inventario</button>
            <button className={`nav-btn${location.pathname === "/ventas" ? " nav-btn-active" : ""}`} onClick={() => navigate("/ventas")}>Ventas</button>
            <button className={`nav-btn${location.pathname === "/clientes" ? " nav-btn-active" : ""}`} onClick={() => navigate("/clientes")}>Clientes</button>
            <button className={`nav-btn${location.pathname === "/usuarios" ? " nav-btn-active" : ""}`} onClick={() => navigate("/usuarios")}>Usuarios</button>
          </div>
          <div className="nav-datetime">
            <span>{dateStr}</span>
            <span>{timeStr}</span>
          </div>
          <div className="nav-user" ref={menuRef}>
            <button className="user-btn" onClick={() => setMenuOpen(v => !v)}>
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
                <div className="modal-content" style={{ maxWidth: 340, padding: '2rem 1.5rem', textAlign: 'center' }}>
                  <h2 style={{ color: '#a30015', fontWeight: 800, fontSize: '1.15rem', marginBottom: 18 }}>¿Cerrar sesión?</h2>
                  <p style={{ color: '#7b1531', marginBottom: 22, fontWeight: 600 }}>¿Estás seguro de que deseas cerrar sesión?</p>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    <button className="delete-btn" style={{ minWidth: 90 }} onClick={confirmLogout}>Cerrar sesión</button>
                    <button className="cancel-btn" style={{ minWidth: 90 }} onClick={cancelLogout}>Cancelar</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div style={{ padding: 40, maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
          <button className="open-add-modal-btn" onClick={openAddModal}>
            <FaPlus style={{ marginRight: 8 }} /> Nueva Cotización
          </button>
        </div>

        {/* Tabla de cotizaciones */}
        <div style={{ overflowX: "auto" }}>
          <table className="users-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Productos</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4">Cargando...</td></tr>
              ) : cotizaciones.length === 0 ? (
                <tr><td colSpan="4">No hay cotizaciones registradas</td></tr>
              ) : (
                cotizaciones.map(cot => (
                  <tr key={cot.ID}>
                    <td>{clientes.find(c => c.ID === cot.ID_cliente)?.nombre || "-"}</td>
                    <td>
                      {(cot.productos || []).map((p, i) => {
                        const prod = productos.find(pr => pr.ID === p.productoId);
                        return (
                          <div key={i} style={{ marginBottom: 4 }}>
                            {prod?.nombre || ""} x{p.cantidad} <span style={{ color: '#7b1531', fontSize: 12 }}>({p.tipoFigura})</span>
                          </div>
                        );
                      })}
                    </td>
                    <td>{cot.status}</td>
                    <td>
                      <button className="edit-btn" title="Editar" onClick={() => openEditModal(cot)}><FaEdit /></button>
                      <button className="delete-btn" title="Cancelar" onClick={() => handleDelete(cot.ID)}><FaTrash /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal para crear/editar cotización */}
        {(modalOpen === 'add' || modalOpen === 'edit') && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: 520 }}>
              <h2>{modalOpen === 'add' ? 'Nueva Cotización' : 'Editar Cotización'}</h2>
              <form className="user-form" onSubmit={modalOpen === 'add' ? handleAdd : handleEdit}>
                <label>Cliente</label>
                <select
                  className="user-input"
                  name="ID_cliente"
                  value={form.ID_cliente}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecciona un cliente</option>
                  {clientes.map(c => (
                    <option key={c.ID} value={c.ID}>{c.nombre}</option>
                  ))}
                </select>

                <label>Productos</label>
                {form.productos.map((p, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                    <select
                      className="user-input"
                      style={{ minWidth: 120 }}
                      value={p.productoId}
                      onChange={e => handleProductoChange(idx, 'productoId', e.target.value)}
                      required
                    >
                      <option value="">Producto</option>
                      {productos.map(pr => (
                        <option key={pr.ID} value={pr.ID}>{pr.nombre}</option>
                      ))}
                    </select>
                    <input
                      className="user-input"
                      type="number"
                      min={1}
                      style={{ width: 70 }}
                      value={p.cantidad}
                      onChange={e => handleProductoChange(idx, 'cantidad', e.target.value)}
                      placeholder="Cantidad"
                      required
                    />
                    <select
                      className="user-input"
                      style={{ minWidth: 100 }}
                      value={p.tipoFigura}
                      onChange={e => handleProductoChange(idx, 'tipoFigura', e.target.value)}
                      required
                    >
                      <option value="cuadrado">Cuadrado</option>
                      <option value="rectangulo">Rectángulo</option>
                      <option value="circulo">Círculo</option>
                      <option value="ovalo">Óvalo</option>
                      <option value="L">L</option>
                      <option value="L invertida">L invertida</option>
                    </select>
                    <button type="button" className="delete-btn" style={{ minWidth: 32 }} onClick={() => handleRemoveProducto(idx)}><FaTrash /></button>
                  </div>
                ))}
                <button type="button" className="add-btn" style={{ marginBottom: 10 }} onClick={handleAddProducto}>
                  <FaPlus style={{ marginRight: 6 }} /> Agregar producto
                </button>

                <label>Estado</label>
                <select
                  className="user-input"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
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
      </div>
    </div>
  );
};

export default Sells;