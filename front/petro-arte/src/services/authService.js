// Servicio para login
export async function loginUser(email, password) {
  const res = await fetch("http://localhost:3000/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      correo: email,         // <-- debe ser 'correo'
      contrasena: password,  // <-- debe ser 'contrasena'
    }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Error de autenticación");
  }
  return await res.json();
}
