import React, { useEffect, useRef, useState } from "react";
import "../App.css";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaUser,
  FaRecycle,
  FaTimes,
  FaArrowLeft,
  FaPlus,
  FaTrash,
} from "react-icons/fa";
import { fetchWithAuth } from "../utils/auth";

const API_RESIDUOS =
  "https://estadias1-backend-production.up.railway.app/api/residuos";
const API_PRODUCTOS =
  "https://estadias1-backend-production.up.railway.app/productos";
const API_COTIZACIONES =
  "https://estadias1-backend-production.up.railway.app/api/ordenes";

const Residuos = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const menuRef = useRef();

  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resumen, setResumen] = useState({
    total_residuos: 0,
    total_m2_disponibles: 0,
    por_producto: [],
    todos_los_residuos: [],
  });
  const [productos, setProductos] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [form, setForm] = useState({
    cotizacionId: "",
    productoId: "",
    m2_residuo: "",
    observaciones: "",
    estado: "disponible",
  });
  const [saving, setSaving] = useState(false);

  const [filterText, setFilterText] = useState("");
  const [filterEstado, setFilterEstado] = useState("");

  const toggleMobileMenu = () => setMobileMenuOpen((v) => !v);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.nombre) setUserName(user.nombre);
    fetchResiduos();
    fetchAux();
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

  const fetchResiduos = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchWithAuth(API_RESIDUOS, navigate);
      const txt = await res.text();
      let data;
      try {
        data = JSON.parse(txt);
      } catch {
        data = { success: false, message: txt };
      }
      if (!res.ok || data?.success === false)
        throw new Error(data?.message || "No se pudieron cargar los residuos");
      // Normalizar estructura simple si backend devuelve arreglo directo
      const raw = data.data || data;
      if (Array.isArray(raw)) {
        setResumen({
          total_residuos: raw.length,
          total_m2_disponibles: raw.reduce(
            (acc, r) => acc + Number(r.m2_residuo || 0),
            0
          ),
          por_producto: [],
          todos_los_residuos: raw,
        });
      } else {
        setResumen(raw);
      }
    } catch (e) {
      if (e.message === "Sesión expirada") return;
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAux = async () => {
    try {
      const [rp, ro] = await Promise.all([
        fetchWithAuth(API_PRODUCTOS, navigate),
        fetchWithAuth(API_COTIZACIONES, navigate),
      ]);
      const [t1, t2] = await Promise.all([rp.text(), ro.text()]);
      let d1, d2;
      try {
        d1 = JSON.parse(t1);
      } catch {
        d1 = [];
      }
      try {
        d2 = JSON.parse(t2);
      } catch {
        d2 = [];
      }
      const arrProd = Array.isArray(d1) ? d1 : d1.productos || d1.data || [];
      const arrOrd = Array.isArray(d2?.data)
        ? d2.data
        : Array.isArray(d2)
        ? d2
        : [];
      setProductos(Array.isArray(arrProd) ? arrProd : []);
      setOrdenes(Array.isArray(arrOrd) ? arrOrd : []);
    } catch (e) {
      if (e.message === "Sesión expirada") return;
      // silent for other fallbacks
    }
  };

  const handleFormChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleCrearResiduo = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.cotizacionId || !form.productoId || !form.m2_residuo) {
      setError("Selecciona cotización, producto y m² residuo.");
      return;
    }
    try {
      setSaving(true);
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = user?.ID ?? user?.id ?? null;
      // Obtener medida por unidad desde el producto seleccionado si existe
      const prodSel = productos.find((p) => String(p.ID) === String(form.productoId));
      const medidaPorUnidad = prodSel?.medida_por_unidad || 1;
      // Enviar variantes de nombres para compatibilidad con backend
      const payload = {
        cotizacionId: Number(form.cotizacionId),
        productoId: Number(form.productoId),
        // soportar ambos estilos de nombre
        m2_residuo: Number(form.m2_residuo),
        m2Residuo: Number(form.m2_residuo),
        // campos requeridos por el modelo con defaults seguros
        piezas_usadas: 0,
        m2_necesarios: 0,
        m2_usados: 0,
        porcentaje_residuo: 0,
        medida_por_unidad: Number(medidaPorUnidad) || 1,
        estado: form.estado,
        observaciones: form.observaciones || null,
        ID_usuario_registro: userId,
      };
      const res = await fetchWithAuth(API_RESIDUOS, navigate, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const txt = await res.text();
      let data;
      try {
        data = JSON.parse(txt);
      } catch {
        data = { success: false, message: txt };
      }
      if (!res.ok || data?.success === false) {
        const statusLine = `[${res.status}] ${res.statusText || ""}`.trim();
        const serverMsg = (data && typeof data === 'object')
          ? (data.message || data.error || JSON.stringify(data))
          : String(txt || 'Error desconocido');
        const details = (data && typeof data === 'object')
          ? JSON.stringify(data, null, 2)
          : String(txt || '');
        setError(`${statusLine}\n${serverMsg}\n\nDetalles:\n${details}`);
        return;
      }
      setForm({
        cotizacionId: "",
        productoId: "",
        m2_residuo: "",
        observaciones: "",
        estado: "disponible",
      });
      await fetchResiduos();
    } catch (e) {
      if (e.message === "Sesión expirada") return;
      const msg = e?.message ?? String(e);
      setError(`Error de red o inesperado al crear residuo.\n${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEliminarResiduo = async (id) => {
    if (!globalThis.confirm("¿Eliminar este residuo?")) return;
    try {
      const res = await fetchWithAuth(`${API_RESIDUOS}/${id}`, navigate, {
        method: "DELETE",
      });
      const txt = await res.text();
      let data;
      try {
        data = JSON.parse(txt);
      } catch {
        data = { success: false, message: txt };
      }
      if (!res.ok || data?.success === false)
        throw new Error(data?.message || "No se pudo eliminar");
      await fetchResiduos();
    } catch (e) {
      if (e.message === "Sesión expirada") return;
      setError(e.message || "No se pudo eliminar el residuo");
    }
  };

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
  const cancelLogout = () => setShowLogoutConfirm(false);
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

  const productosAgrupados = Array.isArray(resumen.por_producto)
    ? resumen.por_producto
    : [];
  const todos = Array.isArray(resumen.todos_los_residuos)
    ? resumen.todos_los_residuos
    : [];
  const filtrados = todos.filter((r) => {
    const q = (filterText || "").toLowerCase().trim();
    const est = (filterEstado || "").toLowerCase();
    const nombreProducto = (r.Producto?.nombre || r.producto || "")
      .toLowerCase();
    const okText = !q || nombreProducto.includes(q);
    const okEstado = !est || (r.estado || "").toLowerCase() === est;
    return okText && okEstado;
  });

  const productosContent = (() => {
    if (loading) {
      return <div className="residuos-empty-state">Cargando…</div>;
    }
    if (productosAgrupados.length === 0) {
      return (
        <div className="residuos-empty-state">
          No hay residuos disponibles.
        </div>
      );
    }
    return (
      <div className="residuos-cards">
        {productosAgrupados.map((p) => (
          <div className="residuo-card" key={p.productoId}>
            <div className="residuo-card-title">{p.producto}</div>
            <div className="residuo-card-stat">
              <span className="stat-label">Total m²:</span>
              <span className="stat-value">{p.total_m2.toFixed(2)}</span>
            </div>
            <div className="residuo-card-stat">
              <span className="stat-label">Cantidad:</span>
              <span className="stat-value">{p.cantidad_residuos}</span>
            </div>
          </div>
        ))}
      </div>
    );
  })();

  const tableBodyContent = (() => {
    if (loading) {
      return (
        <tr>
          <td colSpan={9}>Cargando…</td>
        </tr>
      );
    }
    if (filtrados.length === 0) {
      return (
        <tr>
          <td colSpan={9}>Sin registros</td>
        </tr>
      );
    }
    return filtrados.map((r) => (
      <tr key={r.ID || r.id}>
        <td>{r.ID || r.id}</td>
        <td>{r.Producto?.nombre || r.producto || "-"}</td>
        <td>{Number(r.m2_residuo || r.m2Residuo || 0).toFixed(2)}</td>
        <td>
          {Number(r.porcentaje_residuo || r.porcentaje || 0).toFixed(2)}%
        </td>
        <td>
          <span
            className={`status-badge status-${(r.estado || "").toLowerCase()}`}
          >
            {r.estado || "desconocido"}
          </span>
        </td>
        <td>
          {r.fecha_creacion
            ? new Date(r.fecha_creacion).toLocaleDateString("es-MX")
            : r.createdAt
            ? new Date(r.createdAt).toLocaleDateString("es-MX")
            : ""}
        </td>
        <td>{r.cotizacionId || r.cotizacion || "-"}</td>
        <td>{r.observaciones || "-"}</td>
        <td>
          <button
            className="delete-btn"
            title="Eliminar"
            onClick={() => handleEliminarResiduo(r.ID || r.id)}
          >
            <FaTrash />
          </button>
        </td>
      </tr>
    ));
  })();

  return (
    <div className="-bg">
      <nav className="main-navbar guinda-navbar">
        <div className="nav-container">
          <div className="nav-left">
            <div
              className="nav-logo mobile-menu-toggle"
              role="button"
              tabIndex={0}
              onClick={toggleMobileMenu}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  toggleMobileMenu();
                }
              }}
            >
              <img
                src="https://irp.cdn-website.com/d7ba7f52/dms3rep/multi/265.png"
                alt="Logo"
                className="logo-img"
              />
              <div className="nav-title">RESIDUOS</div>
            </div>
            <header className="header">
              <h1>
                RESIDUOS <FaRecycle className="iconName" />
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

      <div className="residuos-body">
        <div className="residuos-container">
          <div className="residuos-page">
            <div className="residuos-top-row">
              <button
                className="cancel-btn"
                onClick={() => navigate("/inventario")}
              >
                <FaArrowLeft /> Regresar a Inventario
              </button>
            </div>

            <section className="residuos-card">
              <div className="residuos-header-row">
                <div>
                  <h2 className="residuos-section-title">Resumen general</h2>
                  <p className="residuos-section-description">
                    Consulta de un vistazo cuántos recortes tienes disponibles y la
                    superficie que representan.
                  </p>
                </div>
              </div>
              <div className="residuos-summary">
                <div className="resumen-card">
                  <div className="resumen-title">Total m² disponibles</div>
                  <div className="resumen-value">
                    {(resumen.total_m2_disponibles || 0).toFixed(2)} m²
                  </div>
                </div>
                <div className="resumen-card">
                  <div className="resumen-title">Número de residuos</div>
                  <div className="resumen-value">{resumen.total_residuos || 0}</div>
                </div>
              </div>
            </section>

            <section className="residuos-card">
              <div className="residuos-header-row">
                <div>
                  <h2 className="residuos-section-title">Por producto</h2>
                  <p className="residuos-section-description">
                    Identifica qué productos concentran más residuos para planear su
                    reutilización.
                  </p>
                </div>
              </div>
              {productosContent}
            </section>

            <div className="residuos-main">
              <aside className="residuos-sidebar residuos-card">
                <h3>Nuevo residuo</h3>
                <p className="residuos-section-description">
                  Registra recortes manuales o ajustes de producción.
                </p>
                <form
                  className="residuos-form-grid"
                  onSubmit={handleCrearResiduo}
                >
                  <div>
                    <label htmlFor="residuo-cotizacion">Cotización</label>
                    <select
                      id="residuo-cotizacion"
                      className="user-input"
                      value={form.cotizacionId}
                      onChange={(e) =>
                        handleFormChange("cotizacionId", e.target.value)
                      }
                    >
                      <option value="">Selecciona…</option>
                      {ordenes.slice(0, 300).map((o) => (
                        <option key={o.ID || o.id} value={o.ID || o.id}>
                          #{o.ID || o.id} {o.nombre || o.titulo || ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="residuo-producto">Producto</label>
                    <select
                      id="residuo-producto"
                      className="user-input"
                      value={form.productoId}
                      onChange={(e) =>
                        handleFormChange("productoId", e.target.value)
                      }
                    >
                      <option value="">Selecciona…</option>
                      {productos.map((p) => (
                        <option key={p.ID} value={p.ID}>
                          {p.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="residuo-m2">m² residuo</label>
                    <input
                      id="residuo-m2"
                      className="user-input"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form.m2_residuo}
                      onChange={(e) =>
                        handleFormChange("m2_residuo", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label htmlFor="residuo-estado">Estado</label>
                    <select
                      id="residuo-estado"
                      className="user-input"
                      value={form.estado}
                      onChange={(e) =>
                        handleFormChange("estado", e.target.value)
                      }
                    >
                      <option value="disponible">Disponible</option>
                      <option value="usado">Usado</option>
                      <option value="descartado">Descartado</option>
                    </select>
                  </div>
                  <div className="form-span">
                    <label htmlFor="residuo-observaciones">Observaciones</label>
                    <textarea
                      id="residuo-observaciones"
                      className="user-input"
                      rows={3}
                      value={form.observaciones}
                      onChange={(e) =>
                        handleFormChange("observaciones", e.target.value)
                      }
                    />
                  </div>
                  <div className="residuos-form-actions form-span">
                    <button type="submit" className="add-btn" disabled={saving}>
                      <FaPlus />
                      {saving ? "Guardando…" : "Guardar residuo"}
                    </button>
                  </div>
                </form>
              </aside>

              <section className="residuos-table-card residuos-card">
                <div className="residuos-table-card-header">
                  <h2 className="residuos-section-title">Todos los residuos</h2>
                  <p className="residuos-section-description">
                    Filtra por producto o estado para encontrar rápidamente un recorte.
                  </p>
                  <div className="residuos-actions-row users-table-filter-row users-table-filter-row-attached">
                    <div className="users-filter-title">Filtrar por:</div>
                    <input
                      className="users-table-filter-input"
                      placeholder="Producto…"
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
                    />
                    <select
                      className="users-table-filter-select"
                      value={filterEstado}
                      onChange={(e) => setFilterEstado(e.target.value)}
                    >
                      <option value="">Todos</option>
                      <option value="disponible">Disponible</option>
                      <option value="usado">Usado</option>
                      <option value="descartado">Descartado</option>
                    </select>
                    <button
                      type="button"
                      className="users-filter-clear-btn"
                      onClick={() => {
                        setFilterText("");
                        setFilterEstado("");
                      }}
                      title="Limpiar filtro"
                    >
                      <FaTimes /> Limpiar
                    </button>
                  </div>
                </div>

                <div className="residuos-table-wrapper">
                  <table className="residuos-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Producto</th>
                        <th>m² residuo</th>
                        <th>% pieza</th>
                        <th>Estado</th>
                        <th>Fecha</th>
                        <th>Cotización</th>
                        <th>Observaciones</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>{tableBodyContent}</tbody>
                  </table>
                </div>

                {error && (
                  <div className="residuos-error-panel">
                    <h4>Detalle del error</h4>
                    <pre>{error}</pre>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Residuos;
