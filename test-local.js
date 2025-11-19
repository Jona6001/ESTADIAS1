// Test LOCAL de creación de producto tipo "piezas"
async function testCreateProductPiezasLocal() {
  try {
    // Login
    const loginRes = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        correo: "admin@example.com",
        contrasena: "admin123"
      })
    });

    const loginData = await loginRes.json();
    console.log("📋 Login:", { status: loginRes.status, ok: loginRes.ok });
    
    if (!loginRes.ok) {
      throw new Error("Error en login: " + JSON.stringify(loginData));
    }

    const token = loginData.token;
    console.log("✅ Token:", token?.substring(0, 20) + "...");

    // Crear producto tipo piezas
    const productPayload = {
      tipoMaterial: "Metal",
      nombre: "Producto Test Piezas Local",
      unidadMedida: "piezas",
      descripcion: "Test local",
      imagen: "",
      precio: 150.5,
      cantidad_piezas: 100
    };

    console.log("📤 Payload:", productPayload);

    const productRes = await fetch("http://localhost:3000/productos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(productPayload)
    });

    const productData = await productRes.json();
    console.log("📥 Resultado:", { status: productRes.status, data: productData });

  } catch (error) {
    console.error("💥 Error:", error.message);
  }
}

console.log("🧪 TEST LOCAL - Creación producto...");
testCreateProductPiezasLocal();