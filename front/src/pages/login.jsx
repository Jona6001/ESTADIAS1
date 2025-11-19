import React, { useState } from "react";
import "../App.css";
import Swal from "sweetalert2";
import { loginUser, recoverPassword } from "../services/authService";
import { useNavigate } from "react-router-dom";
import { clearSession } from "../utils/auth";

const Login = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [recovering, setRecovering] = useState(false);
	const navigate = useNavigate();

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (submitting) return;
		setSubmitting(true);

		try {
			const res = await loginUser(email.trim(), password);
			clearSession();
			localStorage.setItem("user", JSON.stringify(res.user));
			if (res.token) {
				localStorage.setItem("token", res.token);
			}
			await Swal.fire({
				title: "¡Bienvenido!",
				text: res.user?.nombre
					? `Hola, ${res.user.nombre}`
					: "Inicio de sesión exitoso",
				icon: "success",
				confirmButtonColor: "#0077b6",
				background: "#f8f9fa",
			});
			navigate("/home");
		} catch (err) {
			await Swal.fire({
				title: "Error",
				text: err.message || "Error de autenticación",
				icon: "error",
				confirmButtonColor: "#d90429",
				background: "#fff",
			});
		} finally {
			setSubmitting(false);
		}
	};

	const handleForgotPassword = async () => {
		if (recovering) return;
		const { value: emailInput, isConfirmed } = await Swal.fire({
			title: "Recuperar contraseña",
			text: "Ingresa el correo con el que te registraste.",
			input: "email",
			inputLabel: "Correo electrónico",
			inputPlaceholder: "usuario@empresa.com",
			confirmButtonText: "Enviar instrucciones",
			cancelButtonText: "Cancelar",
			confirmButtonColor: "#a30015",
			showCancelButton: true,
			background: "#f8f9fa",
		});

		if (!isConfirmed || !emailInput) return;

		const sanitizedEmail = emailInput.trim().toLowerCase();
		if (!sanitizedEmail) return;

		setRecovering(true);
		Swal.fire({
			title: "Enviando...",
			text: "Generando instrucciones de recuperación.",
			allowOutsideClick: false,
			showConfirmButton: false,
			background: "#f8f9fa",
			didOpen: () => {
				Swal.showLoading();
			},
		});

		try {
			await recoverPassword(sanitizedEmail);
			Swal.close();
			await Swal.fire({
				icon: "success",
				title: "Correo enviado",
				text: "Te enviamos un mensaje con los pasos para restablecer tu contraseña.",
				confirmButtonColor: "#0077b6",
				background: "#f8f9fa",
			});
		} catch (err) {
			Swal.close();
			await Swal.fire({
				icon: "error",
				title: "No se pudo enviar",
				text: err.message || "Intenta nuevamente más tarde.",
				confirmButtonColor: "#d90429",
				background: "#fff",
			});
		} finally {
			setRecovering(false);
		}
	};

	return (
		<div className="login-bg">
			<div className="login-wrapper">
				<div className="login-illustration">
					<img
						src="https://irp.cdn-website.com/d7ba7f52/dms3rep/multi/265.png"
						alt="Logo Petro-Arte"
						className="login-illustration-logo"
					/>
					<h2>Bienvenido a Petro-Arte</h2>
					<p>
						Administra cotizaciones, ventas, inventario y residuos en una sola
						plataforma.
					</p>
					<ul className="login-highlights">
						<li>Panel ejecutivo con indicadores clave.</li>
						<li>Seguimiento de clientes y usuarios.</li>
						<li>Control granular del inventario.</li>
					</ul>
				</div>

				<div className="login-card">
					<form className="login-form" onSubmit={handleSubmit}>
						<h1>Iniciar sesión</h1>
						<div className="form-group">
							<label htmlFor="email">Correo</label>
							<input
								type="email"
								id="email"
								autoComplete="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								placeholder="usuario@empresa.com"
							/>
						</div>
						<div className="form-group">
							<label htmlFor="password">Contraseña</label>
							<input
								type="password"
								id="password"
								autoComplete="current-password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								placeholder="Tu contraseña"
							/>
						</div>
						<button type="submit" disabled={submitting}>
							{submitting ? "Ingresando..." : "Entrar"}
						</button>
						<div className="login-footer">
							<button
								type="button"
								className="login-forgot"
								disabled={recovering}
								onClick={handleForgotPassword}
							>
								¿Olvidaste tu contraseña?
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};

export default Login;
