// ---------------------------------------------------------
// Fichero: logicaFake.js (actualizado)
// ---------------------------------------------------------

import { obtenerUsuarioLogueado } from "./auth";
const API_BASE = "https://us-central1-proyectodebiometria.cloudfunctions.net/ServidorREST";

// ----------------------------------------------------------
// obtenerTodosLosUsuarios()
// ----------------------------------------------------------
export async function obtenerTodosLosUsuarios() {
  try {
    const usuario = obtenerUsuarioLogueado();
    const idAdmin = usuario?.uid || usuario?.id || usuario?.idUsuario;
    if (!idAdmin) throw new Error("No se encontró ID del administrador");

    const res = await fetch(`${API_BASE}/usuarios/admin/${idAdmin}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  } catch (error) {
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
    if (!res.ok) throw new Error(data.error);
    return data;
  } catch (error) {
    return { error: error.message };
  }
}

// ----------------------------------------------------------
// obtenerMediciones(nombreNodo, propietarioId)
// Nuevo formato: GET /mediciones/:propietarioId/:nombreNodo
// ----------------------------------------------------------
async function obtenerMediciones(nombreNodo, propietarioId) {
  try {
    const res = await fetch(`${API_BASE}/mediciones/${propietarioId}/${nombreNodo}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  } catch (error) {
    return { error: error.message };
  }
}

// ----------------------------------------------------------
// obtenerUsuarioCompleto(uid) → Obtiene datos completos del usuario
// ----------------------------------------------------------
export async function obtenerUsuarioCompleto(uid) {
  try {
    if (!uid) throw new Error("Se requiere el UID del usuario");

    // ✅ Nuevo endpoint universal
    let res = await fetch(`${API_BASE}/usuarios/completo/${uid}`);
    let data = await res.json();

    if (!res.ok || data.error) throw new Error(data.error || "No se pudo obtener el usuario");

    return data;
  } catch (error) {
    console.error("❌ Error en obtenerUsuarioCompleto:", error);
    return { error: error.message };
  }
}

// ----------------------------------------------------------
// actualizarDistanciaUsuario(idUsuario, distancia)
// ----------------------------------------------------------
export async function actualizarDistanciaUsuario(idUsuario, distancia) {
  try {
    const res = await fetch(`${API_BASE}/usuarios/${idUsuario}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ distancia }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  } catch (error) {
    console.error("❌ Error en actualizarDistanciaUsuario:", error);
    return { error: error.message };
  }
}

// ----------------------------------------------------------
// actualizarDatosUsuario(idUsuario, datos)
// ----------------------------------------------------------
export async function actualizarDatosUsuario(idUsuario, datos) {
  try {
    const res = await fetch(`${API_BASE}/usuarios/${idUsuario}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(datos),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  } catch (error) {
    console.error("❌ Error en actualizarDatosUsuario:", error);
    return { error: error.message };
  }
}

// ----------------------------------------------------------
// actualizarMonedasUsuario(idUsuario, monedas)
// ----------------------------------------------------------
export async function actualizarMonedasUsuario(idUsuario, monedas) {
  try {
    const res = await fetch(`${API_BASE}/usuarios/${idUsuario}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ monedas }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  } catch (error) {
    console.error("❌ Error en actualizarMonedasUsuario:", error);
    return { error: error.message };
  }
}



// ----------------------------------------------------------
// main()  → Ciudadano
// ----------------------------------------------------------
export async function main() {
  try {
    const usuario = obtenerUsuarioLogueado();
    const idUsuario = usuario?.uid || usuario?.id || usuario?.idUsuario;
    if (!idUsuario) return [{ paso: "AUTENTICACIÓN", error: "No hay usuario logueado" }];

    const nodos = await obtenerNodosPorPropietario(idUsuario);
    if (nodos.error) return [{ paso: "GET /nodos/propietario", error: nodos.error }];

    if (!Array.isArray(nodos) || nodos.length === 0)
      return [{ paso: "GET /nodos/propietario", resultado: "El usuario no tiene nodos registrados." }];

    const resultados = [];
    for (const nodo of nodos) {
      const nombreNodo = nodo.nombre;
      if (!nombreNodo) continue;

      const mediciones = await obtenerMediciones(nombreNodo, idUsuario);
      if (mediciones.error) {
        resultados.push({ paso: `GET /mediciones/${idUsuario}/${nombreNodo}`, error: mediciones.error });
        continue;
      }

      resultados.push({
        paso: "GET /mediciones",
        resultado: {
          nodo: nombreNodo,
          datos: mediciones,
        },
      });
    }

    return resultados.length > 0
      ? resultados
      : [{ paso: "GET /mediciones", resultado: "Sin mediciones registradas." }];
  } catch (error) {
    return [{ paso: "main()", error: error.message }];
  }
}

// ----------------------------------------------------------
// mainAdmin()  → Administrador
// ----------------------------------------------------------
export async function mainAdmin() {
  try {
    const usuarios = await obtenerTodosLosUsuarios();
    if (usuarios.error) return [{ paso: "GET /usuarios", error: usuarios.error }];

    if (!Array.isArray(usuarios) || usuarios.length === 0)
      return [{ paso: "GET /usuarios", resultado: "No hay usuarios registrados." }];

    return usuarios.map((u) => ({
      paso: "GET /usuarios",
      resultado: {
        idUsuario: u.uid,
        nombre: u.nombre,
        correo: u.correo,
        rol: u.rol,
        monedas: u.monedas,     
        premios: u.premios,     
      },
    }));
  } catch (error) {
    return [{ paso: "mainAdmin()", error: error.message }];
  }
}
