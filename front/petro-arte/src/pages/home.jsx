import React, { useState, useRef, useEffect } from "react";
import "../App.css";
import "../home.overrides.css";
import { useNavigate, useLocation } from "react-router-dom";
import { FaUser, FaHome, FaBoxes, FaChartBar, FaReceipt, FaUsers, FaMoneyCheckAlt, FaRecycle, FaHourglassHalf, FaCheckCircle, FaTimesCircle, FaClipboardList, FaDollarSign, FaExclamationCircle } from "react-icons/fa";

const Home = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("");
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


  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [stats, setStats] = useState({ clientes: 0, cotizaciones: 0, pendientes: 0, pagadas: 0, canceladas: 0, montoTotal: 0, montoPendiente: 0 });
  const [recentSales, setRecentSales] = useState([]);
  const [chartData, setChartData] = useState([
    { label: "Lun", value: 0 },
    { label: "Mar", value: 0 },
    { label: "Mié", value: 0 },
    { label: "Jue", value: 0 },
    { label: "Vie", value: 0 },
    { label: "Sáb", value: 0 },
    { label: "Dom", value: 0 },
  ]);
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

  // Cargar datos reales para panel rápido y estadísticas  Front funcional
  useEffect(() => {
    const fetchDash = async () => {
      try {
        const token = localStorage.getItem("token");
        const authHeaders = token ? { Authorization: `Bearer ${token}`, Accept: "application/json" } : { Accept: "application/json" };
        const [resClientes, resCots] = await Promise.all([
          fetch("http://localhost:3000/clientes", { headers: authHeaders }),
          fetch("http://localhost:3000/api/ordenes", { headers: authHeaders })
        ]);
        const toJson = async (r) => { const t = await r.text(); try { return JSON.parse(t); } catch { return t; } };
        const cData = await toJson(resClientes);
        const oData = await toJson(resCots);
        const clientesArr = Array.isArray(cData) ? cData : cData?.clientes || [];
        const cotArr = Array.isArray(oData?.data) ? oData.data : Array.isArray(oData) ? oData : [];
        const pendientes = cotArr.filter(c => (c.status||"").toLowerCase()==="pendiente").length;
        const pagadas = cotArr.filter(c => (c.status||"").toLowerCase()==="pagado").length;
        const canceladas = cotArr.filter(c => (c.status||"").toLowerCase()==="cancelado").length;
        const montoTotal = cotArr.reduce((acc,c)=> acc + Number(c.total||0),0);
        const montoPendiente = cotArr.reduce((acc,c)=> {
          const total = Number(c.total||0); const anticipo = Number(c.anticipo||0); return acc + Math.max(0,total-anticipo);
        },0);
        setStats({ clientes: clientesArr.length, cotizaciones: cotArr.length, pendientes, pagadas, canceladas, montoTotal, montoPendiente });
        const sorted = [...cotArr].sort((a,b) => new Date(b.fecha_creacion||b.fecha||0) - new Date(a.fecha_creacion||a.fecha||0));
        setRecentSales(sorted.slice(0,5));

        // Estadísticas semanales: conteo de cotizaciones por día (Lun-Dom) de la semana actual
        const now = new Date();
        // Obtener lunes de esta semana (considerando lunes como primer día)
        const day = (now.getDay() + 6) % 7; // 0..6 donde 0 = Lunes
        const monday = new Date(now);
        monday.setHours(0,0,0,0);
        monday.setDate(now.getDate() - day);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23,59,59,999);

        const counts = [0,0,0,0,0,0,0]; // Lun..Dom
        cotArr.forEach((c) => {
          const d = new Date(c.fecha_creacion || c.fecha || 0);
          if (!isNaN(d.getTime()) && d >= monday && d <= sunday) {
            const idx = (d.getDay() + 6) % 7; // 0..6 L-D
            counts[idx] += 1;
          }
        });
        setChartData([
          { label: "Lun", value: counts[0] },
          { label: "Mar", value: counts[1] },
          { label: "Mié", value: counts[2] },
          { label: "Jue", value: counts[3] },
          { label: "Vie", value: counts[4] },
          { label: "Sáb", value: counts[5] },
          { label: "Dom", value: counts[6] },
        ]);
      } catch {
        // silencioso
      }
    };
    fetchDash();
  }, []);
  const maxValue = Math.max(...chartData.map(d => d.value)) || 1;

  // Role
  let isAdmin = false;
  try {
    const userObj = JSON.parse(localStorage.getItem("user")||"{}");
    isAdmin = String(userObj?.rol||"").toLowerCase()==="admin";
  } catch {
    // ignore
  }

  return (
    <div className="home-bg">
      <nav className="main-navbar guinda-navbar">
        <div className="nav-container">
          {/* Izquierda: logo + título + menú móvil */}
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
              <div className="nav-title">INICIO</div>
            </div>
            <header className="header">
              <h1>INICIO <FaHome className="iconName" /></h1>
            </header>
            <div className={`mobile-menu ${mobileMenuOpen ? "open" : ""}`}>
              <button className={`nav-btn${location.pathname === "/home" ? " nav-btn-active" : ""}`} onClick={() => navigate("/home")}>Inicio</button>
              <button className={`nav-btn${location.pathname === "/inventario" ? " nav-btn-active" : ""}`} onClick={() => navigate("/inventario")}>Inventario</button>
              <button className={`nav-btn${location.pathname === "/ventas" ? " nav-btn-active" : ""}`} onClick={() => navigate("/ventas")}>Ventas</button>
              <button className={`nav-btn${location.pathname === "/clientes" ? " nav-btn-active" : ""}`} onClick={() => navigate("/clientes")}>Clientes</button>
              {isAdmin && (
                <button className={`nav-btn${location.pathname === "/usuarios" ? " nav-btn-active" : ""}`} onClick={() => navigate("/usuarios")}>Usuarios</button>
              )}
            </div>
          </div>

          {/* Centro: navegación (oculto en móvil) */}
          <div className="nav-center">
            <button className={`nav-btn${location.pathname === "/home" ? " nav-btn-active" : ""}`} onClick={() => navigate("/home")}>Inicio</button>
            <button className={`nav-btn${location.pathname === "/inventario" ? " nav-btn-active" : ""}`} onClick={() => navigate("/inventario")}>Inventario</button>
            <button className={`nav-btn${location.pathname === "/ventas" ? " nav-btn-active" : ""}`} onClick={() => navigate("/ventas")}>Ventas</button>
            <button className={`nav-btn${location.pathname === "/clientes" ? " nav-btn-active" : ""}`} onClick={() => navigate("/clientes")}>Clientes</button>
            {isAdmin && <button className={`nav-btn${location.pathname === "/usuarios" ? " nav-btn-active" : ""}`} onClick={() => navigate("/usuarios")}>Usuarios</button>}
          </div>

          {/* Derecha: fecha/hora + usuario */}
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

      {/* Dashboard Home */}
      <main className="home-dashboard">
        {/* Espaciador superior adicional para alejar contenido del navbar */}
        <div className="home-top-spacer" />

        {/* Accesos rápidos */}
        <section className="home-left">
          <h3 className="section-title">Accesos rápidos</h3>
          <div className="home-actions-grid">
            <button className="home-card home-card-action inventory-card" onClick={() => navigate("/inventario")} title="Inventario">
              <span className="home-card-icon"><FaBoxes size={26} /></span>
              <div className="home-card-text"><h3>Inventario</h3><p>{stats.cotizaciones>0?`Productos activos`:'Administrar productos'}</p></div>
            </button>
            <button className="home-card home-card-action inventory-card" onClick={() => navigate("/ventas")} title="Ventas">
              <span className="home-card-icon"><FaMoneyCheckAlt size={26} /></span>
              <div className="home-card-text"><h3>Ventas</h3><p>{stats.cotizaciones} cotizaciones</p></div>
            </button>
            <button className="home-card home-card-action inventory-card" onClick={() => navigate("/clientes")} title="Clientes">
              <span className="home-card-icon"><FaUsers size={26} /></span>
              <div className="home-card-text"><h3>Clientes</h3><p>{stats.clientes} registrados</p></div>
            </button>
            <button className="home-card home-card-action inventory-card" onClick={() => navigate("/residuos")} title="Residuos">
              <span className="home-card-icon"><FaRecycle size={26} /></span>
              <div className="home-card-text"><h3>Residuos</h3><p>Control sobrantes</p></div>
            </button>
            {isAdmin && (
              <button className="home-card home-card-action inventory-card" onClick={() => navigate("/usuarios")} title="Usuarios">
                <span className="home-card-icon"><FaUser size={26} /></span>
                <div className="home-card-text"><h3>Usuarios</h3><p>Gestión de roles</p></div>
              </button>
            )}
          </div>
          {/* Mini resumen de estados */}
          <h3 className="section-title" style={{ marginTop: 6 }}>Resumen</h3>
          <div className="card kpi-row" style={{ marginTop:8 }}>
            <div className="kpi" title="Cotizaciones totales">
              <span className="kpi-icon"><FaClipboardList /></span>
              <span className="kpi-label">Cotizaciones</span>
              <span className="kpi-value">{stats.cotizaciones}</span>
            </div>
            <div className="kpi" title="Pendientes">
              <span className="kpi-icon"><FaHourglassHalf /></span>
              <span className="kpi-label">Pendientes</span>
              <span className="kpi-value kpi-pendiente">{stats.pendientes}</span>
            </div>
            <div className="kpi" title="Pagadas">
              <span className="kpi-icon"><FaCheckCircle /></span>
              <span className="kpi-label">Pagadas</span>
              <span className="kpi-value kpi-pagado">{stats.pagadas}</span>
            </div>
            <div className="kpi" title="Canceladas">
              <span className="kpi-icon"><FaTimesCircle /></span>
              <span className="kpi-label">Canceladas</span>
              <span className="kpi-value kpi-cancelado">{stats.canceladas}</span>
            </div>
            <div className="kpi" title="Clientes registrados">
              <span className="kpi-icon"><FaUsers /></span>
              <span className="kpi-label">Clientes</span>
              <span className="kpi-value">{stats.clientes}</span>
            </div>
            <div className="kpi" title="Monto total de cotizaciones">
              <span className="kpi-icon"><FaDollarSign /></span>
              <span className="kpi-label">Monto Total</span>
              <span className="kpi-value">${stats.montoTotal.toLocaleString('es-MX',{minimumFractionDigits:2})}</span>
            </div>
            <div className="kpi" title="Saldo pendiente acumulado">
              <span className="kpi-icon"><FaExclamationCircle /></span>
              <span className="kpi-label">Saldo Pendiente</span>
              <span className="kpi-value kpi-pendiente">${stats.montoPendiente.toLocaleString('es-MX',{minimumFractionDigits:2})}</span>
            </div>
          </div>
        </section>

        {/* Sección inferior: Tablas y estadísticas (a lo ancho) */}
        <section className="home-bottom">
          <div className="card recent-sales sales-card">
            <div className="card-header">
              <FaReceipt size={18} />
              <h4>Últimas cotizaciones</h4>
            </div>
            <div className="sales-table">
              <div className="sales-header sticky">
                <span>ID</span>
                <span>Cliente</span>
                <span>Total</span>
                <span>Fecha</span>
                <span>Estado</span>
              </div>
              <ul className="sales-list scrollable">
                {recentSales.length === 0 && <li style={{ padding:'0.5rem', color:'#666' }}>Sin datos recientes</li>}
                {recentSales.map(s => {
                  const status = String(s.status||'').toLowerCase();
                  const badgeClass = `status-badge status-${status}`;
                  return (
                    <li key={s.id} className="sale-item">
                      <span className="col-id">{s.id}</span>
                      <span className="col-cliente">{s.cliente || s.Cliente?.nombre || '—'}</span>
                      <span className="col-total">${Number(s.total||s.subtotal||0).toLocaleString('es-MX',{minimumFractionDigits:2})}</span>
                      <span className="col-fecha">{new Date(s.fecha_creacion||s.fecha||Date.now()).toLocaleDateString('es-MX')}</span>
                      <span className="col-estado">{status && <span className={badgeClass}>{status}</span>}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="card stats-card">
            <div className="card-header">
              <FaChartBar size={18} />
              <h4>Estadísticas de la semana</h4>
            </div>
            <div className="bars">
              {chartData.map(d => (
                <div key={d.label} className="bar">
                  <div
                    className="bar-fill"
                    style={{ height: `${(d.value / maxValue) * 100}%` }}
                    aria-label={`${d.label}: ${d.value}`}
                  />
                  <span className="bar-label">{d.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;