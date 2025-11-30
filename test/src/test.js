// --------------------------------------------------------------------------
// Fichero: test.js
// Responsable: Josue Bellota Ichaso
//
// Descripción:
// Este fichero contiene las pruebas automáticas para el servidor REST.
// Simula el comportamiento de un cliente para verificar que los endpoints
// de la API funcionan como se espera.
// --------------------------------------------------------------------------

// --------------------------------------------------------------------------
// 🔧 URL base del servidor REST desplegado en Firebase
// --------------------------------------------------------------------------
const BASE_URL = "https://us-central1-proyectodebiometria.cloudfunctions.net/ServidorREST";

// -----------------------------------------------------------------------------------
// callAPI(metodo, ruta, body)
//
// Función de ayuda para realizar llamadas a la API REST.
//
// Parámetros:
//   - metodo: Método HTTP (GET, POST, PUT, DELETE).
//   - ruta: Ruta del endpoint (ej. "/usuarios").
//   - body: Objeto con los datos para el cuerpo de la solicitud (opcional).
//
// Retorno:
//   - Un objeto con el resultado de la llamada o un error.
// -----------------------------------------------------------------------------------
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
/* ✅ PRUEBAS DE GESTIÓN DE USUARIOS                                          */
/* -------------------------------------------------------------------------- */
// -----------------------------------------------------------------------------------
// testUsuarios()
//
// Realiza un flujo de pruebas sobre los endpoints de usuarios:
//   1. Crea un usuario "ciudadano".
//   2. Crea un usuario "admin".
//   3. Crea un usuario extra para pruebas de eliminación.
//   4. Obtiene un usuario por su UID.
//   5. Obtiene la lista completa de usuarios (como admin).
//   6. Actualiza los datos de un usuario.
//   7. Elimina el usuario extra.
//
// Retorno:
//   - Un objeto con los resultados, y los IDs y datos únicos generados.
// -----------------------------------------------------------------------------------
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
/* ✅ PRUEBAS DE AUTENTICACIÓN (AUTOLOGIN Y LOGOUT)                           */
/* -------------------------------------------------------------------------- */
// -----------------------------------------------------------------------------------
// testAutenticacion(idCiudadano)
//
// Verifica la funcionalidad de autenticación:
//   1. Genera un token de autologin para un usuario.
//   2. Revoca la sesión del mismo usuario para forzar el logout.
//
// Parámetros:
//   - idCiudadano: ID del usuario para las pruebas.
//
// Retorno:
//   - Un array con los resultados de las pruebas.
// -----------------------------------------------------------------------------------
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
/* ✅ PRUEBAS DE NODOS Y MEDICIONES                                           */
/* -------------------------------------------------------------------------- */
// -----------------------------------------------------------------------------------
// testNodos(idCiudadano, unique)
//
// Realiza pruebas sobre la gestión de nodos y mediciones:
//   1. Crea dos nodos para un usuario.
//   2. Registra mediciones normales en un nodo.
//   3. Registra mediciones con CO2 elevado para probar notificaciones.
//   4. Obtiene las mediciones de un nodo.
//   5. Obtiene todos los nodos de un propietario.
//   6. Actualiza la ubicación de un nodo.
//   7. Elimina uno de los nodos.
//
// Parámetros:
//   - idCiudadano: ID del propietario de los nodos.
//   - unique: Sufijo único para los nombres de los nodos.
//
// Retorno:
//   - Un array con los resultados de las pruebas.
// -----------------------------------------------------------------------------------
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
/* ✅ PRUEBAS DE NOTIFICACIONES                                               */
/* -------------------------------------------------------------------------- */
// -----------------------------------------------------------------------------------
// testNotificacion(idCiudadano)
//
// Envía notificaciones para verificar el endpoint correspondiente.
//   1. Envía una notificación de prueba a un usuario específico.
//   2. Envía una notificación de alerta a un tópico general.
//
// Parámetros:
//   - idCiudadano: ID del usuario para enviar la notificación (usado como tópico).
//
// Retorno:
//   - Un array con los resultados de las pruebas.
// -----------------------------------------------------------------------------------
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
/* ✅ EJECUCIÓN GENERAL DE LAS PRUEBAS AUTOMÁTICAS                             */
/* -------------------------------------------------------------------------- */
// -----------------------------------------------------------------------------------
// pruebaAutomatica()
//
// Función principal que orquesta la ejecución de todas las pruebas en secuencia.
//
// Lógica:
//   1. Ejecuta las pruebas de usuarios.
//   2. Ejecuta las pruebas de autenticación.
//   3. Ejecuta las pruebas de nodos y mediciones.
//   4. Ejecuta las pruebas de notificaciones.
//   5. Agrupa y devuelve todos los resultados.
//
// Retorno:
//   - Un array con todos los resultados de las pruebas.
// -----------------------------------------------------------------------------------
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