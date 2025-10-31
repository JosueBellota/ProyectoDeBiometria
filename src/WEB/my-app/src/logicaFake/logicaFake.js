// ---------------------------------------------------------
// Fichero: logicaFake.js
// Responsable: Josue Bellota Ichaso
// ---------------------------------------------------------

import { obtenerUsuarioLogueado } from "./auth";

const API_BASE = "https://us-central1-proyectodebiometria.cloudfunctions.net/ServidorREST";

export async function obtenerTodosLosUsuarios() {
  try {
    const usuario = obtenerUsuarioLogueado();
    const idAdmin = usuario?.idUsuario || usuario?.id || usuario?.uid;

    if (!idAdmin) throw new Error("No se encontró ID del administrador");

    const res = await fetch(`${API_BASE}/usuarios/admin/${idAdmin}`);
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Error al obtener lista de usuarios");

    return data;
  } catch (error) {
    console.error("❌ Error al obtener usuarios:", error);
    return { error: error.message };
  }
}


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
// obtenerUsuarioCompleto(uid) → usa la API real del backend
// ----------------------------------------------------------
export async function obtenerUsuarioCompleto(uid) {
  try {
    const res = await fetch(
      `https://us-central1-proyectodebiometria.cloudfunctions.net/ServidorREST/usuarios/${uid}`
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al obtener datos del usuario");
    return data;
  } catch (error) {
    console.error("❌ Error en obtenerUsuarioCompleto:", error);
    return { error: error.message };
  }
}

// ----------------------------------------------------------
// main() → para ciudadano (ya existente)
// ----------------------------------------------------------
export async function main() {
  try {
    const usuario = obtenerUsuarioLogueado();
    const idUsuario = usuario?.id || usuario?.uid || usuario?.idUsuario;
    if (!idUsuario) return [{ paso: "AUTENTICACIÓN", error: "No hay usuario logueado o falta su ID" }];

    const nodos = await obtenerNodosPorPropietario(idUsuario);
    if (nodos.error) return [{ paso: "GET /nodos/propietario/:idPropietario", error: nodos.error }];

    if (!Array.isArray(nodos) || nodos.length === 0)
      return [{ paso: "GET /nodos/propietario/:idPropietario", resultado: "⚠️ El usuario no tiene nodos registrados." }];

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
      : [{ paso: "GET /mediciones", resultado: "Sin mediciones registradas para los nodos del usuario." }];
  } catch (error) {
    console.error("❌ Error general en logicaFake.main():", error);
    return [{ paso: "main()", error: error.message }];
  }
}

// ----------------------------------------------------------
// mainAdmin() → para administrador (listar todos los usuarios)
// ----------------------------------------------------------
export async function mainAdmin() {
  try {
    const usuario = obtenerUsuarioLogueado();
    if (!usuario) return [{ paso: "AUTENTICACIÓN", error: "No hay usuario logueado" }];

    console.log("🧑‍💼 Admin logueado:", usuario.correo);

    const usuarios = await obtenerTodosLosUsuarios();
    if (usuarios.error) return [{ paso: "GET /usuarios", error: usuarios.error }];

    if (!Array.isArray(usuarios) || usuarios.length === 0)
      return [{ paso: "GET /usuarios", resultado: "⚠️ No hay usuarios registrados en el sistema." }];

    // Creamos formato de salida legible
    return usuarios.map((u) => ({
      paso: "GET /usuarios",
      resultado: {
        idUsuario: u.idUsuario || u.id,
        nombre: u.nombre || "Sin nombre",
        correo: u.correo || "-",
        rol: u.rol || "No especificado",
        fechaRegistro: u.fechaRegistro || u.createdAt || null,
      },
    }));
  } catch (error) {
    console.error("❌ Error en mainAdmin():", error);
    return [{ paso: "mainAdmin()", error: error.message }];
  }
}
