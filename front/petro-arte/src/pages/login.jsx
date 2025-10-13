import React, { useState } from "react";
import "../App.css";
import Swal from "sweetalert2";
import { loginUser } from "../services/authService";
import { useNavigate } from "react-router-dom";


const Login = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const navigate = useNavigate();

		const handleSubmit = async (e) => {
	  e.preventDefault();
	  try {
		const res = await loginUser(email, password);
		// Guarda el usuario en localStorage
		localStorage.setItem("user", JSON.stringify(res.user));
		await Swal.fire({
		  title: '¡Bienvenido!',
		  text: res.user?.nombre ? `Hola, ${res.user.nombre}` : 'Login exitoso',
		  icon: 'success',
		  confirmButtonColor: '#0077b6',
		  background: '#f8f9fa',
		});
		navigate("/home");
	  } catch (err) {
		Swal.fire({
		  title: 'Error',
		  text: err.message || 'Error de autenticación',
		  icon: 'error',
		  confirmButtonColor: '#d90429',
		  background: '#fff',
		});
	  }
	};

		return (
			<div className="login-bg">
				<img src="https://irp.cdn-website.com/d7ba7f52/dms3rep/multi/265.png" alt="login-logo" className="login-logo" />
				<div className="login-container">
					<form className="login-form" onSubmit={handleSubmit}>
						<h1>Iniciar Sesión </h1>
						<div className="form-group">
							<label htmlFor="email">Correo</label>
							<input
								type="email"
								id="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								placeholder="Ejemplo: usuario@email.com"
							/>
						</div>
						<div className="form-group">
							<label htmlFor="password">Contraseña</label>
							<input
								type="password"
								id="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								placeholder="Tu contraseña"
							/>
						</div>
						<button type="submit">Entrar</button>
					</form>
				</div>
			</div>
		);
};

export default Login;
