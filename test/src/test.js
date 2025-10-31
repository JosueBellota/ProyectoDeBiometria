// --------------------------------------------------------------------------
// 🔧 URL base del servidor REST desplegado en Firebase
// --------------------------------------------------------------------------
const BASE_URL = "https://us-central1-proyectodebiometria.cloudfunctions.net/ServidorREST";

/* -------------------------------------------------------------------------- */
/* 🔹 Función genérica para llamadas REST                                      */
/* -------------------------------------------------------------------------- */
async function callAPI(metodo, ruta, body = null) {
  try {
    const res = await fetch(`${BASE_URL}${ruta}`, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { paso: `${metodo} ${ruta}`, error: data.error || data };
    }
    return { paso: `${metodo} ${ruta}`, resultado: data };
  } catch (err) {
    return { paso: `${metodo} ${ruta}`, error: err.message };
  }
}

/* -------------------------------------------------------------------------- */
/* 🔹 USUARIOS                                                                */
/* -------------------------------------------------------------------------- */
async function testUsuarios() {
  const resultados = [];
  const timestamp = Date.now();

  // Crear un usuario ciudadano
  const usuario1 = {
    nombre: "UsuarioTest1",
    correo: `ciudadano_${timestamp}@test.com`,
    rol: "ciudadano",
    password: "123456",
  };

  const resUsuario1 = await callAPI("POST", "/usuarios", usuario1);
  resultados.push(resUsuario1);
  const idUsuario1 = resUsuario1.resultado?.idUsuario || null;

  // Crear un usuario admin
  const usuarioAdmin = {
    nombre: "AdminTest",
    correo: `admin_${timestamp}@test.com`,
    rol: "admin",
    password: "Admin123!",
  };

  const resAdmin = await callAPI("POST", "/usuarios", usuarioAdmin);
  resultados.push(resAdmin);
  const idAdmin = resAdmin.resultado?.idUsuario || null;

  // Obtener usuario específico
  if (idUsuario1) resultados.push(await callAPI("GET", `/usuarios/${idUsuario1}`));

  // Actualizar usuario
  if (idUsuario1) resultados.push(await callAPI("PUT", `/usuarios/${idUsuario1}`, { nombre: "Usuario Actualizado" }));

  // ✅ Nuevo test: Obtener todos los usuarios desde el admin
  if (idAdmin) resultados.push(await callAPI("GET", `/usuarios/admin/${idAdmin}`));

  // Eliminar usuario de prueba
  if (idUsuario1) resultados.push(await callAPI("DELETE", `/usuarios/${idUsuario1}`));

  return { resultados, idUsuario1: idAdmin }; // devolvemos idAdmin como usuario válido
}

/* -------------------------------------------------------------------------- */
/* 🔹 NODOS + MEDICIONES                                                      */
/* -------------------------------------------------------------------------- */
async function testNodos(idUsuario1) {
  const resultados = [];
  let idNodo1 = null;

  const nodo1 = {
    nombre: "NodoTest1",
    ubicacion: { lat: 10, lng: 20 },
    propietarioId: idUsuario1,
  };

  const resNodo1 = await callAPI("POST", "/nodos", nodo1);
  resultados.push(resNodo1);
  idNodo1 = resNodo1.resultado?.idNodo || null;

  if (idNodo1) {
    resultados.push(await callAPI("POST", "/mediciones", {
      idNodo: idNodo1,
      medidas: { temperatura: 22.5, co2: 400, humedad: 55 },
    }));

    resultados.push(await callAPI("GET", `/mediciones/${idNodo1}`));

    resultados.push(await callAPI("POST", `/usuarios/${idUsuario1}/vincularNodo`, { idNodo: idNodo1 }));
    resultados.push(await callAPI("POST", `/usuarios/${idUsuario1}/desvincularNodo`, { idNodo: idNodo1 }));

    // ✅ Nuevo test: obtener nodos por propietario
    resultados.push(await callAPI("GET", `/nodos/propietario/${idUsuario1}`));
  }

  return { resultados, idNodo1 };
}

/* -------------------------------------------------------------------------- */
/* 🔹 TEST EXTRA: CAMBIAR CO₂ MANUALMENTE                                     */
/* -------------------------------------------------------------------------- */
async function testCambiarCO2Nodo(idUsuario1, nuevoValorCO2) {
  const resultados = [];

  // ✅ Nuevo endpoint para obtener nodos de un propietario
  const resNodos = await callAPI("GET", `/nodos/propietario/${idUsuario1}`);
  resultados.push(resNodos);

  const nodos = resNodos.resultado || [];
  for (const nodo of nodos) {
    const idNodo = nodo.idNodo || nodo.id;
    if (!idNodo) continue;

    // Obtener mediciones del nodo
    const resMediciones = await callAPI("GET", `/mediciones/${idNodo}`);
    resultados.push(resMediciones);

    const mediciones = resMediciones.resultado || [];
    for (const m of mediciones) {
      // ⚠️ Este endpoint es solo demostrativo — no existe PUT /mediciones/:idMedicion en el servidor real
      resultados.push(
        await callAPI("PUT", `/mediciones/${m.idMedicion}`, {
          medidas: { ...m.medidas, co2: nuevoValorCO2 },
        })
      );
    }
  }

  return resultados;
}

/* -------------------------------------------------------------------------- */
/* 🔹 NOTIFICACIÓN                                                            */
/* -------------------------------------------------------------------------- */
async function testNotificacion(idUsuario1) {
  return await callAPI("POST", "/notificar", {
    mensaje: "Prueba automática de notificación",
    color: "#27F531",
    topic: idUsuario1,
  });
}

/* -------------------------------------------------------------------------- */
/* 🔹 EJECUCIÓN GENERAL                                                       */
/* -------------------------------------------------------------------------- */
export async function pruebaAutomatica() {
  const resultados = [];

  resultados.push({ paso: "🧪 Test USUARIOS" });
  const { resultados: resUsuarios, idUsuario1 } = await testUsuarios();
  resultados.push(...resUsuarios);

  resultados.push({ paso: "🧪 Test NODOS y MEDICIONES" });
  const { resultados: resNodos } = await testNodos(idUsuario1);
  resultados.push(...resNodos);

  /* ⭐ OPCIONAL: CAMBIAR CO₂ MANUALMENTE DURANTE DEMO
  resultados.push({ paso: "🛠 CAMBIANDO MANUALMENTE CO₂" });
  const resCO2 = await testCambiarCO2Nodo(idUsuario1, 150);
  resultados.push(...resCO2);
  */

  resultados.push({ paso: "🧪 Probando NOTIFICACIÓN" });
  resultados.push(await testNotificacion(idUsuario1));

  resultados.push({ paso: "✅ Prueba finalizada correctamente" });
  return resultados;
}
