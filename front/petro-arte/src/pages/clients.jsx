import React, { useState, useRef, useEffect } from "react";
import "../App.css";
import { useNavigate } from "react-router-dom";
import { FaUser, FaUsers  } from "react-icons/fa";

const Clients = () => {
  const [menuOpen, setMenuOpen] = useState(false);
   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
   const [userName, setUserName] = useState("");
   const [dateStr, setDateStr] = useState("");  
   const [timeStr, setTimeStr] = useState("");  
   const menuRef = useRef();
   const navigate = useNavigate();
 
   useEffect(() => {
     const user = JSON.parse(localStorage.getItem("user"));
     if (user && user.nombre) setUserName(user.nombre);
   }, []);
 
   // 🔹 Fecha y hora actualizadas cada segundo
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
 
   const handleLogout = () => {
     setMenuOpen(false);
     navigate("/");
   };
 
   const handleConfig = () => {
     setMenuOpen(false);
     alert("Configuración próximamente");
   };
 
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
               <div className="nav-title">CLIENTES</div>
             </div> 
             <header className="header">
               <h1>CLIENTES <FaUsers  className="iconName" /></h1>
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
           {/* FECHA Y HORA */}
           <div className="nav-datetime">
             <span>{dateStr}</span>
             <span>{timeStr}</span>
           </div>
           {/* Botón usuario */}
           <div className="nav-user" ref={menuRef}>
             <button className="user-btn" onClick={() => setMenuOpen(v => !v)}>
               <FaUser size={28} color="#fff" />
             </button>
             {/*  Nombre del usuario */}
             {userName && (
               <span className="user-name" style={{ color: "#fff", fontWeight: "bold", whiteSpace: "nowrap" }} >
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


      <div style={{ padding: 40, textAlign: "center" }}>
        <h1>Clientes</h1>
        <p>Próximamente podrás administrar clientes y sus datos.</p>
      </div>
    </div>
  );
}

export default Clients;