
import React, { useState, useRef, useEffect } from "react";
import "../App.css";
import { useNavigate, useLocation } from "react-router-dom";
import { FaUser, FaBoxes, FaEdit, FaTrash, FaPlus, FaSave, FaTimes, FaCheck } from "react-icons/fa";

const API_URL = "http://localhost:3000/productos";

const initialForm = {
	nombre: "",
	descripcion: "",
	imagen: "",
	cantidad_piezas: 0,
	medida_por_unidad: 0
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
		const [modalOpen, setModalOpen] = useState(null); // null, 'add', 'edit', 'reactivate'
		const [form, setForm] = useState(initialForm);
		const [editId, setEditId] = useState(null);
		const [errorMsg, setErrorMsg] = useState("");
		const [reactivateId, setReactivateId] = useState(null);
		const [deleteConfirmId, setDeleteConfirmId] = useState(null);
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

	// CRUD Productos
	const fetchProductos = async () => {
		setLoading(true);
		try {
			const token = localStorage.getItem("token");
			const res = await fetch(API_URL, {
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await res.json();
			setProductos(data.productos || []);
		} catch (err) {
			setProductos([]);
		}
		setLoading(false);
	};

	const openAddModal = () => {
		setForm(initialForm);
		setEditId(null);
		setModalOpen('add');
		setErrorMsg("");
	};

	const openEditModal = (producto) => {
		setForm({
			nombre: producto.nombre,
			descripcion: producto.descripcion || "",
			imagen: producto.imagen || "",
			cantidad_piezas: producto.cantidad_piezas,
			medida_por_unidad: producto.medida_por_unidad
		});
		setEditId(producto.ID || producto.id);
		setModalOpen('edit');
		setErrorMsg("");
	};

	const openReactivateModal = (producto) => {
		setReactivateId(producto.ID || producto.id);
		setModalOpen('reactivate');
	};

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
		const token = localStorage.getItem("token");
		try {
			const res = await fetch(API_URL, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(form),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.mensaje || "Error al agregar producto");
			fetchProductos();
			closeModal();
		} catch (err) {
			setErrorMsg(err.message);
		}
	};

	const handleEdit = async (e) => {
		e.preventDefault();
		setErrorMsg("");
		const token = localStorage.getItem("token");
		try {
			const res = await fetch(`${API_URL}/${editId}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(form),
			});
			let data;
			let text = await res.text();
			try {
				data = JSON.parse(text);
			} catch (e) {
				setErrorMsg("Error inesperado del servidor. Intenta más tarde o revisa la consola.");
				return;
			}
			if (!res.ok) throw new Error(data.mensaje || "Error al editar producto");
			fetchProductos();
			closeModal();
		} catch (err) {
			setErrorMsg(err.message);
		}
	};

	const handleDelete = async (id) => {
		const token = localStorage.getItem("token");
		try {
			const res = await fetch(`${API_URL}/${id}/desactivar`, {
				method: "PATCH",
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.mensaje || "Error al eliminar producto");
			fetchProductos();
			setDeleteConfirmId(null);
		} catch (err) {
			alert(err.message);
			setDeleteConfirmId(null);
		}
	};

	const handleReactivate = async () => {
		const token = localStorage.getItem("token");
		try {
			const res = await fetch(`${API_URL}/${reactivateId}/reactivar`, {
				method: "PATCH",
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.mensaje || "Error al reactivar producto");
			fetchProductos();
			setModalOpen(null);
			setReactivateId(null);
		} catch (err) {
			alert(err.message);
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

	const cancelLogout = () => {
		setShowLogoutConfirm(false);
	};

	const handleConfig = () => {
		setMenuOpen(false);
		navigate("/config");
	};

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
			<div className="nav-title">INVENTARIO</div>
		      </div>
		      <header className="header">
			<h1>INVENTARIO <FaBoxes className="iconName" /></h1>
		      </header>
		      <div className={`mobile-menu ${mobileMenuOpen ? "open" : ""}`}>
			<button className={`nav-btn${location.pathname === "/home" ? " nav-btn-active" : ""}`} onClick={() => navigate("/home")}>Inicio</button>
			<button className={`nav-btn${location.pathname === "/inventario" ? " nav-btn-active" : ""}`} onClick={() => navigate("/inventario")}>Inventario</button>
			<button className={`nav-btn${location.pathname === "/ventas" ? " nav-btn-active" : ""}`} onClick={() => navigate("/ventas")}>Ventas</button>
			<button className={`nav-btn${location.pathname === "/clientes" ? " nav-btn-active" : ""}`} onClick={() => navigate("/clientes")}>Clientes</button>
			<button className={`nav-btn${location.pathname === "/usuarios" ? " nav-btn-active" : ""}`} onClick={() => navigate("/usuarios")}>Usuarios</button>
		      </div>
		    </div>

		    {/* Centro: navegación (oculto en móvil) */}
		    <div className="nav-center">
		      <button className={`nav-btn${location.pathname === "/home" ? " nav-btn-active" : ""}`} onClick={() => navigate("/home")}>Inicio</button>
		      <button className={`nav-btn${location.pathname === "/inventario" ? " nav-btn-active" : ""}`} onClick={() => navigate("/inventario")}>Inventario</button>
		      <button className={`nav-btn${location.pathname === "/ventas" ? " nav-btn-active" : ""}`} onClick={() => navigate("/ventas")}>Ventas</button>
		      <button className={`nav-btn${location.pathname === "/clientes" ? " nav-btn-active" : ""}`} onClick={() => navigate("/clientes")}>Clientes</button>
		      <button className={`nav-btn${location.pathname === "/usuarios" ? " nav-btn-active" : ""}`} onClick={() => navigate("/usuarios")}>Usuarios</button>
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

			<div style={{ padding: 40, maxWidth: 1100, margin: "0 auto" }}>
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
					<button className="open-add-modal-btn" onClick={openAddModal}>
						<FaPlus style={{ marginRight: 8 }} /> Nuevo Producto
					</button>
				</div>

				{/* Tabla de productos */}
				{(() => {
					let tableRows;
					if (loading) {
						tableRows = (
							<tr>
								<td colSpan="10">Cargando...</td>
							</tr>
						);
					} else if (productos.length === 0) {
						tableRows = (
							<tr>
								<td colSpan="10">No hay productos registrados</td>
							</tr>
						);
					} else {
						tableRows = productos.map(producto => (
							<tr
								key={producto.ID || producto.id}
								className={producto.status ? "" : "inactive-row"}
							>
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
								<td>{producto.cantidad_piezas}</td>
								<td>{producto.medida_por_unidad}</td>
								<td>{producto.cantidad_m2}</td>
								<td>
									{producto.fecha_creacion
										? new Date(producto.fecha_creacion).toLocaleDateString()
										: ""}
								</td>
								<td>
									{/* Estado eliminado */}
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
											onClick={() => setDeleteConfirmId(producto.ID || producto.id)}
											style={{ color: '#ffffffff' }}
										>
											<FaTrash />
										</button>
{/* Modal de confirmación de eliminación de producto */}
{deleteConfirmId && (
	<div className="modal-overlay">
		<div className="modal-content" style={{ maxWidth: 340, textAlign: 'center' }}>
			<h2 style={{ color: '#a30015', fontWeight: 800, fontSize: '1.15rem', marginBottom: 18 }}>¿Eliminar producto?</h2>
			<p style={{ color: '#7b1531', marginBottom: 22, fontWeight: 600 }}>¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.</p>
			<div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
				<button className="delete-btn" style={{ minWidth: 90 }} onClick={() => handleDelete(deleteConfirmId)}>Eliminar</button>
				<button className="cancel-btn" style={{ minWidth: 90 }} onClick={() => setDeleteConfirmId(null)}>Cancelar</button>
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
							<table className="users-table">
								<thead>
									<tr>
										<th>ID</th>
										<th>Nombre</th>
										<th>Descripción</th>
										<th>Imagen</th>
										<th>Cant. piezas</th>
										<th>Medida/unidad</th>
										<th>Cant. m2</th>
										<th>Fecha creación</th>
										<th>Estado</th>
										<th>Acciones</th>
									</tr>
								</thead>
								<tbody>{tableRows}</tbody>
							</table>
						</div>
					);
				})()}

				{/* Modal para crear producto */}
						{modalOpen === 'add' && (
							<div className="modal-overlay">
								<div className="modal-content modal-product" style={{ maxWidth: 420, color: '#111' }}>
									<h2 style={{ color: '#111' }}>Nuevo Producto</h2>
									<form className="user-form" onSubmit={handleAdd}>
										<div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 320, maxWidth: '100%' }}>
											<label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
												<span style={{ minWidth: 110 }}>Nombre:</span>
												<input className="user-input" type="text" name="nombre" value={form.nombre} onChange={handleChange} required />
											</label>
											<label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
												<span style={{ minWidth: 110 }}>Descripción:</span>
												<input className="user-input" type="text" name="descripcion" value={form.descripcion} onChange={handleChange} />
											</label>
											<label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
												<span style={{ minWidth: 110 }}>URL imagen:</span>
												<input className="user-input" type="url" name="imagen" value={form.imagen} onChange={handleImageChange} placeholder="(opcional)" />
											</label>
											<label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
												<span style={{ minWidth: 110 }}>Cantidad piezas:</span>
												<input className="user-input" type="number" name="cantidad_piezas" value={form.cantidad_piezas === 0 ? '' : form.cantidad_piezas} onChange={e => setForm({ ...form, cantidad_piezas: parseFloat(e.target.value) || 0 })} min={0} step="any" required onFocus={e => { if (form.cantidad_piezas === 0) e.target.value = ''; }} />
											</label>
											<label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
												<span style={{ minWidth: 110 }}>Medida/unidad (m2):</span>
												<input className="user-input" type="number" name="medida_por_unidad" value={form.medida_por_unidad === 0 ? '' : form.medida_por_unidad} onChange={e => setForm({ ...form, medida_por_unidad: parseFloat(e.target.value) || 0 })} min={0} step="any" required onFocus={e => { if (form.medida_por_unidad === 0) e.target.value = ''; }} />
											</label>
											{/* Campo de estado eliminado */}
											{errorMsg && <div style={{ color: "#a30015", marginBottom: 8 }}>{errorMsg}</div>}
											<div className="modal-btn-row">
												<button type="submit" className="add-btn">
													<FaPlus style={{ marginRight: 6 }} /> Agregar
												</button>
												<button type="button" className="cancel-btn" onClick={closeModal}>
													<FaTimes style={{ marginRight: 6 }} /> Cancelar
												</button>
											</div>
										</div>
									</form>
								</div>
							</div>
						)}

				{/* Modal para editar producto */}
						{modalOpen === 'edit' && (
							<div className="modal-overlay">
								<div className="modal-content modal-product" style={{ maxWidth: 420, color: '#111' }}>
									<h2 style={{ color: '#111' }}>Editar Producto</h2>
									<form className="user-form" onSubmit={handleEdit}>
										<div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 320, maxWidth: '100%' }}>
											<label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
												<span style={{ minWidth: 110 }}>Nombre:</span>
												<input className="user-input" type="text" name="nombre" value={form.nombre} onChange={handleChange} required />
											</label>
											<label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
												<span style={{ minWidth: 110 }}>Descripción:</span>
												<input className="user-input" type="text" name="descripcion" value={form.descripcion} onChange={handleChange} />
											</label>
											<label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
												<span style={{ minWidth: 110 }}>URL imagen:</span>
												<input className="user-input" type="url" name="imagen" value={form.imagen} onChange={handleImageChange} placeholder="(opcional)" />
											</label>
											<label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
												<span style={{ minWidth: 110 }}>Cantidad piezas:</span>
												<input className="user-input" type="number" name="cantidad_piezas" value={form.cantidad_piezas === 0 ? '' : form.cantidad_piezas} onChange={e => setForm({ ...form, cantidad_piezas: parseFloat(e.target.value) || 0 })} min={0} step="any" required onFocus={e => { if (form.cantidad_piezas === 0) e.target.value = ''; }} />
											</label>
											<label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
												<span style={{ minWidth: 110 }}>Medida/unidad (m2):</span>
												<input className="user-input" type="number" name="medida_por_unidad" value={form.medida_por_unidad === 0 ? '' : form.medida_por_unidad} onChange={e => setForm({ ...form, medida_por_unidad: parseFloat(e.target.value) || 0 })} min={0} step="any" required onFocus={e => { if (form.medida_por_unidad === 0) e.target.value = ''; }} />
											</label>
											{/* Campo de estado eliminado */}
											{errorMsg && <div style={{ color: "#a30015", marginBottom: 8 }}>{errorMsg}</div>}
											<div className="modal-btn-row">
												<button type="submit" className="add-btn">
													<FaSave style={{ marginRight: 6 }} /> Guardar
												</button>
												<button type="button" className="cancel-btn" onClick={closeModal}>
													<FaTimes style={{ marginRight: 6 }} /> Cancelar
												</button>
											</div>
										</div>
									</form>
								</div>
							</div>
						)}

						{modalOpen === 'reactivate' && (
							<div className="modal-overlay">
								<div className="modal-content" style={{ maxWidth: 340, textAlign: 'center' }}>
									<h2 style={{ color: '#a30015', fontWeight: 800, fontSize: '1.15rem', marginBottom: 18 }}>¿Reactivar producto?</h2>
									<p style={{ color: '#7b1531', marginBottom: 22, fontWeight: 600 }}>¿Estás seguro de que deseas reactivar este producto?</p>
									<div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
										<button className="reactivate-btn" style={{ minWidth: 90 }} onClick={handleReactivate}>Reactivar</button>
										<button className="cancel-btn" style={{ minWidth: 90 }} onClick={closeModal}>Cancelar</button>
									</div>
								</div>
							</div>
						)}
			</div>
		</div>
	);
};

export default Inventory;
