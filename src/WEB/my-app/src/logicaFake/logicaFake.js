// ---------------------------------------------------------
// Fichero: logicaFake.js
// Responsable: Josue Bellota Ichaso
// ---------------------------------------------------------

const API_BASE = "https://us-central1-proyectodebiometria.cloudfunctions.net/ServidorREST";

// ----------------------------------------------------------
// obtenerNodo()
// ----------------------------------------------------------
// Obtiene la información completa de un nodo (nombre, sensores, etc.)
// ----------------------------------------------------------
async function obtenerNodo(idNodo) {
  try {
    const res = await fetch(`${API_BASE}/nodos/${idNodo}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al obtener nodo");
    return data;
  } catch (error) {
    console.error("❌ Error al obtener nodo:", error);
    return { error: error.message };
  }
}

// ----------------------------------------------------------
// obtenerMediciones()
// ----------------------------------------------------------
// Obtiene las mediciones del nodo dado
// ----------------------------------------------------------
async function obtenerMediciones(idNodo) {
  try {
    const res = await fetch(`${API_BASE}/mediciones/${idNodo}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al obtener mediciones");
    return data;
  } catch (error) {
    console.error("❌ Error al obtener mediciones:", error);
    return { error: error.message };
  }
}

// ----------------------------------------------------------
// main()
// ----------------------------------------------------------
// • Muestra nombre del nodo y los sensores con su valor y tiempo
// ----------------------------------------------------------
export async function main() {
  const resultados = [];
  const idNodo = "lZv2QcjXZWOKeNX5DaXO";

  // 1️⃣ Obtener información del nodo
  const nodo = await obtenerNodo(idNodo);
  if (nodo.error) {
    resultados.push({ paso: "GET /nodos/:idNodo", error: nodo.error });
    return resultados;
  }

  // 2️⃣ Obtener mediciones
  const mediciones = await obtenerMediciones(idNodo);
  if (mediciones.error) {
    resultados.push({ paso: "GET /mediciones/:idNodo", error: mediciones.error });
    return resultados;
  }

  // 3️⃣ Mapear sensores del objeto
  if (mediciones && mediciones.sensores) {
    for (const [sensor, valor] of Object.entries(mediciones.sensores)) {
      resultados.push({
        paso: "GET",
        resultado: {
          nodo: nodo.nombre || "Nodo desconocido",
          sensor,
          valor,
          tiempo: mediciones.tiempo || nodo.tiempo || null,
        },
      });
    }
  } else {
    resultados.push({ paso: "GET", resultado: mediciones });
  }

  return resultados;
}

