// Servicio para login
import axios from "axios";

const API_URL = "http://localhost:3000";

export const loginUser = async (email, password) => {
  try {
    const res = await axios.post(`${API_URL}/login`, { email, password });
    return res.data;
  } catch (err) {
    throw err.response?.data || { message: "Error de conexión" };
  }
};
