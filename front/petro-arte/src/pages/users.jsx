import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaUserCog, FaEdit, FaTrashAlt, FaSave, FaPlus } from "react-icons/fa";

const Users = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("");
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({ username: "", email: "", rol: "" });
  const menuRef = useRef();
  const navigate = useNavigate();

  // Cargar usuario actual
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.nombre) setUserName(user.nombre);
  }, []);

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

  // Cerrar menú si se da clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setMenuOpen(false);
    navigate("/");
  };

  const handleConfig = () => {
    setMenuOpen(false);
    alert("Configuración próximamente");
  };

  // Simulación de datos (puedes conectar con tu backend aquí)
  useEffect(() => {
    setUsers([
      { id: 1, username: "admin", email: "admin@correo.com", rol: "Administrador" },
      { id: 2, username: "juan", email: "juan@correo.com", rol: "Empleado" },
    ]);
  }, []);

  // Agregar nuevo usuario
  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newUser.username || !newUser.email || !newUser.rol) return alert("Completa todos los campos");
    const nuevo = { ...newUser, id: Date.now() };
    setUsers([...users, nuevo]);
    setNewUser({ username: "", email: "", rol: "" });
  };

  // Editar usuario
  const handleEdit = (user) => setEditingUser(user);

  // Guardar edición
  const handleSaveEdit = () => {
    setUsers(users.map(u => (u.id === editingUser.id ? editingUser : u)));
    setEditingUser(null);
  };

const handleDeactivate = (id) => {
  if (window.confirm("¿Seguro que quieres desactivar este usuario?")) {
    setUsers(users.map(u => u.id === id ? { ...u, status: false } : u));
    // Aquí deberías hacer la petición al backend para desactivar realmente el usuario
  }
};

const handleReactivate = (id) => {
  if (window.confirm("¿Seguro que quieres reactivar este usuario?")) {
    setUsers(users.map(u => u.id === id ? { ...u, status: true } : u));
    // Aquí deberías hacer la petición al backend para reactivar realmente el usuario
  }
};

  const [showAddModal, setShowAddModal] = useState(false);
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
              <button className="nav-btn" onClick={() => navigate("/ventas")}>Ventas</button>
              <button className="nav-btn" onClick={() => navigate("/clientes")}>Clientes</button>
              <button className="nav-btn" onClick={() => navigate("/home")}>Inicio</button>
            </div>
          </div>

          <div className="nav-center">
            <button className="nav-btn" onClick={() => navigate("/ventas")}>Ventas</button>
            <button className="nav-btn" onClick={() => navigate("/clientes")}>Clientes</button>
            <button className="nav-btn" onClick={() => navigate("/home")}>Inicio</button>
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
      <form className="user-form" onSubmit={e => { handleAddUser(e); setShowAddModal(false); }}>
        <input
          type="text"
          placeholder="Nombre de usuario"
          value={newUser.username}
          onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
          required
          className="user-input"
        />
        <input
          type="email"
          placeholder="Correo electrónico"
          value={newUser.email}
          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
          required
          className="user-input"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={newUser.password}
          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
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
          <option value="Administrador">Administrador</option>
          <option value="Empleado">Empleado</option>
        </select>
        <button type="submit" className="add-btn"><FaPlus /> Agregar usuario</button>
        <button type="button" className="cancel-btn" onClick={() => setShowAddModal(false)}>Cancelar</button>
      </form>
    </div>
  </div>
)} 

{/* Tabla de usuarios */}
<table className="users-table">
  <thead>
    <tr>
      <th>ID</th>
      <th>Usuario</th>
      <th>Email</th>
      <th>Rol</th>
      <th>Estado</th>
      <th>Acciones</th>
    </tr>
  </thead>
  <tbody>
    {users.length === 0 ? (
      <tr><td colSpan="6">No hay usuarios registrados</td></tr>
    ) : (
      users.map(user => (
        <tr key={user.id}>
          <td>{user.id}</td>
          <td>
            {editingUser?.id === user.id ? (
              <input
                type="text"
                value={editingUser.username}
                onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
              />
            ) : (
              user.username
            )}
          </td>
          <td>
            {editingUser?.id === user.id ? (
              <input
                type="email"
                value={editingUser.email}
                onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
              />
            ) : (
              user.email
            )}
          </td>
          <td>
            {editingUser?.id === user.id ? (
              <select
                value={editingUser.rol}
                onChange={(e) => setEditingUser({ ...editingUser, rol: e.target.value })}
              >
                <option value="Administrador">Administrador</option>
                <option value="Empleado">Empleado</option>
              </select>
            ) : (
              user.rol
            )}
          </td>
          <td>
            {user.status === false ? (
              <span style={{ color: "#d90429", fontWeight: "bold" }}>Desactivado</span>
            ) : (
              <span style={{ color: "#2ecc40", fontWeight: "bold" }}>Activo</span>
            )}
          </td>
          <td>
            {editingUser?.id === user.id ? (
              <button className="save-btn" onClick={handleSaveEdit}><FaSave /></button>
            ) : (
              <button className="edit-btn" onClick={() => handleEdit(user)}><FaEdit /></button>
            )}
            {/* Solo permite desactivar/reactivar si NO es el usuario actual */}
       {user.id !== JSON.parse(localStorage.getItem("user"))?.id && (
  user.status === false ? (
    <button 
      className="action-btn reactivate-btn" 
      onClick={() => handleReactivate(user.id)}
      title="Reactivar usuario"
    >
      <FaPlus />
    </button>
  ) : (
    <button 
      className="action-btn delete-btn" 
      onClick={() => handleDeactivate(user.id)}
      title="Desactivar usuario"
    >
      <FaTrashAlt />
    </button>
  )
)}

          </td>
        </tr>
      ))
    )}
  </tbody>
</table>
      </main>
    </div>
  );
};

export default Users;
