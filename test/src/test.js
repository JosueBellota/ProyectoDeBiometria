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
    const data = await res.json();
    if (!res.ok) return { paso: `${metodo} ${ruta}`, error: data.error || data };
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

  // Crear usuario de prueba (permanece)
  const usuario1 = { nombre: "UsuarioTest1", correo: `usuario1@test.com`, rol: "admin", password: "Test1234!" };
  const resUsuario1 = await callAPI("POST", "/usuarios", usuario1);
  resultados.push(resUsuario1);
  const idUsuario1 = resUsuario1.resultado?.idUsuario || "u1";

  // Crear usuario temporal (se eliminará)
  const usuario2 = { nombre: "UsuarioTest2", correo: `usuario2@test.com`, rol: "admin", password: "Test1234!" };
  const resUsuario2 = await callAPI("POST", "/usuarios", usuario2);
  resultados.push(resUsuario2);
  const idUsuario2 = resUsuario2.resultado?.idUsuario || "u2";

  // Actualizar primer usuario
  if (idUsuario1) {
    resultados.push(await callAPI("PUT", `/usuarios/${idUsuario1}`, { nombre: "UsuarioTest1 Actualizado" }));
  }

  // Eliminar segundo usuario
  if (idUsuario2) {
    resultados.push(await callAPI("DELETE", `/usuarios/${idUsuario2}`));
  }

  return { resultados, idUsuario1 };
}

/* -------------------------------------------------------------------------- */
/* 🔹 NODOS, SENSORES Y MEDICIONES                                             */
/* -------------------------------------------------------------------------- */
async function testNodos(idUsuario1) {
  const resultados = [];

  // Crear primer nodo (permanece)
  const nodo1 = { nombre: "NodoTest1", ubicacion: { lat: 10, lng: 20 }, propietarioId: idUsuario1 };
  const resNodo1 = await callAPI("POST", "/nodos", nodo1);
  resultados.push(resNodo1);
  const idNodo1 = resNodo1.resultado?.idNodo || "n1";

  // Crear mediciones en primer nodo
  if (idNodo1) {
    resultados.push(await callAPI("POST", "/mediciones", { idNodo: idNodo1, tipoSensor: "temperatura", valor: 22.5 }));
    resultados.push(await callAPI("POST", "/mediciones", { idNodo: idNodo1, tipoSensor: "co2", valor: 400 }));

    const ultimaTemp = await callAPI("GET", `/mediciones/${idNodo1}/temperatura`);
    resultados.push(ultimaTemp);

    if (ultimaTemp.resultado?.id) {
      resultados.push(await callAPI("PUT", `/mediciones/${idNodo1}/temperatura/${ultimaTemp.resultado.id}`, { valor: 23 }));
      resultados.push(await callAPI("DELETE", `/mediciones/${idNodo1}/temperatura/${ultimaTemp.resultado.id}`));
    }

    resultados.push(await callAPI("POST", `/usuarios/${idUsuario1}/vincularNodo`, { idNodo: idNodo1 }));
    resultados.push(await callAPI("POST", `/usuarios/${idUsuario1}/desvincularNodo`, { idNodo: idNodo1 }));
  }

  // Crear segundo nodo temporal (se eliminará)
  const nodo2 = { nombre: "NodoTest2", ubicacion: { lat: 15, lng: 25 }, propietarioId: idUsuario1 };
  const resNodo2 = await callAPI("POST", "/nodos", nodo2);
  resultados.push(resNodo2);
  const idNodo2 = resNodo2.resultado?.idNodo || "n2";

  if (idNodo2) {
    resultados.push(await callAPI("POST", "/mediciones", { idNodo: idNodo2, tipoSensor: "temperatura", valor: 23 }));
    resultados.push(await callAPI("POST", "/mediciones", { idNodo: idNodo2, tipoSensor: "co2", valor: 410 }));
    resultados.push(await callAPI("DELETE", `/nodos/${idNodo2}`));
  }

  return { resultados, idNodo1 };
}

/* -------------------------------------------------------------------------- */
/* 🔹 NOTIFICACIÓN                                                            */
/* -------------------------------------------------------------------------- */
async function testNotificacion() {
  return await callAPI("POST", "/notificar", { mensaje: "Prueba de notificación" });
}

/* -------------------------------------------------------------------------- */
/* 🔹 EJECUCIÓN GENERAL                                                       */
/* -------------------------------------------------------------------------- */
export async function pruebaAutomatica() {
  const resultados = [];

  resultados.push({ paso: "🧪 Iniciando test de USUARIOS" });
  const { resultados: resUsuarios, idUsuario1 } = await testUsuarios();
  resultados.push(...resUsuarios);

  resultados.push({ paso: "🧪 Iniciando test de NODOS, SENSORES y MEDICIONES" });
  const { resultados: resNodos, idNodo1 } = await testNodos(idUsuario1);
  resultados.push(...resNodos);

  resultados.push({ paso: "🧪 Probando NOTIFICACIÓN" });
  resultados.push(await testNotificacion());

  resultados.push({ paso: "✅ Prueba finalizada correctamente" });
  return resultados;
}
