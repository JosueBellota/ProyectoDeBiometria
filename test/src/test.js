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

  // ✅ Obtener usuario por UID estándar
  if (idCiudadano) resultados.push(await callAPI("GET", `/usuarios/${idCiudadano}`));

  // ✅ Obtener usuario completo (nueva ruta universal)
  if (idCiudadano)
    resultados.push(await callAPI("GET", `/usuarios/completo/${idCiudadano}`));

  // ✅ Obtener lista de usuarios desde admin
  if (idAdmin) resultados.push(await callAPI("GET", `/usuarios/admin/${idAdmin}`));

  // ✅ Actualizar usuario con nuevos campos
  if (idCiudadano) {
    resultados.push(
      await callAPI("PUT", `/usuarios/${idCiudadano}`, {
        nombre: `Ciudadano_${unique}_Actualizado`,
        monedas: 150,
        distancia: 8.5,
        premios: ["premio_bronce"]
      })
    );
  }

  // 🗑️ Eliminar usuario extra
  if (idCiudadanoExtra)
    resultados.push(await callAPI("DELETE", `/usuarios/${idCiudadanoExtra}`));

  return { resultados, idCiudadano, idAdmin, unique };
}

/* -------------------------------------------------------------------------- */
/* ✅ TOKEN AUTOLOGIN Y LOGOUT                                                */
/* -------------------------------------------------------------------------- */
async function testAutenticacion(idCiudadano) {
  const resultados = [];
  if (!idCiudadano) return resultados;

  resultados.push({ paso: "🧪 Generando token autologin" });
  const res = await callAPI("GET", `/autologin/${idCiudadano}`);
  resultados.push(res);

  if (res.resultado?.link) {
    resultados.push({
      paso: "🔗 Enlace autologin generado correctamente",
      resultado: res.resultado.link,
    });
  } else {
    resultados.push({ paso: "❌ Fallo al generar enlace autologin" });
  }

  // ⛔ Test logout (nuevo método)
  resultados.push({ paso: "🧪 Revocando sesión (logout)" });
  const resLogout = await callAPI("GET", `/logout/${idCiudadano}`);
  resultados.push(resLogout);

  if (resLogout.resultado?.mensaje) {
    resultados.push({
      paso: "⛔ Sesión revocada correctamente",
      resultado: resLogout.resultado.mensaje,
    });
  } else {
    resultados.push({ paso: "❌ Fallo al revocar sesión" });
  }

  return resultados;
}

/* -------------------------------------------------------------------------- */
/* ✅ NODOS + MEDICIONES (solo ciudadano)                                     */
/* -------------------------------------------------------------------------- */
async function testNodos(idCiudadano, unique) {
  const resultados = [];

  const nombreNodoPrincipal = `NodoPrincipal_${unique}`;
  const nombreNodoEliminar = `NodoEliminar_${unique}`;

  resultados.push(
    await callAPI("POST", "/nodos", {
      nombre: nombreNodoPrincipal,
      ubicacion: "Ubicación Principal Test",
      propietarioId: idCiudadano,
    })
  );

  resultados.push(
    await callAPI("POST", "/nodos", {
      nombre: nombreNodoEliminar,
      ubicacion: "Ubicación Secundaria Test",
      propietarioId: idCiudadano,
    })
  );

  // Test mediciones normales
  resultados.push(
    await callAPI("POST", "/mediciones", {
      nombreNodo: nombreNodoPrincipal,
      propietarioId: idCiudadano,
      medidas: { temperatura: 22.5, co2: 40, humedad: 55 },
    })
  );

  // Test mediciones con CO2 elevado para trigger de notificación
  resultados.push(
    await callAPI("POST", "/mediciones", {
      nombreNodo: nombreNodoPrincipal,
      propietarioId: idCiudadano,
      medidas: { temperatura: 23.1, co2: 120, humedad: 60 },
    })
  );

  resultados.push(
    await callAPI("GET", `/mediciones/${idCiudadano}/${nombreNodoPrincipal}`)
  );

  resultados.push(await callAPI("GET", `/nodos/propietario/${idCiudadano}`));

  resultados.push(
    await callAPI("PUT", "/nodos", {
      nombreNodo: nombreNodoPrincipal,
      propietarioId: idCiudadano,
      datos: { ubicacion: "Ubicación Actualizada Test" },
    })
  );

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
  const resultados = [];

  // Test notificación manual
  resultados.push(
    await callAPI("POST", "/notificar", {
      mensaje: "Prueba automática de notificación",
      color: "#27F531",
      topic: idCiudadano,
    })
  );

  // Test notificación con color rojo
  resultados.push(
    await callAPI("POST", "/notificar", {
      mensaje: "Notificación de alerta CO2 elevado",
      color: "rojo",
      topic: "general",
    })
  );

  return resultados;
}

/* -------------------------------------------------------------------------- */
/* ✅ EJECUCIÓN GENERAL                                                       */
/* -------------------------------------------------------------------------- */
export async function pruebaAutomatica() {
  const resultados = [];

  resultados.push({ paso: "🧪 Test USUARIOS" });
  const { resultados: resUsuarios, idCiudadano, idAdmin, unique } = await testUsuarios();
  resultados.push(...resUsuarios);

  resultados.push({ paso: "🧪 Test TOKEN AUTOLOGIN Y LOGOUT" });
  resultados.push(...await testAutenticacion(idCiudadano));

  resultados.push({ paso: "🧪 Test NODOS y MEDICIONES (ciudadano)" });
  resultados.push(...await testNodos(idCiudadano, unique));

  resultados.push({ paso: "🧪 Test NOTIFICACIONES" });
  resultados.push(...await testNotificacion(idCiudadano));

  resultados.push({ paso: "✅ Prueba completada correctamente" });
  return resultados;
}