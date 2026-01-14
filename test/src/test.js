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

  if (idCiudadano) resultados.push(await callAPI("GET", `/usuarios/completo/${idCiudadano}`));
  if (idAdmin) resultados.push(await callAPI("GET", `/usuarios/admin/${idAdmin}`));

  if (idCiudadano) {
    resultados.push(
      await callAPI("PUT", `/usuarios/${idCiudadano}`, {
        nombre: `Ciudadano_${unique}_Actualizado`,
        monedas: 150,
      })
    );
  }

  if (idCiudadanoExtra)
    resultados.push(await callAPI("DELETE", `/usuarios/${idCiudadanoExtra}`));

  return { resultados, idCiudadano, idAdmin, unique };
}

/* -------------------------------------------------------------------------- */
/* ✅ PRUEBAS E2E (USUARIOS, NODOS, LECTURAS, BÚSQUEDA)                     */
/* -------------------------------------------------------------------------- */
async function testEndToEnd(idCiudadano, unique) {
  const resultados = [];

  // --- Creación de Nodos y Lecturas ---
  const nombreNodo = `Nodo_${unique}`;
  resultados.push(
    await callAPI("POST", "/nodos", { nombre: nombreNodo, propietarioId: idCiudadano })
  );

  const lecturasAntiguas = [{ tipo: "co2", valor: 50 }];
  const lat1 = 40.7128, lon1 = -74.0060;
  resultados.push(
    await callAPI("POST", "/lecturas", {
      nombreNodo: nombreNodo,
      propietarioId: idCiudadano,
      lecturas: lecturasAntiguas,
      latitud: lat1,
      longitud: lon1,
    })
  );

  await new Promise(resolve => setTimeout(resolve, 1200));
  const fechaInicioReciente = new Date();
  
  const lecturasRecientes = [{ tipo: "co2", valor: 150 }];
  const lat2 = 40.7129, lon2 = -74.0061;
  resultados.push(
    await callAPI("POST", "/lecturas", {
      nombreNodo: nombreNodo,
      propietarioId: idCiudadano,
      lecturas: lecturasRecientes,
      latitud: lat2,
      longitud: lon2,
    })
  );

  // --- Pruebas de Obtención y Búsqueda ---
  resultados.push({ paso: "🧪 Test BÚSQUEDA FLEXIBLE" });
  
  // Test 1: Búsqueda por NODO (debe devolver 2 lecturas)
  resultados.push(
      await callAPI("GET", `/lecturas?nombreNodo=${nombreNodo}&propietarioId=${idCiudadano}`)
  );

  // Test 2: Búsqueda por UBICACIÓN (radio pequeño, debe encontrar 1 lectura)
  resultados.push(
      await callAPI("GET", `/lecturas?latitud=${lat1}&longitud=${lon1}&radio=10`)
  );

  // Test 3: Búsqueda por UBICACIÓN (radio grande, debe encontrar 2 lecturas)
  resultados.push(
      await callAPI("GET", `/lecturas?latitud=${lat1}&longitud=${lon1}&radio=50`)
  );

    // Test 4: Búsqueda por FECHA y UBICACIÓN (debe encontrar 1 lectura reciente)
    resultados.push(
        await callAPI("GET", `/lecturas?latitud=${lat2}&longitud=${lon2}&radio=10&fechaInicio=${fechaInicioReciente.toISOString()}`)
    );
  
    // --- Limpieza ---
    resultados.push(await callAPI("DELETE", "/usuarios/" + idCiudadano));
  
    return resultados;
  }

/* -------------------------------------------------------------------------- */
/* ✅ PRUEBAS DE INCIDENCIAS                                                  */
/* -------------------------------------------------------------------------- */
async function testIncidencias(idCiudadano, idAdmin) {
  const resultados = [];
  let incidenciaId = null;

  // 1. Reportar incidencia
  const reporte = {
    usuarioId: idCiudadano,
    titulo: "Farola rota",
    descripcion: "La farola de la calle X parpadea",
  };
  const resReporte = await callAPI("POST", "/incidencias", reporte);
  resultados.push(resReporte);
  
  if (resReporte.resultado && resReporte.resultado.idIncidencia) {
    incidenciaId = resReporte.resultado.idIncidencia;

    // 2. Listar incidencias (filtro usuario)
    resultados.push(await callAPI("GET", `/incidencias?usuarioId=${idCiudadano}`));

    // 3. Asignar incidencia (Admin)
    resultados.push(
      await callAPI("PUT", "/incidencias/asignar", {
        incidenciaId: incidenciaId,
        adminId: idAdmin,
      })
    );

    // 4. Resolver incidencia (Admin)
    resultados.push(
      await callAPI("PUT", "/incidencias/resolver", {
        incidenciaId: incidenciaId,
        adminId: idAdmin,
        respuesta: "El técnico pasará mañana. Gracias.",
      })
    );

    // 5. Verificar estado final
    const resFinal = await callAPI("GET", `/incidencias?usuarioId=${idCiudadano}`);
    // Podríamos inspeccionar que el estado sea "resuelta"
    resultados.push({
      paso: "Verificar resolución",
      resultado: resFinal.resultado ? "OK (Lista obtenida)" : "Error"
    });
  } else {
    resultados.push({ paso: "❌ Falló creación de incidencia", error: "No ID returned" });
  }

  return resultados;
}

/* -------------------------------------------------------------------------- */
/* ✅ EJECUCIÓN GENERAL DE LAS PRUEBAS AUTOMÁTICAS                             */
/* -------------------------------------------------------------------------- */
export async function pruebaAutomatica() {
  const resultados = [];

  resultados.push({ paso: "🧪 Test USUARIOS" });
  const { resultados: resUsuarios, idCiudadano, idAdmin, unique } = await testUsuarios();
  // No agregamos todos los resultados de creación de usuario para no saturar
  if(idCiudadano && idAdmin) {
    resultados.push({ paso: "✅ Creación de usuarios de prueba correcta" });
  } else {
     resultados.push({ paso: "❌ Error creando usuarios de prueba", error: resUsuarios.filter(r => r.error) });
     return resultados;
  }

  resultados.push({ paso: "🧪 Test INCIDENCIAS" });
  const resIncidencias = await testIncidencias(idCiudadano, idAdmin);
  resultados.push(...resIncidencias);

  resultados.push({ paso: "🧪 Test E2E de Lecturas" });
  const resE2E = await testEndToEnd(idCiudadano, unique);
  resultados.push(...resE2E);
  
  // Limpieza del admin
  if(idAdmin) await callAPI("DELETE", "/usuarios/" + idAdmin);

  resultados.push({ paso: "✅ Prueba completada" });
  return resultados;
}
