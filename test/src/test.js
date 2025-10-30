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

  const usuario1 = {
    nombre: "UsuarioTest1",
    correo: `ciudadano@test.com`,
    rol: "ciudadano",
    password: "123456",
  };

  const resUsuario1 = await callAPI("POST", "/usuarios", usuario1);
  resultados.push(resUsuario1);
  const idUsuario1 = resUsuario1.resultado?.idUsuario || null;

  const usuario2 = {
    nombre: "UsuarioTest2",
    correo: `usuario2_${timestamp}@test.com`,
    rol: "user",
    password: "Test1234!",
  };

  const resUsuario2 = await callAPI("POST", "/usuarios", usuario2);
  resultados.push(resUsuario2);
  const idUsuario2 = resUsuario2.resultado?.idUsuario || null;

  if (idUsuario1) resultados.push(await callAPI("GET", `/usuarios/${idUsuario1}`));
  if (idUsuario1) resultados.push(await callAPI("PUT", `/usuarios/${idUsuario1}`, { nombre: "UsuarioTest1 Actualizado" }));
  if (idUsuario2) resultados.push(await callAPI("DELETE", `/usuarios/${idUsuario2}`));

  return { resultados, idUsuario1 };
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
  }

  return { resultados, idNodo1 };
}

/* -------------------------------------------------------------------------- */
/* ⭐ EXTRA PARA PRESENTACIÓN: CAMBIAR CO₂ MANUALMENTE (NO SE EJECUTA AUTOMÁTICO) */

async function testCambiarCO2Nodo(idUsuario1, nuevoValorCO2) {
  const resultados = [];

  // Obtener nodos del usuario
  const resNodos = await callAPI("GET", `/usuarios/${idUsuario1}/nodos`);
  resultados.push(resNodos);

  const nodos = resNodos.resultado?.nodos || [];
  for (const nodo of nodos) {

    // Obtener mediciones del nodo
    const resMediciones = await callAPI("GET", `/mediciones/${nodo.idNodo}`);
    resultados.push(resMediciones);

    const mediciones = resMediciones.resultado?.mediciones || [];
    for (const m of mediciones) {

      // Cambiamos manualmente el valor de CO₂
      resultados.push(
        await callAPI("PUT", `/mediciones/${m.idMedicion}`, {
          medidas: { ...m.medidas, co2: nuevoValorCO2 }
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
    mensaje: "🔔 Prueba automática de notificación",
    color: "#27F531",
    topic: idUsuario1, 
  });
}

/* -------------------------------------------------------------------------- */
/* 🔹 EJECUCIÓN GENERAL                                                       */
/* -------------------------------------------------------------------------- */
export async function pruebaAutomatica() {
  const resultados = [];

  // resultados.push({ paso: "🧪 Test USUARIOS" });
  // const { resultados: resUsuarios, idUsuario1 } = await testUsuarios();
  // resultados.push(...resUsuarios);

  // resultados.push({ paso: "🧪 Test NODOS y MEDICIONES" });
  // const { resultados: resNodos } = await testNodos(idUsuario1);
  // resultados.push(...resNodos);

  /* ⭐ ACTIVAR EN PRESENTACIÓN
  resultados.push({ paso: "🛠 CAMBIANDO MANUALMENTE CO₂" });
  const resCO2 = await testCambiarCO2Nodo(idUsuario1, 150); // <= CAMBIA ESTE VALOR EN VIVO
  resultados.push(...resCO2);
  */

  resultados.push({ paso: "🧪 Probando NOTIFICACIÓN" });
  resultados.push(await testNotificacion("gHkwMbcmMwhq6WQOISMTkyAJ25Y2"));

  resultados.push({ paso: "✅ Prueba finalizada correctamente" });
  return resultados;
}

