import React, { useState, useRef, useEffect } from "react";
import "../App.css";
import { useNavigate } from "react-router-dom";

const Home = () => {
	const navigate = useNavigate();
	const [menuOpen, setMenuOpen] = useState(false);
	const menuRef = useRef();

	const handleLogout = () => {
		setMenuOpen(false);
		navigate("/");
	};
	const handleConfig = () => {
		setMenuOpen(false);
		// Aquí puedes navegar a configuración o mostrar modal
		alert("Configuración próximamente");
	};

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
    {/* Izquierda */}
    <div className="nav-left" onClick={() => navigate("/home")}>
      <div className="nav-logo">
        <img src="https://irp.cdn-website.com/d7ba7f52/dms3rep/multi/265.png" 
             alt="Logo" 
             style={{ height: 38, width: 'auto', cursor: 'pointer', marginRight: 8 }} />
        <div className="nav-title">Panel Principal</div>
      </div>
    </div>

    {/* Centro */}
    <div className="nav-center">
      <button className="nav-btn" onClick={() => navigate("/ventas")}>Ventas</button>
      <button className="nav-btn" onClick={() => navigate("/clientes")}>Clientes</button>
      <button className="nav-btn" onClick={() => navigate("/usuarios")}>Usuarios</button>
    </div>

    {/* Derecha */}
    <div className="nav-user" ref={menuRef}>
      <button className="user-btn" onClick={() => setMenuOpen((v) => !v)}>
        {/* ícono usuario */}
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
					{/* Aquí irán las gráficas y contenido principal */}
				</main>
			</div>
		);
};

export default Home;
