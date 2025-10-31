import React, { useState, useRef, useEffect } from "react";
import "../App.css";
import { useNavigate, useLocation } from "react-router-dom";
import { FaUser, FaUserCog, FaEdit, FaTrashAlt, FaSave, FaPlus, FaSearch, FaCheckCircle, FaTimesCircle, FaTimes } from "react-icons/fa";

const Users = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("");
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("");
  const [filterField, setFilterField] = useState("nombre");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 8;
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({ nombre: "", correo: "", telefono: "", rol: "", contrasena: "" });
  const [errorMsg, setErrorMsg] = useState("");
  const menuRef = useRef();
  const navigate = useNavigate();
  const location = useLocation();
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, userId: null });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.nombre) setUserName(user.nombre);
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


  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
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

  // Obtener usuarios desde la BD
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3000/usuarios", {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Error al obtener usuarios");
      const data = await res.json();
      setUsers(data.usuarios || []);
    } catch {
      setUsers([]);
      setErrorMsg("No se pudo cargar usuarios");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Agregar usuario
  const handleAddUser = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (!newUser.nombre || !newUser.correo || !newUser.rol || !newUser.contrasena) {
      setErrorMsg("Todos los campos son requeridos");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3000/usuarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.mensaje || "Error al agregar usuario");
      }
      setNewUser({ nombre: "", correo: "", rol: "", contrasena: "" });
      setShowAddModal(false);
      fetchUsers();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleEdit = (user) => setEditingUser({ ...user });

  // Editar usuario
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (!editingUser.nombre || !editingUser.correo || !editingUser.rol) {
      setErrorMsg("Completa todos los campos");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3000/usuarios/${editingUser.ID}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(editingUser)
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.mensaje || "Error al editar usuario");
      }
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // Cambiar estatus (desactivar)
  const handleDeactivate = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3000/usuarios/${id}/desactivar`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.mensaje || "Error al desactivar usuario");
      }
      fetchUsers();
      setConfirmModal({ open: false, userId: null, type: null });
    } catch (err) {
      setErrorMsg(err.message);
      setConfirmModal({ open: false, userId: null, type: null });
    }
  };

  // Cambiar estatus (reactivar)
  const handleReactivate = async (id) => {
    try {
      const token = localStorage.getItem("token");
      // Usar PATCH a /usuarios/:id y enviar { status: true } para máxima compatibilidad
      const res = await fetch(`http://localhost:3000/usuarios/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: true })
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.mensaje || "Error al activar usuario");
      }
      fetchUsers();
      setConfirmModal({ open: false, userId: null, type: null });
    } catch (err) {
      setErrorMsg(err.message);
      setConfirmModal({ open: false, userId: null, type: null });
    }
  };

  // Filtrado avanzado por campo
  const filteredUsers = users.filter(u => {
    if (!filter) return true;
    if (filterField === "status") {
      const val = u.status ? "activo" : "desactivado";
      return val.toLowerCase().includes(filter.toLowerCase());
    }
    const val = (u[filterField] || "").toString().toLowerCase();
    return val.includes(filter.toLowerCase());
  });

  // Paginación
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  // Usuario actual
  const currentUser = JSON.parse(localStorage.getItem("user"));
  // En la tabla de usuarios, agregar columna Teléfono
  // En el formulario de alta y edición, agregar input de teléfono

    return (
    <div className="-bg">
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
              <div className="nav-title">USUARIOS</div>
            </div>
            <header className="header">
              <h1>USUARIOS <FaUserCog className="iconName" /></h1>
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


      <main className="users-container">
        {/* Botón para abrir el modal */}
        <button className="open-add-modal-btn" onClick={() => setShowAddModal(true)}>
          <FaPlus /> Nuevo usuario
        </button>
        {/* Modal para agregar usuario */}
        {showAddModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Agregar usuario</h2>
              <form className="user-form" onSubmit={handleAddUser}>
                <input
                  type="text"
                  placeholder="Nombre"
                  value={newUser.nombre}
                  onChange={(e) => setNewUser({ ...newUser, nombre: e.target.value })}
                  required
                  className="user-input"
                />
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  value={newUser.correo}
                  onChange={(e) => setNewUser({ ...newUser, correo: e.target.value })}
                  required
                  className="user-input"
                />
                <input
                  type="tel"
                  placeholder="Teléfono"
                  value={newUser.telefono}
                  onChange={(e) => setNewUser({ ...newUser, telefono: e.target.value })}
                  className="user-input"
                  pattern="[0-9]{10,15}"
                  maxLength={15}
                />
                <input
                  type="password"
                  placeholder="Contraseña"
                  value={newUser.contrasena}
                  onChange={(e) => setNewUser({ ...newUser, contrasena: e.target.value })}
                  required
                  className="user-input"
                />
                <select
                  value={newUser.rol}
                  onChange={(e) => setNewUser({ ...newUser, rol: e.target.value })}
                  required
                  className="user-input"
                >
                  <option value="">Seleccionar rol</option>
                  <option value="admin">Administrador</option>
                  <option value="usuario">Empleado</option>
                </select>
                {errorMsg && <div className="error-msg">{errorMsg}</div>}
                <button type="submit" className="add-btn"><FaPlus /> Agregar usuario</button>
                <button type="button" className="cancel-btn" onClick={() => setShowAddModal(false)}>Cancelar</button>
              </form>
            </div>
          </div>
        )}

        {/* Modal para editar usuario */}
        {editingUser && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Editar usuario</h2>
              <form className="user-form" onSubmit={handleSaveEdit}>
                <input
                  type="text"
                  placeholder="Nombre"
                  value={editingUser.nombre}
                  onChange={(e) => setEditingUser({ ...editingUser, nombre: e.target.value })}
                  required
                  className="user-input"
                />
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  value={editingUser.correo}
                  onChange={(e) => setEditingUser({ ...editingUser, correo: e.target.value })}
                  required
                  className="user-input"
                />
                <input
                  type="tel"
                  placeholder="Teléfono"
                  value={editingUser.telefono || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, telefono: e.target.value })}
                  className="user-input"
                  pattern="[0-9]{10,15}"
                  maxLength={15}
                />
                <select
                  value={editingUser.rol}
                  onChange={(e) => setEditingUser({ ...editingUser, rol: e.target.value })}
                  required
                  className="user-input"
                >
                  <option value="admin">Administrador</option>
                  <option value="usuario">Empleado</option>
                </select>
                {errorMsg && <div className="error-msg">{errorMsg}</div>}
                <button type="submit" className="save-btn"><FaSave /> Guardar</button>
                <button type="button" className="cancel-btn" onClick={() => setEditingUser(null)}>Cancelar</button>
              </form>
            </div>
          </div>
        )}


    {/* Filtro de usuarios */}
    <div className="users-table-filter-row users-table-filter-row-attached">
      <span className="users-filter-title"><FaSearch style={{marginRight: 4}}/> Filtrar:</span>
      <select
        className="users-table-filter-select"
        value={filterField}
        onChange={e => {
          setFilterField(e.target.value);
          setFilter("");
          setCurrentPage(1);
        }}
      >
        <option value="nombre">Nombre</option>
        <option value="correo">Correo</option>
  <option value="rol">Rol</option>
  <option value="telefono">Teléfono</option>
  <option value="status">Estado</option>
      </select>
      {filterField === "rol" ? (
        <select
          className="users-table-filter-input"
          value={filter}
          onChange={e => {
            setFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">Todos</option>
          <option value="admin">Administrador</option>
          <option value="usuario">Empleado</option>
        </select>
      ) : filterField === "status" ? (
        <select
          className="users-table-filter-input"
          value={filter}
          onChange={e => {
            setFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">Todos</option>
          <option value="activo">Activo</option>
          <option value="desactivado">Desactivado</option>
        </select>
      ) : (
        <input
          type="text"
          placeholder={`Buscar por ${filterField}...`}
          value={filter}
          onChange={e => {
            setFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="users-table-filter-input"
        />
      )}
      <button
        type="button"
        className="users-filter-clear-btn"
        onClick={() => { setFilter(""); setCurrentPage(1); }}
        title="Limpiar filtro"
      >
        <FaTimes /> Limpiar
      </button>
    </div>

        {/* Tabla de usuarios (estilo unificado) */}
        <table className="cotizaciones-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Fecha de creación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.length === 0 ? (
              <tr><td colSpan="8">No hay usuarios registrados</td></tr>
            ) : (
              paginatedUsers.map(user => (
                <tr key={user.ID}>
                  <td>{user.ID}</td>
                  <td>{user.nombre}</td>
                  <td>{user.correo}</td>
                  <td>{user.telefono || "-"}</td>
                  <td>{user.rol}</td>
                  <td>
                    <span className={`status-badge ${user.status ? 'status-activo' : 'status-cancelado status-desactivado'}`}>
                      {user.status ? 'Activo' : 'Desactivado'}
                    </span>
                  </td>
                  <td>{user.fecha_creacion ? new Date(user.fecha_creacion).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}</td>
                  <td>
                    {/* Solo permite editar si NO es el usuario actual */}
                    {user.ID !== currentUser?.ID && (
                      <button className="edit-btn" onClick={() => handleEdit(user)}><FaEdit /></button>
                    )}
                    {/* Solo permite desactivar/reactivar si NO es el usuario actual */}
                    {user.ID !== currentUser?.ID && (
                      user.status === false ? (
                        <button 
                          className="action-btn reactivate-btn" 
                          onClick={() => setConfirmModal({ open: true, userId: user.ID, type: 'activar' })}
                          title="Reactivar usuario"
                        >
                          <FaCheckCircle />
                        </button>
                      ) : (
                        <button 
                          className="action-btn delete-btn" 
                          onClick={() => setConfirmModal({ open: true, userId: user.ID, type: 'desactivar' })}
                          title="Desactivar usuario"
                        >
                          <FaTrashAlt />
                        </button>
                      )
                    )}
                    
      {/* Modal de confirmación para activar usuario */}
      {confirmModal.open && confirmModal.type === 'activar' && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: 350, textAlign: 'center'}}>
            <FaCheckCircle size={48} color="#2ecc40" style={{marginBottom: 12}}/>
            <h2 style={{marginBottom: 10, color: '#222'}}>Confirmar activación</h2>
            <p style={{marginBottom: 18}}>¿Estás seguro que deseas <b>activar</b> este usuario?</p>
            <div style={{display: 'flex', gap: 10}}>
              <button className="add-btn" style={{flex: 1}} onClick={() => handleReactivate(confirmModal.userId)}>
                <FaCheckCircle style={{marginRight: 6}}/> Activar
              </button>
              <button className="cancel-btn" style={{flex: 1}} onClick={() => setConfirmModal({ open: false, userId: null, type: null })}>
                <FaTimesCircle style={{marginRight: 6}}/> Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal de confirmación para desactivar usuario */}
      {confirmModal.open && confirmModal.type === 'desactivar' && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: 350, textAlign: 'center'}}>
            <FaTrashAlt size={48} color="#a30015" style={{marginBottom: 12}}/>
            <h2 style={{marginBottom: 10, color: '#222'}}>Confirmar desactivación</h2>
            <p style={{marginBottom: 18}}>¿Estás seguro que deseas <b>desactivar</b> este usuario?</p>
            <div style={{display: 'flex', gap: 10}}>
              <button className="delete-btn" style={{flex: 1}} onClick={() => handleDeactivate(confirmModal.userId)}>
                <FaTrashAlt style={{marginRight: 6}}/> Desactivar
              </button>
              <button className="cancel-btn" style={{flex: 1}} onClick={() => setConfirmModal({ open: false, userId: null, type: null })}>
                <FaTimesCircle style={{marginRight: 6}}/> Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Paginación */}
        {totalPages > 1 && (
          <div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 8 }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </button>
            <span>Página {currentPage} de {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default Users;
