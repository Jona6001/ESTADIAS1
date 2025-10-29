

import React, { useState, useRef, useEffect } from "react";
import "../App.css";
import { useNavigate, useLocation } from "react-router-dom";
import { FaUser, FaUsers, FaEdit, FaTrash, FaPlus, FaSave, FaTimes } from "react-icons/fa";

const API_URL = "http://localhost:3000/clientes";
const initialForm = { nombre: "", telefono: "", rfc: "", direccion: "" };

const Clients = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(null); // null, 'add', 'edit'
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const menuRef = useRef();
  const navigate = useNavigate();
  const location = useLocation();

  // Obtener usuario y proteger pantalla
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.nombre) setUserName(user.nombre);
    fetchClientes();
    // eslint-disable-next-line
  }, [navigate]);

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

  // Cerrar menú usuario al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Obtener clientes
  const fetchClientes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(API_URL, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setClientes(data.clientes || []);
    } catch {
      setErrorMsg("Error al cargar clientes");
    }
    setLoading(false);
  };

  // Abrir modal para crear
  const openAddModal = () => {
    setForm(initialForm);
    setEditId(null);
    setModalOpen('add');
    setErrorMsg("");
  };

  // Abrir modal para editar
  const openEditModal = (cliente) => {
    setForm({
      nombre: cliente.nombre,
      telefono: cliente.telefono,
      rfc: cliente.rfc || "",
      direccion: cliente.direccion
    });
    setEditId(cliente.id);
    setModalOpen('edit');
    setErrorMsg("");
  };

  // Cerrar modal
  const closeModal = () => {
    setModalOpen(null);
    setEditId(null);
    setForm(initialForm);
    setErrorMsg("");
  };

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Crear cliente
  const handleAdd = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje || "Error");
      closeModal();
      fetchClientes();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // Editar cliente
  const handleEdit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/${editId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje || "Error");
      closeModal();
      fetchClientes();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // Desactivar cliente
  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que deseas desactivar este cliente?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje || "Error");
      fetchClientes();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // Navbar y layout igual que antes
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

  return (
    <div className="home-bg">
      <nav className="main-navbar guinda-navbar">
        <div className="nav-container">
          {/* Logo que funciona como botón móvil */}
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
              <div className="nav-title">CLIENTES</div>
            </div>
            <header className="header">
              <h1>CLIENTES <FaUsers className="iconName" /></h1>
            </header>
            {/* Menú desplegable móvil */}
            <div className={`mobile-menu ${mobileMenuOpen ? "open" : ""}`}>
              <button className={`nav-btn${location.pathname === "/home" ? " nav-btn-active" : ""}`} onClick={() => navigate("/home")}>Inicio</button>
              <button className={`nav-btn${location.pathname === "/inventario" ? " nav-btn-active" : ""}`} onClick={() => navigate("/inventario")}>Inventario</button>
              <button className={`nav-btn${location.pathname === "/ventas" ? " nav-btn-active" : ""}`} onClick={() => navigate("/ventas")}>Ventas</button>
              <button className={`nav-btn${location.pathname === "/clientes" ? " nav-btn-active" : ""}`} onClick={() => navigate("/clientes")}>Clientes</button>
              <button className={`nav-btn${location.pathname === "/usuarios" ? " nav-btn-active" : ""}`} onClick={() => navigate("/usuarios")}>Usuarios</button>
            </div>
          </div>
          {/* Botones normales (ocultos en móvil) */}
          <div className="nav-center">
            <button className={`nav-btn${location.pathname === "/home" ? " nav-btn-active" : ""}`} onClick={() => navigate("/home")}>Inicio</button>
            <button className={`nav-btn${location.pathname === "/inventario" ? " nav-btn-active" : ""}`} onClick={() => navigate("/inventario")}>Inventario</button>
            <button className={`nav-btn${location.pathname === "/ventas" ? " nav-btn-active" : ""}`} onClick={() => navigate("/ventas")}>Ventas</button>
            <button className={`nav-btn${location.pathname === "/clientes" ? " nav-btn-active" : ""}`} onClick={() => navigate("/clientes")}>Clientes</button>
            <button className={`nav-btn${location.pathname === "/usuarios" ? " nav-btn-active" : ""}`} onClick={() => navigate("/usuarios")}>Usuarios</button>
          </div>
          {/* FECHA Y HORA */}
          <div className="nav-datetime">
            <span>{dateStr}</span>
            <span>{timeStr}</span>
          </div>
          {/* Botón usuario */}
          <div className="nav-user" ref={menuRef}>
            <button className="user-btn" onClick={() => setMenuOpen(v => !v)}>
              <FaUser size={28} color="#fff" />
            </button>
            {userName && (
              <span className="user-name" style={{ color: "#fff", fontWeight: "bold", whiteSpace: "nowrap" }} >
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

      {/* Contenido principal: tabla de clientes */}
      <div style={{ padding: 40, maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 18 }}>
          <button className="add-btn" onClick={openAddModal}>
            <FaPlus style={{ marginRight: 6 }} /> Nuevo Cliente
          </button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="users-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>RFC</th>
                <th>Dirección</th>
                <th>Status</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6">Cargando...</td></tr>
              ) : clientes.length === 0 ? (
                <tr><td colSpan="6">No hay clientes registrados</td></tr>
              ) : (
                clientes.map(cliente => (
                  <tr key={cliente.id} style={cliente.status === false ? { opacity: 0.5, background: "#fde8eb" } : {}}>
                    <td>{cliente.nombre}</td>
                    <td>{cliente.telefono}</td>
                    <td>{cliente.rfc || "-"}</td>
                    <td>{cliente.direccion}</td>
                    <td>{cliente.status ? "Activo" : "Desactivado"}</td>
                    <td>
                      <button className="edit-btn" title="Editar" onClick={() => openEditModal(cliente)}><FaEdit /></button>
                      <button className="delete-btn" title="Desactivar" onClick={() => handleDelete(cliente.id)} disabled={!cliente.status}><FaTrash /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal para crear cliente */}
        {modalOpen === 'add' && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: 420 }}>
              <h2>Nuevo Cliente</h2>
              <form className="user-form" onSubmit={handleAdd}>
                <input
                  className="user-input"
                  type="text"
                  name="nombre"
                  placeholder="Nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  required
                />
                <input
                  className="user-input"
                  type="tel"
                  name="telefono"
                  placeholder="Teléfono (10 dígitos)"
                  value={form.telefono}
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
                    setForm({ ...form, telefono: val });
                  }}
                  pattern="[0-9]{10}"
                  maxLength={10}
                  required
                  inputMode="numeric"
                  autoComplete="off"
                />
                <input
                  className="user-input"
                  type="text"
                  name="rfc"
                  placeholder="RFC (opcional)"
                  value={form.rfc}
                  onChange={handleChange}
                />
                <input
                  className="user-input"
                  type="text"
                  name="direccion"
                  placeholder="Dirección"
                  value={form.direccion}
                  onChange={handleChange}
                  required
                />
                {errorMsg && <div style={{ color: "#a30015", marginBottom: 8 }}>{errorMsg}</div>}
                <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
                  <button type="submit" className="add-btn" style={{ flex: 1 }}>
                    <FaPlus style={{ marginRight: 6 }} /> Agregar
                  </button>
                  <button type="button" className="cancel-btn" onClick={closeModal} style={{ flex: 1 }}>
                    <FaTimes style={{ marginRight: 6 }} /> Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal para editar cliente */}
        {modalOpen === 'edit' && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: 420 }}>
              <h2>Editar Cliente</h2>
              <form className="user-form" onSubmit={handleEdit}>
                <input
                  className="user-input"
                  type="text"
                  name="nombre"
                  placeholder="Nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  required
                />
                <input
                  className="user-input"
                  type="tel"
                  name="telefono"
                  placeholder="Teléfono (10 dígitos)"
                  value={form.telefono}
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
                    setForm({ ...form, telefono: val });
                  }}
                  pattern="[0-9]{10}"
                  maxLength={10}
                  required
                  inputMode="numeric"
                  autoComplete="off"
                />
                <input
                  className="user-input"
                  type="text"
                  name="rfc"
                  placeholder="RFC (opcional)"
                  value={form.rfc}
                  onChange={handleChange}
                />
                <input
                  className="user-input"
                  type="text"
                  name="direccion"
                  placeholder="Dirección"
                  value={form.direccion}
                  onChange={handleChange}
                  required
                />
                {errorMsg && <div style={{ color: "#a30015", marginBottom: 8 }}>{errorMsg}</div>}
                <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
                  <button type="submit" className="add-btn" style={{ flex: 1 }}>
                    <FaSave style={{ marginRight: 6 }} /> Guardar
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

export default Clients;