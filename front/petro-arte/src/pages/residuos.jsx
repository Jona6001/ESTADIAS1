import React, { useEffect, useRef, useState } from "react";
import "../App.css";
import { useLocation, useNavigate } from "react-router-dom";
import { FaUser, FaRecycle, FaTimes, FaArrowLeft, FaPlus, FaTrash } from "react-icons/fa";

const API_RESIDUOS = "http://localhost:3000/api/residuos";
const API_PRODUCTOS = "http://localhost:3000/productos";
const API_COTIZACIONES = "http://localhost:3000/api/ordenes";

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
  const [resumen, setResumen] = useState({ total_residuos: 0, total_m2_disponibles: 0, por_producto: [], todos_los_residuos: [] });
  const [productos, setProductos] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [form, setForm] = useState({ cotizacionId: "", productoId: "", m2_residuo: "", observaciones: "", estado: "disponible" });
  const [saving, setSaving] = useState(false);

  const [filterText, setFilterText] = useState("");
  const [filterEstado, setFilterEstado] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/"); return; }
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.nombre) setUserName(user.nombre);
    fetchResiduos();
    fetchAux();
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

  const fetchResiduos = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(API_RESIDUOS, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
      const txt = await res.text();
      let data; try { data = JSON.parse(txt); } catch { data = { success: false, message: txt }; }
      if (!res.ok || data?.success === false) throw new Error(data?.message || "No se pudieron cargar los residuos");
      // Normalizar estructura simple si backend devuelve arreglo directo
      const raw = data.data || data;
      if (Array.isArray(raw)) {
        setResumen({ total_residuos: raw.length, total_m2_disponibles: raw.reduce((acc,r)=>acc + Number(r.m2_residuo||0),0), por_producto: [], todos_los_residuos: raw });
      } else {
        setResumen(raw);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAux = async () => {
    try {
      const token = localStorage.getItem("token");
      const [rp, ro] = await Promise.all([
        fetch(API_PRODUCTOS, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }),
        fetch(API_COTIZACIONES, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }),
      ]);
      const [t1, t2] = await Promise.all([rp.text(), ro.text()]);
      let d1, d2; try { d1 = JSON.parse(t1); } catch { d1 = []; } try { d2 = JSON.parse(t2); } catch { d2 = []; }
      const arrProd = Array.isArray(d1) ? d1 : (d1.productos || d1.data || []);
      const arrOrd = Array.isArray(d2?.data) ? d2.data : Array.isArray(d2) ? d2 : [];
      setProductos(Array.isArray(arrProd) ? arrProd : []);
      setOrdenes(Array.isArray(arrOrd) ? arrOrd : []);
    } catch (e) {
      // silent
    }
  };

  const handleFormChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleCrearResiduo = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.cotizacionId || !form.productoId || !form.m2_residuo) {
      setError("Selecciona cotización, producto y m² residuo.");
      return;
    }
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const payload = {
        cotizacionId: Number(form.cotizacionId),
        productoId: Number(form.productoId),
        m2_residuo: Number(form.m2_residuo),
        estado: form.estado,
        observaciones: form.observaciones || null,
        ID_usuario_registro: user?.ID,
        // Campos opcionales se dejan fuera o en null
      };
      const res = await fetch(API_RESIDUOS, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const txt = await res.text();
      let data; try { data = JSON.parse(txt); } catch { data = { success:false, message: txt }; }
      if (!res.ok || data?.success === false) throw new Error(data?.message || "Error al crear residuo");
      setForm({ cotizacionId: "", productoId: "", m2_residuo: "", observaciones: "", estado: "disponible" });
      await fetchResiduos();
    } catch (e) {
      setError(e.message || "Error al crear residuo");
    } finally {
      setSaving(false);
    }
  };

  const handleEliminarResiduo = async (id) => {
    if (!window.confirm("¿Eliminar este residuo?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_RESIDUOS}/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
      const txt = await res.text();
      let data; try { data = JSON.parse(txt); } catch { data = { success:false, message: txt }; }
      if (!res.ok || data?.success === false) throw new Error(data?.message || "No se pudo eliminar");
      await fetchResiduos();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleLogout = () => { setMenuOpen(false); setShowLogoutConfirm(true); };
  const confirmLogout = () => { setShowLogoutConfirm(false); localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/"); };
  const cancelLogout = () => setShowLogoutConfirm(false);
  const handleConfig = () => { setMenuOpen(false); navigate("/config"); };
  // rol actual para ocultar Usuarios si no es admin
  let isAdmin = false;
  try {
    const u = JSON.parse(localStorage.getItem("user")||"{}");
    isAdmin = String(u?.rol||"").toLowerCase()==="admin";
  } catch { /* ignore */ }

  const productosAgrupados = Array.isArray(resumen.por_producto) ? resumen.por_producto : [];
  const todos = Array.isArray(resumen.todos_los_residuos) ? resumen.todos_los_residuos : [];
  const filtrados = todos.filter((r) => {
    const q = (filterText || '').toLowerCase().trim();
    const est = (filterEstado || '').toLowerCase();
    const okText = !q || (r.producto || '').toLowerCase().includes(q);
    const okEstado = !est || (r.estado || '').toLowerCase() === est;
    return okText && okEstado;
  });

  return (
    <div className="home-bg">
      <nav className="main-navbar guinda-navbar">
        <div className="nav-container">
          <div className="nav-left">
            <div className="nav-logo mobile-menu-toggle" onClick={() => setMobileMenuOpen(v => !v)}>
              <img src="https://irp.cdn-website.com/d7ba7f52/dms3rep/multi/265.png" alt="Logo" className="logo-img" />
              <div className="nav-title">RESIDUOS</div>
            </div>
            <header className="header">
              <h1>RESIDUOS <FaRecycle className="iconName" /></h1>
            </header>
            <div className={`mobile-menu ${mobileMenuOpen ? "open" : ""}`}>
              <button className={`nav-btn${location.pathname === "/home" ? " nav-btn-active" : ""}`} onClick={() => navigate("/home")}>Inicio</button>
              <button className={`nav-btn${location.pathname === "/inventario" ? " nav-btn-active" : ""}`} onClick={() => navigate("/inventario")}>Inventario</button>
              <button className={`nav-btn${location.pathname === "/ventas" ? " nav-btn-active" : ""}`} onClick={() => navigate("/ventas")}>Ventas</button>
              <button className={`nav-btn${location.pathname === "/clientes" ? " nav-btn-active" : ""}`} onClick={() => navigate("/clientes")}>Clientes</button>
              {isAdmin && <button className={`nav-btn${location.pathname === "/usuarios" ? " nav-btn-active" : ""}`} onClick={() => navigate("/usuarios")}>Usuarios</button>}
            </div>
          </div>
          <div className="nav-center">
            <button className={`nav-btn${location.pathname === "/home" ? " nav-btn-active" : ""}`} onClick={() => navigate("/home")}>Inicio</button>
            <button className={`nav-btn${location.pathname === "/inventario" ? " nav-btn-active" : ""}`} onClick={() => navigate("/inventario")}>Inventario</button>
            <button className={`nav-btn${location.pathname === "/ventas" ? " nav-btn-active" : ""}`} onClick={() => navigate("/ventas")}>Ventas</button>
            <button className={`nav-btn${location.pathname === "/clientes" ? " nav-btn-active" : ""}`} onClick={() => navigate("/clientes")}>Clientes</button>
            {isAdmin && <button className={`nav-btn${location.pathname === "/usuarios" ? " nav-btn-active" : ""}`} onClick={() => navigate("/usuarios")}>Usuarios</button>}
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

  <div className="residuos-page" style={{ padding: 24, paddingTop: 'calc(var(--navbar-offset) + 2px)', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display:'flex', justifyContent:'flex-start', marginBottom: 12 }}>
          <button className="cancel-btn" onClick={() => navigate('/inventario')}>
            <FaArrowLeft style={{ marginRight: 6 }} /> Regresar a Inventario
          </button>
        </div>
        <div className="residuos-summary">
          <div className="resumen-card">
            <div className="resumen-title">Total m² disponibles</div>
            <div className="resumen-value">{(resumen.total_m2_disponibles || 0).toFixed(2)} m²</div>
          </div>
          <div className="resumen-card">
            <div className="resumen-title">Número de residuos</div>
            <div className="resumen-value">{resumen.total_residuos || 0}</div>
          </div>
        </div>

        <h2 className="residuos-section-title">Por producto</h2>
        {loading ? (
          <p>Cargando…</p>
        ) : productosAgrupados.length === 0 ? (
          <p>No hay residuos disponibles.</p>
        ) : (
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
        )}

        <h2 className="residuos-section-title">Nuevo residuo</h2>
        <form onSubmit={handleCrearResiduo} style={{ background:'#f7f9fa', border:'1px solid #dde3e6', padding:'12px 14px', borderRadius:8, marginBottom:16, display:'grid', gap:10, gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            <label style={{ fontSize:'.75rem', fontWeight:600 }}>Cotización</label>
            <select className="user-input" value={form.cotizacionId} onChange={(e)=>handleFormChange('cotizacionId', e.target.value)}>
              <option value="">Selecciona…</option>
              {ordenes.slice(0,300).map(o => (
                <option key={o.ID || o.id} value={o.ID || o.id}>#{o.ID || o.id} {o.nombre || o.titulo || ''}</option>
              ))}
            </select>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            <label style={{ fontSize:'.75rem', fontWeight:600 }}>Producto</label>
            <select className="user-input" value={form.productoId} onChange={(e)=>handleFormChange('productoId', e.target.value)}>
              <option value="">Selecciona…</option>
              {productos.map(p => (
                <option key={p.ID} value={p.ID}>{p.nombre}</option>
              ))}
            </select>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            <label style={{ fontSize:'.75rem', fontWeight:600 }}>m² residuo</label>
            <input className="user-input" type="number" min="0.01" step="0.01" value={form.m2_residuo} onChange={(e)=>handleFormChange('m2_residuo', e.target.value)} />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            <label style={{ fontSize:'.75rem', fontWeight:600 }}>Estado</label>
            <select className="user-input" value={form.estado} onChange={(e)=>handleFormChange('estado', e.target.value)}>
              <option value="disponible">Disponible</option>
              <option value="usado">Usado</option>
              <option value="descartado">Descartado</option>
            </select>
          </div>
          <div style={{ gridColumn:'1 / -1', display:'flex', flexDirection:'column', gap:4 }}>
            <label style={{ fontSize:'.75rem', fontWeight:600 }}>Observaciones</label>
            <textarea className="user-input" rows={2} value={form.observaciones} onChange={(e)=>handleFormChange('observaciones', e.target.value)} />
          </div>
          <div style={{ gridColumn:'1 / -1', display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button type="submit" className="add-btn" disabled={saving}>
              <FaPlus style={{ marginRight:6 }} /> {saving ? 'Guardando…' : 'Guardar residuo'}
            </button>
          </div>
        </form>

        <h2 className="residuos-section-title">Todos los residuos</h2>
        <div className="users-table-filter-row users-table-filter-row-attached" style={{ margin: '0 0 8px 0' }}>
          <div className="users-filter-title">Filtrar por:</div>
          <input
            className="users-table-filter-input"
            placeholder="Producto…"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
          <select className="users-table-filter-select" value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}>
            <option value="">Todos</option>
            <option value="disponible">Disponible</option>
            <option value="usado">Usado</option>
            <option value="descartado">Descartado</option>
          </select>
          <button
            type="button"
            className="users-filter-clear-btn"
            onClick={() => { setFilterText(''); setFilterEstado(''); }}
            title="Limpiar filtro"
          >
            <FaTimes /> Limpiar
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
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
            <tbody>
              {loading ? (
                <tr><td colSpan="8">Cargando…</td></tr>
              ) : filtrados.length === 0 ? (
                <tr><td colSpan="8">Sin registros</td></tr>
              ) : (
                filtrados.map((r) => (
                  <tr key={r.ID || r.id}>
                    <td>{r.ID || r.id}</td>
                    <td>{r.Producto?.nombre || r.producto || '-'}</td>
                    <td>{Number(r.m2_residuo || r.m2Residuo || 0).toFixed(2)}</td>
                    <td>{Number(r.porcentaje_residuo || r.porcentaje || 0).toFixed(2)}%</td>
                    <td><span className={`status-badge status-${(r.estado || '').toLowerCase()}`}>{r.estado || 'desconocido'}</span></td>
                    <td>{r.fecha_creacion ? new Date(r.fecha_creacion).toLocaleDateString('es-MX') : (r.createdAt ? new Date(r.createdAt).toLocaleDateString('es-MX') : '')}</td>
                    <td>{r.cotizacionId || r.cotizacion || '-'}</td>
                    <td>{r.observaciones || '-'}</td>
                    <td>
                      <button className="delete-btn" title="Eliminar" onClick={() => handleEliminarResiduo(r.ID || r.id)}>
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {error && <div style={{ color: '#a30015', marginTop: 10 }}>{error}</div>}
      </div>
    </div>
  );
};

export default Residuos;
