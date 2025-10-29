
    import React, { useState, useEffect, useRef } from "react";
    import { FaUser, FaUserCog, FaLock, FaCheckCircle } from "react-icons/fa";
    import { useNavigate } from "react-router-dom";

    const Config = () => {
      const [menuOpen, setMenuOpen] = useState(false);
      const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
      const [userName, setUserName] = useState("");
      const [dateStr, setDateStr] = useState("");
      const [timeStr, setTimeStr] = useState("");
  const [form, setForm] = useState({ nombre: "", correo: "", telefono: "", contrasena: "", contrasena2: "" });
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showPasswordFields, setShowPasswordFields] = useState(false);
      const menuRef = useRef();
      const navigate = useNavigate();

      useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) navigate("/");
        const user = JSON.parse(localStorage.getItem("user"));
        if (user && user.nombre) {
          setUserName(user.nombre);
          setForm({
            nombre: user.nombre,
            correo: user.correo,
            telefono: user.telefono || "",
            contrasena: "",
            contrasena2: ""
          });
        }
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
          if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
      }, []);

      const handleLogout = () => {
        setMenuOpen(false);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
      };

      const handleConfig = () => {
        setMenuOpen(false);
        navigate("/config");
      };

      const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setErrorMsg("");
        setSuccessMsg("");
      };

      const handleShowPasswordFields = () => {
        setShowPasswordFields(v => !v);
        setForm(f => ({ ...f, contrasena: "", contrasena2: "" }));
        setErrorMsg("");
        setSuccessMsg("");
      };

      const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        setSuccessMsg("");
        if (!form.nombre || !form.correo) {
          setErrorMsg("Nombre y correo son obligatorios");
          return;
        }
        if (showPasswordFields && (form.contrasena || form.contrasena2)) {
          if (form.contrasena !== form.contrasena2) {
            setErrorMsg("Las contraseñas no coinciden");
            return;
          }
          if (form.contrasena.length < 6) {
            setErrorMsg("La contraseña debe tener al menos 6 caracteres");
            return;
          }
        }
        try {
          const token = localStorage.getItem("token");
          const user = JSON.parse(localStorage.getItem("user"));
          const body = {
            nombre: form.nombre,
            correo: form.correo,
            telefono: form.telefono,
            ...(showPasswordFields && form.contrasena ? { contrasena: form.contrasena } : {})
          };
          const res = await fetch(`http://localhost:3000/usuarios/${user.ID}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(body)
          });
          if (!res.ok) {
            const errData = await res.json();
            setErrorMsg(errData.mensaje || "Error al actualizar datos");
            return;
          }
          await res.json();
          setSuccessMsg("Datos actualizados correctamente");
          localStorage.setItem("user", JSON.stringify({ ...user, nombre: form.nombre, correo: form.correo, telefono: form.telefono }));
          setUserName(form.nombre);
          setForm(f => ({ ...f, contrasena: "", contrasena2: "" }));
          setShowPasswordFields(false);
        } catch (err) {
          setErrorMsg("Error al actualizar datos");
        }
      };

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
                  <div className="nav-title">CONFIGURACIÓN</div>
                </div>
                <header className="header">
                  <h1>CONFIGURACIÓN <FaUserCog className="iconName" /></h1>
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
              </div>
            </div>
          </nav>

          <main className="config-container">
            <div className="config-form-wrapper">
              
              <h2>Editar perfil</h2>
              <form className="config-form" onSubmit={handleSubmit}>
                <label>Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  required
                  className="user-input"
                />
                <label>Correo electrónico</label>
                <input
                  type="email"
                  name="correo"
                  value={form.correo}
                  onChange={handleChange}
                  required
                  className="user-input"
                />
                <label>Teléfono</label>
                <input
                  type="tel"
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  className="user-input"
                  placeholder="Ej: 5551234567"
                  pattern="[0-9]{10,15}"
                  maxLength={15}
                />
                <button
                  type="button"
                  className="show-password-btn"
                  onClick={handleShowPasswordFields}
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <FaLock style={{ marginRight: 4 }} /> {showPasswordFields ? 'Cancelar cambio de contraseña' : 'Cambiar contraseña'}
                </button>
                {showPasswordFields && (
                  <>
                    <label>Nueva contraseña</label>
                    <input
                      type="password"
                      name="contrasena"
                      value={form.contrasena}
                      onChange={handleChange}
                      className="user-input"
                      placeholder="Nueva contraseña"
                    />
                    <label>Confirmar nueva contraseña</label>
                    <input
                      type="password"
                      name="contrasena2"
                      value={form.contrasena2}
                      onChange={handleChange}
                      className="user-input"
                      placeholder="Repite la nueva contraseña"
                    />
                  </>
                )}
                {errorMsg && <div className="error-msg">{errorMsg}</div>}
                {successMsg && (
                  <div className="success-msg">
                    <FaCheckCircle style={{ color: '#1a7f37', marginRight: 6, marginBottom: -2 }} />
                    {successMsg}
                  </div>
                )}
                <button type="submit" className="save-btn">Guardar cambios</button>
              </form>
            </div>
          </main>
        </div>
      );
    };

    export default Config;