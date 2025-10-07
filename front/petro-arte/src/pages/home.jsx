import React, { useState, useRef, useEffect } from "react";
import "../App.css";
import { useNavigate } from "react-router-dom";
import { FaUser } from "react-icons/fa";

const Home = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);          // menú usuario
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // menú móvil desde logo
  const menuRef = useRef();

  const handleLogout = () => {
    setMenuOpen(false);
    navigate("/");
  };

  const handleConfig = () => {
    setMenuOpen(false);
    alert("Configuración próximamente");
  };

  // Cierra el menú usuario si se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
              <div className="nav-title">Panel Principal</div>
            </div>

            {/* Menú desplegable móvil */}
            <div className={`mobile-menu ${mobileMenuOpen ? "open" : ""}`}>
              <button className="nav-btn" onClick={() => navigate("/ventas")}>Ventas</button>
              <button className="nav-btn" onClick={() => navigate("/clientes")}>Clientes</button>
              <button className="nav-btn" onClick={() => navigate("/usuarios")}>Usuarios</button>
            </div>
          </div>

          {/* Botones normales (ocultos en móvil) */}
          <div className="nav-center">
            <button className="nav-btn" onClick={() => navigate("/ventas")}>Ventas</button>
            <button className="nav-btn" onClick={() => navigate("/clientes")}>Clientes</button>
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



      <header className="home-header">
        <h1>Panel Principal</h1>
      </header>

      <main className="home-main">
        {/* Contenido principal */}
      </main>
    </div>
  );
};

export default Home;
