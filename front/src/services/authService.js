const API_BASE = "https://estadias1-backend-production.up.railway.app";

// Servicio para login
export async function loginUser(email, password) {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      correo: email,
      contrasena: password,
    }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Error de autenticación");
  }
  return await res.json();
}

// Solicitar recuperación de contraseña vía correo
export async function recoverPassword(email) {
  const res = await fetch(`${API_BASE}/recuperar-contrasena`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ correo: email }),
  });

  const payload = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      payload.message ||
        payload.error ||
        "No se pudo procesar la recuperación de la contraseña"
    );
  }

  return payload;
}
