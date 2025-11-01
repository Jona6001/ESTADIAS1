import { Routes, Route } from "react-router-dom";
import Login from "./pages/login";
import Home from "./pages/home";
import Clients from "./pages/clients";
import Sells from "./pages/sells";
import Users from "./pages/users";
import Config from "./pages/config";
import Inventory from "./pages/inventory";
import Residuos from "./pages/residuos";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/home" element={<Home />} />
      <Route path="/clientes" element={<Clients />} />
      <Route path="/ventas" element={<Sells />} />
      <Route path="/usuarios" element={<Users />} />
      <Route path="/config" element={<Config />} />
  <Route path="/inventario" element={<Inventory />} />
  <Route path="/residuos" element={<Residuos />} />

    </Routes>
  );
}

export default App;