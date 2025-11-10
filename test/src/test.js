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
  const unique = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;

  const ciudadano = {
    nombre: `Ciudadano_${unique}`,
    correo: `ciudadano_${unique}@test.com`,
    rol: "ciudadano",
    password: "123456",
  };

  const resCiudadano = await callAPI("POST", "/usuarios", ciudadano);
  resultados.push(resCiudadano);
  const idCiudadano = resCiudadano.resultado?.idUsuario;

  const admin = {
    nombre: `Admin_${unique}`,
    correo: `admin_${unique}@test.com`,
    rol: "admin",
    password: "admin123",
  };

  const resAdmin = await callAPI("POST", "/usuarios", admin);
  resultados.push(resAdmin);
  const idAdmin = resAdmin.resultado?.idUsuario;

  const ciudadanoExtra = {
    nombre: `CiudadanoExtra_${unique}`,
    correo: `extra_${unique}@test.com`,
    rol: "ciudadano",
    password: "123456",
  };

  const resCiudadanoExtra = await callAPI("POST", "/usuarios", ciudadanoExtra);
  resultados.push(resCiudadanoExtra);
  const idCiudadanoExtra = resCiudadanoExtra.resultado?.idUsuario;

  if (idCiudadano) resultados.push(await callAPI("GET", `/usuarios/${idCiudadano}`));
  if (idAdmin) resultados.push(await callAPI("GET", `/usuarios/admin/${idAdmin}`));
  if (idCiudadanoExtra) resultados.push(await callAPI("DELETE", `/usuarios/${idCiudadanoExtra}`));

  return { resultados, idCiudadano, unique };
}

/* -------------------------------------------------------------------------- */
/* ✅ NODOS + MEDICIONES (solo ciudadano)                                     */
/* -------------------------------------------------------------------------- */
async function testNodos(idCiudadano, unique) {
  const resultados = [];

  const nombreNodoPrincipal = `NodoPrincipal_${unique}`;
  const nombreNodoEliminar = `NodoEliminar_${unique}`;

  // Crear nodo principal
  resultados.push(
    await callAPI("POST", "/nodos", {
      nombre: nombreNodoPrincipal,
      ubicacion: { lat: 10, lng: 20 },
      propietarioId: idCiudadano,
    })
  );

  // Crear nodo que luego se eliminará
  resultados.push(
    await callAPI("POST", "/nodos", {
      nombre: nombreNodoEliminar,
      ubicacion: { lat: 11, lng: 21 },
      propietarioId: idCiudadano,
    })
  );

  // Insertar mediciones en el nodo principal
  resultados.push(
    await callAPI("POST", "/mediciones", {
      nombreNodo: nombreNodoPrincipal,
      propietarioId: idCiudadano,
      medidas: { temperatura: 22.5, co2: 40, humedad: 55 },
    })
  );

  // Consultar medidas
  resultados.push(
    await callAPI("GET", `/mediciones/${idCiudadano}/${nombreNodoPrincipal}`)
  );

  // Obtener nodos que pertenecen al ciudadano
  resultados.push(await callAPI("GET", `/nodos/propietario/${idCiudadano}`));

  // Actualizar nodo principal
  resultados.push(
    await callAPI("PUT", "/nodos", {
      nombreNodo: nombreNodoPrincipal,
      propietarioId: idCiudadano,
      datos: { ubicacion: { lat: 99, lng: 99 } },
    })
  );

  // Eliminar nodo secundario
  resultados.push(
    await callAPI("DELETE", "/nodos", {
      nombreNodo: nombreNodoEliminar,
      propietarioId: idCiudadano,
    })
  );

  return resultados;
}

/* -------------------------------------------------------------------------- */
/* ✅ NOTIFICACIÓN                                                            */
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
  const { resultados: resUsuarios, idCiudadano, unique } = await testUsuarios();
  resultados.push(...resUsuarios);

  resultados.push({ paso: "🧪 Test NODOS y MEDICIONES (ciudadano)" });
  resultados.push(...await testNodos(idCiudadano, unique));

  resultados.push({ paso: "🧪 Test NOTIFICACIONES" });
  resultados.push(await testNotificacion(idCiudadano));

  resultados.push({ paso: "✅ Prueba completada correctamente" });
  return resultados;
}
