import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/login";
import Home from "./pages/home";
import Sells from "./pages/sells";
import Clients from "./pages/clients";
import Users from "./pages/users";
import "./App.css";

function App() {
  return (
  <HashRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/ventas" element={<Sells />} />
        <Route path="/clientes" element={<Clients />} />
        <Route path="/usuarios" element={<Users />} />
      </Routes>
  </HashRouter>
  );
}

export default App;
