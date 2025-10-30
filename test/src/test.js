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

    const data = await res.json().catch(() => ({})); // Previene crash si no hay JSON
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
  const timestamp = Date.now(); // para generar correos únicos

  // Crear usuario principal (permanece)
  const usuario1 = {
    nombre: "UsuarioTest1",
    correo: `usuario1_${timestamp}@test.com`,
    rol: "admin",
    password: "Test1234!",
  };

  const resUsuario1 = await callAPI("POST", "/usuarios", usuario1);
  resultados.push(resUsuario1);
  const idUsuario1 = resUsuario1.resultado?.idUsuario || null;

  // Crear usuario temporal (se eliminará)
  const usuario2 = {
    nombre: "UsuarioTest2",
    correo: `usuario2_${timestamp}@test.com`,
    rol: "user",
    password: "Test1234!",
  };

  const resUsuario2 = await callAPI("POST", "/usuarios", usuario2);
  resultados.push(resUsuario2);
  const idUsuario2 = resUsuario2.resultado?.idUsuario || null;

  // Obtener usuario creado
  if (idUsuario1) {
    resultados.push(await callAPI("GET", `/usuarios/${idUsuario1}`));
  }

  // Actualizar nombre del primer usuario
  if (idUsuario1) {
    resultados.push(
      await callAPI("PUT", `/usuarios/${idUsuario1}`, {
        nombre: "UsuarioTest1 Actualizado",
      })
    );
  }

  // Eliminar usuario temporal
  if (idUsuario2) {
    resultados.push(await callAPI("DELETE", `/usuarios/${idUsuario2}`));
  }

  return { resultados, idUsuario1 };
}

/* -------------------------------------------------------------------------- */
/* 🔹 NODOS, SENSORES Y MEDICIONES                                            */
/* -------------------------------------------------------------------------- */
async function testNodos(idUsuario1) {
  const resultados = [];
  let idNodo1 = null;

  if (!idUsuario1) {
    resultados.push({
      paso: "❌ Creación de nodo cancelada (usuario no creado)",
      error: "idUsuario1 es null",
    });
    return { resultados, idNodo1 };
  }

  // Crear nodo principal (permanece)
  const nodo1 = {
    nombre: "NodoTest1",
    ubicacion: { lat: 10, lng: 20 },
    propietarioId: idUsuario1,
  };

  const resNodo1 = await callAPI("POST", "/nodos", nodo1);
  resultados.push(resNodo1);
  idNodo1 = resNodo1.resultado?.idNodo || null;

  // Crear mediciones y probar rutas relacionadas
  if (idNodo1) {
    resultados.push(
      await callAPI("POST", "/mediciones", {
        idNodo: idNodo1,
        medidas: { temperatura: 22.5, co2: 400, humedad: 55 },
      })
    );

    resultados.push(await callAPI("GET", `/mediciones/${idNodo1}`));

    // Vincular y desvincular el nodo al usuario
    resultados.push(
      await callAPI("POST", `/usuarios/${idUsuario1}/vincularNodo`, {
        idNodo: idNodo1,
      })
    );

    resultados.push(
      await callAPI("POST", `/usuarios/${idUsuario1}/desvincularNodo`, {
        idNodo: idNodo1,
      })
    );
  }

  // Crear nodo temporal (se eliminará)
  const nodo2 = {
    nombre: "NodoTest2",
    ubicacion: { lat: 15, lng: 25 },
    propietarioId: idUsuario1,
  };

  const resNodo2 = await callAPI("POST", "/nodos", nodo2);
  resultados.push(resNodo2);
  const idNodo2 = resNodo2.resultado?.idNodo || null;

  if (idNodo2) {
    resultados.push(
      await callAPI("POST", "/mediciones", {
        idNodo: idNodo2,
        medidas: { temperatura: 23, co2: 410, humedad: 60 },
      })
    );

    resultados.push(await callAPI("GET", `/mediciones/${idNodo2}`));
    resultados.push(await callAPI("DELETE", `/nodos/${idNodo2}`));
  }

  return { resultados, idNodo1 };
}

/* -------------------------------------------------------------------------- */
/* 🔹 NOTIFICACIÓN                                                            */
/* -------------------------------------------------------------------------- */

async function testNotificacion() {
  return await callAPI("POST", "/notificar", {
    mensaje: "🔔 Prueba automática de notificación con color desde test.js",
    color: "#27F531",
  });
}
/* -------------------------------------------------------------------------- */
/* 🔹 EJECUCIÓN GENERAL                                                       */
/* -------------------------------------------------------------------------- */
export async function pruebaAutomatica() {
  const resultados = [];

  // resultados.push({ paso: "🧪 Iniciando test de USUARIOS" });
  // const { resultados: resUsuarios, idUsuario1 } = await testUsuarios();
  // resultados.push(...resUsuarios);

  // resultados.push({ paso: "🧪 Iniciando test de NODOS, SENSORES y MEDICIONES" });
  // const { resultados: resNodos } = await testNodos(idUsuario1);
  // resultados.push(...resNodos);

  resultados.push({ paso: "🧪 Probando NOTIFICACIÓN" });
  resultados.push(await testNotificacion());

  resultados.push({ paso: "✅ Prueba finalizada correctamente" });
  return resultados;
}
