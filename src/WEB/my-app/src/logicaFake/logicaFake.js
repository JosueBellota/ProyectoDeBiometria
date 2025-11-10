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
// obtenerUsuarioCompleto
// ----------------------------------------------------------
export async function obtenerUsuarioCompleto(uid) {
  try {
    const res = await fetch(`${API_BASE}/usuarios/${uid}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  } catch (error) {
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
