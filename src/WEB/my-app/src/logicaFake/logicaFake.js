// ---------------------------------------------------------
// Fichero: logicaFake.js
// Responsable: Josue Bellota Ichaso
// ---------------------------------------------------------

const API_BASE = "https://us-central1-proyectodebiometria.cloudfunctions.net/ServidorREST";

// ----------------------------------------------------------
// obtenerNodo()
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
export async function main() {
  const idNodo = "lZv2QcjXZWOKeNX5DaXO";

  // 1️⃣ Obtener información del nodo
  const nodo = await obtenerNodo(idNodo);
  if (nodo.error) {
    return [{ paso: "GET /nodos/:idNodo", error: nodo.error }];
  }

  // 2️⃣ Obtener mediciones
  const mediciones = await obtenerMediciones(idNodo);
  if (mediciones.error) {
    return [{ paso: "GET /mediciones/:idNodo", error: mediciones.error }];
  }

  // 3️⃣ Construir resultado único por nodo
  return [
    {
      paso: "GET",
      resultado: {
        nodo: nodo.nombre || "Nodo desconocido",
        sensores: mediciones.sensores || {},
        tiempo: mediciones.tiempo || nodo.tiempo || null,
      },
    },
  ];
}
