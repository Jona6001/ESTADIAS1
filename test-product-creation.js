// Test de creación de producto tipo "piezas"
async function testCreateProductPiezas() {
  try {
    // Primer paso: hacer login para obtener un token
    console.log("🔐 Haciendo login...");
    const loginRes = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        correo: "admin@example.com", // Usuario por defecto del sistema
        contrasena: "admin123"
      })
    });

    const loginData = await loginRes.json();
    console.log("📋 Resultado del login:", { status: loginRes.status, data: loginData });

    if (!loginRes.ok) {
      throw new Error("Error en login: " + JSON.stringify(loginData));
    }

    const token = loginData.token;
    console.log("✅ Token obtenido:", token?.substring(0, 20) + "...");

    // Segundo paso: crear producto tipo piezas
    console.log("\n📦 Creando producto tipo 'piezas'...");
    const productPayload = {
      tipoMaterial: "Metal",
      nombre: "Producto Test Piezas",
      unidadMedida: "piezas",
      descripcion: "Descripción de prueba",
      imagen: "",
      precio: 150.50,
      cantidad_piezas: 100
    };

    console.log("📤 Payload a enviar:", productPayload);

    const productRes = await fetch("https://estadias1-backend-production.up.railway.app/productos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(productPayload)
    });

    const productData = await productRes.json();
    console.log("📥 Resultado crear producto:", { status: productRes.status, data: productData });

    if (productRes.ok) {
      console.log("✅ ¡Producto tipo piezas creado exitosamente!");
      return productData.producto.ID;
    } else {
      console.error("❌ Error al crear producto:", productData);
    }
  } catch (error) {
    console.error("💥 Error general:", error.message);
  }
}

// Test de creación de producto tipo "m2"
async function testCreateProductM2() {
  try {
    // Primer paso: hacer login para obtener un token
    console.log("\n🔐 Haciendo login para test M2...");
    const loginRes = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        correo: "admin@example.com", 
        contrasena: "admin123"
      })
    });

    const loginData = await loginRes.json();
    console.log("📋 Resultado del login:", { status: loginRes.status, data: loginData });

    if (!loginRes.ok) {
      throw new Error("Error en login: " + JSON.stringify(loginData));
    }

    const token = loginData.token;
    console.log("✅ Token obtenido:", token?.substring(0, 20) + "...");

    // Segundo paso: crear producto tipo m2
    console.log("\n📐 Creando producto tipo 'm2'...");
    const productPayload = {
      tipoMaterial: "Lamina",
      nombre: "Producto Test M2",
      unidadMedida: "m2",
      descripcion: "Descripción de prueba para m2",
      imagen: "",
      precio: 250.75,
      cantidad_m2: 50.5,
      medida_por_unidad: 2.5
    };

    console.log("📤 Payload a enviar:", productPayload);

    const productRes = await fetch("https://estadias1-backend-production.up.railway.app/productos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(productPayload)
    });

    const productData = await productRes.json();
    console.log("📥 Resultado crear producto:", { status: productRes.status, data: productData });

    if (productRes.ok) {
      console.log("✅ ¡Producto tipo m2 creado exitosamente!");
      return productData.producto.ID;
    } else {
      console.error("❌ Error al crear producto:", productData);
    }
  } catch (error) {
    console.error("💥 Error general:", error.message);
  }
}

// Ejecutar ambas pruebas
console.log("🧪 INICIANDO TESTS DE CREACIÓN DE PRODUCTOS...\n");
testCreateProductPiezas()
  .then(() => testCreateProductM2())
  .then(() => console.log("\n🏁 Tests completados"));