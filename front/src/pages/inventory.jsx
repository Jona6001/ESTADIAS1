import React, { useState, useRef, useEffect } from "react";
import "../App.css";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaUser,
  FaBoxes,
  FaEdit,
  FaTrash,
  FaPlus,
  FaSave,
  FaTimes,
} from "react-icons/fa";
import { fetchWithAuth } from "../utils/auth";

const API_URL = "https://estadias1-backend-production.up.railway.app/productos";

const initialForm = {
  tipoMaterial: "",
  nombre: "",
  unidadMedida: "piezas", // piezas o m2
  descripcion: "",
  imagen: "",
  cantidad_piezas: "",
  cantidad_m2: "",
  medida_por_unidad: "",
  precio: "",
};

const Inventory = () => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(null); // null, 'add', 'edit'
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [showSecondDeleteConfirm, setShowSecondDeleteConfirm] = useState(false);
  // Filtro
  const [filterText, setFilterText] = useState("");
  const [filterField, setFilterField] = useState("nombre");
  const menuRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.nombre) setUserName(user.nombre);
    fetchProductos();
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

  // CRUD Productos
  const fetchProductos = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(API_URL, navigate);
      const data = await res.json().catch(() => ({}));
      const listado = Array.isArray(data?.productos)
        ? data.productos
        : Array.isArray(data)
        ? data
        : [];
      setProductos(listado);
    } catch (err) {
      if (err.message === "Sesión expirada") {
        return;
      }
      setProductos([]);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setForm(initialForm);
    setEditId(null);
    setModalOpen("add");
    setErrorMsg("");
  };

  const openEditModal = (producto) => {
    // Detectar unidad de medida correctamente
    let unidad = "piezas";
    let cantPiezas = "";
    
    if (producto.cantidad_m2 !== null && producto.medida_por_unidad !== null) {
      // Es por m²
      unidad = "m2";
      cantPiezas = producto.cantidad_m2 ?? "";
    } else if (producto.cantidad_piezas !== null && producto.cantidad_m2 === null) {
      // Es por piezas
      unidad = "piezas";
      cantPiezas = producto.cantidad_piezas ?? "";
    }

    setForm({
      tipoMaterial: producto.tipoMaterial || "",
      nombre: producto.nombre || "",
      unidadMedida: unidad,
      descripcion: producto.descripcion || "",
      imagen: producto.imagen || "",
      cantidad_piezas: cantPiezas,
      medida_por_unidad: producto.medida_por_unidad ?? "",
      precio: producto.precio ?? "",
    });
    setEditId(producto.ID || producto.id);
    setModalOpen("edit");
    setErrorMsg("");
  };

  // Reactivación eliminada: ya no se maneja estado de producto

  const closeModal = () => {
    setModalOpen(null);
    setEditId(null);
    setForm(initialForm);
    setErrorMsg("");
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Imagen: permite pegar URL o subir archivo (solo URL por simplicidad)
  const handleImageChange = (e) => {
    setForm({ ...form, imagen: e.target.value });
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    
    // Validación frontend
    if (!form.tipoMaterial || !form.nombre || !form.unidadMedida) {
      setErrorMsg(
        "Los campos tipoMaterial, nombre y unidadMedida son requeridos"
      );
      return;
    }

    // Validar precio
    const precioNum = Number(form.precio);
    if (isNaN(precioNum) || precioNum <= 0) {
      setErrorMsg("El precio debe ser un número válido mayor que 0");
      return;
    }

    // Validar cantidad según unidad
    if (form.unidadMedida === "piezas") {
      const cantNum = Number(form.cantidad_piezas);
      if (isNaN(cantNum) || cantNum < 0) {
        setErrorMsg("Cantidad de piezas debe ser un número válido");
        return;
      }
    } else if (form.unidadMedida === "m2") {
      const cantM2 = Number(form.cantidad_m2);
      const medida = Number(form.medida_por_unidad);
      if (isNaN(cantM2) || cantM2 <= 0) {
        setErrorMsg("Cantidad en m² debe ser un número válido mayor que 0");
        return;
      }
      if (isNaN(medida) || medida <= 0) {
        setErrorMsg("Medida por unidad debe ser un número válido mayor que 0");
        return;
      }
    }

    try {
      // Armar payload según unidadMedida
      let payload = {
        tipoMaterial: form.tipoMaterial,
        nombre: form.nombre,
        unidadMedida: form.unidadMedida,
        descripcion: form.descripcion || "",
        imagen: form.imagen || "",
        precio: precioNum,
      };

      if (form.unidadMedida === "piezas") {
        payload.cantidad_piezas = Number(form.cantidad_piezas);
      } else if (form.unidadMedida === "m2") {
        payload.cantidad_m2 = Number(form.cantidad_m2);
        payload.medida_por_unidad = Number(form.medida_por_unidad);
      }

      console.log("📤 Enviando al backend (CREATE):", {
        url: API_URL,
        payload,
      });

      const res = await fetchWithAuth(API_URL, navigate, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      
      console.log("📥 Respuesta del servidor:", { status: res.status, data });

      if (!res.ok) {
        throw new Error(data.mensaje || `Error ${res.status}: ${JSON.stringify(data)}`);
      }
      
      fetchProductos();
      closeModal();
    } catch (err) {
      if (err.message === "Sesión expirada") return;
      console.error("❌ Error en handleAdd:", err);
      setErrorMsg(err.message);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    
    if (!form.tipoMaterial || !form.nombre || !form.unidadMedida) {
      setErrorMsg(
        "Los campos tipoMaterial, nombre y unidadMedida son requeridos"
      );
      return;
    }

    // Validar precio
    const precioNum = Number(form.precio);
    if (isNaN(precioNum) || precioNum <= 0) {
      setErrorMsg("El precio debe ser un número válido mayor que 0");
      return;
    }

    // Validar cantidad según unidad
    if (form.unidadMedida === "piezas") {
      const cantNum = Number(form.cantidad_piezas);
      if (isNaN(cantNum) || cantNum < 0) {
        setErrorMsg("Cantidad de piezas debe ser un número válido");
        return;
      }
    } else if (form.unidadMedida === "m2") {
      const cantM2 = Number(form.cantidad_m2);
      const medida = Number(form.medida_por_unidad);
      if (isNaN(cantM2) || cantM2 <= 0) {
        setErrorMsg("Cantidad en m² debe ser un número válido mayor que 0");
        return;
      }
      if (isNaN(medida) || medida <= 0) {
        setErrorMsg("Medida por unidad debe ser un número válido mayor que 0");
        return;
      }
    }

    try {
      let payload = {
        tipoMaterial: form.tipoMaterial,
        nombre: form.nombre,
        unidadMedida: form.unidadMedida,
        descripcion: form.descripcion || "",
        imagen: form.imagen || "",
        precio: precioNum,
      };

      if (form.unidadMedida === "piezas") {
        payload.cantidad_piezas = Number(form.cantidad_piezas);
      } else if (form.unidadMedida === "m2") {
        payload.cantidad_m2 = Number(form.cantidad_m2);
        payload.medida_por_unidad = Number(form.medida_por_unidad);
      }

      console.log("📤 Enviando al backend (EDIT):", {
        url: `${API_URL}/${editId}`,
        payload,
      });

      const res = await fetchWithAuth(`${API_URL}/${editId}`, navigate, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("❌ Error al parsear respuesta:", text);
        setErrorMsg(
          "Error inesperado del servidor. Intenta más tarde o revisa la consola."
        );
        return;
      }

      console.log("📥 Respuesta del servidor:", { status: res.status, data });

      if (!res.ok) {
        throw new Error(data.mensaje || `Error ${res.status}: ${JSON.stringify(data)}`);
      }
      
      fetchProductos();
      closeModal();
    } catch (err) {
      if (err.message === "Sesión expirada") return;
      console.error("❌ Error en handleEdit:", err);
      setErrorMsg(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetchWithAuth(`${API_URL}/${id}`, navigate, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(
          data.mensaje || data.message || "Error al eliminar producto"
        );
      fetchProductos();
      setDeleteConfirmId(null);
      setShowSecondDeleteConfirm(false);
    } catch (err) {
      if (err.message === "Sesión expirada") {
        setDeleteConfirmId(null);
        setShowSecondDeleteConfirm(false);
        return;
      }
      alert(err.message);
      setDeleteConfirmId(null);
      setShowSecondDeleteConfirm(false);
    }
  };
  // Reactivar eliminado

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
  // rol actual para ocultar Usuarios si no es admin
  let isAdmin = false;
  try {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    isAdmin = String(u?.rol || "").toLowerCase() === "admin";
  } catch {
    /* ignore */
  }

  return (
    <div className="-bg">
      <nav className="main-navbar guinda-navbar">
        <div className="nav-container">
          {/* Izquierda: logo + título + menú móvil */}
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
              <div className="nav-title">INVENTARIO</div>
            </div>
            <header className="header">
              <h1>
                INVENTARIO <FaBoxes className="iconName" />
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

          {/* Centro: navegación (oculto en móvil) */}
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

          {/* Derecha: fecha/hora + usuario */}
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

      <div
        style={{
          padding: 24,
          paddingTop: "calc(var(--navbar-offset) + 2px)",
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 30,
          }}
        >
          <button className="open-add-modal-btn" onClick={openAddModal}>
            <FaPlus style={{ marginRight: 8 }} /> Nuevo Producto
          </button>
          <button
            className="add-btn"
            onClick={() => navigate("/residuos")}
            title="Ver residuos disponibles"
          >
            Ver Residuos
          </button>
        </div>

        {/* Tabla de productos */}
        {(() => {
          let tableRows;
          if (loading) {
            tableRows = (
              <tr>
                <td colSpan="9">Cargando...</td>
              </tr>
            );
          } else if (productos.length === 0) {
            tableRows = (
              <tr>
                <td colSpan="9">No hay productos registrados</td>
              </tr>
            );
          } else {
            const filtered = productos.filter((producto) => {
              const q = (filterText || "").toLowerCase().trim();
              if (!q) return true;
              switch (filterField) {
                case "id":
                  return String(producto.ID || producto.id || "").includes(q);
                case "nombre":
                  return (producto.nombre || "").toLowerCase().includes(q);
                case "descripcion":
                  return (producto.descripcion || "").toLowerCase().includes(q);
                default:
                  return true;
              }
            });
            tableRows = filtered.map((producto) => (
              <tr key={producto.ID || producto.id} className={""}>
                <td>{producto.ID || producto.id}</td>
                <td>{producto.nombre}</td>
                <td>{producto.descripcion}</td>
                <td>
                  {producto.imagen ? (
                    <img
                      src={producto.imagen}
                      alt="img"
                      className="product-img-thumb"
                      style={{
                        maxWidth: 60,
                        maxHeight: 60,
                        objectFit: "cover",
                        borderRadius: 6,
                      }}
                    />
                  ) : (
                    <span style={{ color: "#aaa" }}>Sin imagen</span>
                  )}
                </td>
                <td
                  style={{
                    color: producto.cantidad_piezas < 0 ? "#d32f2f" : "inherit",
                    fontWeight:
                      producto.cantidad_piezas < 0 ? "bold" : "normal",
                  }}
                >
                  {producto.cantidad_piezas}
                  {producto.cantidad_piezas < 0 && (
                    <span style={{ marginLeft: 4, fontSize: "0.8em" }}>⚠️</span>
                  )}
                </td>
                <td>{producto.medida_por_unidad}</td>
                <td>{producto.cantidad_m2}</td>
                <td>{producto.precio ? `$${parseFloat(producto.precio).toFixed(2)}` : "-"}</td>
                <td>
                  {producto.fecha_creacion
                    ? new Date(producto.fecha_creacion).toLocaleDateString()
                    : ""}
                </td>
                <td style={{ minWidth: 120 }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button
                      className="edit-btn"
                      title="Editar"
                      onClick={() => openEditModal(producto)}
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="delete-btn"
                      title="Eliminar"
                      onClick={() =>
                        setDeleteConfirmId(producto.ID || producto.id)
                      }
                      style={{ color: "#ffffffff" }}
                    >
                      <FaTrash />
                    </button>
                    {/* Modales de doble confirmación de eliminación */}
                    {deleteConfirmId && !showSecondDeleteConfirm && (
                      <div className="modal-overlay">
                        <div
                          className="modal-content"
                          style={{ maxWidth: 360, textAlign: "center" }}
                        >
                          <h2
                            style={{
                              color: "#a30015",
                              fontWeight: 800,
                              fontSize: "1.1rem",
                              marginBottom: 14,
                            }}
                          >
                            ¿Eliminar producto?
                          </h2>
                          <p
                            style={{
                              color: "#7b1531",
                              marginBottom: 18,
                              fontWeight: 600,
                            }}
                          >
                            Esta acción no se puede deshacer.
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
                              onClick={() => setShowSecondDeleteConfirm(true)}
                            >
                              Continuar
                            </button>
                            <button
                              className="cancel-btn"
                              style={{ minWidth: 90 }}
                              onClick={() => setDeleteConfirmId(null)}
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    {deleteConfirmId && showSecondDeleteConfirm && (
                      <div className="modal-overlay">
                        <div
                          className="modal-content"
                          style={{ maxWidth: 380, textAlign: "center" }}
                        >
                          <h2
                            style={{
                              color: "#a30015",
                              fontWeight: 800,
                              fontSize: "1.1rem",
                              marginBottom: 14,
                            }}
                          >
                            Confirmar eliminación permanente
                          </h2>
                          <p
                            style={{
                              color: "#7b1531",
                              marginBottom: 18,
                              fontWeight: 600,
                            }}
                          >
                            Se eliminará el producto de forma permanente.
                            ¿Deseas continuar?
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
                              onClick={() => handleDelete(deleteConfirmId)}
                            >
                              Eliminar
                            </button>
                            <button
                              className="cancel-btn"
                              style={{ minWidth: 90 }}
                              onClick={() => {
                                setDeleteConfirmId(null);
                                setShowSecondDeleteConfirm(false);
                              }}
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ));
          }
          return (
            <div style={{ overflowX: "auto" }}>
              {/* Barra de filtros */}
              <div
                className="users-table-filter-row users-table-filter-row-attached"
                style={{ margin: "0 0 6px 0" }}
              >
                <div className="users-filter-title">Filtrar por:</div>
                <select
                  className="users-table-filter-select"
                  value={filterField}
                  onChange={(e) => {
                    setFilterField(e.target.value);
                    setFilterText("");
                  }}
                >
                  <option value="id">ID</option>
                  <option value="nombre">Nombre</option>
                  <option value="descripcion">Descripción</option>
                </select>
                {
                  <input
                    className="users-table-filter-input"
                    placeholder="Escribe para filtrar…"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                  />
                }
                <button
                  type="button"
                  className="users-filter-clear-btn"
                  onClick={() => setFilterText("")}
                  title="Limpiar filtro"
                >
                  <FaTimes /> Limpiar
                </button>
              </div>
              <table className="cotizaciones-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Imagen</th>
                    <th>Cant. piezas</th>
                    <th>Medida/unidad</th>
                    <th>Cant. m2</th>
                    <th>Precio</th>
                    <th>Fecha creación</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>{tableRows}</tbody>
              </table>
            </div>
          );
        })()}

        {/* Modal para crear producto */}
        {modalOpen === "add" && (
          <div className="modal-overlay">
            <div
              className="modal-content modal-product"
              style={{ maxWidth: 700, color: "#111" }}
            >
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                marginBottom: 16,
                paddingBottom: 12,
                borderBottom: "2px solid #a30015"
              }}>
                <h2 style={{ color: "#111", margin: 0 }}>Nuevo Producto</h2>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "24px",
                    cursor: "pointer",
                    color: "#a30015",
                    padding: 0
                  }}
                >
                  ✕
                </button>
              </div>
              <form className="user-form" onSubmit={handleAdd}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 14,
                    width: "100%",
                    maxWidth: "100%",
                    maxHeight: "65vh",
                    overflowY: "auto",
                    paddingRight: 8
                  }}
                >
                  {/* Sección: Información básica */}
                  <div style={{ 
                    background: "#f5f5f5", 
                    padding: 12, 
                    borderRadius: 6,
                    borderLeft: "4px solid #a30015"
                  }}>
                    <h3 style={{ margin: "0 0 10px 0", color: "#a30015", fontSize: "12px", fontWeight: 700, textTransform: "uppercase" }}>
                      Información Básica
                    </h3>
                    <label
                      style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}
                    >
                      <span style={{ minWidth: 100, fontSize: "13px", fontWeight: 500 }}>Tipo Material*:</span>
                      <input
                        className="user-input"
                        type="text"
                        name="tipoMaterial"
                        value={form.tipoMaterial}
                        onChange={handleChange}
                        required
                      />
                    </label>
                    <label
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span style={{ minWidth: 100, fontSize: "13px", fontWeight: 500 }}>Nombre*:</span>
                      <input
                        className="user-input"
                        type="text"
                        name="nombre"
                        value={form.nombre}
                        onChange={handleChange}
                        required
                      />
                    </label>
                  </div>

                  {/* Sección: Unidad y descripción */}
                  <div style={{ 
                    background: "#f5f5f5", 
                    padding: 12, 
                    borderRadius: 6,
                    borderLeft: "4px solid #a30015"
                  }}>
                    <h3 style={{ margin: "0 0 10px 0", color: "#a30015", fontSize: "12px", fontWeight: 700, textTransform: "uppercase" }}>
                      Detalles
                    </h3>
                    <label
                      style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}
                    >
                      <span style={{ minWidth: 100, fontSize: "13px", fontWeight: 500 }}>Unidad*:</span>
                      <select
                        className="user-input"
                        name="unidadMedida"
                        value={form.unidadMedida}
                        onChange={handleChange}
                        required
                      >
                        <option value="piezas">Piezas</option>
                        <option value="m2">m²</option>
                      </select>
                    </label>
                    <label
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span style={{ minWidth: 100, fontSize: "13px", fontWeight: 500 }}>Descripción:</span>
                      <input
                        className="user-input"
                        type="text"
                        name="descripcion"
                        value={form.descripcion}
                        onChange={handleChange}
                      />
                    </label>
                  </div>

                  {/* Sección: Imagen */}
                  <div style={{ 
                    background: "#f5f5f5", 
                    padding: 12, 
                    borderRadius: 6,
                    borderLeft: "4px solid #a30015"
                  }}>
                    <label
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span style={{ minWidth: 100, fontSize: "13px", fontWeight: 500 }}>URL imagen:</span>
                      <input
                        className="user-input"
                        type="url"
                        name="imagen"
                        value={form.imagen}
                        onChange={handleImageChange}
                        placeholder="(opcional)"
                      />
                    </label>
                  </div>

                  {/* Sección: Cantidad (dinámica según unidad) */}
                  <div style={{ 
                    background: "#f5f5f5", 
                    padding: 12, 
                    borderRadius: 6,
                    borderLeft: "4px solid #a30015"
                  }}>
                    <h3 style={{ margin: "0 0 10px 0", color: "#a30015", fontSize: "12px", fontWeight: 700, textTransform: "uppercase" }}>
                      Cantidad
                    </h3>
                    {form.unidadMedida === "piezas" ? (
                      <label
                        style={{ display: "flex", alignItems: "center", gap: 8 }}
                      >
                        <span style={{ minWidth: 100, fontSize: "13px", fontWeight: 500 }}>Cantidad (piezas)*:</span>
                        <input
                          className="user-input"
                          type="number"
                          name="cantidad_piezas"
                          value={form.cantidad_piezas}
                          onChange={handleChange}
                          min={0}
                          step="any"
                          required
                        />
                      </label>
                    ) : (
                      <>
                        <label
                          style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}
                        >
                          <span style={{ minWidth: 100, fontSize: "13px", fontWeight: 500 }}>Cantidad total (m²)*:</span>
                          <input
                            className="user-input"
                            type="number"
                            name="cantidad_m2"
                            value={form.cantidad_m2}
                            onChange={handleChange}
                            min={0}
                            step="any"
                            required
                          />
                        </label>
                        <label
                          style={{ display: "flex", alignItems: "center", gap: 8 }}
                        >
                          <span style={{ minWidth: 100, fontSize: "13px", fontWeight: 500 }}>Medida/unidad (m²)*:</span>
                          <input
                            className="user-input"
                            type="number"
                            name="medida_por_unidad"
                            value={form.medida_por_unidad}
                            onChange={handleChange}
                            min={0}
                            step="any"
                            required
                          />
                        </label>
                        <div style={{ 
                          fontSize: "12px", 
                          color: "#666", 
                          marginTop: 8,
                          padding: "8px",
                          background: "#fff",
                          borderRadius: 4,
                          borderLeft: "3px solid #ffc107"
                        }}>
                          <strong>ℹ️ Nota:</strong> La cantidad de piezas se calcula automáticamente como: cantidad_total ÷ medida_por_unidad
                        </div>
                      </>
                    )}
                  </div>

                  {/* Sección: Precio */}
                  <div style={{ 
                    background: "#f5f5f5", 
                    padding: 12, 
                    borderRadius: 6,
                    borderLeft: "4px solid #a30015"
                  }}>
                    <label
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span style={{ minWidth: 100, fontSize: "13px", fontWeight: 500 }}>Precio ($)*:</span>
                      <input
                        className="user-input"
                        type="number"
                        name="precio"
                        value={form.precio}
                        onChange={handleChange}
                        min={0}
                        step="0.01"
                        required
                      />
                    </label>
                  </div>

                  {errorMsg && (
                    <div style={{ 
                      color: "#fff", 
                      backgroundColor: "#a30015",
                      padding: "10px 12px",
                      borderRadius: 4,
                      fontSize: "13px",
                      fontWeight: 500
                    }}>
                      {errorMsg}
                    </div>
                  )}
                  <div className="modal-btn-row">
                    <button type="submit" className="add-btn">
                      <FaPlus style={{ marginRight: 6 }} /> Agregar
                    </button>
                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={closeModal}
                    >
                      <FaTimes style={{ marginRight: 6 }} /> Cancelar
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal para editar producto */}
        {modalOpen === "edit" && (
          <div className="modal-overlay">
            <div
              className="modal-content modal-product"
              style={{ maxWidth: 700, color: "#111" }}
            >
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                marginBottom: 16,
                paddingBottom: 12,
                borderBottom: "2px solid #a30015"
              }}>
                <h2 style={{ color: "#111", margin: 0 }}>Editar Producto</h2>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "24px",
                    cursor: "pointer",
                    color: "#a30015",
                    padding: 0
                  }}
                >
                  ✕
                </button>
              </div>
              <form className="user-form" onSubmit={handleEdit}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 14,
                    width: "100%",
                    maxWidth: "100%",
                    maxHeight: "65vh",
                    overflowY: "auto",
                    paddingRight: 8
                  }}
                >
                  {/* Sección: Información básica */}
                  <div style={{ 
                    background: "#f5f5f5", 
                    padding: 12, 
                    borderRadius: 6,
                    borderLeft: "4px solid #a30015"
                  }}>
                    <h3 style={{ margin: "0 0 10px 0", color: "#a30015", fontSize: "12px", fontWeight: 700, textTransform: "uppercase" }}>
                      Información Básica
                    </h3>
                    <label
                      style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}
                    >
                      <span style={{ minWidth: 100, fontSize: "13px", fontWeight: 500 }}>Tipo Material*:</span>
                      <input
                        className="user-input"
                        type="text"
                        name="tipoMaterial"
                        value={form.tipoMaterial}
                        onChange={handleChange}
                        required
                      />
                    </label>
                    <label
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span style={{ minWidth: 100, fontSize: "13px", fontWeight: 500 }}>Nombre*:</span>
                      <input
                        className="user-input"
                        type="text"
                        name="nombre"
                        value={form.nombre}
                        onChange={handleChange}
                        required
                      />
                    </label>
                  </div>

                  {/* Sección: Unidad y descripción */}
                  <div style={{ 
                    background: "#f5f5f5", 
                    padding: 12, 
                    borderRadius: 6,
                    borderLeft: "4px solid #a30015"
                  }}>
                    <h3 style={{ margin: "0 0 10px 0", color: "#a30015", fontSize: "12px", fontWeight: 700, textTransform: "uppercase" }}>
                      Detalles
                    </h3>
                    <label
                      style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}
                    >
                      <span style={{ minWidth: 100, fontSize: "13px", fontWeight: 500 }}>Unidad*:</span>
                      <select
                        className="user-input"
                        name="unidadMedida"
                        value={form.unidadMedida}
                        onChange={handleChange}
                        required
                      >
                        <option value="piezas">Piezas</option>
                        <option value="m2">m²</option>
                      </select>
                    </label>
                    <label
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span style={{ minWidth: 100, fontSize: "13px", fontWeight: 500 }}>Descripción:</span>
                      <input
                        className="user-input"
                        type="text"
                        name="descripcion"
                        value={form.descripcion}
                        onChange={handleChange}
                      />
                    </label>
                  </div>

                  {/* Sección: Imagen */}
                  <div style={{ 
                    background: "#f5f5f5", 
                    padding: 12, 
                    borderRadius: 6,
                    borderLeft: "4px solid #a30015"
                  }}>
                    <label
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span style={{ minWidth: 100, fontSize: "13px", fontWeight: 500 }}>URL imagen:</span>
                      <input
                        className="user-input"
                        type="url"
                        name="imagen"
                        value={form.imagen}
                        onChange={handleImageChange}
                        placeholder="(opcional)"
                      />
                    </label>
                  </div>

                  {/* Sección: Cantidad (dinámica según unidad) */}
                  <div style={{ 
                    background: "#f5f5f5", 
                    padding: 12, 
                    borderRadius: 6,
                    borderLeft: "4px solid #a30015"
                  }}>
                    <h3 style={{ margin: "0 0 10px 0", color: "#a30015", fontSize: "12px", fontWeight: 700, textTransform: "uppercase" }}>
                      Cantidad
                    </h3>
                    {form.unidadMedida === "piezas" ? (
                      <label
                        style={{ display: "flex", alignItems: "center", gap: 8 }}
                      >
                        <span style={{ minWidth: 100, fontSize: "13px", fontWeight: 500 }}>Cantidad (piezas)*:</span>
                        <input
                          className="user-input"
                          type="number"
                          name="cantidad_piezas"
                          value={form.cantidad_piezas}
                          onChange={handleChange}
                          min={0}
                          step="any"
                          required
                        />
                      </label>
                    ) : (
                      <>
                        <label
                          style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}
                        >
                          <span style={{ minWidth: 100, fontSize: "13px", fontWeight: 500 }}>Cantidad total (m²)*:</span>
                          <input
                            className="user-input"
                            type="number"
                            name="cantidad_m2"
                            value={form.cantidad_m2}
                            onChange={handleChange}
                            min={0}
                            step="any"
                            required
                          />
                        </label>
                        <label
                          style={{ display: "flex", alignItems: "center", gap: 8 }}
                        >
                          <span style={{ minWidth: 100, fontSize: "13px", fontWeight: 500 }}>Medida/unidad (m²)*:</span>
                          <input
                            className="user-input"
                            type="number"
                            name="medida_por_unidad"
                            value={form.medida_por_unidad}
                            onChange={handleChange}
                            min={0}
                            step="any"
                            required
                          />
                        </label>
                        <div style={{ 
                          fontSize: "12px", 
                          color: "#666", 
                          marginTop: 8,
                          padding: "8px",
                          background: "#fff",
                          borderRadius: 4,
                          borderLeft: "3px solid #ffc107"
                        }}>
                          <strong>ℹ️ Nota:</strong> La cantidad de piezas se calcula automáticamente como: cantidad_total ÷ medida_por_unidad
                        </div>
                      </>
                    )}
                  </div>

                  {/* Sección: Precio */}
                  <div style={{ 
                    background: "#f5f5f5", 
                    padding: 12, 
                    borderRadius: 6,
                    borderLeft: "4px solid #a30015"
                  }}>
                    <label
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span style={{ minWidth: 100, fontSize: "13px", fontWeight: 500 }}>Precio ($)*:</span>
                      <input
                        className="user-input"
                        type="number"
                        name="precio"
                        value={form.precio}
                        onChange={handleChange}
                        min={0}
                        step="0.01"
                        required
                      />
                    </label>
                  </div>

                  {errorMsg && (
                    <div style={{ 
                      color: "#fff", 
                      backgroundColor: "#a30015",
                      padding: "10px 12px",
                      borderRadius: 4,
                      fontSize: "13px",
                      fontWeight: 500
                    }}>
                      {errorMsg}
                    </div>
                  )}
                  <div className="modal-btn-row">
                    <button type="submit" className="add-btn">
                      <FaSave style={{ marginRight: 6 }} /> Guardar
                    </button>
                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={closeModal}
                    >
                      <FaTimes style={{ marginRight: 6 }} /> Cancelar
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Reactivar eliminado */}
      </div>
    </div>
  );
};

export default Inventory;
