// ---------------------------------------------------------
// Fichero: logicaFake.js
// Responsable: Josue Bellota Ichaso
// ---------------------------------------------------------

import { obtenerUsuarioLogueado } from "./auth";

const API_BASE = "https://us-central1-proyectodebiometria.cloudfunctions.net/ServidorREST";

// ----------------------------------------------------------
// obtenerNodosPorPropietario()
// ----------------------------------------------------------
async function obtenerNodosPorPropietario(idUsuario) {
  try {
    const res = await fetch(`${API_BASE}/nodos/propietario/${idUsuario}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al obtener nodos del usuario");
    return data;
  } catch (error) {
    console.error("❌ Error al obtener nodos:", error);
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
// main() → obtiene los nodos del usuario y sus mediciones
// ----------------------------------------------------------
export async function main() {
  try {
    const usuario = obtenerUsuarioLogueado();

    // 🔍 Detectar id del usuario, sea cual sea el formato
    const idUsuario = usuario?.id || usuario?.uid || usuario?.idUsuario;
    if (!idUsuario) {
      return [{ paso: "AUTENTICACIÓN", error: "No hay usuario logueado o falta su ID" }];
    }

    console.log("🧑 Usuario logueado:", usuario.nombre, "→", idUsuario);

    // 1️⃣ Obtener nodos del usuario
    const nodos = await obtenerNodosPorPropietario(idUsuario);
    if (nodos.error) {
      return [{ paso: "GET /nodos/propietario/:idPropietario", error: nodos.error }];
    }

    if (!Array.isArray(nodos) || nodos.length === 0) {
      return [
        {
          paso: "GET /nodos/propietario/:idPropietario",
          resultado: "⚠️ El usuario no tiene nodos registrados.",
        },
      ];
    }

    // 2️⃣ Para cada nodo, obtener sus mediciones
    const resultados = [];
    for (const nodo of nodos) {
      const idNodo = nodo.idNodo || nodo.id || null;
      if (!idNodo) continue;

      const mediciones = await obtenerMediciones(idNodo);
      if (mediciones.error) {
        resultados.push({ paso: `GET /mediciones/${idNodo}`, error: mediciones.error });
        continue;
      }

      resultados.push({
        paso: "GET",
        resultado: {
          nodo: nodo.nombre || "Nodo sin nombre",
          sensores: mediciones.sensores || mediciones || {},
          tiempo: mediciones.tiempo || mediciones.fecha || null,
        },
      });
    }

    return resultados.length > 0
      ? resultados
      : [
          {
            paso: "GET /mediciones",
            resultado: "Sin mediciones registradas para los nodos del usuario.",
          },
        ];
  } catch (error) {
    console.error("❌ Error general en logicaFake.main():", error);
    return [{ paso: "main()", error: error.message }];
  }
}
