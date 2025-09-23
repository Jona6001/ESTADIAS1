import React from "react";
import "../App.css";

const Home = () => {
	return (
		<div className="home-bg">
			<header className="home-header">
				<h1>Panel Principal</h1>
			</header>
			<main className="home-main">
				<section className="home-section ventas">
					<h2>Ventas</h2>
					<p>Gestiona y consulta las ventas realizadas.</p>
					<button className="home-btn">Ir a Ventas</button>
				</section>
				<section className="home-section clientes">
					<h2>Clientes</h2>
					<p>Administra la información de tus clientes.</p>
					<button className="home-btn">Ir a Clientes</button>
				</section>
				<section className="home-section usuarios">
					<h2>Usuarios</h2>
					<p>Gestiona los usuarios del sistema.</p>
					<button className="home-btn">Ir a Usuarios</button>
				</section>
			</main>
		</div>
	);
};

export default Home;
