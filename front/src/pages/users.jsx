import React, { useState, useRef, useEffect } from "react";
import "../App.css";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaUser,
  FaUserCog,
  FaEdit,
  FaTrashAlt,
  FaSave,
  FaPlus,
  FaSearch,
  FaCheckCircle,
  FaTimesCircle,
  FaTimes,
} from "react-icons/fa";

const Users = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("");
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("");
  const [filterField, setFilterField] = useState("nombre");
  const [userOrder, setUserOrder] = useState("recientes"); // ordenar por fecha
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 8;
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    rol: "",
    contrasena: "",
  });
  const [errorMsg, setErrorMsg] = useState("");
  const menuRef = useRef();
  const navigate = useNavigate();
  const location = useLocation();
  const [showAddModal, setShowAddModal] = useState(false);
  // Confirm modals for activate/deactivate (unified style like Clientes/Ventas)
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [showReactivateConfirm, setShowReactivateConfirm] = useState(false);
  const [reactivateTarget, setReactivateTarget] = useState(null);

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
      const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      };
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
  // rol actual para condicionar visibilidad
  let isAdmin = false;
  try {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    isAdmin = String(u?.rol || "").toLowerCase() === "admin";
  } catch {
    /* ignore */
  }

  // Obtener usuarios desde la BD
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        "https://estadias1-backend-production.up.railway.app/usuarios",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
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
    if (
      !newUser.nombre ||
      !newUser.correo ||
      !newUser.rol ||
      !newUser.contrasena
    ) {
      setErrorMsg("Todos los campos son requeridos");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        "https://estadias1-backend-production.up.railway.app/usuarios",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newUser),
        }
      );
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
      const res = await fetch(
        `https://estadias1-backend-production.up.railway.app/usuarios/${editingUser.ID}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(editingUser),
        }
      );
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
      const res = await fetch(
        `https://estadias1-backend-production.up.railway.app/usuarios/${id}/desactivar`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.mensaje || "Error al desactivar usuario");
      }
      fetchUsers();
      // Cerrar modal de confirmación unificado
      setShowDeactivateConfirm(false);
      setDeactivateTarget(null);
    } catch (err) {
      setErrorMsg(err.message);
      setShowDeactivateConfirm(false);
      setDeactivateTarget(null);
    }
  };

  // Cambiar estatus (reactivar)
  const handleReactivate = async (id) => {
    try {
      const token = localStorage.getItem("token");
      // Usar PATCH a /usuarios/:id y enviar { status: true } para máxima compatibilidad
      const res = await fetch(
        `https://estadias1-backend-production.up.railway.app/usuarios/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: true }),
        }
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.mensaje || "Error al activar usuario");
      }
      fetchUsers();
      // Cerrar modal de confirmación unificado
      setShowReactivateConfirm(false);
      setReactivateTarget(null);
    } catch (err) {
      setErrorMsg(err.message);
      setShowReactivateConfirm(false);
      setReactivateTarget(null);
    }
  };

  // Abrir confirm dialogs (unificados)
  const askDeactivate = (user) => {
    setDeactivateTarget(user);
    setShowDeactivateConfirm(true);
  };
  const askReactivate = (user) => {
    setReactivateTarget(user);
    setShowReactivateConfirm(true);
  };

  // Filtrado avanzado por campo
  const filteredUsers = users.filter((u) => {
    if (!filter) return true;
    if (filterField === "status") {
      const val = u.status ? "activo" : "desactivado";
      return val.toLowerCase().includes(filter.toLowerCase());
    }
    const val = (u[filterField] || "").toString().toLowerCase();
    return val.includes(filter.toLowerCase());
  });

  // Ordenar por fecha de creación (más recientes/antiguos)
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const da = new Date(
      a?.fecha_creacion || a?.createdAt || a?.fecha || 0
    ).getTime();
    const db = new Date(
      b?.fecha_creacion || b?.createdAt || b?.fecha || 0
    ).getTime();
    if (userOrder === "antiguos") return da - db; // más antiguos primero
    return db - da; // por defecto más recientes primero
  });

  // Paginación
  const totalPages = Math.ceil(sortedUsers.length / usersPerPage);
  const paginatedUsers = sortedUsers.slice(
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
              onClick={() => setMobileMenuOpen((v) => !v)}
            >
              <img
                src="https://irp.cdn-website.com/d7ba7f52/dms3rep/multi/265.png"
                alt="Logo"
                className="logo-img"
              />
              <div className="nav-title">USUARIOS</div>
            </div>
            <header className="header">
              <h1>
                USUARIOS <FaUserCog className="iconName" />
              </h1>
            </header>
            <div className={`mobile-menu ${mobileMenuOpen ? "open" : ""}`}>
              <button
                className={`nav-btn${
                  location.pathname === "/home" ? " nav-btn-active" : ""
                }`}
                onClick={() => navigate("/home")}
              >
                Inicio
              </button>
              <button
                className={`nav-btn${
                  location.pathname === "/inventario" ? " nav-btn-active" : ""
                }`}
                onClick={() => navigate("/inventario")}
              >
                Inventario
              </button>
              <button
                className={`nav-btn${
                  location.pathname === "/ventas" ? " nav-btn-active" : ""
                }`}
                onClick={() => navigate("/ventas")}
              >
                Ventas
              </button>
              <button
                className={`nav-btn${
                  location.pathname === "/clientes" ? " nav-btn-active" : ""
                }`}
                onClick={() => navigate("/clientes")}
              >
                Clientes
              </button>
              {isAdmin && (
                <button
                  className={`nav-btn${
                    location.pathname === "/usuarios" ? " nav-btn-active" : ""
                  }`}
                  onClick={() => navigate("/usuarios")}
                >
                  Usuarios
                </button>
              )}
            </div>
          </div>
          <div className="nav-center">
            <button
              className={`nav-btn${
                location.pathname === "/home" ? " nav-btn-active" : ""
              }`}
              onClick={() => navigate("/home")}
            >
              Inicio
            </button>
            <button
              className={`nav-btn${
                location.pathname === "/inventario" ? " nav-btn-active" : ""
              }`}
              onClick={() => navigate("/inventario")}
            >
              Inventario
            </button>
            <button
              className={`nav-btn${
                location.pathname === "/ventas" ? " nav-btn-active" : ""
              }`}
              onClick={() => navigate("/ventas")}
            >
              Ventas
            </button>
            <button
              className={`nav-btn${
                location.pathname === "/clientes" ? " nav-btn-active" : ""
              }`}
              onClick={() => navigate("/clientes")}
            >
              Clientes
            </button>
            {isAdmin && (
              <button
                className={`nav-btn${
                  location.pathname === "/usuarios" ? " nav-btn-active" : ""
                }`}
                onClick={() => navigate("/usuarios")}
              >
                Usuarios
              </button>
            )}
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
              <span
                className="user-name"
                style={{
                  color: "#fff",
                  fontWeight: "bold",
                  whiteSpace: "nowrap",
                }}
              >
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
                <div
                  className="modal-content"
                  style={{
                    maxWidth: 340,
                    padding: "2rem 1.5rem",
                    textAlign: "center",
                  }}
                >
                  <h2
                    style={{
                      color: "#a30015",
                      fontWeight: 800,
                      fontSize: "1.15rem",
                      marginBottom: 18,
                    }}
                  >
                    ¿Cerrar sesión?
                  </h2>
                  <p
                    style={{
                      color: "#7b1531",
                      marginBottom: 22,
                      fontWeight: 600,
                    }}
                  >
                    ¿Estás seguro de que deseas cerrar sesión?
                  </p>
                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      justifyContent: "center",
                    }}
                  >
                    <button
                      className="delete-btn"
                      style={{ minWidth: 90 }}
                      onClick={confirmLogout}
                    >
                      Cerrar sesión
                    </button>
                    <button
                      className="cancel-btn"
                      style={{ minWidth: 90 }}
                      onClick={cancelLogout}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="users-container">
        {/* Botón para abrir el modal */}
        <div className="top-actions">
          <button
            className="open-add-modal-btn"
            onClick={() => setShowAddModal(true)}
          >
            <FaPlus /> Nuevo usuario
          </button>
        </div>
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
                  onChange={(e) =>
                    setNewUser({ ...newUser, nombre: e.target.value })
                  }
                  required
                  className="user-input"
                />
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  value={newUser.correo}
                  onChange={(e) =>
                    setNewUser({ ...newUser, correo: e.target.value })
                  }
                  required
                  className="user-input"
                />
                <input
                  type="tel"
                  placeholder="Teléfono"
                  value={newUser.telefono}
                  onChange={(e) =>
                    setNewUser({ ...newUser, telefono: e.target.value })
                  }
                  className="user-input"
                  pattern="[0-9]{10,15}"
                  maxLength={15}
                />
                <input
                  type="password"
                  placeholder="Contraseña"
                  value={newUser.contrasena}
                  onChange={(e) =>
                    setNewUser({ ...newUser, contrasena: e.target.value })
                  }
                  required
                  className="user-input"
                />
                <select
                  value={newUser.rol}
                  onChange={(e) =>
                    setNewUser({ ...newUser, rol: e.target.value })
                  }
                  required
                  className="user-input"
                >
                  <option value="">Seleccionar rol</option>
                  <option value="admin">Administrador</option>
                  <option value="usuario">Empleado</option>
                </select>
                {errorMsg && <div className="error-msg">{errorMsg}</div>}
                <button type="submit" className="add-btn">
                  <FaPlus /> Agregar usuario
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancelar
                </button>
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
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, nombre: e.target.value })
                  }
                  required
                  className="user-input"
                />
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  value={editingUser.correo}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, correo: e.target.value })
                  }
                  required
                  className="user-input"
                />
                <input
                  type="tel"
                  placeholder="Teléfono"
                  value={editingUser.telefono || ""}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, telefono: e.target.value })
                  }
                  className="user-input"
                  pattern="[0-9]{10,15}"
                  maxLength={15}
                />
                <select
                  value={editingUser.rol}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, rol: e.target.value })
                  }
                  required
                  className="user-input"
                >
                  <option value="admin">Administrador</option>
                  <option value="usuario">Empleado</option>
                </select>
                {errorMsg && <div className="error-msg">{errorMsg}</div>}
                <button type="submit" className="save-btn">
                  <FaSave /> Guardar
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setEditingUser(null)}
                >
                  Cancelar
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Filtro de usuarios */}
        <div className="users-table-filter-row users-table-filter-row-attached">
          <span className="users-filter-title">
            <FaSearch style={{ marginRight: 4 }} /> Filtrar:
          </span>
          <select
            className="users-table-filter-select"
            value={filterField}
            onChange={(e) => {
              setFilterField(e.target.value);
              setFilter("");
              setCurrentPage(1);
            }}
          >
            {/* Ordenar por fecha */}
            <select
              className="users-table-filter-select"
              value={userOrder}
              onChange={(e) => {
                setUserOrder(e.target.value);
                setCurrentPage(1);
              }}
              title="Ordenar por fecha"
            >
              <option value="recientes">Más recientes</option>
              <option value="antiguos">Más antiguos</option>
            </select>
            <option value="nombre">Nombre</option>
            <option value="correo">Correo</option>
            <option value="rol">Rol</option>
            onClick=
            {() => {
              setFilter("");
              setCurrentPage(1);
            }}
            <option value="status">Estado</option>
          </select>
          {filterField === "rol" ? (
            <select
              className="users-table-filter-input"
              value={filter}
              onChange={(e) => {
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
              onChange={(e) => {
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
              onChange={(e) => {
                setFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="users-table-filter-input"
            />
          )}
          <button
            type="button"
            className="users-filter-clear-btn"
            onClick={() => {
              setFilter("");
              setCurrentPage(1);
            }}
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
              <tr>
                <td colSpan="8">No hay usuarios registrados</td>
              </tr>
            ) : (
              paginatedUsers.map((user) => (
                <tr key={user.ID}>
                  <td>{user.ID}</td>
                  <td>{user.nombre}</td>
                  <td>{user.correo}</td>
                  <td>{user.telefono || "-"}</td>
                  <td>{user.rol}</td>
                  <td>
                    <span
                      className={`status-badge ${
                        user.status
                          ? "status-activo"
                          : "status-cancelado status-desactivado"
                      }`}
                    >
                      {user.status ? "Activo" : "Desactivado"}
                    </span>
                  </td>
                  <td>
                    {user.fecha_creacion
                      ? new Date(user.fecha_creacion).toLocaleDateString(
                          "es-MX",
                          { year: "numeric", month: "short", day: "numeric" }
                        )
                      : ""}
                  </td>
                  <td>
                    <div className="table-actions">
                      {/* Solo permite editar si NO es el usuario actual */}
                      {user.ID !== currentUser?.ID && (
                        <button
                          className="edit-btn"
                          onClick={() => handleEdit(user)}
                          title="Editar usuario"
                        >
                          <FaEdit />
                        </button>
                      )}
                      {/* Solo permite desactivar/reactivar si NO es el usuario actual */}
                      {user.ID !== currentUser?.ID &&
                        (user.status === false ? (
                          <button
                            className="add-btn"
                            onClick={() => askReactivate(user)}
                            title="Reactivar usuario"
                          >
                            <FaCheckCircle />
                          </button>
                        ) : (
                          <button
                            className="delete-btn"
                            onClick={() => askDeactivate(user)}
                            title="Desactivar usuario"
                          >
                            <FaTrashAlt />
                          </button>
                        ))}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Confirmación desactivar (estilo unificado) */}
        {showDeactivateConfirm && (
          <div className="modal-overlay">
            <div
              className="modal-content"
              style={{
                width: 380,
                maxWidth: "90vw",
                color: "#222",
                position: "relative",
              }}
            >
              <div className="modal-close-row">
                <button
                  className="modal-close-btn"
                  title="Cancelar"
                  aria-label="Cancelar"
                  onClick={() => {
                    setShowDeactivateConfirm(false);
                    setDeactivateTarget(null);
                  }}
                ></button>
              </div>
              <h2
                style={{ color: "#111", fontSize: "1.05rem", marginBottom: 10 }}
              >
                Confirmar desactivación
              </h2>
              <p style={{ marginBottom: 16 }}>
                ¿Seguro que deseas desactivar al usuario{" "}
                {deactivateTarget?.nombre}? Podrás reactivarlo después.
              </p>
              <div
                style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}
              >
                <button
                  className="cancel-btn"
                  onClick={() => {
                    setShowDeactivateConfirm(false);
                    setDeactivateTarget(null);
                  }}
                >
                  No, volver
                </button>
                <button
                  className="delete-btn"
                  onClick={async () => {
                    await handleDeactivate(
                      deactivateTarget?.ID ?? deactivateTarget?.id
                    );
                  }}
                >
                  Sí, desactivar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmación reactivar (estilo unificado) */}
        {showReactivateConfirm && (
          <div className="modal-overlay">
            <div
              className="modal-content"
              style={{
                width: 380,
                maxWidth: "90vw",
                color: "#222",
                position: "relative",
              }}
            >
              <div className="modal-close-row">
                <button
                  className="modal-close-btn"
                  title="Cancelar"
                  aria-label="Cancelar"
                  onClick={() => {
                    setShowReactivateConfirm(false);
                    setReactivateTarget(null);
                  }}
                ></button>
              </div>
              <h2
                style={{ color: "#111", fontSize: "1.05rem", marginBottom: 10 }}
              >
                Confirmar reactivación
              </h2>
              <p style={{ marginBottom: 16 }}>
                ¿Deseas reactivar al usuario {reactivateTarget?.nombre}?
              </p>
              <div
                style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}
              >
                <button
                  className="cancel-btn"
                  onClick={() => {
                    setShowReactivateConfirm(false);
                    setReactivateTarget(null);
                  }}
                >
                  No, volver
                </button>
                <button
                  className="add-btn"
                  onClick={async () => {
                    await handleReactivate(
                      reactivateTarget?.ID ?? reactivateTarget?.id
                    );
                  }}
                >
                  Sí, reactivar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div
            style={{
              margin: "16px 0",
              display: "flex",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </button>
            <span>
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Users;
