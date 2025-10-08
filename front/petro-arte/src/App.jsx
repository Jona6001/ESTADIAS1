import { Routes, Route } from "react-router-dom";
import Login from "./pages/login";
import Home from "./pages/home";
import Clients from "./pages/clients";
import Sells from "./pages/sells";
import Users from "./pages/users";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/home" element={<Home />} />
      <Route path="/clientes" element={<Clients />} />
      <Route path="/ventas" element={<Sells />} />
      <Route path="/usuarios" element={<Users />} />
    </Routes>
  );
}

export default App;