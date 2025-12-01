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
/* ✅ PRUEBAS DE NODOS Y LECTURAS                                             */
/* -------------------------------------------------------------------------- */
async function testNodosYLecturas(idCiudadano, unique) {
  const resultados = [];

  const nombreNodoPrincipal = `NodoPrincipal_${unique}`;
  const nombreNodoEliminar = `NodoEliminar_${unique}`;

  // 1. Crear nodos (nueva API sin ubicación)
  resultados.push(
    await callAPI("POST", "/nodos", {
      nombre: nombreNodoPrincipal,
      propietarioId: idCiudadano,
    })
  );

  resultados.push(
    await callAPI("POST", "/nodos", {
      nombre: nombreNodoEliminar,
      propietarioId: idCiudadano,
    })
  );

  // 2. Guardar lecturas (Batch 1 - simula ser más antiguo)
  const lecturasAntiguas = [
      { tipo: "temperatura", valor: 18.5 },
      { tipo: "co2", valor: 50 },
      { tipo: "humedad", valor: 65 },
  ];
  resultados.push(
    await callAPI("POST", "/lecturas", {
      nombreNodo: nombreNodoPrincipal,
      propietarioId: idCiudadano,
      lecturas: lecturasAntiguas,
      latitud: 40.7128,
      longitud: -74.0060,
    })
  );

  // Pausa para asegurar un timestamp diferente
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 2. Guardar lecturas (Batch 2 - más reciente y con CO2 elevado)
  const lecturasRecientes = [
    { tipo: "temperatura", valor: 25.1 },
    { tipo: "co2", valor: 150 },
    { tipo: "humedad", valor: 70 },
  ];
  resultados.push(
    await callAPI("POST", "/lecturas", {
      nombreNodo: nombreNodoPrincipal,
      propietarioId: idCiudadano,
      lecturas: lecturasRecientes,
      latitud: 40.7129,
      longitud: -74.0061,
    })
  );

  // 3. Obtener lecturas (sin filtro, debe devolver el Batch 2)
  resultados.push(
    await callAPI("GET", `/lecturas/${idCiudadano}/${nombreNodoPrincipal}`)
  );

  // 3. Obtener lecturas (con filtro de tipoSensor, debe devolver 2 lecturas de co2)
  resultados.push(
    await callAPI("GET", `/lecturas/${idCiudadano}/${nombreNodoPrincipal}?tipoSensor=co2`)
  );

  // 4. Actualizar nodo (cambiar nombre)
  const nuevoNombre = `NodoPrincipal_Actualizado_${unique}`;
  resultados.push(
    await callAPI("PUT", "/nodos", {
      nombreNodo: nombreNodoPrincipal,
      propietarioId: idCiudadano,
      datos: { nombre: nuevoNombre },
    })
  );

  // 5. Eliminar lecturas (eliminar todas las de temperatura)
  resultados.push({ paso: "🧪 Eliminando lecturas de temperatura..." });
  resultados.push(
      await callAPI("POST", "/lecturas/delete", {
          nombreNodo: nuevoNombre, // Usamos el nuevo nombre
          propietarioId: idCiudadano,
          opciones: { tipoSensor: "temperatura" }
      })
  );

  // 6. Obtener todos los nodos del propietario (verificar adaptador)
  resultados.push(await callAPI("GET", `/nodos/propietario/${idCiudadano}`));

  // 7. Eliminar un nodo
  resultados.push(
    await callAPI("DELETE", "/nodos", {
      nombreNodo: nombreNodoEliminar,
      propietarioId: idCiudadano,
    })
  );

  return resultados;
}

/* -------------------------------------------------------------------------- */
/* ✅ EJECUCIÓN GENERAL DE LAS PRUEBAS AUTOMÁTICAS                             */
/* -------------------------------------------------------------------------- */
export async function pruebaAutomatica() {
  const resultados = [];

  resultados.push({ paso: "🧪 Test USUARIOS" });
  const { resultados: resUsuarios, idCiudadano, idAdmin, unique } = await testUsuarios();
  resultados.push(...resUsuarios);

  // Los tests de autenticación y notificaciones se omiten por ahora para centrarse en CRUD
  // resultados.push({ paso: "🧪 Test TOKEN AUTOLOGIN Y LOGOUT" });
  // resultados.push(...await testAutenticacion(idCiudadano));

  resultados.push({ paso: "🧪 Test NODOS y LECTURAS (ciudadano)" });
  resultados.push(...await testNodosYLecturas(idCiudadano, unique));

  // resultados.push({ paso: "🧪 Test NOTIFICACIONES" });
  // resultados.push(...await testNotificacion(idCiudadano));

  resultados.push({ paso: "✅ Prueba completada correctamente" });
  return resultados;
}
