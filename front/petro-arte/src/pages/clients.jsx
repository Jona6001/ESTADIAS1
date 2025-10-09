import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser } from "react-icons/fa";

export default function Clients() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef();

  const handleLogout = () => {
    navigate("/");
  };

  const handleConfig = () => {
    alert("Configuración (en construcción)");
  };

  return (
    <div>
      <nav className="main-navbar guinda-navbar">
        <div className="nav-container">
          {/* Logo que funciona como botón móvil */}
          <div className="nav-left">
            <div
              className="nav-logo mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(v => !v)}
              style={{ cursor: "pointer" }}
            >
              <img
                src="https://irp.cdn-website.com/d7ba7f52/dms3rep/multi/265.png"
                alt="Logo"
                className="logo-img"
              />
              <div className="nav-title">Clientes</div>
            </div>

            
            <header className="header">
              <h1 center>CLIENTES</h1>
            </header>

            {/* Menú desplegable móvil */}
            <div className={`mobile-menu ${mobileMenuOpen ? "open" : ""}`}>
              <button className="nav-btn" onClick={() => navigate("/ventas")}>Ventas</button>
              <button className="nav-btn" onClick={() => navigate("/home")}>Inicio</button>
              <button className="nav-btn" onClick={() => navigate("/usuarios")}>Usuarios</button>
            </div>
          </div>
          {/* Botones normales (ocultos en móvil) */}
          <div className="nav-center">
            <button className="nav-btn" onClick={() => navigate("/ventas")}>Ventas</button>
              <button className="nav-btn" onClick={() => navigate("/home")}>Inicio</button>
            <button className="nav-btn" onClick={() => navigate("/usuarios")}>Usuarios</button>
          </div>
          {/* Botón usuario */}
          <div className="nav-user" ref={menuRef}>
            <button className="user-btn" onClick={() => setMenuOpen(v => !v)}>
              <FaUser size={20} color="#fff" />
            </button>
            {menuOpen && (
              <div className="user-menu">
                <button onClick={handleConfig}>Configuración</button>
                <button onClick={handleLogout}>Cerrar sesión</button>
              </div>
            )}
          </div>
        </div>
      </nav>
      <div style={{ padding: 40, textAlign: "center" }}>
        <h1>Clientes</h1>
        <p>Próximamente podrás administrar clientes y sus datos.</p>
      </div>
    </div>
  );
}