// --------------------------------------------------------------------------
// 🔧 URL base del servidor REST desplegado en Firebase
// --------------------------------------------------------------------------
const BASE_URL = "https://us-central1-proyectodebiometria.cloudfunctions.net/ServidorREST";

async function callAPI(metodo, ruta, body = null) {
  try {
    const res = await fetch(`${BASE_URL}${ruta}`, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => ({}));
    return res.ok
      ? { paso: `${metodo} ${ruta}`, resultado: data }
      : { paso: `${metodo} ${ruta}`, error: data.error || data };
  } catch (err) {
    return { paso: `${metodo} ${ruta}`, error: err.message };
  }
}

/* -------------------------------------------------------------------------- */
/* ✅ USUARIOS                                                                */
/* -------------------------------------------------------------------------- */
async function testUsuarios() {
  const resultados = [];

  // Ciudadano principal
  const ciudadano = {
    nombre: "Ciudadano",
    correo: "ciudadano@test.com",
    rol: "ciudadano",
    password: "123456",
  };

  const resCiudadano = await callAPI("POST", "/usuarios", ciudadano);
  resultados.push(resCiudadano);
  const idCiudadano = resCiudadano.resultado?.idUsuario;

  // Admin solo para consultar lista de usuarios
  const admin = {
    nombre: "Admin",
    correo: "admin@test.com",
    rol: "admin",
    password: "admin123",
  };

  const resAdmin = await callAPI("POST", "/usuarios", admin);
  resultados.push(resAdmin);
  const idAdmin = resAdmin.resultado?.idUsuario;

  // Ciudadano secundario para probar eliminar
  const timestamp = Date.now();
  const ciudadanoExtra = {
    nombre: "CiudadanoExtra",
    correo: `extra_${timestamp}@test.com`,
    rol: "ciudadano",
    password: "123456",
  };

  const resCiudadanoExtra = await callAPI("POST", "/usuarios", ciudadanoExtra);
  resultados.push(resCiudadanoExtra);
  const idCiudadanoExtra = resCiudadanoExtra.resultado?.idUsuario;

  // Ver ciudadano principal
  if (idCiudadano) resultados.push(await callAPI("GET", `/usuarios/${idCiudadano}`));

  // Admin lista usuarios
  if (idAdmin) resultados.push(await callAPI("GET", `/usuarios/admin/${idAdmin}`));

  // Eliminar ciudadano extra
  if (idCiudadanoExtra) resultados.push(await callAPI("DELETE", `/usuarios/${idCiudadanoExtra}`));

  return { resultados, idCiudadano };
}

/* -------------------------------------------------------------------------- */
/* ✅ NODOS + MEDICIONES (solo ciudadano)                                     */
/* -------------------------------------------------------------------------- */
async function testNodos(idCiudadano) {
  const resultados = [];

  // Formato real esperado → { nombre, ubicacion, propietarioId }
  resultados.push(
    await callAPI("POST", "/nodos", {
      nombre: "NodoTest1",
      ubicacion: { lat: 10, lng: 20 },
      propietarioId: idCiudadano,
    })
  );

  resultados.push(
    await callAPI("POST", "/mediciones", {
      nombreNodo: "NodoTest1",
      propietarioId: idCiudadano,
      medidas: { temperatura: 22.5, co2: 40, humedad: 55 },
    })
  );

  resultados.push(await callAPI("GET", `/mediciones/${idCiudadano}/NodoTest1`));
  resultados.push(await callAPI("GET", `/nodos/propietario/${idCiudadano}`));

  resultados.push(
    await callAPI("PUT", "/nodos", {
      nombreNodo: "NodoTest1",
      propietarioId: idCiudadano,
      datos: { ubicacion: { lat: 99, lng: 99 } },
    })
  );

  resultados.push(
    await callAPI("DELETE", "/nodos", {
      nombreNodo: "NodoTest1",
      propietarioId: idCiudadano,
    })
  );

  return resultados;
}

/* -------------------------------------------------------------------------- */
/* ✅ NOTIFICACIÓN (ciudadano puede recibir)                                  */
/* -------------------------------------------------------------------------- */
async function testNotificacion(idCiudadano) {
  return await callAPI("POST", "/notificar", {
    mensaje: "Prueba automática de notificación",
    color: "#27F531",
    topic: idCiudadano,
  });
}

/* -------------------------------------------------------------------------- */
/* ✅ EJECUCIÓN GENERAL                                                       */
/* -------------------------------------------------------------------------- */
export async function pruebaAutomatica() {
  const resultados = [];

  resultados.push({ paso: "🧪 Test USUARIOS" });
  const { resultados: resUsuarios, idCiudadano } = await testUsuarios();
  resultados.push(...resUsuarios);

  resultados.push({ paso: "🧪 Test NODOS y MEDICIONES (ciudadano)" });
  resultados.push(...await testNodos(idCiudadano));

  resultados.push({ paso: "🧪 Test NOTIFICACIONES" });
  resultados.push(await testNotificacion(idCiudadano));

  resultados.push({ paso: "✅ Prueba completada correctamente" });
  return resultados;
}
